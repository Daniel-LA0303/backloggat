package knowledge

import (
	"backloggat/runner/platform/apperr"
	"context"
	"database/sql"
	"errors"
	"log"

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

// list knoledge without pagination
func (r *KnowledgeRepository) ListKnowledge(userId int64) ([]Knowlage, error) {
	skills := []Knowlage{}
	err := r.db.Select(&skills,
		`SELECT 
			s.knowlage_id, 
			s.user_id, 
			s.name, 
			s.description,
			s.color, 
			s.created_at, 
			s.updated_at
		 FROM knowlage_tbl s
		 WHERE s.user_id = ?
		 ORDER BY s.name`,
		userId,
	)
	if err != nil {
		log.Printf("ListKnowledge ERROR: %v\n", err)
		return nil, err
	}
	return skills, nil
}

// get one by id
func (r *KnowledgeRepository) GetByID(ctx context.Context, id int64, userID int64) (*Knowlage, error) {
	var s Knowlage
	err := r.db.GetContext(ctx, &s,
		`SELECT knowlage_id, user_id, name, color, created_at, updated_at
		 FROM knowlage_tbl WHERE knowlage_id = ? AND user_id = ?`, id, userID)

	// when is not a row, then return null
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, apperr.NewDatabase(err)
	}
	return &s, nil
}

// create new knowledge
func (r *KnowledgeRepository) CreateKnowledge(ctx context.Context, userID int64, data *CreateKnowledge) (*KnowlageInfo, error) {

	query := `
		INSERT INTO knowlage_tbl (user_id, name, description, color) VALUES (?, ?, ?, ?) 
		returning knowlage_id, user_id, name, description, color, created_at
	`

	var knowledgeR KnowlageInfo

	err := r.db.QueryRowContext(ctx, query,
		userID, data.Name, data.Description, data.Color).Scan(
		&knowledgeR.KnowlageId,
		&knowledgeR.UserId,
		&knowledgeR.Name,
		&knowledgeR.Description,
		&knowledgeR.Color,
		&knowledgeR.CreatedAt,
	)

	if err != nil {
		log.Printf("CreateKnowledge ERROR: %v\n", err)
		return nil, err
	}
	return &knowledgeR, nil
}

// to insert in pivote table
func (r *KnowledgeRepository) InserKnowledgeSkill(ctx context.Context, skillId int64, knowledgeId int64) error {

	query := `
		INSERT INTO knowlage_skills_tbl (knowlage_id, skill_id) VALUES (?, ?) 
	`
	_, err := r.db.ExecContext(ctx, query, knowledgeId, skillId)

	if err != nil {
		log.Printf("InserKnowledgeSkill ERROR: %v\n", err)
		return err
	}
	return nil
}

// to delete one knowledge
func (r *KnowledgeRepository) DeleteKnowledge(ctx context.Context, knowledgeId int64) error {

	query := `
		delete from knowlage_tbl where knowlage_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, knowledgeId)

	if err != nil {
		log.Printf("DeleteKnowledge ERROR: %v\n", err)
		return err
	}
	return nil
}
