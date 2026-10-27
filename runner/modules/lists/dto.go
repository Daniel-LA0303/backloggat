package lists

import (
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/validator"
	"fmt"
	"regexp"
	"time"
)

const (
	dateLayout  = "2006-01-02"
	maxListDays = 366
)

const maxDayNote = 50000

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// ---- responses ----

type ListInfo struct {
	ListId      int64  `db:"list_id" json:"id"`
	UserId      int64  `db:"user_id" json:"user_id"`
	Title       string `db:"title" json:"title"`
	Description string `db:"description" json:"description"`
	StartDate   string `db:"start_date" json:"start_date"`
	EndDate     string `db:"end_date" json:"end_date"`
	DaysCount   int    `db:"days_count" json:"days_count"`
	TasksCount  int    `db:"tasks_count" json:"tasks_count"`
	DoneCount   int    `db:"done_count" json:"done_count"`
	CreatedAt   string `db:"created_at" json:"created_at"`
	UpdatedAt   string `db:"updated_at" json:"updated_at"`
}

type DayInfo struct {
	DayId      int64  `db:"list_task_id" json:"id"`
	ListId     int64  `db:"list_id" json:"list_id"`
	Title      string `db:"title" json:"title"`
	Note       string `db:"note" json:"note"`
	TaskDate   string `db:"task_date" json:"task_date"`
	Position   int    `db:"position" json:"position"`
	TasksCount int    `db:"tasks_count" json:"tasks_count"`
	DoneCount  int    `db:"done_count" json:"done_count"`
	CreatedAt  string `db:"created_at" json:"created_at"`
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

type ListDetail struct {
	ListInfo
	Days []DayInfo `json:"days"`
}

type DayDetail struct {
	DayInfo
	Tasks []TaskInfo `json:"tasks"`
}

// ---- helpers ----

// parses an inclusive date range and returns field errors for the UI
func parseRange(start, end string) (time.Time, time.Time, error) {
	s, err := time.Parse(dateLayout, start)
	if err != nil {
		return s, s, apperr.NewValidationFields("Invalid date", map[string]string{"startDate": "Not a valid date"})
	}
	e, err := time.Parse(dateLayout, end)
	if err != nil {
		return s, e, apperr.NewValidationFields("Invalid date", map[string]string{"endDate": "Not a valid date"})
	}
	if e.Before(s) {
		return s, e, apperr.NewValidationFields("Invalid range", map[string]string{"endDate": "End date must be after start date"})
	}
	return s, e, nil
}

// ---- requests ----

type CreateListRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	StartDate   string `json:"startDate"` // YYYY-MM-DD
	EndDate     string `json:"endDate"`   // YYYY-MM-DD
}

func (r *CreateListRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(100).Value()
	r.Description = v.Field("description", r.Description).Max(500).Value()
	r.StartDate = v.Field("startDate", r.StartDate).Required().Match(dateRe, "Date must look like 2027-01-31").Value()
	r.EndDate = v.Field("endDate", r.EndDate).Required().Match(dateRe, "Date must look like 2027-01-31").Value()
	if err := v.Err(); err != nil {
		return err
	}

	s, e, err := parseRange(r.StartDate, r.EndDate)
	if err != nil {
		return err
	}
	if int(e.Sub(s).Hours()/24)+1 > maxListDays {
		return apperr.NewValidationFields("Invalid range", map[string]string{
			"endDate": fmt.Sprintf("A list can have at most %d days", maxListDays),
		})
	}
	return nil
}

type UpdateListRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (r *UpdateListRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(100).Value()
	r.Description = v.Field("description", r.Description).Max(500).Value()
	return v.Err()
}

type UpdateDayRequest struct {
	Title string `json:"title"`
	Note  string `json:"note"`
}

func (r *UpdateDayRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Max(100).Value()
	r.Note = v.Field("note", r.Note).Max(maxDayNote).Value()
	return v.Err()
}

type CreateTaskRequest struct {
	Title     string `json:"title"`
	Priority  string `json:"priority"`
	StartDate string `json:"startDate"` // optional: defaults to the day's date
	EndDate   string `json:"endDate"`   // optional: defaults to the day's date
}

func (r *CreateTaskRequest) Validate() error {
	v := validator.New()
	r.Title = v.Field("title", r.Title).Required().Max(200).Value()
	r.Priority = v.Field("priority", r.Priority).Default("LOW").OneOf("LOW", "MEDIUM", "HIGH").Value()
	r.StartDate = v.Field("startDate", r.StartDate).Match(dateRe, "Date must look like 2027-01-31").Value()
	r.EndDate = v.Field("endDate", r.EndDate).Match(dateRe, "Date must look like 2027-01-31").Value()
	if err := v.Err(); err != nil {
		return err
	}

	// if only one date comes, use it for both
	if r.StartDate == "" {
		r.StartDate = r.EndDate
	}
	if r.EndDate == "" {
		r.EndDate = r.StartDate
	}
	if r.StartDate != "" {
		if _, _, err := parseRange(r.StartDate, r.EndDate); err != nil {
			return err
		}
	}
	return nil
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
	_, _, err := parseRange(r.StartDate, r.EndDate)
	return err
}

type TaskStatusRequest struct {
	Status string `json:"status"`
}

func (r *TaskStatusRequest) Validate() error {
	v := validator.New()
	r.Status = v.Field("status", r.Status).Required().OneOf("TO_DO", "DOING", "DONE").Value()
	return v.Err()
}
