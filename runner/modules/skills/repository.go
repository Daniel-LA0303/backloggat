package skills

import (
	"backloggat/runner/platform/apperr"
	"context"
	"database/sql"
	"errors"
	"log"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, userID int64, name, color string) (*Skill, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO skills_tbl (user_id, name, color) VALUES (?, ?, ?)`,
		userID, name, color)
	if err != nil {
		return nil, apperr.NewDatabase(err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, apperr.NewDatabase(err)
	}
	return r.GetByID(ctx, id, userID) // read it back to get created_at, updated_at
}

// GetByID filters by user_id too, so nobody can read another user's skill.
func (r *Repository) GetByID(ctx context.Context, id, userID int64) (*Skill, error) {
	var s Skill
	err := r.db.GetContext(ctx, &s,
		`SELECT skill_id, user_id, name, color, created_at, updated_at
		 FROM skills_tbl WHERE skill_id = ? AND user_id = ?`, id, userID)

	// when is not a row, then return null
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, apperr.NewDatabase(err)
	}
	return &s, nil
}

func (r *Repository) ExistsByName(ctx context.Context, userID int64, name string) (bool, error) {
	var n int
	err := r.db.GetContext(ctx, &n,
		`SELECT COUNT(*) FROM skills_tbl WHERE user_id = ? AND lower(name) = lower(?)`,
		userID, name)
	if err != nil {
		return false, apperr.NewDatabase(err)
	}
	return n > 0, nil
}

func (r *Repository) ListSkills(userID int64) ([]SkillResponseDTO, error) {
	skills := []SkillResponseDTO{}
	err := r.db.Select(&skills,
		`SELECT 
			s.skill_id, 
			s.user_id, 
			s.name, 
			s.color, 
			s.created_at, 
			s.updated_at,

			-- subqueries
			(SELECT COUNT(*)
             FROM project_skill_tbl ps
             WHERE ps.skill_id = s.skill_id) AS projects_count,

            (SELECT COUNT(*)
             FROM note_skill_tbl ns
             WHERE ns.skill_id = s.skill_id) AS notes_count,

            (SELECT COUNT(*)
             FROM resources_skills_tbl rs
             WHERE rs.skill_id = s.skill_id) AS resources_count,

            (SELECT COUNT(*)
             FROM knowlage_skills_tbl ks
             WHERE ks.skill_id = s.skill_id) AS knowledge_count

		 FROM skills_tbl s
		 WHERE s.user_id = ?
		 ORDER BY s.name`,
		userID,
	)
	if err != nil {
		log.Printf("ListSkills ERROR: %v\n", err)
		return nil, err
	}
	return skills, nil
}

/****
TODO: WE CAN ADD SOME REPOS TO DELETE PRIVOTE TABLE (UPDATE)
DELTE FROM PROJECTS <-> SKILLS
ETC
****/

/* GET COUNTS SKILL INFO REPOSITORIES */
func (r *Repository) GetPojectsBySkill(
	ctx context.Context,
	skillId int64,
) (int, error) {

	var count int

	query := `
		select count(*) from project_skill_tbl
		where skill_id = $1
	`

	err := r.db.GetContext(ctx, &count, query, skillId)

	if err != nil {
		log.Printf("GetPojectsBySkill ERROR: %v\n", err)
		return 0, err
	}

	return count, err
}

func (r *Repository) GetNotesBySkill(
	ctx context.Context,
	skillId int64,
) (int, error) {

	var count int
	query := `
		select count(*) from note_skill_tbl
		where skill_id = $1
	`

	err := r.db.GetContext(ctx, &count, query, skillId)

	if err != nil {
		log.Printf("GetNotesBySkill ERROR: %v\n", err)
		return 0, err
	}

	return count, err
}

func (r *Repository) GetResourcesBySkill(
	ctx context.Context,
	skillId int64,
) (int, error) {

	var count int
	query := `
		select count(*) from resources_skills_tbl
		where skill_id = $1
	`

	err := r.db.GetContext(ctx, &count, query, skillId)

	if err != nil {
		log.Printf("GetResourcesBySkill ERROR: %v\n", err)
		return 0, err
	}

	return count, err
}

func (r *Repository) GetKnowlageBySkill(
	ctx context.Context,
	skillId int64,
) (int, error) {

	var count int
	query := `
		select count(*) from knowlage_skills_tbl
		where skill_id = $1
	`

	err := r.db.GetContext(ctx, &count, query, skillId)

	if err != nil {
		log.Printf("GetKnowlageBySkill ERROR: %v\n", err)
		return 0, err
	}

	return count, err
}

func (r *Repository) DeleteSkill(
	ctx context.Context,
	skillId int64,
) error {

	query := `
		delete from skills_tbl
		where skill_id = $1
	`

	_, err := r.db.ExecContext(ctx, query, skillId)

	if err != nil {
		log.Printf("DeleteSkill ERROR: %v\n", err)
		return err
	}

	return nil
}
