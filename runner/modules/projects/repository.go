package projects

import (
	"backloggat/runner/platform/apperr"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/jmoiron/sqlx"
)

type ProjectRepository struct {
	db *sqlx.DB
}

func NewProjectRepository(db *sqlx.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// projects of the user: tasks have no user_id, ownership goes through here
const ownedProjects = `SELECT project_id FROM project_tbl WHERE user_id = ?`

const taskColumns = `task_id, title, status, priority, start_date, end_date,
	list_task_id, project_id, created_at, updated_at`

// sort_by values allowed from the client (the client never writes SQL)
var projectSortColumns = map[string]string{
	"title":      "title",
	"created_at": "created_at",
	"updated_at": "updated_at",
	"start_date": "start_date",
	"progress":   "progress",
}

var taskSortColumns = map[string]string{
	"title":      "t.title",
	"created_at": "t.created_at",
	"end_date":   "t.end_date",
	"status":     "CASE t.status WHEN 'DOING' THEN 0 WHEN 'TO_DO' THEN 1 ELSE 2 END",
	"priority":   "CASE t.priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END",
}

const projectBase = `SELECT
		p.project_id, p.user_id, p.title,
		COALESCE(p.description, '') AS description,
		p.start_date,
		COALESCE(p.end_date, '') AS end_date,
		p.status, p.created_at, p.updated_at,

		(SELECT COUNT(*) FROM tasks_tbl t WHERE t.project_id = p.project_id) AS tasks_count,
		(SELECT COUNT(*) FROM tasks_tbl t WHERE t.project_id = p.project_id AND t.status = 'DONE') AS done_count,
		(SELECT COUNT(*) FROM note_projects np WHERE np.project_id = p.project_id) AS notes_count,
		(SELECT COUNT(*) FROM resources_projects_tbl rp WHERE rp.project_id = p.project_id) AS resources_count,
		(SELECT COUNT(*) FROM project_skill_tbl ps WHERE ps.project_id = p.project_id) AS skills_count
	FROM project_tbl p`

// progress is computed on read, so it is never stale
func projectQuery(where string) string {
	return `SELECT *,
		CASE WHEN tasks_count = 0 THEN 0 ELSE done_count * 100 / tasks_count END AS progress
		FROM (` + projectBase + ` WHERE ` + where + `)`
}

func (r *ProjectRepository) InTx(ctx context.Context, fn func(tx *sqlx.Tx) error) error {
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

func (r *ProjectRepository) ListProjects(ctx context.Context, userID int64, f ProjectFilters) ([]ProjectInfo, error) {
	items := []ProjectInfo{}

	where := `p.user_id = ?`
	args := []any{userID}

	if f.Search != "" {
		where += ` AND p.title LIKE ? ESCAPE '\'`
		args = append(args, "%"+likeEscaper.Replace(f.Search)+"%")
	}
	if f.Status == "ACTIVE" || f.Status == "DONE" {
		where += ` AND p.status = ?`
		args = append(args, f.Status)
	}
	if f.SkillId > 0 {
		where += ` AND EXISTS (SELECT 1 FROM project_skill_tbl fs
		                       WHERE fs.project_id = p.project_id AND fs.skill_id = ?)`
		args = append(args, f.SkillId)
	}

	col, ok := projectSortColumns[f.SortBy]
	if !ok {
		col = "updated_at"
	}
	dir := "DESC"
	if f.Order == "asc" {
		dir = "ASC"
	}

	query := projectQuery(where) + fmt.Sprintf(` ORDER BY %s %s, project_id ASC`, col, dir)

	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		log.Printf("ListProjects ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ProjectRepository) GetProject(ctx context.Context, userID, id int64) (*ProjectInfo, error) {
	var item ProjectInfo
	err := r.db.GetContext(ctx, &item,
		projectQuery(`p.project_id = ? AND p.user_id = ?`), id, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Project")
	}
	if err != nil {
		log.Printf("GetProject ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ProjectRepository) ListProjectSkills(ctx context.Context, userID, id int64) ([]SkillRef, error) {
	items := []SkillRef{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT s.skill_id, s.name, s.color
		 FROM project_skill_tbl ps
		 JOIN skills_tbl s ON s.skill_id = ps.skill_id
		 WHERE ps.project_id = ? AND ps.project_id IN (`+ownedProjects+`)
		 ORDER BY s.name`,
		id, userID)
	if err != nil {
		log.Printf("ListProjectSkills ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

// pinned first, then most recently updated
func (r *ProjectRepository) ListProjectNotes(ctx context.Context, userID, id int64, f NoteFilters) ([]NoteRef, error) {
	items := []NoteRef{}

	query := `SELECT n.note_id, n.title, n.color,
			COALESCE(n.description, '') AS description, n.pinned, n.updated_at
		 FROM notes_tbl n
		 JOIN note_projects np ON np.note_id = n.note_id
		 WHERE np.project_id = ? AND n.user_id = ?
		   AND np.project_id IN (` + ownedProjects + `)`
	args := []any{id, userID, userID}

	if f.PinnedOnly {
		query += ` AND n.pinned = 1`
	}
	if f.Search != "" {
		like := "%" + likeEscaper.Replace(f.Search) + "%"
		query += ` AND (n.title LIKE ? ESCAPE '\' OR n.description LIKE ? ESCAPE '\')`
		args = append(args, like, like)
	}
	query += ` ORDER BY n.pinned DESC, n.updated_at DESC, n.note_id ASC`
	if f.Limit > 0 {
		query += fmt.Sprintf(` LIMIT %d`, f.Limit)
	}

	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		log.Printf("ListProjectNotes ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

// limit -1 = all
func (r *ProjectRepository) ListProjectResources(ctx context.Context, userID, id int64, limit int) ([]ResourceRef, error) {
	items := []ResourceRef{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT rs.resource_id, rs.name, rs.link, rs.type
		 FROM resources_projects_tbl rp
		 JOIN resources_tbl rs ON rs.resource_id = rp.resource_id
		 WHERE rp.project_id = ? AND rs.user_id = ?
		   AND rp.project_id IN (`+ownedProjects+`)
		 ORDER BY rs.created_at DESC, rs.resource_id DESC
		 LIMIT ?`,
		id, userID, userID, limit)
	if err != nil {
		log.Printf("ListProjectResources ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ProjectRepository) ListProjectActivity(ctx context.Context, userID, id int64, limit int) ([]ActivityInfo, error) {
	items := []ActivityInfo{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT project_activity_id, action, created_at
		 FROM project_activity_tbl
		 WHERE project_id = ? AND user_id = ?
		 ORDER BY project_activity_id DESC
		 LIMIT ?`,
		id, userID, limit)
	if err != nil {
		log.Printf("ListProjectActivity ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ProjectRepository) ListProjectTasks(ctx context.Context, userID, id int64, f TaskFilters) ([]TaskInfo, error) {
	items := []TaskInfo{}

	query := `SELECT ` + taskColumns + `
		 FROM tasks_tbl t
		 WHERE t.project_id = ? AND t.project_id IN (` + ownedProjects + `)`
	args := []any{id, userID}

	if f.Search != "" {
		query += ` AND t.title LIKE ? ESCAPE '\'`
		args = append(args, "%"+likeEscaper.Replace(f.Search)+"%")
	}
	if f.Status == "TO_DO" || f.Status == "DOING" || f.Status == "DONE" {
		query += ` AND t.status = ?`
		args = append(args, f.Status)
	}
	if f.Priority == "LOW" || f.Priority == "MEDIUM" || f.Priority == "HIGH" {
		query += ` AND t.priority = ?`
		args = append(args, f.Priority)
	}

	col, ok := taskSortColumns[f.SortBy]
	if !ok {
		col = taskSortColumns["status"] // pending first by default
	}
	dir := "ASC"
	if f.Order == "desc" {
		dir = "DESC"
	}
	query += fmt.Sprintf(` ORDER BY %s %s, t.task_id %s`, col, dir, dir)
	if f.Limit > 0 {
		query += fmt.Sprintf(` LIMIT %d`, f.Limit)
	}

	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		log.Printf("ListProjectTasks ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ProjectRepository) GetProjectTask(ctx context.Context, userID, projectID, taskID int64) (*TaskInfo, error) {
	var item TaskInfo
	err := r.db.GetContext(ctx, &item,
		`SELECT `+taskColumns+` FROM tasks_tbl
		 WHERE task_id = ? AND project_id = ? AND project_id IN (`+ownedProjects+`)`,
		taskID, projectID, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Task")
	}
	if err != nil {
		log.Printf("GetProjectTask ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

// today's day in any list of the user. 0 = none
func (r *ProjectRepository) FindDayByDate(ctx context.Context, ex sqlx.ExtContext, userID int64, date string) (int64, error) {
	var id int64
	err := sqlx.GetContext(ctx, ex, &id,
		`SELECT lt.list_task_id
		 FROM list_task_tbl lt
		 JOIN lists_tbl l ON l.list_id = lt.list_id
		 WHERE l.user_id = ? AND lt.task_date = ?
		 ORDER BY l.list_id ASC LIMIT 1`,
		userID, date)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		log.Printf("FindDayByDate ERROR: %v\n", err)
		return 0, apperr.NewDatabase(err)
	}
	return id, nil
}

func (r *ProjectRepository) NoteInProject(ctx context.Context, ex sqlx.ExtContext, userID, projectID, noteID int64) (bool, error) {
	var n int
	err := sqlx.GetContext(ctx, ex, &n,
		`SELECT COUNT(*) FROM notes_tbl n
		 JOIN note_projects np ON np.note_id = n.note_id
		 WHERE n.note_id = ? AND n.user_id = ? AND np.project_id = ?`,
		noteID, userID, projectID)
	if err != nil {
		log.Printf("NoteInProject ERROR: %v\n", err)
		return false, apperr.NewDatabase(err)
	}
	return n > 0, nil
}

// ---- writes (ex is the db or a transaction) ----

func (r *ProjectRepository) InsertProject(ctx context.Context, ex sqlx.ExtContext, userID int64, d *CreateProjectRequest) (int64, error) {
	var id int64
	err := sqlx.GetContext(ctx, ex, &id,
		`INSERT INTO project_tbl (user_id, title, description, start_date, end_date)
		 VALUES (?, ?, NULLIF(?, ''), ?, NULLIF(?, ''))
		 RETURNING project_id`,
		userID, d.Title, d.Description, d.StartDate, d.EndDate)
	if err != nil {
		log.Printf("InsertProject ERROR: %v\n", err)
		return 0, apperr.NewDatabase(err)
	}
	return id, nil
}

func (r *ProjectRepository) UpdateProject(ctx context.Context, ex sqlx.ExtContext, userID, id int64, d *UpdateProjectRequest) error {
	res, err := ex.ExecContext(ctx,
		`UPDATE project_tbl
		 SET title = ?, description = NULLIF(?, ''), start_date = ?,
		     end_date = NULLIF(?, ''), status = ?, updated_at = datetime('now')
		 WHERE project_id = ? AND user_id = ?`,
		d.Title, d.Description, d.StartDate, d.EndDate, d.Status, id, userID)
	if err != nil {
		log.Printf("UpdateProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return apperr.NewNotFound("Project")
	}
	return nil
}

func (r *ProjectRepository) InsertProjectSkill(ctx context.Context, ex sqlx.ExtContext, projectID, skillID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO project_skill_tbl (project_id, skill_id) VALUES (?, ?)`,
		projectID, skillID)
	if err != nil {
		log.Printf("InsertProjectSkill ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) InsertProjectNote(ctx context.Context, ex sqlx.ExtContext, projectID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO note_projects (note_id, project_id) VALUES (?, ?)`,
		noteID, projectID)
	if err != nil {
		log.Printf("InsertProjectNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) InsertProjectResource(ctx context.Context, ex sqlx.ExtContext, projectID, resourceID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO resources_projects_tbl (project_id, resource_id) VALUES (?, ?)`,
		projectID, resourceID)
	if err != nil {
		log.Printf("InsertProjectResource ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) InsertActivity(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64, action string) error {
	_, err := ex.ExecContext(ctx,
		`INSERT INTO project_activity_tbl (user_id, project_id, action) VALUES (?, ?, ?)`,
		userID, projectID, action)
	if err != nil {
		log.Printf("InsertActivity ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// keeps the stored column in sync (reads compute it anyway)
func (r *ProjectRepository) RecalcProgress(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`UPDATE project_tbl SET progress = COALESCE((
		     SELECT CASE WHEN COUNT(*) = 0 THEN 0
		                 ELSE SUM(status = 'DONE') * 100 / COUNT(*) END
		     FROM tasks_tbl WHERE project_id = ?), 0)
		 WHERE project_id = ? AND user_id = ?`,
		projectID, projectID, userID)
	if err != nil {
		log.Printf("RecalcProgress ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) InsertProjectTask(ctx context.Context, ex sqlx.ExtContext, projectID int64, dayID *int64, d *CreateTaskRequest) (*TaskInfo, error) {
	var item TaskInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`INSERT INTO tasks_tbl (title, priority, start_date, end_date, project_id, list_task_id)
		 VALUES (?, ?, ?, ?, ?, ?)
		 RETURNING `+taskColumns,
		d.Title, d.Priority, d.StartDate, d.EndDate, projectID, dayID)
	if err != nil {
		log.Printf("InsertProjectTask ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ProjectRepository) UpdateProjectTask(ctx context.Context, ex sqlx.ExtContext, userID, projectID, taskID int64, d *UpdateTaskRequest) (*TaskInfo, error) {
	var item TaskInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE tasks_tbl
		 SET title = ?, status = ?, priority = ?, start_date = ?, end_date = ?,
		     updated_at = datetime('now')
		 WHERE task_id = ? AND project_id = ? AND project_id IN (`+ownedProjects+`)
		 RETURNING `+taskColumns,
		d.Title, d.Status, d.Priority, d.StartDate, d.EndDate, taskID, projectID, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Task")
	}
	if err != nil {
		log.Printf("UpdateProjectTask ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ProjectRepository) UpdateProjectTaskStatus(ctx context.Context, ex sqlx.ExtContext, userID, projectID, taskID int64, status string) (*TaskInfo, error) {
	var item TaskInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE tasks_tbl
		 SET status = ?, updated_at = datetime('now')
		 WHERE task_id = ? AND project_id = ? AND project_id IN (`+ownedProjects+`)
		 RETURNING `+taskColumns,
		status, taskID, projectID, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Task")
	}
	if err != nil {
		log.Printf("UpdateProjectTaskStatus ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

// ---- deletes ----

// a task that also lives in a day keeps living there
func (r *ProjectRepository) UnlinkTaskFromProject(ctx context.Context, ex sqlx.ExtContext, userID, projectID, taskID int64) error {
	_, err := ex.ExecContext(ctx,
		`UPDATE tasks_tbl SET project_id = NULL
		 WHERE task_id = ? AND project_id = ? AND list_task_id IS NOT NULL
		   AND project_id IN (`+ownedProjects+`)`,
		taskID, projectID, userID)
	if err != nil {
		log.Printf("UnlinkTaskFromProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// runs after the unlink: only project-only tasks still match
func (r *ProjectRepository) DeleteProjectTask(ctx context.Context, ex sqlx.ExtContext, userID, projectID, taskID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM tasks_tbl
		 WHERE task_id = ? AND project_id = ? AND project_id IN (`+ownedProjects+`)`,
		taskID, projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectTask ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) UnlinkDayTasksFromProject(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`UPDATE tasks_tbl SET project_id = NULL
		 WHERE project_id = ? AND list_task_id IS NOT NULL
		   AND project_id IN (`+ownedProjects+`)`,
		projectID, userID)
	if err != nil {
		log.Printf("UnlinkDayTasksFromProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteProjectTasks(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM tasks_tbl WHERE project_id = ? AND project_id IN (`+ownedProjects+`)`,
		projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectTasks ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteProjectSkills(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM project_skill_tbl WHERE project_id = ? AND project_id IN (`+ownedProjects+`)`,
		projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectSkills ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// unlinks every note (the notes stay)
func (r *ProjectRepository) DeleteProjectNotes(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM note_projects WHERE project_id = ? AND project_id IN (`+ownedProjects+`)`,
		projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectNotes ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteProjectResources(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_projects_tbl WHERE project_id = ? AND project_id IN (`+ownedProjects+`)`,
		projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectResources ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteProjectResource(ctx context.Context, ex sqlx.ExtContext, userID, projectID, resourceID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_projects_tbl
		 WHERE resource_id = ? AND project_id = ? AND project_id IN (`+ownedProjects+`)`,
		resourceID, projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectResource ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteProjectActivity(ctx context.Context, ex sqlx.ExtContext, userID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM project_activity_tbl WHERE project_id = ? AND user_id = ?`,
		projectID, userID)
	if err != nil {
		log.Printf("DeleteProjectActivity ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteProject(ctx context.Context, ex sqlx.ExtContext, userID, id int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM project_tbl WHERE project_id = ? AND user_id = ?`, id, userID)
	if err != nil {
		log.Printf("DeleteProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// ---- deleting a note for good (all scoped to the owner) ----

func (r *ProjectRepository) DeleteNoteSkillsByNote(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM note_skill_tbl
		 WHERE note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteSkillsByNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteNoteResourcesByNote(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_note_tbl
		 WHERE note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteResourcesByNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// every project link of the note, not only this project's
func (r *ProjectRepository) DeleteNoteProjectsByNote(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM note_projects
		 WHERE note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteProjectsByNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ProjectRepository) DeleteNote(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM notes_tbl WHERE note_id = ? AND user_id = ?`, noteID, userID)
	if err != nil {
		log.Printf("DeleteNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}
