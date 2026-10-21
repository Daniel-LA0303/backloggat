package skills

import (
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// TODO: replace with the logged-in user once auth exists.
// User 1 must exist in user_tbl or the INSERT fails on the foreign key.
const tempUserID int64 = 1

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Handlers return an error. response.Handle turns it into the JSON envelope.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) error {
	var req CreateSkillRequest
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	skill, err := h.svc.Create(r.Context(), tempUserID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, skill, "Skill created")
	return nil
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) error {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		return apperr.NewValidation("Invalid skill id")
	}
	skill, err := h.svc.GetByID(r.Context(), id, tempUserID)
	if err != nil {
		return err
	}
	response.OK(w, r, skill, "Skill found")
	return nil
}
