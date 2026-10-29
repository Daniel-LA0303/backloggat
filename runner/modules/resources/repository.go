package resources

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

type ResourceRepository struct {
	db *sqlx.DB
}

func NewResourceRepository(db *sqlx.DB) *ResourceRepository {
	return &ResourceRepository{db: db}
}

var resourceSortColumns = map[string]string{
	"name":       "r.name",
	"created_at": "r.created_at",
	"type":       "r.type",
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// runs fn inside a transaction: any error rolls everything back
func (r *ResourceRepository) InTx(ctx context.Context, fn func(tx *sqlx.Tx) error) error {
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

func (r *ResourceRepository) ListResources(ctx context.Context, userID int64, f ResourceFilters) ([]ResourceInfo, error) {
	items := []ResourceInfo{}

	query := `SELECT
			r.resource_id,
			r.user_id,
			r.name,
			r.link,
			r.type,
			r.created_at,
			r.updated_at,

			-- counters
			(SELECT COUNT(*) FROM resources_skills_tbl rs
			 WHERE rs.resource_id = r.resource_id) AS skills_count,

			(SELECT COUNT(*) FROM resources_note_tbl rn
			 WHERE rn.resource_id = r.resource_id) AS notes_count,

			(SELECT COUNT(*) FROM resources_projects_tbl rp
			 WHERE rp.resource_id = r.resource_id) AS projects_count

		 FROM resources_tbl r
		 WHERE r.user_id = ?`
	args := []any{userID}

	if f.Search != "" {
		like := "%" + likeEscaper.Replace(f.Search) + "%"
		query += ` AND (r.name LIKE ? ESCAPE '\' OR r.link LIKE ? ESCAPE '\')`
		args = append(args, like, like)
	}
	if f.Type != "" {
		query += ` AND r.type = ?`
		args = append(args, f.Type)
	}

	col, ok := resourceSortColumns[f.SortBy]
	if !ok {
		col = "r.name"
	}
	dir := "ASC"
	if f.Order == "desc" {
		dir = "DESC"
	}
	query += fmt.Sprintf(` ORDER BY %s %s, r.resource_id ASC`, col, dir)

	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		log.Printf("ListResources ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ResourceRepository) GetResource(ctx context.Context, userID, id int64) (*ResourceInfo, error) {
	var item ResourceInfo
	err := r.db.GetContext(ctx, &item,
		`SELECT resource_id, user_id, name, link, type, created_at, updated_at
		 FROM resources_tbl WHERE resource_id = ? AND user_id = ?`,
		id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Resource")
	}
	if err != nil {
		log.Printf("GetResource ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ResourceRepository) ListResourceSkills(ctx context.Context, userID, id int64) ([]SkillRef, error) {
	items := []SkillRef{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT s.skill_id, s.name, s.color
		 FROM resources_skills_tbl rs
		 JOIN resources_tbl r ON r.resource_id = rs.resource_id
		 JOIN skills_tbl s ON s.skill_id = rs.skill_id
		 WHERE rs.resource_id = ? AND r.user_id = ?
		 ORDER BY s.name`,
		id, userID,
	)
	if err != nil {
		log.Printf("ListResourceSkills ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *ResourceRepository) ListResourceNoteIds(ctx context.Context, userID, id int64) ([]int64, error) {
	ids := []int64{}
	err := r.db.SelectContext(ctx, &ids,
		`SELECT rn.note_id
		 FROM resources_note_tbl rn
		 JOIN resources_tbl r ON r.resource_id = rn.resource_id
		 WHERE rn.resource_id = ? AND r.user_id = ?`,
		id, userID,
	)
	if err != nil {
		log.Printf("ListResourceNoteIds ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return ids, nil
}

func (r *ResourceRepository) ListResourceProjectIds(ctx context.Context, userID, id int64) ([]int64, error) {
	ids := []int64{}
	err := r.db.SelectContext(ctx, &ids,
		`SELECT rp.project_id
		 FROM resources_projects_tbl rp
		 JOIN resources_tbl r ON r.resource_id = rp.resource_id
		 WHERE rp.resource_id = ? AND r.user_id = ?`,
		id, userID,
	)
	if err != nil {
		log.Printf("ListResourceProjectIds ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return ids, nil
}

// ---- writes (ex is the db or a transaction) ----

func (r *ResourceRepository) InsertResource(ctx context.Context, ex sqlx.ExtContext, userID int64, d *ResourceRequest, driveFileID *string) (*ResourceInfo, error) {
	var item ResourceInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`INSERT INTO resources_tbl (user_id, name, link, type, drive_file_id)
		 VALUES (?, ?, ?, ?, ?)
		 RETURNING resource_id, user_id, name, link, type, drive_file_id, created_at, updated_at`,
		userID, d.Name, d.Link, d.Type, driveFileID,
	)
	if err != nil {
		log.Printf("InsertResource ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

/*func (r *ResourceRepository) UpdateResource(ctx context.Context, ex sqlx.ExtContext, userID, id int64, d *UpdateResourceRequest) (*ResourceInfo, error) {
	var item ResourceInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE resources_tbl
		 SET name = ?,
		     link = ?,
		     type = ?,
		     updated_at = datetime('now')
		 WHERE resource_id = ? AND user_id = ?
		 RETURNING resource_id, user_id, name, link, type, created_at, updated_at`,
		d.Name, d.Link, d.Type, id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Resource")
	}
	if err != nil {
		log.Printf("UpdateResource ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}*/

func (r *ResourceRepository) InsertResourceSkill(ctx context.Context, ex sqlx.ExtContext, resourceID, skillID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO resources_skills_tbl (resource_id, skill_id) VALUES (?, ?)`,
		resourceID, skillID)
	if err != nil {
		log.Printf("InsertResourceSkill ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ResourceRepository) InsertResourceNote(ctx context.Context, ex sqlx.ExtContext, resourceID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO resources_note_tbl (note_id, resource_id) VALUES (?, ?)`,
		noteID, resourceID)
	if err != nil {
		log.Printf("InsertResourceNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ResourceRepository) InsertResourceProject(ctx context.Context, ex sqlx.ExtContext, resourceID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO resources_projects_tbl (project_id, resource_id) VALUES (?, ?)`,
		projectID, resourceID)
	if err != nil {
		log.Printf("InsertResourceProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// all skills of a resource (scoped to the owner)
func (r *ResourceRepository) DeleteResourceSkills(ctx context.Context, ex sqlx.ExtContext, userID, resourceID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_skills_tbl
		 WHERE resource_id IN (SELECT resource_id FROM resources_tbl WHERE resource_id = ? AND user_id = ?)`,
		resourceID, userID)
	if err != nil {
		log.Printf("DeleteResourceSkills ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ResourceRepository) DeleteResourceNotes(ctx context.Context, ex sqlx.ExtContext, userID, resourceID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_note_tbl
		 WHERE resource_id IN (SELECT resource_id FROM resources_tbl WHERE resource_id = ? AND user_id = ?)`,
		resourceID, userID)
	if err != nil {
		log.Printf("DeleteResourceNotes ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ResourceRepository) DeleteResourceProjects(ctx context.Context, ex sqlx.ExtContext, userID, resourceID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_projects_tbl
		 WHERE resource_id IN (SELECT resource_id FROM resources_tbl WHERE resource_id = ? AND user_id = ?)`,
		resourceID, userID)
	if err != nil {
		log.Printf("DeleteResourceProjects ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// unlink one note
func (r *ResourceRepository) DeleteResourceNote(ctx context.Context, ex sqlx.ExtContext, userID, resourceID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_note_tbl
		 WHERE note_id = ?
		   AND resource_id IN (SELECT resource_id FROM resources_tbl WHERE resource_id = ? AND user_id = ?)`,
		noteID, resourceID, userID)
	if err != nil {
		log.Printf("DeleteResourceNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// unlink one project
func (r *ResourceRepository) DeleteResourceProject(ctx context.Context, ex sqlx.ExtContext, userID, resourceID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_projects_tbl
		 WHERE project_id = ?
		   AND resource_id IN (SELECT resource_id FROM resources_tbl WHERE resource_id = ? AND user_id = ?)`,
		projectID, resourceID, userID)
	if err != nil {
		log.Printf("DeleteResourceProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ResourceRepository) DeleteResource(ctx context.Context, ex sqlx.ExtContext, userID, id int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_tbl WHERE resource_id = ? AND user_id = ?`, id, userID)
	if err != nil {
		log.Printf("DeleteResource ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *ResourceRepository) GetResourceByID(ctx context.Context, ex sqlx.ExtContext, userID, resourceID int64) (*ResourceInfo, error) {
	var item ResourceInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`SELECT resource_id, user_id, name, link, type, drive_file_id, created_at, updated_at
		 FROM resources_tbl WHERE resource_id = ? AND user_id = ?`,
		resourceID, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewConflict("resource not found")
	}
	if err != nil {
		log.Printf("GetResourceByID ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ResourceRepository) UpdateResource(ctx context.Context, ex sqlx.ExtContext, userID, resourceID int64, name, link, typ string, driveFileID *string) (*ResourceInfo, error) {
	var item ResourceInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE resources_tbl
		 SET name = ?, link = ?, type = ?, drive_file_id = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE resource_id = ? AND user_id = ?
		 RETURNING resource_id, user_id, name, link, type, drive_file_id, created_at, updated_at`,
		name, link, typ, driveFileID, resourceID, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewConflict("resource not found")
	}
	if err != nil {
		log.Printf("UpdateResource ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *ResourceRepository) ReplaceResourceSkills(ctx context.Context, ex sqlx.ExtContext, resourceID int64, skillIDs []int64) error {
	if _, err := ex.ExecContext(ctx,
		`DELETE FROM resources_skills_tbl WHERE resource_id = ?`, resourceID); err != nil {
		log.Printf("ReplaceResourceSkills ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	for _, id := range skillIDs {
		if err := r.InsertResourceSkill(ctx, ex, resourceID, id); err != nil {
			return err
		}
	}
	return nil
}
