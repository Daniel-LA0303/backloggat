package vault

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type PasswordHandler struct {
	svc *PasswordService
}

func NewPasswordHandler(svc *PasswordService) *PasswordHandler {
	return &PasswordHandler{svc: svc}
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid password id")
	}
	return id, nil
}

// create the vault (master password)
func (h *PasswordHandler) CreateVault(w http.ResponseWriter, r *http.Request) error {
	var req CreateVaultRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	if err := h.svc.CreateVault(r.Context(), userID, req); err != nil {
		return err
	}
	response.Created(w, r, nil, "Vault created")
	return nil
}

// list passwords by user, with optional search and sorting
func (h *PasswordHandler) ListPasswords(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	q := r.URL.Query()
	filters := PasswordFilters{
		Search: q.Get("search"),
		SortBy: q.Get("sort_by"),
		Order:  q.Get("order"),
	}

	items, err := h.svc.ListPasswords(r.Context(), userID, filters)
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Passwords by user")
	return nil
}

// create handler
func (h *PasswordHandler) CreatePassword(w http.ResponseWriter, r *http.Request) error {
	var req CreatePasswordRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	item, err := h.svc.CreatePassword(r.Context(), userID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Password created")
	return nil
}

// reveal handler
func (h *PasswordHandler) Reveal(w http.ResponseWriter, r *http.Request) error {
	var req RevealRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	data, err := h.svc.Reveal(r.Context(), userID, id, req)
	if err != nil {
		return err
	}
	w.Header().Set("Cache-Control", "no-store")
	response.OK(w, r, data, "Password revealed")
	return nil
}

// delete handler
func (h *PasswordHandler) DeletePassword(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeletePassword(r.Context(), userID, id); err != nil {
		return err
	}
	response.OK(w, r, nil, "Password deleted successfully")
	return nil
}

func (h *PasswordHandler) VaultStatus(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	exists, err := h.svc.HasVault(r.Context(), userID)
	if err != nil {
		return err
	}
	response.OK(w, r, map[string]bool{"exists": exists}, "Vault status")
	return nil
}
