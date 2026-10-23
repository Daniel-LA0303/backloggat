package user

import "backloggat/runner/platform/validator"

type User struct {
	ID           int64  `db:"user_id"  json:"id"`
	Username     string `db:"username" json:"username"`
	Email        string `db:"email" json:"email"`
	PasswordHash string `db:"password_hash" json:"passwordHash"`
	CreatedAt    string `db:"created_at" json:"created_at"`
	UpdatedAt    string `db:"updated_at" json:"updated_at"`
}

func (r *User) Validate() error {
	v := validator.New()
	r.Username = v.Field("username", r.Username).Required().Max(50).Value()
	r.Email = v.Field("email", r.Email).Required().Email().Value()
	return v.Err()
}
