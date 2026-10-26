package knowledge

import "backloggat/runner/platform/validator"

const maxDescription = 50000

type CreateKnowledge struct {
	Name        string  `db:"name" json:"name"`
	Color       string  `db:"color" json:"color"`
	Description string  `db:"description" json:"description"`
	SkillsIds   []int64 `json:"skillsIds"`
}

func (r *CreateKnowledge) Validate() error {
	v := validator.New()
	r.Name = v.Field("name", r.Name).Required().Max(50).Value()
	r.Color = v.Field("color", r.Color).Required().Value()
	return v.Err()
}

type KnowlageInfo struct {
	KnowlageId  int64  `db:"knowlage_id" json:"id"`
	UserId      int64  `db:"user_id" json:"user_id"`
	Name        string `db:"name" json:"name"`
	Description string `db:"description" json:"description"`
	Color       string `db:"color" json:"color"`
	CreatedAt   string `db:"created_at" json:"created_at"`
}

type UpdateKnowledge struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

func (r *UpdateKnowledge) Validate() error {
	v := validator.New()
	r.Name = v.Field("name", r.Name).Required().Max(100).Value()
	r.Description = v.Field("description", r.Description).Max(maxDescription).Value()
	r.Color = v.Field("color", r.Color).Required().Value()
	return v.Err()
}

type KnowledgeFilters struct {
	Search string
	SortBy string
	Order  string
}
