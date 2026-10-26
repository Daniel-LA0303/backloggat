package vault

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

type PasswordRepository struct {
	db *sqlx.DB
}

func NewPasswordRepository(db *sqlx.DB) *PasswordRepository {
	return &PasswordRepository{db: db}
}

var passwordSortColumns = map[string]string{
	"name":       "name",
	"created_at": "created_at",
}

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// returns sql.ErrNoRows as is, so the service decides what it means
func (r *PasswordRepository) GetVault(ctx context.Context, userID int64) (*Vault, error) {
	var v Vault
	err := r.db.GetContext(ctx, &v,
		`SELECT user_id, kdf_salt, wrapped_key, wrap_nonce FROM vault_tbl WHERE user_id = ?`, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	if err != nil {
		log.Printf("GetVault ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &v, nil
}

func (r *PasswordRepository) InsertVault(ctx context.Context, v *Vault) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO vault_tbl (user_id, kdf_salt, wrapped_key, wrap_nonce) VALUES (?, ?, ?, ?)`,
		v.UserId, v.KdfSalt, v.WrappedKey, v.WrapNonce,
	)
	if err != nil {
		log.Printf("InsertVault ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

// never selects secret_enc: the list has no sensitive data
func (r *PasswordRepository) ListPasswords(ctx context.Context, userID int64, f PasswordFilters) ([]PasswordInfo, error) {
	items := []PasswordInfo{}

	query := `SELECT
			pass_id,
			user_id,
			name,
			COALESCE(site_username, '') AS site_username,
			COALESCE(url, '') AS url,
			color,
			created_at,
			updated_at
		 FROM pass_tbl
		 WHERE user_id = ?`
	args := []any{userID}

	if f.Search != "" {
		like := "%" + likeEscaper.Replace(f.Search) + "%"
		query += ` AND (name LIKE ? ESCAPE '\' OR site_username LIKE ? ESCAPE '\')`
		args = append(args, like, like)
	}

	col, ok := passwordSortColumns[f.SortBy]
	if !ok {
		col = "name"
	}
	dir := "ASC"
	if f.Order == "desc" {
		dir = "DESC"
	}
	query += fmt.Sprintf(` ORDER BY %s %s, pass_id ASC`, col, dir)

	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		log.Printf("ListPasswords ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return items, nil
}

func (r *PasswordRepository) InsertPassword(ctx context.Context, userID int64, p *NewPassword) (*PasswordInfo, error) {
	var item PasswordInfo
	err := r.db.GetContext(ctx, &item,
		`INSERT INTO pass_tbl (user_id, name, site_username, url, secret_enc, nonce, color)
		 VALUES (?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?, ?)
		 RETURNING pass_id, user_id, name,
		           COALESCE(site_username, '') AS site_username,
		           COALESCE(url, '') AS url,
		           color, created_at, updated_at`,
		userID, p.Name, p.SiteUsername, p.Url, p.SecretEnc, p.Nonce, p.Color,
	)
	if err != nil {
		log.Printf("InsertPassword ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &item, nil
}

func (r *PasswordRepository) GetPasswordSecret(ctx context.Context, userID, passID int64) (*PasswordSecret, error) {
	var s PasswordSecret
	err := r.db.GetContext(ctx, &s,
		`SELECT COALESCE(site_username, '') AS site_username, secret_enc, nonce
		 FROM pass_tbl WHERE pass_id = ? AND user_id = ?`,
		passID, userID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewNotFound("Password")
	}
	if err != nil {
		log.Printf("GetPasswordSecret ERROR: %v\n", err)
		return nil, apperr.NewDatabase(err)
	}
	return &s, nil
}

func (r *PasswordRepository) DeletePassword(ctx context.Context, userID, passID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM pass_tbl WHERE pass_id = ? AND user_id = ?`, passID, userID)
	if err != nil {
		log.Printf("DeletePassword ERROR: %v\n", err)
		return apperr.NewDatabase(err)
	}
	return nil
}

func (r *PasswordRepository) VaultExists(ctx context.Context, userID int64) (bool, error) {
	var n int
	err := r.db.GetContext(ctx, &n, `SELECT COUNT(*) FROM vault_tbl WHERE user_id = ?`, userID)
	if err != nil {
		log.Printf("VaultExists ERROR: %v\n", err)
		return false, apperr.NewDatabase(err)
	}
	return n > 0, nil
}
