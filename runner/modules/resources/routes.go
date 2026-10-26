package resources

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *ResourceHandler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)
		r.Get("/resources", response.Handle(h.ListResources))    // list + filters + counters
		r.Get("/resources/{id}", response.Handle(h.GetResource)) // detail for the edit modal
		r.Post("/resources", response.Handle(h.CreateResource))
		r.Put("/resources/{id}", response.Handle(h.UpdateResource))
		r.Delete("/resources/{id}", response.Handle(h.DeleteResource))
	})
}
