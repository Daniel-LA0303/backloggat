package knowledge

import "backloggat/runner/platform/validator"

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
