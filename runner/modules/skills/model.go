package skills

type Skill struct {
	ID        int64  `db:"skill_id"   json:"id"`
	UserID    int64  `db:"user_id"    json:"user_id"`
	Name      string `db:"name"       json:"name"`
	Color     string `db:"color"      json:"color"`
	CreatedAt string `db:"created_at" json:"created_at"`
	UpdatedAt string `db:"updated_at" json:"updated_at"`
}
