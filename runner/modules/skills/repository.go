package skills

import (
	"backloggat/runner/platform/apperr"
	"context"

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

	/*if errors.Is(err, sqlx.Get().ErrNoRows) {
		return nil, apperr.NewNotFound("Skill")
	}*/
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
