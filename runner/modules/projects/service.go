package projects

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type ProjectService struct {
	repo *ProjectRepository
}

func NewProjectService(repo *ProjectRepository) *ProjectService {
	return &ProjectService{repo: repo}
}

// ---- projects ----

func (s *ProjectService) ListProjects(ctx context.Context, userID int64, f ProjectFilters) ([]ProjectInfo, error) {
	f.Search = strings.TrimSpace(f.Search)
	f.Status = strings.ToUpper(strings.TrimSpace(f.Status))
	f.SortBy = strings.ToLower(f.SortBy)
	f.Order = strings.ToLower(f.Order)
	return s.repo.ListProjects(ctx, userID, f)
}

func (s *ProjectService) GetProject(ctx context.Context, userID, id int64) (*ProjectDetail, error) {
	info, err := s.repo.GetProject(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	skills, err := s.repo.ListProjectSkills(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	return &ProjectDetail{ProjectInfo: *info, Skills: skills}, nil
}

// the response is read again after the transaction so it carries the counters
func (s *ProjectService) CreateProject(ctx context.Context, userID int64, req CreateProjectRequest) (*ProjectInfo, error) {
	var id int64

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		id, err = s.repo.InsertProject(ctx, tx, userID, &req)
		if err != nil {
			return err
		}
		for _, skillID := range req.SkillsIds {
			if err := s.repo.InsertProjectSkill(ctx, tx, id, skillID); err != nil {
				return err
			}
		}
		for _, noteID := range req.NotesIds {
			if err := s.repo.InsertProjectNote(ctx, tx, id, noteID); err != nil {
				return err
			}
		}
		for _, resourceID := range req.ResourcesIds {
			if err := s.repo.InsertProjectResource(ctx, tx, id, resourceID); err != nil {
				return err
			}
		}
		return s.repo.InsertActivity(ctx, tx, userID, id, "Project created")
	})
	if err != nil {
		return nil, err
	}
	return s.repo.GetProject(ctx, userID, id)
}

func (s *ProjectService) UpdateProject(ctx context.Context, userID, id int64, req UpdateProjectRequest) (*ProjectInfo, error) {
	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.UpdateProject(ctx, tx, userID, id, &req); err != nil {
			return err // NotFound if it is not the user's: nothing else runs
		}

		if req.SkillsIds != nil {
			if err := s.repo.DeleteProjectSkills(ctx, tx, userID, id); err != nil {
				return err
			}
			for _, skillID := range req.SkillsIds {
				if err := s.repo.InsertProjectSkill(ctx, tx, id, skillID); err != nil {
					return err
				}
			}
		}
		for _, resourceID := range req.AddResourcesIds {
			if err := s.repo.InsertProjectResource(ctx, tx, id, resourceID); err != nil {
				return err
			}
		}
		for _, resourceID := range req.RemoveResourcesIds {
			if err := s.repo.DeleteProjectResource(ctx, tx, userID, id, resourceID); err != nil {
				return err
			}
		}

		// removing a note from a project deletes it for good
		for _, noteID := range req.RemoveNotesIds {
			inProject, err := s.repo.NoteInProject(ctx, tx, userID, id, noteID)
			if err != nil {
				return err
			}
			if !inProject {
				continue
			}
			if err := s.repo.DeleteNoteSkillsByNote(ctx, tx, userID, noteID); err != nil {
				return err
			}
			if err := s.repo.DeleteNoteResourcesByNote(ctx, tx, userID, noteID); err != nil {
				return err
			}
			if err := s.repo.DeleteNoteProjectsByNote(ctx, tx, userID, noteID); err != nil {
				return err
			}
			if err := s.repo.DeleteNote(ctx, tx, userID, noteID); err != nil {
				return err
			}
			if err := s.repo.InsertActivity(ctx, tx, userID, id, "Note deleted"); err != nil {
				return err
			}
		}

		return s.repo.InsertActivity(ctx, tx, userID, id, "Project updated")
	})
	if err != nil {
		return nil, err
	}
	return s.repo.GetProject(ctx, userID, id)
}

// tasks that also live in a day are only unlinked, the rest are deleted.
// notes and resources are unlinked, never deleted.
func (s *ProjectService) DeleteProject(ctx context.Context, userID, id int64) error {
	return s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.UnlinkDayTasksFromProject(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteProjectTasks(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteProjectSkills(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteProjectNotes(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteProjectResources(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteProjectActivity(ctx, tx, userID, id); err != nil {
			return err
		}
		return s.repo.DeleteProject(ctx, tx, userID, id)
	})
}

// ---- tabs ----

func (s *ProjectService) GetSummary(ctx context.Context, userID, id int64) (*ProjectSummary, error) {
	if _, err := s.repo.GetProject(ctx, userID, id); err != nil {
		return nil, err // ownership + 404
	}

	notes, err := s.repo.ListProjectNotes(ctx, userID, id, NoteFilters{PinnedOnly: true, Limit: 3})
	if err != nil {
		return nil, err
	}
	tasks, err := s.repo.ListProjectTasks(ctx, userID, id, TaskFilters{SortBy: "created_at", Order: "desc", Limit: 4})
	if err != nil {
		return nil, err
	}
	resources, err := s.repo.ListProjectResources(ctx, userID, id, 4)
	if err != nil {
		return nil, err
	}
	activity, err := s.repo.ListProjectActivity(ctx, userID, id, 10)
	if err != nil {
		return nil, err
	}

	return &ProjectSummary{PinnedNotes: notes, RecentTasks: tasks, Resources: resources, Activity: activity}, nil
}

func (s *ProjectService) ListNotes(ctx context.Context, userID, id int64, search string) ([]NoteRef, error) {
	return s.repo.ListProjectNotes(ctx, userID, id, NoteFilters{Search: strings.TrimSpace(search)})
}

func (s *ProjectService) ListResources(ctx context.Context, userID, id int64) ([]ResourceRef, error) {
	return s.repo.ListProjectResources(ctx, userID, id, -1) // -1 = no limit in SQLite
}

// ---- tasks ----

func (s *ProjectService) ListTasks(ctx context.Context, userID, id int64, f TaskFilters) ([]TaskInfo, error) {
	f.Search = strings.TrimSpace(f.Search)
	f.Status = strings.ToUpper(strings.TrimSpace(f.Status))
	f.Priority = strings.ToUpper(strings.TrimSpace(f.Priority))
	f.SortBy = strings.ToLower(f.SortBy)
	f.Order = strings.ToLower(f.Order)
	return s.repo.ListProjectTasks(ctx, userID, id, f)
}

func (s *ProjectService) CreateTask(ctx context.Context, userID, projectID int64, req CreateTaskRequest) (*CreateTaskResult, error) {
	if _, err := s.repo.GetProject(ctx, userID, projectID); err != nil {
		return nil, err // ownership + 404
	}

	// the task is registered with the date of today (client's date if sent)
	today := req.Today
	if today == "" {
		today = time.Now().Format(dateLayout)
	}
	if req.StartDate == "" {
		req.StartDate = today
	}
	if req.EndDate == "" || req.EndDate < req.StartDate {
		req.EndDate = req.StartDate
	}

	var res CreateTaskResult
	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var dayID *int64
		if req.AddToDaily {
			id, err := s.repo.FindDayByDate(ctx, tx, userID, today)
			if err != nil {
				return err
			}
			if id > 0 {
				dayID = &id
			}
		}

		task, err := s.repo.InsertProjectTask(ctx, tx, projectID, dayID, &req)
		if err != nil {
			return err
		}
		res = CreateTaskResult{TaskInfo: *task, DailyLinked: dayID != nil}

		if err := s.repo.RecalcProgress(ctx, tx, userID, projectID); err != nil {
			return err
		}
		return s.repo.InsertActivity(ctx, tx, userID, projectID, fmt.Sprintf("Created task %q", task.Title))
	})
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *ProjectService) UpdateTask(ctx context.Context, userID, projectID, taskID int64, req UpdateTaskRequest) (*TaskInfo, error) {
	var item *TaskInfo

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.UpdateProjectTask(ctx, tx, userID, projectID, taskID, &req)
		if err != nil {
			return err
		}
		if err := s.repo.RecalcProgress(ctx, tx, userID, projectID); err != nil {
			return err
		}
		return s.repo.InsertActivity(ctx, tx, userID, projectID, fmt.Sprintf("Updated task %q", item.Title))
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (s *ProjectService) SetTaskStatus(ctx context.Context, userID, projectID, taskID int64, status string) (*TaskInfo, error) {
	var item *TaskInfo

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.UpdateProjectTaskStatus(ctx, tx, userID, projectID, taskID, status)
		if err != nil {
			return err
		}
		if err := s.repo.RecalcProgress(ctx, tx, userID, projectID); err != nil {
			return err
		}

		verb := "Reopened"
		switch status {
		case "DONE":
			verb = "Completed"
		case "DOING":
			verb = "Started"
		}
		return s.repo.InsertActivity(ctx, tx, userID, projectID, fmt.Sprintf("%s task %q", verb, item.Title))
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

// a task that also lives in a day is only unlinked from the project
func (s *ProjectService) DeleteTask(ctx context.Context, userID, projectID, taskID int64) error {
	task, err := s.repo.GetProjectTask(ctx, userID, projectID, taskID)
	if err != nil {
		return err
	}

	return s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.UnlinkTaskFromProject(ctx, tx, userID, projectID, taskID); err != nil {
			return err
		}
		if err := s.repo.DeleteProjectTask(ctx, tx, userID, projectID, taskID); err != nil {
			return err
		}
		if err := s.repo.RecalcProgress(ctx, tx, userID, projectID); err != nil {
			return err
		}
		return s.repo.InsertActivity(ctx, tx, userID, projectID, fmt.Sprintf("Removed task %q", task.Title))
	})
}
