package knowledge

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type KnowledgeHandler struct {
	svc *KnowledgeService
}

func NewKnowledgeHandler(svc *KnowledgeService) *KnowledgeHandler {
	return &KnowledgeHandler{svc: svc}
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid knowledge id")
	}
	return id, nil
}

// get all knowledge by user
// get all knowledge by user, with optional search and sorting
func (h *KnowledgeHandler) GetKnowledgeByUser(w http.ResponseWriter, r *http.Request) error {

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	q := r.URL.Query()
	filters := KnowledgeFilters{
		Search: q.Get("search"),
		SortBy: q.Get("sort_by"),
		Order:  q.Get("order"),
	}

	items, err := h.svc.GetKnowledgesByUser(r.Context(), userID, filters)
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Knowledges by user")
	return nil
}

// create handler
func (h *KnowledgeHandler) CreateKnowledge(w http.ResponseWriter, r *http.Request) error {

	var req CreateKnowledge

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	item, err := h.svc.CreateKnowledge(r.Context(), userID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Knowledge created")
	return nil
}

func (h *KnowledgeHandler) UpdateKnowledge(w http.ResponseWriter, r *http.Request) error {

	var req UpdateKnowledge

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

	item, err := h.svc.UpdateKnowledge(r.Context(), userID, id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Knowledge updated")
	return nil
}

// delete handler
func (h *KnowledgeHandler) DeleteKnowledge(w http.ResponseWriter, r *http.Request) error {

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteById(r.Context(), id, userID); err != nil {
		return err
	}
	response.OK(w, r, nil, "Knowledge deleted successfully")
	return nil
}
