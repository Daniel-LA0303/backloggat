package skills

import (
	"backloggat/runner/platform/validator"
	"regexp"
)

// CreateSkillRequest is the JSON body of POST /api/skills.
type CreateSkillRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

var hexColor = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

// Validate cleans the values (trim, default) and returns an AppError
// with the failing fields, or nil when everything is fine.
func (r *CreateSkillRequest) Validate() error {
	v := validator.New()
	r.Name = v.Field("name", r.Name).Required().Max(50).Value()
	r.Color = v.Field("color", r.Color).Default("#64748b").Match(hexColor, "Color must look like #64748b").Value()
	return v.Err()
}

type SkillResponseDTO struct {
	SkillId         int64  `db:"skill_id" json:"id"`
	UserId          int64  `db:"user_id" json:"user_id"`
	Name            string `db:"name" json:"name"`
	Color           string `db:"color" json:"color"`
	CreatedAt       string `db:"created_at" json:"created_at"`
	UpdatedAt       string `db:"updated_at" json:"updated_at"`
	CountProjects   int    `db:"projects_count" json:"countProject"`
	CountNotes      int    `db:"notes_count" json:"countNotes"`
	CountResources  int    `db:"resources_count" json:"countResources"`
	CountKnowledges int    `db:"knowledge_count" json:"countKnowledges"`
}
