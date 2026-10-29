package resources

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type ResourceHandler struct {
	svc *ResourceService
}

func NewResourceHandler(svc *ResourceService) *ResourceHandler {
	return &ResourceHandler{svc: svc}
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.NewValidation("Invalid resource id")
	}
	return id, nil
}

// list resources by user, with search, type filter and sorting
func (h *ResourceHandler) ListResources(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	q := r.URL.Query()
	filters := ResourceFilters{
		Search: q.Get("search"),
		Type:   q.Get("type"),
		SortBy: q.Get("sort_by"),
		Order:  q.Get("order"),
	}

	items, err := h.svc.ListResources(r.Context(), userID, filters)
	if err != nil {
		return err
	}
	response.OK(w, r, items, "Resources by user")
	return nil
}

// one resource with its current links
func (h *ResourceHandler) GetResource(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	item, err := h.svc.GetResource(r.Context(), userID, id)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Resource")
	return nil
}

// create resource handler

const maxUploadSize = 50 << 20

type FileUpload struct {
	Name     string
	MimeType string
	Reader   multipart.File
}

// Lee el body: multipart (con archivo opcional) o JSON.
// El archivo se devuelve como *multipart.FileHeader (sin abrir).
func readResourceBody(w http.ResponseWriter, r *http.Request) (ResourceRequest, *multipart.FileHeader, error) {
	log.Printf("Content-Type: %q", r.Header.Get("Content-Type"))
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
		var req ResourceRequest
		if err := response.DecodeJSON(w, r, &req); err != nil {
			return req, nil, err
		}
		return req, nil, nil
	}

	var req ResourceRequest

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return req, nil, apperr.NewConflict("invalid form or file too large")
	}

	req.Name = r.FormValue("name")
	req.Link = r.FormValue("link")
	req.Type = r.FormValue("type")

	for _, s := range r.MultipartForm.Value["skillsIds"] {
		id, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			return req, nil, apperr.NewConflict("invalid skillsIds")
		}
		req.SkillsIds = append(req.SkillsIds, id)
	}

	var err error
	if req.NoteId, err = optInt64(r.FormValue("noteId")); err != nil {
		return req, nil, apperr.NewConflict("invalid noteId")
	}
	if req.ProjectId, err = optInt64(r.FormValue("projectId")); err != nil {
		return req, nil, apperr.NewConflict("invalid projectId")
	}

	var file *multipart.FileHeader
	if files := r.MultipartForm.File["file"]; len(files) > 0 {
		file = files[0]
	}
	return req, file, nil
}

func optInt64(s string) (*int64, error) {
	if s == "" {
		return nil, nil
	}
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (h *ResourceHandler) CreateResource(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	req, file, err := readResourceBody(w, r)
	if err != nil {
		return err
	}
	/*if err := req.Validate(file != nil); err != nil {
		return err
	}*/

	item, err := h.svc.CreateResource(r.Context(), userID, req, file)
	if err != nil {
		return err
	}
	response.Created(w, r, item, "Resource created")
	return nil
}

func (h *ResourceHandler) UpdateResource(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	resourceID, err := pathID(r)
	if err != nil {
		return err
	}

	req, file, err := readResourceBody(w, r)
	if err != nil {
		return err
	}

	item, err := h.svc.UpdateResource(r.Context(), userID, resourceID, req, file)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Resource updated")
	return nil
}

// update handler
/*func (h *ResourceHandler) UpdateResource(w http.ResponseWriter, r *http.Request) error {
	var req UpdateResourceRequest

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

	item, err := h.svc.UpdateResource(r.Context(), userID, id, req)
	if err != nil {
		return err
	}
	response.OK(w, r, item, "Resource updated")
	return nil
}*/

// delete handler
func (h *ResourceHandler) DeleteResource(w http.ResponseWriter, r *http.Request) error {
	userID, _ := strconv.ParseInt(jwt.GetUserIdFromContext(r.Context()), 10, 64)

	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteResource(r.Context(), userID, id); err != nil {
		return err
	}
	response.OK(w, r, nil, "Resource deleted successfully")
	return nil
}
