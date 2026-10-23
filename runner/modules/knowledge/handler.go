package knowledge

import (
	"backloggat/runner/modules/auth/jwt"
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

func (h *KnowledgeHandler) GetKnowledgeByUser(w http.ResponseWriter, r *http.Request) error {

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	skills, err := h.svc.GetKnowledgesByUser(r.Context(), userID)
	if err != nil {
		return err
	}
	response.Created(w, r, skills, "Knowledges by user")
	return nil
}

func (h *KnowledgeHandler) GetKnowledgeBySkillAndUser(w http.ResponseWriter, r *http.Request) error {

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	skills, err := h.svc.GetKnowledgesBySkillAndUser(r.Context(), userID, id)
	if err != nil {
		return err
	}
	response.Created(w, r, skills, "Knowledges by user")
	return nil
}

func (h *KnowledgeHandler) CreateKnowledge(w http.ResponseWriter, r *http.Request) error {

	var req CreateKnowledge

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	skills, err := h.svc.CreateKnowledge(r.Context(), userID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, skills, "Knowledges by user")
	return nil
}

func (h *KnowledgeHandler) DeleteKnowledge(w http.ResponseWriter, r *http.Request) error {

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	err = h.svc.DeleteById(r.Context(), id, userID)
	if err != nil {
		return err
	}
	response.Created(w, r, nil, "Knowledge deleted successfully!")
	return nil
}
