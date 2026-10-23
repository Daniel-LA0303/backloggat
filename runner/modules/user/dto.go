package user

import "backloggat/runner/platform/validator"

type UserInfoDTO struct {
	UserId    int64  `json:"userId" db:"user_id"`
	Username  string `db:"username" json:"username"`
	Email     string `db:"email" json:"email"`
	Token     string `json:"token"`
	CreatedAt string `db:"created_at" json:"created_at"`
}

type UserLoginDBDTO struct {
	UserId       int64  `json:"userId" db:"user_id"`
	Username     string `db:"username" json:"username"`
	Email        string `db:"email" json:"email"`
	PasswordHash string `db:"password_hash" json:"passwordHash"`
	Token        string `json:"token"`
}

type UserLoginResponseDTO struct {
	UserId   int64  `json:"userId" db:"user_id"`
	Username string `db:"username" json:"username"`
	Email    string `db:"email" json:"email"`
	Token    string `json:"token"`
}

type UserLoginRequestDTO struct {
	Email        string `db:"email" json:"email"`
	PasswordHash string `db:"password_hash" json:"password"`
}

func (r *UserLoginRequestDTO) Validate() error {
	v := validator.New()
	r.Email = v.Field("email", r.Email).Required().Email().Value()
	r.PasswordHash = v.Field("password", r.PasswordHash).Required().Value()
	return v.Err()
}
