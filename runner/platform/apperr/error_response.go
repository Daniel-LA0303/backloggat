package apperr

import (
	"errors"
	"fmt"
	"net/http"
)

type Type string

const (
	TypeValidation   Type = "VALIDATION_ERROR"
	TypeNotFound     Type = "NOT_FOUND"
	TypeDatabase     Type = "DATABASE_ERROR"
	TypeUnauthorized Type = "UNAUTHORIZED"
	TypeForbidden    Type = "FORBIDDEN"
	TypeConflict     Type = "CONFLICT"
	TypeInternal     Type = "INTERNAL_ERROR"
)

type AppError struct {
	Type       Type              `json:"type"`
	Message    string            `json:"message"`
	Fields     map[string]string `json:"fields,omitempty"`
	StatusCode int               `json:"-"`
	Err        error             `json:"-"` // original cause, logged but never sent
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (caused by: %v)", e.Type, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Type, e.Message)
}

// lets errors.Is / errors.As see the original error
func (e *AppError) Unwrap() error { return e.Err }

// From always returns an *AppError: the one inside err, or a generic internal error.
func From(err error) *AppError {
	var ae *AppError
	if errors.As(err, &ae) {
		return ae
	}
	return NewInternal(err)
}

// IsType reports whether err is an AppError of the given type.
func IsType(err error, t Type) bool {
	var ae *AppError
	return errors.As(err, &ae) && ae.Type == t
}

func NewValidation(message string) *AppError {
	return &AppError{Type: TypeValidation, Message: message, StatusCode: http.StatusBadRequest}
}

func NewValidationFields(message string, fields map[string]string) *AppError {
	return &AppError{Type: TypeValidation, Message: message, Fields: fields, StatusCode: http.StatusBadRequest}
}

func NewNotFound(resource string) *AppError {
	return &AppError{Type: TypeNotFound, Message: resource + " not found", StatusCode: http.StatusNotFound}
}

func NewConflict(message string) *AppError {
	return &AppError{Type: TypeConflict, Message: message, StatusCode: http.StatusConflict}
}

func NewDatabase(err error) *AppError {
	return &AppError{Type: TypeDatabase, Message: "Database operation failed", StatusCode: http.StatusInternalServerError, Err: err}
}

func NewInternal(err error) *AppError {
	return &AppError{Type: TypeInternal, Message: "An internal error occurred", StatusCode: http.StatusInternalServerError, Err: err}
}

func NewUnauthorized(message string) *AppError {
	return &AppError{Type: TypeUnauthorized, Message: message, StatusCode: http.StatusUnauthorized}
}

func NewForbidden(message string) *AppError {
	return &AppError{Type: TypeForbidden, Message: message, StatusCode: http.StatusForbidden}
}
