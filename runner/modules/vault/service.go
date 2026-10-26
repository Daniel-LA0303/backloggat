package vault

import (
	"backloggat/runner/platform/apperr"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"errors"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

type PasswordService struct {
	repo *PasswordRepository
}

func NewPasswordService(repo *PasswordRepository) *PasswordService {
	return &PasswordService{repo: repo}
}

// build the vault: random data key, wrapped with a key derived from the master password
func (s *PasswordService) CreateVault(ctx context.Context, userID int64, req CreateVaultRequest) error {
	salt, err := randomBytes(16)
	if err != nil {
		return apperr.NewInternal(err)
	}
	dek, err := randomBytes(keyLen)
	if err != nil {

		return apperr.NewInternal(err)
	}

	kek := deriveKEK(req.MasterPassword, salt)
	wrapped, nonce, err := seal(kek, dek, aadFor(userID))
	if err != nil {
		return apperr.NewInternal(err)
	}

	return s.repo.InsertVault(ctx, &Vault{
		UserId:     userID,
		KdfSalt:    salt,
		WrappedKey: wrapped,
		WrapNonce:  nonce,
	})
}

func (s *PasswordService) ListPasswords(ctx context.Context, userID int64, f PasswordFilters) ([]PasswordInfo, error) {
	f.Search = strings.TrimSpace(f.Search)
	f.SortBy = strings.ToLower(f.SortBy)
	f.Order = strings.ToLower(f.Order)
	return s.repo.ListPasswords(ctx, userID, f)
}

func (s *PasswordService) CreatePassword(ctx context.Context, userID int64, req CreatePasswordRequest) (*PasswordInfo, error) {
	dek, err := s.unlock(ctx, userID, req.MasterPassword)
	if err != nil {
		return nil, err
	}

	enc, nonce, err := seal(dek, []byte(req.Password), aadFor(userID))
	if err != nil {
		return nil, apperr.NewInternal(err)
	}

	return s.repo.InsertPassword(ctx, userID, &NewPassword{
		Name:         req.Name,
		SiteUsername: req.SiteUsername,
		Url:          req.Url,
		Color:        req.Color,
		SecretEnc:    enc,
		Nonce:        nonce,
	})
}

func (s *PasswordService) Reveal(ctx context.Context, userID, passID int64, req RevealRequest) (*RevealResponse, error) {
	dek, err := s.unlock(ctx, userID, req.MasterPassword)
	if err != nil {
		return nil, err
	}

	secret, err := s.repo.GetPasswordSecret(ctx, userID, passID)
	if err != nil {
		return nil, err
	}

	plain, err := open(dek, secret.Nonce, secret.SecretEnc, aadFor(userID))
	if err != nil {
		return nil, apperr.NewInternal(err)
	}
	return &RevealResponse{SiteUsername: secret.SiteUsername, Password: string(plain)}, nil
}

func (s *PasswordService) DeletePassword(ctx context.Context, userID, passID int64) error {
	return s.repo.DeletePassword(ctx, userID, passID)
}

// master password -> data key. A wrong master password fails the GCM check.
func (s *PasswordService) unlock(ctx context.Context, userID int64, master string) ([]byte, error) {
	vault, err := s.repo.GetVault(ctx, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.NewValidation("Create your master password first")
	}
	if err != nil {
		return nil, err
	}

	kek := deriveKEK(master, vault.KdfSalt)
	dek, err := open(kek, vault.WrapNonce, vault.WrappedKey, aadFor(userID))
	if err != nil {
		return nil, apperr.NewValidationFields("Invalid master password", map[string]string{
			"masterPassword": "Incorrect master password",
		})
	}
	return dek, nil
}

// //
const (
	argonTime    = 3
	argonMemory  = 64 * 1024 // KiB
	argonThreads = 4
	keyLen       = 32
)

func deriveKEK(master string, salt []byte) []byte {
	return argon2.IDKey([]byte(master), salt, argonTime, argonMemory, argonThreads, keyLen)
}

func randomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	return b, err
}

func newGCM(key []byte) (cipher.AEAD, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

// aad binds the ciphertext to its owner
func aadFor(userID int64) []byte {
	return []byte(strconv.FormatInt(userID, 10))
}

func seal(key, plain, aad []byte) (ciphertext, nonce []byte, err error) {
	gcm, err := newGCM(key)
	if err != nil {
		return nil, nil, err
	}
	nonce, err = randomBytes(gcm.NonceSize()) // 12 bytes, new on every save
	if err != nil {
		return nil, nil, err
	}
	return gcm.Seal(nil, nonce, plain, aad), nonce, nil
}

func open(key, nonce, ciphertext, aad []byte) ([]byte, error) {
	gcm, err := newGCM(key)
	if err != nil {
		return nil, err
	}
	return gcm.Open(nil, nonce, ciphertext, aad)
}

func (s *PasswordService) HasVault(ctx context.Context, userID int64) (bool, error) {
	return s.repo.VaultExists(ctx, userID)
}
