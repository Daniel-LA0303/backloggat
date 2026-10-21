package response

import (
	"backloggat/runner/platform/apperr"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

type Envelope struct {
	Error     bool   `json:"error"`
	Status    int    `json:"status"`         // same number as the HTTP status
	Type      string `json:"type,omitempty"` // only on errors: NOT_FOUND, VALIDATION_ERROR...
	Message   string `json:"message"`
	Data      any    `json:"data"` // success: the payload. validation error: {field: message}
	Path      string `json:"path"`
	Timestamp string `json:"timestamp"`
}

func write(w http.ResponseWriter, r *http.Request, env Envelope) {
	env.Path = r.URL.Path
	env.Timestamp = time.Now().UTC().Format(time.RFC3339)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(env.Status) // the real HTTP status, not only the one in the body
	json.NewEncoder(w).Encode(env)
}

func OK(w http.ResponseWriter, r *http.Request, data any, msg string) {
	write(w, r, Envelope{Status: http.StatusOK, Message: msg, Data: data})
}

func Created(w http.ResponseWriter, r *http.Request, data any, msg string) {
	write(w, r, Envelope{Status: http.StatusCreated, Message: msg, Data: data})
}

func Fail(w http.ResponseWriter, r *http.Request, err error) {
	ae := apperr.From(err)
	if ae.Err != nil { // the hidden cause goes to the log, never to the client
		slog.Error("request failed", "type", ae.Type, "path", r.URL.Path, "cause", ae.Err)
	}
	var data any
	if ae.Fields != nil {
		data = ae.Fields
	}
	write(w, r, Envelope{Error: true, Status: ae.StatusCode, Type: string(ae.Type), Message: ae.Message, Data: data})
}

// HandlerFunc is a handler that returns an error instead of writing it.
type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

// Handle turns a HandlerFunc into a normal http.HandlerFunc:
// if the handler returns an error, Fail writes the JSON envelope.
func Handle(h HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			Fail(w, r, err)
		}
	}
}

// DecodeJSON reads the request body into dst (max 1 MB, rejects unknown fields).
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return apperr.NewValidation("Invalid JSON body")
	}
	return nil
}
