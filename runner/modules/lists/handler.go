package lists

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ListHandler struct {
	svc *ListService
}

func NewListHandler(svc *ListService) *ListHandler {
	return &ListHandler{svc: svc}
}

func userIDOf(r *http.Request) int64 {
	id, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)
	return id
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid id")
	}
	return id, nil
}

// ---- lists (months) ----

func (h *ListHandler) ListLists(w http.ResponseWriter, r *http.Request) error {
	items, err := h.svc.ListLists(r.Context(), userIDOf(r))
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Lists by user")
	return nil
}

func (h *ListHandler) GetList(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r)
	if err != nil {
		return err
	}
	item, err := h.svc.GetList(r.Context(), userIDOf(r), id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "List")
	return nil
}

func (h *ListHandler) CreateList(w http.ResponseWriter, r *http.Request) error {
	var req CreateListRequest
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.CreateList(r.Context(), userIDOf(r), req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "List created")
	return nil
}

func (h *ListHandler) UpdateList(w http.ResponseWriter, r *http.Request) error {
	var req UpdateListRequest
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
	item, err := h.svc.UpdateList(r.Context(), userIDOf(r), id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "List updated")
	return nil
}

func (h *ListHandler) DeleteList(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteList(r.Context(), userIDOf(r), id); err != nil {
		return err
	}
	response.OK(w, r, nil, "List deleted successfully")
	return nil
}

// ---- days ----

func (h *ListHandler) GetDay(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r)
	if err != nil {
		return err
	}
	item, err := h.svc.GetDay(r.Context(), userIDOf(r), id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Day")
	return nil
}

func (h *ListHandler) UpdateDay(w http.ResponseWriter, r *http.Request) error {
	var req UpdateDayRequest
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
	item, err := h.svc.UpdateDay(r.Context(), userIDOf(r), id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Day updated")
	return nil
}

// ---- tasks ----

func (h *ListHandler) CreateTask(w http.ResponseWriter, r *http.Request) error {
	var req CreateTaskRequest
	dayID, err := pathID(r)
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.CreateTask(r.Context(), userIDOf(r), dayID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Task created")
	return nil
}

func (h *ListHandler) UpdateTask(w http.ResponseWriter, r *http.Request) error {
	var req UpdateTaskRequest
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
	item, err := h.svc.UpdateTask(r.Context(), userIDOf(r), id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Task updated")
	return nil
}

func (h *ListHandler) SetTaskStatus(w http.ResponseWriter, r *http.Request) error {
	var req TaskStatusRequest
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
	item, err := h.svc.SetTaskStatus(r.Context(), userIDOf(r), id, req.Status)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Task updated")
	return nil
}

func (h *ListHandler) DeleteTask(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteTask(r.Context(), userIDOf(r), id); err != nil {
		return err
	}
	response.OK(w, r, nil, "Task deleted successfully")
	return nil
}
