package knowledge

type Knowlage struct {
	KnowlageId  int64  `db:"knowlage_id" json:"id"`
	UserId      int64  `db:"user_id" json:"user_id"`
	Name        string `db:"name" json:"name"`
	Description string `db:"description" json:"description"`
	Color       string `db:"color" json:"color"`
	CreatedAt   string `db:"created_at" json:"created_at"`
	UpdatedAt   string `db:"updated_at" json:"updated_at"`
}
