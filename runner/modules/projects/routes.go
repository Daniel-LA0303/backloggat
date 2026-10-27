package projects

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *ProjectHandler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)

		r.Get("/projects", response.Handle(h.ListProjects))
		r.Post("/projects", response.Handle(h.CreateProject))
		r.Get("/projects/{id}", response.Handle(h.GetProject))
		r.Put("/projects/{id}", response.Handle(h.UpdateProject))
		r.Delete("/projects/{id}", response.Handle(h.DeleteProject))

		r.Get("/projects/{id}/summary", response.Handle(h.GetSummary))
		r.Get("/projects/{id}/notes", response.Handle(h.ListNotes))
		r.Get("/projects/{id}/resources", response.Handle(h.ListResources))

		r.Get("/projects/{id}/tasks", response.Handle(h.ListTasks))
		r.Post("/projects/{id}/tasks", response.Handle(h.CreateTask))
		r.Put("/projects/{id}/tasks/{taskId}", response.Handle(h.UpdateTask))
		r.Patch("/projects/{id}/tasks/{taskId}/status", response.Handle(h.SetTaskStatus))
		r.Delete("/projects/{id}/tasks/{taskId}", response.Handle(h.DeleteTask))
	})
}
