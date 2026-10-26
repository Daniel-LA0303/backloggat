package skills

import (
	"backloggat/runner/modules/auth/jwt"
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

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	skill, err := h.svc.Create(r.Context(), userID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, skill, "Skill created")
	return nil
}

// get all skills by user, with optional search and sorting
func (h *Handler) GetSkillsByUser(w http.ResponseWriter, r *http.Request) error {

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	q := r.URL.Query()
	filters := SkillFilters{
		Search: q.Get("search"),
		SortBy: q.Get("sort_by"),
		Order:  q.Get("order"),
	}

	skills, err := h.svc.GetSkillByUser(r.Context(), userID, filters)
	if err != nil {
		return err
	}
	response.OK(w, r, skills, "Skills by user")
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

func (h *Handler) DeleteById(w http.ResponseWriter, r *http.Request) error {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)
	if err != nil {
		return apperr.NewValidation("Invalid skill id")
	}
	err = h.svc.DeleteById(r.Context(), id, userID)
	if err != nil {
		return err
	}
	response.OK(w, r, nil, "Skill deleted successfully!")
	return nil
}

// update skill name and color
func (h *Handler) UpdateSkill(w http.ResponseWriter, r *http.Request) error {

	var req UpdateSkillRequestDTO

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	skillID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || skillID <= 0 {
		return apperr.NewValidation("Invalid skill id")
	}

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}

	skill, err := h.svc.UpdateSkill(r.Context(), userID, skillID, req)
	if err != nil {
		return err
	}
	response.OK(w, r, skill, "Skill updated")
	return nil
}
