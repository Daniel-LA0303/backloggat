package projects

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ProjectHandler struct {
	svc *ProjectService
}

func NewProjectHandler(svc *ProjectService) *ProjectHandler {
	return &ProjectHandler{svc: svc}
}

func userIDOf(r *http.Request) int64 {
	id, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)
	return id
}

func idParam(r *http.Request, name string) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, name), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid id")
	}
	return id, nil
}

// ---- projects ----

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) error {
	q := r.URL.Query()

	var skillID int64
	if raw := q.Get("skill_id"); raw != "" {
		id, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || id <= 0 {
			return apperr.NewValidation("Invalid skill id")
		}
		skillID = id
	}

	items, err := h.svc.ListProjects(r.Context(), userIDOf(r), ProjectFilters{
		Search:  q.Get("search"),
		Status:  q.Get("status"),
		SkillId: skillID,
		SortBy:  q.Get("sort_by"),
		Order:   q.Get("order"),
	})
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Projects by user")
	return nil
}

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) error {
	var req CreateProjectRequest
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.CreateProject(r.Context(), userIDOf(r), req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Project created")
	return nil
}

func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	item, err := h.svc.GetProject(r.Context(), userIDOf(r), id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Project")
	return nil
}

func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) error {
	var req UpdateProjectRequest
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.UpdateProject(r.Context(), userIDOf(r), id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Project updated")
	return nil
}

func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	if err := h.svc.DeleteProject(r.Context(), userIDOf(r), id); err != nil {
		return err
	}
	response.OK(w, r, nil, "Project deleted successfully")
	return nil
}

// ---- tabs ----

func (h *ProjectHandler) GetSummary(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	item, err := h.svc.GetSummary(r.Context(), userIDOf(r), id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Project summary")
	return nil
}

func (h *ProjectHandler) ListNotes(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	items, err := h.svc.ListNotes(r.Context(), userIDOf(r), id, r.URL.Query().Get("search"))
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Project notes")
	return nil
}

func (h *ProjectHandler) ListResources(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	items, err := h.svc.ListResources(r.Context(), userIDOf(r), id)
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Project resources")
	return nil
}

// ---- tasks ----

func (h *ProjectHandler) ListTasks(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	q := r.URL.Query()
	items, err := h.svc.ListTasks(r.Context(), userIDOf(r), id, TaskFilters{
		Search:   q.Get("search"),
		Status:   q.Get("status"),
		Priority: q.Get("priority"),
		SortBy:   q.Get("sort_by"),
		Order:    q.Get("order"),
	})
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Project tasks")
	return nil
}

func (h *ProjectHandler) CreateTask(w http.ResponseWriter, r *http.Request) error {
	var req CreateTaskRequest
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.CreateTask(r.Context(), userIDOf(r), id, req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Task created")
	return nil
}

func (h *ProjectHandler) UpdateTask(w http.ResponseWriter, r *http.Request) error {
	var req UpdateTaskRequest
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	taskID, err := idParam(r, "taskId")
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.UpdateTask(r.Context(), userIDOf(r), id, taskID, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Task updated")
	return nil
}

func (h *ProjectHandler) SetTaskStatus(w http.ResponseWriter, r *http.Request) error {
	var req TaskStatusRequest
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	taskID, err := idParam(r, "taskId")
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	item, err := h.svc.SetTaskStatus(r.Context(), userIDOf(r), id, taskID, req.Status)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Task updated")
	return nil
}

func (h *ProjectHandler) DeleteTask(w http.ResponseWriter, r *http.Request) error {
	id, err := idParam(r, "id")
	if err != nil {
		return err
	}
	taskID, err := idParam(r, "taskId")
	if err != nil {
		return err
	}
	if err := h.svc.DeleteTask(r.Context(), userIDOf(r), id, taskID); err != nil {
		return err
	}
	response.OK(w, r, nil, "Task deleted successfully")
	return nil
}
