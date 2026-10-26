package knowledge

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

type KnowledgeRepository struct {
	db *sqlx.DB
}

func NewKnowledgeRepository(db *sqlx.DB) *KnowledgeRepository {
	return &KnowledgeRepository{db: db}
}

// TODO: this repo should be in skill service
func (r *KnowledgeRepository) ListKnowledgeBySkill(userId int64, skillId int64) ([]Knowlage, error) {
	skills := []Knowlage{}
	err := r.db.Select(&skills,
		`SELECT * from knowlage_tbl kt 
			left join knowlage_skills_tbl kst on kt.knowlage_id = kst.knowlage_id 
			left join skills_tbl st on kst.skill_id = st.skill_id 
			where st.user_id = ? and st.skill_id = ?;`,
		userId, skillId,
	)
	if err != nil {
		log.Printf("ListKnowledge ERROR: %v\n", err)
		return nil, err
	}
	return skills, nil
}

// list knowledge without pagination
var knowledgeSortColumns = map[string]string{
	"name":       "name",
	"created_at": "created_at",
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func (r *KnowledgeRepository) ListKnowledge(userId int64, f KnowledgeFilters) ([]Knowlage, error) {
	items := []Knowlage{}

	query := `SELECT
			knowlage_id,
			user_id,
			name,
			COALESCE(description, '') AS description,
			color,
			created_at,
			updated_at
		 FROM knowlage_tbl
		 WHERE user_id = ?`
	args := []any{userId}

	if f.Search != "" {
		query += ` AND name LIKE ? ESCAPE '\'`
		args = append(args, "%"+likeEscaper.Replace(f.Search)+"%")
	}

	col, ok := knowledgeSortColumns[f.SortBy]
	if !ok {
		col = "name"
	}
	dir := "ASC"
	if f.Order == "desc" {
		dir = "DESC"
	}
	query += fmt.Sprintf(` ORDER BY %s %s, knowlage_id ASC`, col, dir)

	if err := r.db.Select(&items, query, args...); err != nil {
		log.Printf("ListKnowledge ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

// create knowledge + pivot rows in one transaction
func (r *KnowledgeRepository) CreateKnowledge(ctx context.Context, userID int64, data *CreateKnowledge) (*Knowlage, error) {

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, apperr.NewDatabase(err)
	}
	defer tx.Rollback()

	var k Knowlage
	err = tx.GetContext(ctx, &k,
		`INSERT INTO knowlage_tbl (user_id, name, description, color)
		 VALUES (?, ?, ?, ?)
		 RETURNING knowlage_id, user_id, name, COALESCE(description, '') AS description,
		           color, created_at, updated_at`,
		userID, data.Name, data.Description, data.Color,
	)
	if err != nil {
		log.Printf("CreateKnowledge ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}

	for _, skillID := range data.SkillsIds {
		_, err := tx.ExecContext(ctx,
			`INSERT OR IGNORE INTO knowlage_skills_tbl (knowlage_id, skill_id) VALUES (?, ?)`,
			k.KnowlageId, skillID,
		)
		if err != nil {
			log.Printf("CreateKnowledge pivot ERROR: %v\n", err)
			return nil, apperr.NewDatabase(err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, apperr.NewDatabase(err)
	}
	return &k, nil
}

// update info of one knowledge
func (r *KnowledgeRepository) UpdateKnowledge(ctx context.Context, userID, knowledgeID int64, data *UpdateKnowledge) (*Knowlage, error) {

	var k Knowlage
	err := r.db.GetContext(ctx, &k,
		`UPDATE knowlage_tbl
		 SET name = ?,
		     description = ?,
		     color = ?,
		     updated_at = datetime('now')
		 WHERE knowlage_id = ? AND user_id = ?
		 RETURNING knowlage_id, user_id, name, COALESCE(description, '') AS description,
		           color, created_at, updated_at`,
		data.Name, data.Description, data.Color, knowledgeID, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Knowledge")
	}
	if err != nil {
		log.Printf("UpdateKnowledge ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &k, nil
}

// delete knowledge and its pivot rows in one transaction
func (r *KnowledgeRepository) DeleteKnowledge(ctx context.Context, userID, knowledgeID int64) error {

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return apperr.NewDatabase(err)
	}
	defer tx.Rollback()

	// pivot first (no ON DELETE CASCADE there), scoped to the owner
	_, err = tx.ExecContext(ctx,
		`DELETE FROM knowlage_skills_tbl
		 WHERE knowlage_id IN (
		   SELECT knowlage_id FROM knowlage_tbl WHERE knowlage_id = ? AND user_id = ?
		 )`,
		knowledgeID, userID,
	)
	if err != nil {
		log.Printf("DeleteKnowledge pivot ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}

	res, err := tx.ExecContext(ctx,
		`DELETE FROM knowlage_tbl WHERE knowlage_id = ? AND user_id = ?`,
		knowledgeID, userID,
	)
	if err != nil {
		log.Printf("DeleteKnowledge ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return apperr.NewNotFound("Knowledge")
	}

	if err := tx.Commit(); err != nil {
		return apperr.NewDatabase(err)
	}
	return nil
}
