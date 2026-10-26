package notes

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

type NoteRepository struct {
	db *sqlx.DB
}

func NewNoteRepository(db *sqlx.DB) *NoteRepository {
	return &NoteRepository{db: db}
}

var noteSortColumns = map[string]string{
	"title":      "n.title",
	"created_at": "n.created_at",
	"updated_at": "n.updated_at",
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// runs fn inside a transaction: any error rolls everything back
func (r *NoteRepository) InTx(ctx context.Context, fn func(tx *sqlx.Tx) error) error {
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

// no content here: the list stays light
func (r *NoteRepository) ListNotes(ctx context.Context, userID int64, f NoteFilters) ([]NoteInfo, error) {
	items := []NoteInfo{}

	query := `SELECT
			n.note_id,
			n.user_id,
			n.title,
			n.color,
			COALESCE(n.description, '') AS description,
			n.pinned,
			n.created_at,
			n.updated_at,

			-- counters
			(SELECT COUNT(*) FROM note_skill_tbl ns
			 WHERE ns.note_id = n.note_id) AS skills_count,

			(SELECT COUNT(*) FROM resources_note_tbl rn
			 WHERE rn.note_id = n.note_id) AS resources_count,

			(SELECT COUNT(*) FROM note_projects np
			 WHERE np.note_id = n.note_id) AS projects_count

		 FROM notes_tbl n
		 WHERE n.user_id = ?`
	args := []any{userID}

	if f.Search != "" {
		like := "%" + likeEscaper.Replace(f.Search) + "%"
		query += ` AND (n.title LIKE ? ESCAPE '\' OR n.description LIKE ? ESCAPE '\')`
		args = append(args, like, like)
	}

	if f.SkillId > 0 {
		query += ` AND EXISTS (
		SELECT 1 FROM note_skill_tbl fs
		WHERE fs.note_id = n.note_id AND fs.skill_id = ?)`
		args = append(args, f.SkillId)
	}

	col, ok := noteSortColumns[f.SortBy]
	if !ok {
		col = "n.updated_at"
	}
	dir := "DESC"
	if f.Order == "asc" {
		dir = "ASC"
	}
	// pinned notes always first
	query += fmt.Sprintf(` ORDER BY n.pinned DESC, %s %s, n.note_id ASC`, col, dir)

	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		log.Printf("ListNotes ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *NoteRepository) GetNote(ctx context.Context, userID, id int64) (*NoteInfo, error) {
	var item NoteInfo
	err := r.db.GetContext(ctx, &item,
		`SELECT note_id, user_id, title, color,
		        COALESCE(description, '') AS description,
		        pinned, created_at, updated_at
		 FROM notes_tbl WHERE note_id = ? AND user_id = ?`,
		id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Note")
	}
	if err != nil {
		log.Printf("GetNote ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *NoteRepository) GetNoteContent(ctx context.Context, userID, id int64) (string, error) {
	var c string
	err := r.db.GetContext(ctx, &c,
		`SELECT COALESCE(content, '') FROM notes_tbl WHERE note_id = ? AND user_id = ?`,
		id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return "", apperr.NewNotFound("Note")
	}
	if err != nil {
		log.Printf("GetNoteContent ERROR: %v\n", err)
		return "", apperr.NewDatabase(err)
	}
	return c, nil
}

func (r *NoteRepository) ListNoteSkills(ctx context.Context, userID, id int64) ([]SkillRef, error) {
	items := []SkillRef{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT s.skill_id, s.name, s.color
		 FROM note_skill_tbl ns
		 JOIN notes_tbl n ON n.note_id = ns.note_id
		 JOIN skills_tbl s ON s.skill_id = ns.skill_id
		 WHERE ns.note_id = ? AND n.user_id = ?
		 ORDER BY s.name`,
		id, userID,
	)
	if err != nil {
		log.Printf("ListNoteSkills ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *NoteRepository) ListNoteResources(ctx context.Context, userID, id int64) ([]ResourceRef, error) {
	items := []ResourceRef{}
	err := r.db.SelectContext(ctx, &items,
		`SELECT rs.resource_id, rs.name, rs.type
		 FROM resources_note_tbl rn
		 JOIN notes_tbl n ON n.note_id = rn.note_id
		 JOIN resources_tbl rs ON rs.resource_id = rn.resource_id
		 WHERE rn.note_id = ? AND n.user_id = ?
		 ORDER BY rs.name`,
		id, userID,
	)
	if err != nil {
		log.Printf("ListNoteResources ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *NoteRepository) ListNoteProjectIds(ctx context.Context, userID, id int64) ([]int64, error) {
	ids := []int64{}
	err := r.db.SelectContext(ctx, &ids,
		`SELECT np.project_id
		 FROM note_projects np
		 JOIN notes_tbl n ON n.note_id = np.note_id
		 WHERE np.note_id = ? AND n.user_id = ?`,
		id, userID,
	)
	if err != nil {
		log.Printf("ListNoteProjectIds ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return ids, nil
}

// ---- writes (ex is the db or a transaction) ----

func (r *NoteRepository) InsertNote(ctx context.Context, ex sqlx.ExtContext, userID int64, d *CreateNoteRequest) (*NoteInfo, error) {
	var item NoteInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`INSERT INTO notes_tbl (user_id, title, color, description, content, pinned)
		 VALUES (?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?)
		 RETURNING note_id, user_id, title, color,
		           COALESCE(description, '') AS description,
		           pinned, created_at, updated_at`,
		userID, d.Title, d.Color, d.Description, d.Content, d.Pinned,
	)
	if err != nil {
		log.Printf("InsertNote ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *NoteRepository) UpdateNote(ctx context.Context, ex sqlx.ExtContext, userID, id int64, d *UpdateNoteRequest) (*NoteInfo, error) {
	var item NoteInfo
	err := sqlx.GetContext(ctx, ex, &item,
		`UPDATE notes_tbl
		 SET title = ?,
		     color = ?,
		     description = NULLIF(?, ''),
		     content = NULLIF(?, ''),
		     pinned = ?,
		     updated_at = datetime('now')
		 WHERE note_id = ? AND user_id = ?
		 RETURNING note_id, user_id, title, color,
		           COALESCE(description, '') AS description,
		           pinned, created_at, updated_at`,
		d.Title, d.Color, d.Description, d.Content, d.Pinned, id, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Note")
	}
	if err != nil {
		log.Printf("UpdateNote ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *NoteRepository) InsertNoteSkill(ctx context.Context, ex sqlx.ExtContext, noteID, skillID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO note_skill_tbl (note_id, skill_id) VALUES (?, ?)`,
		noteID, skillID)
	if err != nil {
		log.Printf("InsertNoteSkill ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *NoteRepository) InsertNoteResource(ctx context.Context, ex sqlx.ExtContext, noteID, resourceID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO resources_note_tbl (note_id, resource_id) VALUES (?, ?)`,
		noteID, resourceID)
	if err != nil {
		log.Printf("InsertNoteResource ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *NoteRepository) InsertNoteProject(ctx context.Context, ex sqlx.ExtContext, noteID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`INSERT OR IGNORE INTO note_projects (note_id, project_id) VALUES (?, ?)`,
		noteID, projectID)
	if err != nil {
		log.Printf("InsertNoteProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// all skills of a note (scoped to the owner)
func (r *NoteRepository) DeleteNoteSkills(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM note_skill_tbl
		 WHERE note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteSkills ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *NoteRepository) DeleteNoteResources(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM resources_note_tbl
		 WHERE note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteResources ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *NoteRepository) DeleteNoteProjects(ctx context.Context, ex sqlx.ExtContext, userID, noteID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM note_projects
		 WHERE note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteProjects ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// unlink one project
func (r *NoteRepository) DeleteNoteProject(ctx context.Context, ex sqlx.ExtContext, userID, noteID, projectID int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM note_projects
		 WHERE project_id = ?
		   AND note_id IN (SELECT note_id FROM notes_tbl WHERE note_id = ? AND user_id = ?)`,
		projectID, noteID, userID)
	if err != nil {
		log.Printf("DeleteNoteProject ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *NoteRepository) DeleteNote(ctx context.Context, ex sqlx.ExtContext, userID, id int64) error {
	_, err := ex.ExecContext(ctx,
		`DELETE FROM notes_tbl WHERE note_id = ? AND user_id = ?`, id, userID)
	if err != nil {
		log.Printf("DeleteNote ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *NoteRepository) UpdateNotePinned(ctx context.Context, userID, id int64, pinned bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE notes_tbl SET pinned = ? WHERE note_id = ? AND user_id = ?`,
		pinned, id, userID)
	if err != nil {
		log.Printf("UpdateNotePinned ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}
