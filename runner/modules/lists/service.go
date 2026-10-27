package lists

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type ListService struct {
	repo *ListRepository
}

func NewListService(repo *ListRepository) *ListService {
	return &ListService{repo: repo}
}

func (s *ListService) ListLists(ctx context.Context, userID int64) ([]ListInfo, error) {
	return s.repo.ListLists(ctx, userID)
}

func (s *ListService) GetList(ctx context.Context, userID, id int64) (*ListDetail, error) {
	info, err := s.repo.GetList(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	days, err := s.repo.ListDays(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	return &ListDetail{ListInfo: *info, Days: days}, nil
}

// create the list and one day per date of the range, all or nothing
func (s *ListService) CreateList(ctx context.Context, userID int64, req CreateListRequest) (*ListInfo, error) {
	start, end, err := parseRange(req.StartDate, req.EndDate)
	if err != nil {
		return nil, err
	}

	var item *ListInfo
	err = s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.InsertList(ctx, tx, userID, &req)
		if err != nil {
			return err
		}

		pos := 0
		for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
			if err := s.repo.InsertDay(ctx, tx, item.ListId, d.Format(dateLayout), pos); err != nil {
				return err
			}
			pos++
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (s *ListService) UpdateList(ctx context.Context, userID, id int64, req UpdateListRequest) (*ListInfo, error) {
	return s.repo.UpdateList(ctx, s.repo.DB(), userID, id, &req)
}

// tasks that also live in a project are only unlinked, the rest are deleted
func (s *ListService) DeleteList(ctx context.Context, userID, id int64) error {
	return s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.UnlinkProjectTasksByList(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteTasksByList(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteDaysByList(ctx, tx, userID, id); err != nil {
			return err
		}
		return s.repo.DeleteList(ctx, tx, userID, id)
	})
}

func (s *ListService) GetDay(ctx context.Context, userID, id int64) (*DayDetail, error) {
	day, err := s.repo.GetDay(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	tasks, err := s.repo.ListDayTasks(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	return &DayDetail{DayInfo: *day, Tasks: tasks}, nil
}

func (s *ListService) UpdateDay(ctx context.Context, userID, id int64, req UpdateDayRequest) (*DayInfo, error) {
	return s.repo.UpdateDay(ctx, s.repo.DB(), userID, id, &req)
}

// the day is read first: it checks ownership and gives the default dates
func (s *ListService) CreateTask(ctx context.Context, userID, dayID int64, req CreateTaskRequest) (*TaskInfo, error) {
	day, err := s.repo.GetDay(ctx, userID, dayID)
	if err != nil {
		return nil, err
	}
	if req.StartDate == "" {
		req.StartDate = day.TaskDate
		req.EndDate = day.TaskDate
	}
	return s.repo.InsertTask(ctx, s.repo.DB(), dayID, &req)
}

func (s *ListService) UpdateTask(ctx context.Context, userID, id int64, req UpdateTaskRequest) (*TaskInfo, error) {
	return s.repo.UpdateTask(ctx, s.repo.DB(), userID, id, &req)
}

func (s *ListService) SetTaskStatus(ctx context.Context, userID, id int64, status string) (*TaskInfo, error) {
	return s.repo.UpdateTaskStatus(ctx, s.repo.DB(), userID, id, status)
}

// from a day: a project task is unlinked, a day-only task is deleted
func (s *ListService) DeleteTask(ctx context.Context, userID, id int64) error {
	return s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.UnlinkTaskFromDay(ctx, tx, userID, id); err != nil {
			return err
		}
		return s.repo.DeleteDayTask(ctx, tx, userID, id)
	})
}
