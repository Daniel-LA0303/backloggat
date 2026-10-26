package notes

import (
	"context"
	"strings"

	"github.com/jmoiron/sqlx"
)

type NoteService struct {
	repo *NoteRepository
}

func NewNoteService(repo *NoteRepository) *NoteService {
	return &NoteService{repo: repo}
}

func (s *NoteService) ListNotes(ctx context.Context, userID int64, f NoteFilters) ([]NoteInfo, error) {
	f.Search = strings.TrimSpace(f.Search)
	f.SortBy = strings.ToLower(f.SortBy)
	f.Order = strings.ToLower(f.Order)
	return s.repo.ListNotes(ctx, userID, f)
}

func (s *NoteService) GetNote(ctx context.Context, userID, id int64) (*NoteDetail, error) {
	info, err := s.repo.GetNote(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	content, err := s.repo.GetNoteContent(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	skills, err := s.repo.ListNoteSkills(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	resources, err := s.repo.ListNoteResources(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	projectIds, err := s.repo.ListNoteProjectIds(ctx, userID, id)
	if err != nil {
		return nil, err
	}

	return &NoteDetail{
		NoteInfo:   *info,
		Content:    content,
		Skills:     skills,
		Resources:  resources,
		ProjectIds: projectIds,
	}, nil
}

// create the note and link it to whatever came in the body
func (s *NoteService) CreateNote(ctx context.Context, userID int64, req CreateNoteRequest) (*NoteInfo, error) {
	var item *NoteInfo

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.InsertNote(ctx, tx, userID, &req)
		if err != nil {
			return err
		}

		for _, skillID := range req.SkillsIds {
			if err := s.repo.InsertNoteSkill(ctx, tx, item.NoteId, skillID); err != nil {
				return err
			}
		}
		for _, resourceID := range req.ResourcesIds {
			if err := s.repo.InsertNoteResource(ctx, tx, item.NoteId, resourceID); err != nil {
				return err
			}
		}
		if req.ProjectId != nil {
			if err := s.repo.InsertNoteProject(ctx, tx, item.NoteId, *req.ProjectId); err != nil {
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

// update info, replace skills/resources (if sent), unlink projects
func (s *NoteService) UpdateNote(ctx context.Context, userID, id int64, req UpdateNoteRequest) (*NoteInfo, error) {
	var item *NoteInfo

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.UpdateNote(ctx, tx, userID, id, &req)
		if err != nil {
			return err // NotFound if it is not the user's: nothing else runs
		}

		if req.SkillsIds != nil {
			if err := s.repo.DeleteNoteSkills(ctx, tx, userID, id); err != nil {
				return err
			}
			for _, skillID := range req.SkillsIds {
				if err := s.repo.InsertNoteSkill(ctx, tx, id, skillID); err != nil {
					return err
				}
			}
		}
		if req.ResourcesIds != nil {
			if err := s.repo.DeleteNoteResources(ctx, tx, userID, id); err != nil {
				return err
			}
			for _, resourceID := range req.ResourcesIds {
				if err := s.repo.InsertNoteResource(ctx, tx, id, resourceID); err != nil {
					return err
				}
			}
		}
		for _, projectID := range req.RemoveProjectsIds {
			if err := s.repo.DeleteNoteProject(ctx, tx, userID, id, projectID); err != nil {
				return err
			}
		}
		if req.ProjectId != nil {
			if err := s.repo.InsertNoteProject(ctx, tx, id, *req.ProjectId); err != nil {
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

// pivots first (no ON DELETE CASCADE there), then the note
func (s *NoteService) DeleteNote(ctx context.Context, userID, id int64) error {
	return s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		if err := s.repo.DeleteNoteSkills(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteNoteResources(ctx, tx, userID, id); err != nil {
			return err
		}
		if err := s.repo.DeleteNoteProjects(ctx, tx, userID, id); err != nil {
			return err
		}
		return s.repo.DeleteNote(ctx, tx, userID, id)
	})
}

func (s *NoteService) PinNote(ctx context.Context, userID, id int64, pinned bool) error {
	return s.repo.UpdateNotePinned(ctx, userID, id, pinned)
}
