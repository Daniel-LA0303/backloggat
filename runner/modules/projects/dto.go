package projects

import (
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/validator"
	"regexp"
)

const (
	dateLayout  = "2006-01-02"
	maxRichText = 100000 // description is HTML
)

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// ---- responses ----

type ProjectInfo struct {
	ProjectId      int64  `db:"project_id" json:"id"`
	UserId         int64  `db:"user_id" json:"user_id"`
	Title          string `db:"title" json:"title"`
	Description    string `db:"description" json:"description"`
	StartDate      string `db:"start_date" json:"start_date"`
	EndDate        string `db:"end_date" json:"end_date"`
	Status         string `db:"status" json:"status"`
	Progress       int    `db:"progress" json:"progress"`
	TasksCount     int    `db:"tasks_count" json:"tasks_count"`
	DoneCount      int    `db:"done_count" json:"done_count"`
	NotesCount     int    `db:"notes_count" json:"notes_count"`
	ResourcesCount int    `db:"resources_count" json:"resources_count"`
	SkillsCount    int    `db:"skills_count" json:"skills_count"`
	CreatedAt      string `db:"created_at" json:"created_at"`
	UpdatedAt      string `db:"updated_at" json:"updated_at"`
}

type SkillRef struct {
	SkillId int64  `db:"skill_id" json:"id"`
	Name    string `db:"name" json:"name"`
	Color   string `db:"color" json:"color"`
}

type NoteRef struct {
	NoteId      int64  `db:"note_id" json:"id"`
	Title       string `db:"title" json:"title"`
	Color       string `db:"color" json:"color"`
	Description string `db:"description" json:"description"`
	Pinned      bool   `db:"pinned" json:"pinned"`
	UpdatedAt   string `db:"updated_at" json:"updated_at"`
}

type ResourceRef struct {
	ResourceId int64  `db:"resource_id" json:"id"`
	Name       string `db:"name" json:"name"`
	Link       string `db:"link" json:"link"`
	Type       string `db:"type" json:"type"`
}

type TaskInfo struct {
	TaskId    int64  `db:"task_id" json:"id"`
	Title     string `db:"title" json:"title"`
	Status    string `db:"status" json:"status"`
	Priority  string `db:"priority" json:"priority"`
	StartDate string `db:"start_date" json:"start_date"`
	EndDate   string `db:"end_date" json:"end_date"`
	DayId     *int64 `db:"list_task_id" json:"day_id"`
	ProjectId *int64 `db:"project_id" json:"project_id"`
	CreatedAt string `db:"created_at" json:"created_at"`
	UpdatedAt string `db:"updated_at" json:"updated_at"`
}

type ActivityInfo struct {
	ActivityId int64  `db:"project_activity_id" json:"id"`
	Action     string `db:"action" json:"action"`
	CreatedAt  string `db:"created_at" json:"created_at"`
}

type ProjectDetail struct {
	ProjectInfo
	Skills []SkillRef `json:"skills"`
}

type ProjectSummary struct {
	PinnedNotes []NoteRef      `json:"pinnedNotes"`
	RecentTasks []TaskInfo     `json:"recentTasks"`
	Resources   []ResourceRef  `json:"resources"`
	Activity    []ActivityInfo `json:"activity"`
}

type CreateTaskResult struct {
	TaskInfo
	DailyLinked bool `json:"dailyLinked"`
}

// ---- filters ----

type ProjectFilters struct {
	Search  string
	Status  string
	SkillId int64
	SortBy  string
	Order   string
}

type TaskFilters struct {
	Search   string
	Status   string
	Priority string
	SortBy   string
	Order    string
	Limit    int // 0 = no limit
}

type NoteFilters struct {
	Search     string
	PinnedOnly bool
	Limit      int // 0 = no limit
}

// ---- helpers ----

func checkRange(start, end string) error {
	if end != "" && end < start { // YYYY-MM-DD compares as text
		return apperr.NewValidationFields("Invalid range", map[string]string{
			"endDate": "End date must be after start date",
		})
	}
	return nil
}

// ---- requests ----

type CreateProjectRequest struct {
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	StartDate    string  `json:"startDate"`
	EndDate      string  `json:"endDate"` // optional
	SkillsIds    []int64 `json:"skillsIds"`
	NotesIds     []int64 `json:"notesIds"`     // existing notes
	ResourcesIds []int64 `json:"resourcesIds"` // existing resources
}

func (r *CreateProjectRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(150).Value()
	r.Description = v.Field("description", r.Description).Max(maxRichText).Value()
	r.StartDate = v.Field("startDate", r.StartDate).Required().Match(dateRe, "Date must look like 2027-01-31").Value()
	r.EndDate = v.Field("endDate", r.EndDate).Match(dateRe, "Date must look like 2027-01-31").Value()
	if err := v.Err(); err != nil {
		return err
	}
	return checkRange(r.StartDate, r.EndDate)
}

type UpdateProjectRequest struct {
	Title              string  `json:"title"`
	Description        string  `json:"description"`
	StartDate          string  `json:"startDate"`
	EndDate            string  `json:"endDate"` // "" clears it
	Status             string  `json:"status"`
	SkillsIds          []int64 `json:"skillsIds"`          // nil = untouched, [] = remove all
	AddResourcesIds    []int64 `json:"addResourcesIds"`    // link
	RemoveResourcesIds []int64 `json:"removeResourcesIds"` // unlink
	RemoveNotesIds     []int64 `json:"removeNotesIds"`     // DELETES the notes
}

func (r *UpdateProjectRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(150).Value()
	r.Description = v.Field("description", r.Description).Max(maxRichText).Value()
	r.StartDate = v.Field("startDate", r.StartDate).Required().Match(dateRe, "Date must look like 2027-01-31").Value()
	r.EndDate = v.Field("endDate", r.EndDate).Match(dateRe, "Date must look like 2027-01-31").Value()
	r.Status = v.Field("status", r.Status).Required().OneOf("ACTIVE", "DONE").Value()
	if err := v.Err(); err != nil {
		return err
	}
	return checkRange(r.StartDate, r.EndDate)
}

type CreateTaskRequest struct {
	Title      string `json:"title"`
	Priority   string `json:"priority"`
	StartDate  string `json:"startDate"`  // optional: defaults to today
	EndDate    string `json:"endDate"`    // optional: defaults to startDate
	AddToDaily bool   `json:"addToDaily"` // also put it in today's day of the lists
	Today      string `json:"today"`      // client's local date, YYYY-MM-DD
}

func (r *CreateTaskRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(200).Value()
	r.Priority = v.Field("priority", r.Priority).Default("LOW").OneOf("LOW", "MEDIUM", "HIGH").Value()
	r.StartDate = v.Field("startDate", r.StartDate).Match(dateRe, "Date must look like 2027-01-31").Value()
	r.EndDate = v.Field("endDate", r.EndDate).Match(dateRe, "Date must look like 2027-01-31").Value()
	r.Today = v.Field("today", r.Today).Match(dateRe, "Date must look like 2027-01-31").Value()
	return v.Err()
}

type UpdateTaskRequest struct {
	Title     string `json:"title"`
	Status    string `json:"status"`
	Priority  string `json:"priority"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

func (r *UpdateTaskRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(200).Value()
	r.Status = v.Field("status", r.Status).Required().OneOf("TO_DO", "DOING", "DONE").Value()
	r.Priority = v.Field("priority", r.Priority).Required().OneOf("LOW", "MEDIUM", "HIGH").Value()
	r.StartDate = v.Field("startDate", r.StartDate).Required().Match(dateRe, "Date must look like 2027-01-31").Value()
	r.EndDate = v.Field("endDate", r.EndDate).Required().Match(dateRe, "Date must look like 2027-01-31").Value()
	if err := v.Err(); err != nil {
		return err
	}
	return checkRange(r.StartDate, r.EndDate)
}

type TaskStatusRequest struct {
	Status string `json:"status"`
}

func (r *TaskStatusRequest) Validate() error {
	v := validator.New()
	r.Status = v.Field("status", r.Status).Required().OneOf("TO_DO", "DOING", "DONE").Value()
	return v.Err()
}
