package user

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
)

type UserRespository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRespository {
	return &UserRespository{db: db}
}

func (r *UserRespository) GetByEmail(
	ctx context.Context,
	email string,
) (
	*UserInfoDTO, error,
) {

	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	query := `
		select user_id, username, email, created_at
		from user_tbl
		where email = $1
	`

	var user UserInfoDTO

	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		// evit return error so return nil,nil when there is not a row
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		log.Printf("GET USER BY EMAIL ERROR: %v\n", err)
		return nil, err
	}

	return &user, nil
}

func (r *UserRespository) RegisterUser(
	ctx context.Context,
	user *User,
) (
	*UserInfoDTO, error,
) {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	query := `
		insert into user_tbl (username, email, password_hash)
		values ($1, $2, $3)
		returning user_id, username, email, created_at
	`

	var userResponse UserInfoDTO

	err := r.db.QueryRowContext(ctx, query, user.Username, user.Email, user.PasswordHash).
		Scan(
			&userResponse.UserId,
			&userResponse.Username,
			&userResponse.Email,
			&userResponse.CreatedAt,
		)
	if err != nil {
		log.Printf("REGISTER NEW USER ERROR: %v\n", err)
		return nil, err
	}

	return &userResponse, nil
}

func (r *UserRespository) GetByEmailLogin(
	ctx context.Context,
	email string,
) (
	*UserLoginDBDTO, error,
) {

	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	query := `
		select user_id, username, email, password_hash
		from user_tbl
		where email = $1
	`

	var user UserLoginDBDTO

	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		// evit return error so return nil,nil when there is not a row
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		log.Printf("GET USER BY EMAIL LOGIN ERROR: %v\n", err)
		return nil, err
	}

	return &user, nil
}
