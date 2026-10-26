package resources

import (
	"context"
	"strings"

	"github.com/jmoiron/sqlx"
)

type ResourceService struct {
	repo *ResourceRepository
}

func NewResourceService(repo *ResourceRepository) *ResourceService {
	return &ResourceService{repo: repo}
}

func (s *ResourceService) ListResources(ctx context.Context, userID int64, f ResourceFilters) ([]ResourceInfo, error) {
	f.Search = strings.TrimSpace(f.Search)
	f.Type = strings.TrimSpace(f.Type)
	f.SortBy = strings.ToLower(f.SortBy)
	f.Order = strings.ToLower(f.Order)
	return s.repo.ListResources(ctx, userID, f)
}

func (s *ResourceService) GetResource(ctx context.Context, userID, id int64) (*ResourceDetail, error) {
	info, err := s.repo.GetResource(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	skills, err := s.repo.ListResourceSkills(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	noteIds, err := s.repo.ListResourceNoteIds(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	projectIds, err := s.repo.ListResourceProjectIds(ctx, userID, id)
	if err != nil {
		return nil, err
	}

	return &ResourceDetail{
		ResourceInfo: *info,
		Skills:       skills,
		NoteIds:      noteIds,
		ProjectIds:   projectIds,
	}, nil
}

// create the resource and link it to whatever came in the body
func (s *ResourceService) CreateResource(ctx context.Context, userID int64, req CreateResourceRequest) (*ResourceInfo, error) {
	var item *ResourceInfo

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.InsertResource(ctx, tx, userID, &req)
		if err != nil {
			return err
		}

		for _, skillID := range req.SkillsIds {
			if err := s.repo.InsertResourceSkill(ctx, tx, item.ResourceId, skillID); err != nil {
				return err
			}
		}
		if req.NoteId != nil {
			if err := s.repo.InsertResourceNote(ctx, tx, item.ResourceId, *req.NoteId); err != nil {
				return err
			}
		}
		if req.ProjectId != nil {
			if err := s.repo.InsertResourceProject(ctx, tx, item.ResourceId, *req.ProjectId); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

// update info, replace skills (if sent) and unlink notes/projects
func (s *ResourceService) UpdateResource(ctx context.Context, userID, id int64, req UpdateResourceRequest) (*ResourceInfo, error) {
	var item *ResourceInfo

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.UpdateResource(ctx, tx, userID, id, &req)
		if err != nil {
			return err // NotFound if it is not the user's: nothing else runs
		}

		if req.SkillsIds != nil {
			if err := s.repo.DeleteResourceSkills(ctx, tx, userID, id); err != nil {
				return err
			}
			for _, skillID := range req.SkillsIds {
				if err := s.repo.InsertResourceSkill(ctx, tx, id, skillID); err != nil {
					return err
				}
			}
		}
		for _, noteID := range req.RemoveNotesIds {
			if err := s.repo.DeleteResourceNote(ctx, tx, userID, id, noteID); err != nil {
				return err
			}
		}
		for _, projectID := range req.RemoveProjectsIds {
			if err := s.repo.DeleteResourceProject(ctx, tx, userID, id, projectID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

// pivots first (no ON DELETE CASCADE there), then the resource
func (s *ResourceService) DeleteResource(ctx context.Context, userID, id int64) error {
	return s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.DeleteResourceSkills(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteResourceNotes(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteResourceProjects(ctx, tx, userID, id); err != nil {
			return err
		}
		return s.repo.DeleteResource(ctx, tx, userID, id)
	})
}
