package resources

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ResourceHandler struct {
	svc *ResourceService
}

func NewResourceHandler(svc *ResourceService) *ResourceHandler {
	return &ResourceHandler{svc: svc}
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid resource id")
	}
	return id, nil
}

// list resources by user, with search, type filter and sorting
func (h *ResourceHandler) ListResources(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	q := r.URL.Query()
	filters := ResourceFilters{
		Search: q.Get("search"),
		Type:   q.Get("type"),
		SortBy: q.Get("sort_by"),
		Order:  q.Get("order"),
	}

	items, err := h.svc.ListResources(r.Context(), userID, filters)
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Resources by user")
	return nil
}

// one resource with its current links
func (h *ResourceHandler) GetResource(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	item, err := h.svc.GetResource(r.Context(), userID, id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Resource")
	return nil
}

// create handler
func (h *ResourceHandler) CreateResource(w http.ResponseWriter, r *http.Request) error {
	var req CreateResourceRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	item, err := h.svc.CreateResource(r.Context(), userID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Resource created")
	return nil
}

// update handler
func (h *ResourceHandler) UpdateResource(w http.ResponseWriter, r *http.Request) error {
	var req UpdateResourceRequest

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

	item, err := h.svc.UpdateResource(r.Context(), userID, id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Resource updated")
	return nil
}

// delete handler
func (h *ResourceHandler) DeleteResource(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteResource(r.Context(), userID, id); err != nil {
		return err
	}
	response.OK(w, r, nil, "Resource deleted successfully")
	return nil
}
