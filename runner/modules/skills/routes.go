package skills

import (
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Post("/skills", response.Handle(h.Create))
	r.Get("/skills/{id}", response.Handle(h.GetByID))
}
