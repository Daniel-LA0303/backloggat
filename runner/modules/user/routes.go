package user

import (
	"backloggat/runner/platform/response"

	"github.com/go-chi/chi/v5"
)

func RegisterUserRoutes(r chi.Router, h *UserHandler) {
	r.Post("/auth/register", response.Handle(h.CreateUser))
	r.Post("/auth/login", response.Handle(h.LoginUser))
}
