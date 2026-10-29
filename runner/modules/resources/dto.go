package resources

import (
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/validator"
	"regexp"
	"strings"
)

var urlRe = regexp.MustCompile(`^https?://\S+$`)

// ---- responses ----

type ResourceInfo struct {
	ResourceId    int64   `db:"resource_id" json:"id"`
	UserId        int64   `db:"user_id" json:"user_id"`
	Name          string  `db:"name" json:"name"`
	Link          string  `db:"link" json:"link"`
	Type          string  `db:"type" json:"type"`
	SkillsCount   int     `db:"skills_count" json:"skills_count"`
	NotesCount    int     `db:"notes_count" json:"notes_count"`
	ProjectsCount int     `db:"projects_count" json:"projects_count"`
	CreatedAt     string  `db:"created_at" json:"created_at"`
	UpdatedAt     string  `db:"updated_at" json:"updated_at"`
	DriveFileId   *string `db:"drive_file_id" json:"-"`
}

type SkillRef struct {
	SkillId int64  `db:"skill_id" json:"id"`
	Name    string `db:"name" json:"name"`
	Color   string `db:"color" json:"color"`
}

type ResourceDetail struct {
	ResourceInfo
	Skills     []SkillRef `json:"skills"`
	NoteIds    []int64    `json:"noteIds"`
	ProjectIds []int64    `json:"projectIds"`
}

// ---- requests ----

type ResourceFilters struct {
	Search string
	Type   string
	SortBy string
	Order  string
}

type ResourceRequest struct { // antes CreateResourceRequest
	Name      string  `json:"name"`
	Link      string  `json:"link"`
	Type      string  `json:"type"`
	SkillsIds []int64 `json:"skillsIds"`
	NoteId    *int64  `json:"noteId"`
	ProjectId *int64  `json:"projectId"`
}

func (r *ResourceRequest) Validate(hasFile bool) error {
	v := validator.New()
	r.Name = v.Field("name", r.Name).Required().Max(100).Value()
	r.Link = v.Field("link", r.Link).Required().Max(2000).Match(urlRe, "Link must start with http:// or https://").Value()
	r.Type = v.Field("type", r.Type).Required().Max(50).Value()

	if !hasFile && strings.TrimSpace(r.Link) == "" {
		return apperr.NewConflict("link or file is required")
	}
	return v.Err()
}

type UpdateResourceRequest struct {
	Name              string  `json:"name"`
	Link              string  `json:"link"`
	Type              string  `json:"type"`
	SkillsIds         []int64 `json:"skillsIds"`         // nil = untouched, [] = remove all
	RemoveNotesIds    []int64 `json:"removeNotesIds"`    // only unlink, never add
	RemoveProjectsIds []int64 `json:"removeProjectsIds"` // only unlink, never add
}

func (r *UpdateResourceRequest) Validate() error {
	v := validator.New()
	r.Name = v.Field("name", r.Name).Required().Max(100).Value()
	r.Link = v.Field("link", r.Link).Required().Max(2000).Match(urlRe, "Link must start with http:// or https://").Value()
	r.Type = v.Field("type", r.Type).Required().Max(50).Value()
	return v.Err()
}
