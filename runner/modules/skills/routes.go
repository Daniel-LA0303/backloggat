package skills

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)
		r.Post("/skills", response.Handle(h.Create))         // create new skill
		r.Get("/skills", response.Handle(h.GetSkillsByUser)) // get all skills by user
		r.Get("/skills/{id}", response.Handle(h.GetByID))
		r.Delete("/skills/{id}", response.Handle(h.DeleteById)) // delete one skill
		r.Put("/skills/{id}", response.Handle(h.UpdateSkill))   // delete one skill
	})

}
