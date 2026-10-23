package knowledge

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *KnowledgeHandler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)
		r.Get("/knowledges", response.Handle(h.GetKnowledgeByUser))
		r.Post("/knowledges", response.Handle(h.CreateKnowledge))
		r.Delete("/knowledges/{id}", response.Handle(h.DeleteKnowledge))
	})

}
