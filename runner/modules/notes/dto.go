package notes

import "backloggat/runner/platform/validator"

const maxContent = 100000 // rich text (HTML) can be long

// ---- responses ----

type NoteInfo struct {
	NoteId         int64  `db:"note_id" json:"id"`
	UserId         int64  `db:"user_id" json:"user_id"`
	Title          string `db:"title" json:"title"`
	Color          string `db:"color" json:"color"`
	Description    string `db:"description" json:"description"`
	Pinned         bool   `db:"pinned" json:"pinned"`
	SkillsCount    int    `db:"skills_count" json:"skills_count"`
	ResourcesCount int    `db:"resources_count" json:"resources_count"`
	ProjectsCount  int    `db:"projects_count" json:"projects_count"`
	CreatedAt      string `db:"created_at" json:"created_at"`
	UpdatedAt      string `db:"updated_at" json:"updated_at"`
}

type SkillRef struct {
	SkillId int64  `db:"skill_id" json:"id"`
	Name    string `db:"name" json:"name"`
	Color   string `db:"color" json:"color"`
}

type ResourceRef struct {
	ResourceId int64  `db:"resource_id" json:"id"`
	Name       string `db:"name" json:"name"`
	Type       string `db:"type" json:"type"`
}

type NoteDetail struct {
	NoteInfo
	Content    string        `json:"content"`
	Skills     []SkillRef    `json:"skills"`
	Resources  []ResourceRef `json:"resources"`
	ProjectIds []int64       `json:"projectIds"`
}

// ---- db models ----

type NoteContent struct {
	Content string `db:"content"`
}

// ---- requests ----

type NoteFilters struct {
	Search  string
	SkillId int64
	SortBy  string
	Order   string
}

type CreateNoteRequest struct {
	Title        string  `json:"title"`
	Color        string  `json:"color"`
	Description  string  `json:"description"`
	Content      string  `json:"content"`
	Pinned       bool    `json:"pinned"`
	SkillsIds    []int64 `json:"skillsIds"`
	ResourcesIds []int64 `json:"resourcesIds"`
	ProjectId    *int64  `json:"projectId"` // optional: set when created from projects
}

func (r *CreateNoteRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(150).Value()
	r.Color = v.Field("color", r.Color).Default("#64748b").Value()
	r.Description = v.Field("description", r.Description).Max(500).Value()
	r.Content = v.Field("content", r.Content).Max(maxContent).Value()
	return v.Err()
}

type UpdateNoteRequest struct {
	Title             string  `json:"title"`
	Color             string  `json:"color"`
	Description       string  `json:"description"`
	Content           string  `json:"content"`
	Pinned            bool    `json:"pinned"`
	SkillsIds         []int64 `json:"skillsIds"`         // nil = untouched, [] = remove all
	ResourcesIds      []int64 `json:"resourcesIds"`      // nil = untouched, [] = remove all
	RemoveProjectsIds []int64 `json:"removeProjectsIds"` // only unlink
	ProjectId         *int64  `json:"projectId"`         // optional: only the projects view sends it
}

func (r *UpdateNoteRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(150).Value()
	r.Color = v.Field("color", r.Color).Required().Value()
	r.Description = v.Field("description", r.Description).Max(500).Value()
	r.Content = v.Field("content", r.Content).Max(maxContent).Value()
	return v.Err()
}

type PinNoteRequest struct {
	Pinned bool `json:"pinned"`
}
