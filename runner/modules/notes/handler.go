package notes

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type NoteHandler struct {
	svc *NoteService
}

func NewNoteHandler(svc *NoteService) *NoteHandler {
	return &NoteHandler{svc: svc}
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid note id")
	}
	return id, nil
}

// list notes by user, with search and sorting
func (h *NoteHandler) ListNotes(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	q := r.URL.Query()

	var skillID int64
	if raw := q.Get("skill_id"); raw != "" {
		id, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || id <= 0 {
			return apperr.NewValidation("Invalid skill id")
		}
		skillID = id
	}

	filters := NoteFilters{
		Search:  q.Get("search"),
		SkillId: skillID,
		SortBy:  q.Get("sort_by"),
		Order:   q.Get("order"),
	}

	items, err := h.svc.ListNotes(r.Context(), userID, filters)
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Notes by user")
	return nil
}

// one note with its content and current links
func (h *NoteHandler) GetNote(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	item, err := h.svc.GetNote(r.Context(), userID, id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Note")
	return nil
}

// create handler
func (h *NoteHandler) CreateNote(w http.ResponseWriter, r *http.Request) error {
	var req CreateNoteRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	item, err := h.svc.CreateNote(r.Context(), userID, req)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Note created")
	return nil
}

// update handler
func (h *NoteHandler) UpdateNote(w http.ResponseWriter, r *http.Request) error {
	var req UpdateNoteRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := req.Validate(); err != nil {
		return err
	}

	item, err := h.svc.UpdateNote(r.Context(), userID, id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Note updated")
	return nil
}

// delete handler
func (h *NoteHandler) DeleteNote(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteNote(r.Context(), userID, id); err != nil {
		return err
	}
	response.OK(w, r, nil, "Note deleted successfully")
	return nil
}

func (h *NoteHandler) PinNote(w http.ResponseWriter, r *http.Request) error {
	var req PinNoteRequest

	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := response.DecodeJSON(w, r, &req); err != nil {
		return err
	}
	if err := h.svc.PinNote(r.Context(), userID, id, req.Pinned); err != nil {
		return err
	}
	response.OK(w, r, nil, "Note updated")
	return nil
}
