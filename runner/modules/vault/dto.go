package vault

import "backloggat/runner/platform/validator"

// ---- responses ----

type PasswordInfo struct {
	PassId       int64  `db:"pass_id" json:"id"`
	UserId       int64  `db:"user_id" json:"user_id"`
	Name         string `db:"name" json:"name"`
	SiteUsername string `db:"site_username" json:"site_username"`
	Url          string `db:"url" json:"url"`
	Color        string `db:"color" json:"color"`
	CreatedAt    string `db:"created_at" json:"created_at"`
	UpdatedAt    string `db:"updated_at" json:"updated_at"`
}

type RevealResponse struct {
	SiteUsername string `json:"site_username"`
	Password     string `json:"password"`
}

// ---- db models ----

type Vault struct {
	UserId     int64  `db:"user_id"`
	KdfSalt    []byte `db:"kdf_salt"`
	WrappedKey []byte `db:"wrapped_key"`
	WrapNonce  []byte `db:"wrap_nonce"`
}

type PasswordSecret struct {
	SiteUsername string `db:"site_username"`
	SecretEnc    []byte `db:"secret_enc"`
	Nonce        []byte `db:"nonce"`
}

type NewPassword struct {
	Name         string
	SiteUsername string
	Url          string
	Color        string
	SecretEnc    []byte
	Nonce        []byte
}

// ---- requests ----

type PasswordFilters struct {
	Search string
	SortBy string
	Order  string
}

type CreateVaultRequest struct {
	MasterPassword string `json:"masterPassword"`
}

func (r *CreateVaultRequest) Validate() error {
	v := validator.New()
	r.MasterPassword = v.Field("masterPassword", r.MasterPassword).Required().Min(8).Max(200).Value()
	return v.Err()
}

type CreatePasswordRequest struct {
	Name           string `json:"name"`
	SiteUsername   string `json:"siteUsername"`
	Url            string `json:"url"`
	Color          string `json:"color"`
	Password       string `json:"password"`
	MasterPassword string `json:"masterPassword"`
}

func (r *CreatePasswordRequest) Validate() error {
	v := validator.New()
	r.Name = v.Field("name", r.Name).Required().Max(100).Value()
	r.SiteUsername = v.Field("siteUsername", r.SiteUsername).Max(255).Value()
	r.Url = v.Field("url", r.Url).Max(500).Value()
	r.Color = v.Field("color", r.Color).Default("#64748b").Value()
	r.Password = v.Field("password", r.Password).Required().Max(1000).Value()
	r.MasterPassword = v.Field("masterPassword", r.MasterPassword).Required().Max(200).Value()
	return v.Err()
}

type RevealRequest struct {
	MasterPassword string `json:"masterPassword"`
}

func (r *RevealRequest) Validate() error {
	v := validator.New()
	r.MasterPassword = v.Field("masterPassword", r.MasterPassword).Required().Max(200).Value()
	return v.Err()
}
