package lists

import (
	"backloggat/runner/platform/apperr"
	"context"
	"database/sql"
	"errors"
	"log"

	"github.com/jmoiron/sqlx"
)

type ListRepository struct {
	db *sqlx.DB
}

func NewListRepository(db *sqlx.DB) *ListRepository {
	return &ListRepository{db: db}
}

func (r *ListRepository) DB() sqlx.ExtContext { return r.db }

// days owned by the user: tasks have no user_id, ownership goes through here
const ownedDays = `SELECT lt.list_task_id FROM list_task_tbl lt
	JOIN lists_tbl l ON l.list_id = lt.list_id WHERE l.user_id = ?`

const taskColumns = `task_id, title, status, priority, start_date, end_date,
	list_task_id, project_id, created_at, updated_at`

const dayColumns = `lt.list_task_id, lt.list_id, COALESCE(lt.title, '') AS title,
	COALESCE(lt.note, '') AS note, lt.task_date, lt.position, lt.created_at,
	(SELECT COUNT(*) FROM tasks_tbl t WHERE t.list_task_id = lt.list_task_id) AS tasks_count,
	(SELECT COUNT(*) FROM tasks_tbl t WHERE t.list_task_id = lt.list_task_id AND t.status = 'DONE') AS done_count`

func (r *ListRepository) InTx(ctx context.Context, fn func(tx *sqlx.Tx) error) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return apperr.NewDatabase(err)
	}
	defer tx.Rollback()

	if err := fn(tx); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return apperr.NewDatabase(err)
	}
	return nil
}

// ---- reads ----

func (r *ListRepository) ListLists(ctx context.Context, userID int64) ([]ListInfo, error) {
	items := []ListInfo{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT
			l.list_id, l.user_id, l.title,
			COALESCE(l.description, '') AS description,
			l.start_date, l.end_date, l.created_at, l.updated_at,

			(SELECT COUNT(*) FROM list_task_tbl lt WHERE lt.list_id = l.list_id) AS days_count,

			(SELECT COUNT(*) FROM tasks_tbl t
			 JOIN list_task_tbl lt ON lt.list_task_id = t.list_task_id
			 WHERE lt.list_id = l.list_id) AS tasks_count,

			(SELECT COUNT(*) FROM tasks_tbl t
			 JOIN list_task_tbl lt ON lt.list_task_id = t.list_task_id
			 WHERE lt.list_id = l.list_id AND t.status = 'DONE') AS done_count

		 FROM lists_tbl l
		 WHERE l.user_id = ?
		 ORDER BY l.start_date ASC, l.list_id ASC`,
		userID,
	)
	if err != nil {
		log.Printf("ListLists ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ListRepository) GetList(ctx context.Context, userID, id int64) (*ListInfo, error) {
	var item ListInfo
	err := r.db.GetContext(ctx, &item,
		`SELECT
			l.list_id, l.user_id, l.title,
			COALESCE(l.description, '') AS description,
			l.start_date, l.end_date, l.created_at, l.updated_at,

			(SELECT COUNT(*) FROM list_task_tbl lt WHERE lt.list_id = l.list_id) AS days_count,

			(SELECT COUNT(*) FROM tasks_tbl t
			 JOIN list_task_tbl lt ON lt.list_task_id = t.list_task_id
			 WHERE lt.list_id = l.list_id) AS tasks_count,

			(SELECT COUNT(*) FROM tasks_tbl t
			 JOIN list_task_tbl lt ON lt.list_task_id = t.list_task_id
			 WHERE lt.list_id = l.list_id AND t.status = 'DONE') AS done_count

		 FROM lists_tbl l
		 WHERE l.list_id = ? AND l.user_id = ?`,
		id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("List")
	}
	if err != nil {
		log.Printf("GetList ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ListRepository) ListDays(ctx context.Context, userID, listID int64) ([]DayInfo, error) {
	items := []DayInfo{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT `+dayColumns+`
		 FROM list_task_tbl lt
		 JOIN lists_tbl l ON l.list_id = lt.list_id
		 WHERE lt.list_id = ? AND l.user_id = ?
		 ORDER BY lt.task_date ASC`,
		listID, userID,
	)
	if err != nil {
		log.Printf("ListDays ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ListRepository) GetDay(ctx context.Context, userID, id int64) (*DayInfo, error) {
	var item DayInfo
	err := r.db.GetContext(ctx, &item,
		`SELECT `+dayColumns+`
		 FROM list_task_tbl lt
		 JOIN lists_tbl l ON l.list_id = lt.list_id
		 WHERE lt.list_task_id = ? AND l.user_id = ?`,
		id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Day")
	}
	if err != nil {
		log.Printf("GetDay ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

// pending first, then by priority (HIGH first), then oldest
func (r *ListRepository) ListDayTasks(ctx context.Context, userID, dayID int64) ([]TaskInfo, error) {
	items := []TaskInfo{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT `+taskColumns+`
		 FROM tasks_tbl
		 WHERE list_task_id = ? AND list_task_id IN (`+ownedDays+`)
		 ORDER BY (status = 'DONE') ASC,
		          CASE priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
		          task_id ASC`,
		dayID, userID,
	)
	if err != nil {
		log.Printf("ListDayTasks ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

// ---- writes (ex is the db or a transaction) ----

func (r *ListRepository) InsertList(ctx context.Context, ex sqlx.ExtContext, userID int64, d *CreateListRequest) (*ListInfo, error) {
	var item ListInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`INSERT INTO lists_tbl (user_id, title, description, start_date, end_date)
		 VALUES (?, ?, NULLIF(?, ''), ?, ?)
		 RETURNING list_id, user_id, title,
		           COALESCE(description, '') AS description,
		           start_date, end_date, created_at, updated_at`,
		userID, d.Title, d.Description, d.StartDate, d.EndDate,
	)
	if err != nil {
		log.Printf("InsertList ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ListRepository) UpdateList(ctx context.Context, ex sqlx.ExtContext, userID, id int64, d *UpdateListRequest) (*ListInfo, error) {
	var item ListInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE lists_tbl
		 SET title = ?, description = NULLIF(?, ''), updated_at = datetime('now')
		 WHERE list_id = ? AND user_id = ?
		 RETURNING list_id, user_id, title,
		           COALESCE(description, '') AS description,
		           start_date, end_date, created_at, updated_at`,
		d.Title, d.Description, id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("List")
	}
	if err != nil {
		log.Printf("UpdateList ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ListRepository) InsertDay(ctx context.Context, ex sqlx.ExtContext, listID int64, date string, position int) error {
	_, err := ex.ExecContext(ctx,
		`INSERT INTO list_task_tbl (list_id, task_date, position) VALUES (?, ?, ?)`,
		listID, date, position)
	if err != nil {
		log.Printf("InsertDay ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ListRepository) UpdateDay(ctx context.Context, ex sqlx.ExtContext, userID, id int64, d *UpdateDayRequest) (*DayInfo, error) {
	res, err := ex.ExecContext(ctx,
		`UPDATE list_task_tbl
		 SET title = NULLIF(?, ''), note = NULLIF(?, '')
		 WHERE list_task_id = ? AND list_task_id IN (`+ownedDays+`)`,
		d.Title, d.Note, id, userID,
	)
	if err != nil {
		log.Printf("UpdateDay ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, apperr.NewNotFound("Day")
	}
	return r.GetDay(ctx, userID, id)
}

func (r *ListRepository) InsertTask(ctx context.Context, ex sqlx.ExtContext, dayID int64, d *CreateTaskRequest) (*TaskInfo, error) {
	var item TaskInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`INSERT INTO tasks_tbl (title, priority, start_date, end_date, list_task_id)
		 VALUES (?, ?, ?, ?, ?)
		 RETURNING `+taskColumns,
		d.Title, d.Priority, d.StartDate, d.EndDate, dayID,
	)
	if err != nil {
		log.Printf("InsertTask ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ListRepository) UpdateTask(ctx context.Context, ex sqlx.ExtContext, userID, id int64, d *UpdateTaskRequest) (*TaskInfo, error) {
	var item TaskInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE tasks_tbl
		 SET title = ?, status = ?, priority = ?, start_date = ?, end_date = ?,
		     updated_at = datetime('now')
		 WHERE task_id = ? AND list_task_id IN (`+ownedDays+`)
		 RETURNING `+taskColumns,
		d.Title, d.Status, d.Priority, d.StartDate, d.EndDate, id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Task")
	}
	if err != nil {
		log.Printf("UpdateTask ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ListRepository) UpdateTaskStatus(ctx context.Context, ex sqlx.ExtContext, userID, id int64, status string) (*TaskInfo, error) {
	var item TaskInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE tasks_tbl
		 SET status = ?, updated_at = datetime('now')
		 WHERE task_id = ? AND list_task_id IN (`+ownedDays+`)
		 RETURNING `+taskColumns,
		status, id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Task")
	}
	if err != nil {
		log.Printf("UpdateTaskStatus ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

// ---- deletes ----

// project tasks of a list lose their day instead of being deleted
func (r *ListRepository) UnlinkProjectTasksByList(ctx context.Context, ex sqlx.ExtContext, userID, listID int64) error {
	_, err := ex.ExecContext(ctx,
		`UPDATE tasks_tbl SET list_task_id = NULL
		 WHERE project_id IS NOT NULL
		   AND list_task_id IN (
		     SELECT lt.list_task_id FROM list_task_tbl lt
		     JOIN lists_tbl l ON l.list_id = lt.list_id
		     WHERE l.list_id = ? AND l.user_id = ?)`,
		listID, userID)
	if err != nil {
		log.Printf("UnlinkProjectTasksByList ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ListRepository) DeleteTasksByList(ctx context.Context, ex sqlx.ExtContext, userID, listID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM tasks_tbl
		 WHERE list_task_id IN (
		   SELECT lt.list_task_id FROM list_task_tbl lt
		   JOIN lists_tbl l ON l.list_id = lt.list_id
		   WHERE l.list_id = ? AND l.user_id = ?)`,
		listID, userID)
	if err != nil {
		log.Printf("DeleteTasksByList ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ListRepository) DeleteDaysByList(ctx context.Context, ex sqlx.ExtContext, userID, listID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM list_task_tbl
		 WHERE list_id IN (SELECT list_id FROM lists_tbl WHERE list_id = ? AND user_id = ?)`,
		listID, userID)
	if err != nil {
		log.Printf("DeleteDaysByList ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ListRepository) DeleteList(ctx context.Context, ex sqlx.ExtContext, userID, id int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM lists_tbl WHERE list_id = ? AND user_id = ?`, id, userID)
	if err != nil {
		log.Printf("DeleteList ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// a task that also belongs to a project keeps living there
func (r *ListRepository) UnlinkTaskFromDay(ctx context.Context, ex sqlx.ExtContext, userID, id int64) error {
	_, err := ex.ExecContext(ctx,
		`UPDATE tasks_tbl SET list_task_id = NULL
		 WHERE task_id = ? AND project_id IS NOT NULL
		   AND list_task_id IN (`+ownedDays+`)`,
		id, userID)
	if err != nil {
		log.Printf("UnlinkTaskFromDay ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// runs after the unlink: only day-only tasks still match
func (r *ListRepository) DeleteDayTask(ctx context.Context, ex sqlx.ExtContext, userID, id int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM tasks_tbl
		 WHERE task_id = ? AND list_task_id IN (`+ownedDays+`)`,
		id, userID)
	if err != nil {
		log.Printf("DeleteDayTask ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}
