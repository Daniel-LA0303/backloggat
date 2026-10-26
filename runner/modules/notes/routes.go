package notes

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *NoteHandler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)
		r.Get("/notes", response.Handle(h.ListNotes))    // list + filters + counters
		r.Get("/notes/{id}", response.Handle(h.GetNote)) // detail for the edit modal
		r.Post("/notes", response.Handle(h.CreateNote))
		r.Put("/notes/{id}", response.Handle(h.UpdateNote))
		r.Patch("/notes/{id}/pin", response.Handle(h.PinNote))
		r.Delete("/notes/{id}", response.Handle(h.DeleteNote))
	})
}
