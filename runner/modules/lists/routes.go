package lists

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *ListHandler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)

		r.Get("/lists", response.Handle(h.ListLists))
		r.Post("/lists", response.Handle(h.CreateList))
		r.Get("/lists/{id}", response.Handle(h.GetList))
		r.Put("/lists/{id}", response.Handle(h.UpdateList))
		r.Delete("/lists/{id}", response.Handle(h.DeleteList))

		r.Get("/days/{id}", response.Handle(h.GetDay))
		r.Put("/days/{id}", response.Handle(h.UpdateDay))
		r.Post("/days/{id}/tasks", response.Handle(h.CreateTask))

		r.Put("/tasks/{id}", response.Handle(h.UpdateTask))
		r.Patch("/tasks/{id}/status", response.Handle(h.SetTaskStatus))
		r.Delete("/tasks/{id}", response.Handle(h.DeleteTask))
	})
}
