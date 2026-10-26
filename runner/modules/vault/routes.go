package vault

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, h *PasswordHandler) {
	r.Group(func(r chi.Router) {
		r.Use(jwt.WithJWTAuth)
		r.Post("/vault", response.Handle(h.CreateVault))               // set the master password
		r.Get("/passwords", response.Handle(h.ListPasswords))          // list with filters (no secrets)
		r.Post("/passwords", response.Handle(h.CreatePassword))        // create
		r.Post("/passwords/{id}/reveal", response.Handle(h.Reveal))    // show real values
		r.Delete("/passwords/{id}", response.Handle(h.DeletePassword)) // delete
		r.Get("/vault/status", response.Handle(h.VaultStatus))
	})
}
