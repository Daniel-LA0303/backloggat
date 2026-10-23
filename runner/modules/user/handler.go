package user

import (
	"backloggat/runner/platform/response"
	"net/http"
)

type UserHandler struct {
	svc *UserService
}

func NewUserHandler(svc *UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) error {
	var req User
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	skill, err := h.svc.CreateUser(r.Context(), req)
	if err != nil {
		return err
	}
	response.Created(w, r, skill, "User created")
	return nil
}

func (h *UserHandler) LoginUser(w http.ResponseWriter, r *http.Request) error {
	var req UserLoginRequestDTO
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}
	skill, err := h.svc.LoginUser(r.Context(), req)
	if err != nil {
		return err
	}
	response.Created(w, r, skill, "User login successfully!")
	return nil
}
