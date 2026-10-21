package skills

import (
	"backloggat/runner/platform/apperr"
	"context"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, userID int64, req CreateSkillRequest) (*Skill, error) {
	// business rule: a user can't have two skills with the same name
	exists, err := s.repo.ExistsByName(ctx, userID, req.Name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperr.NewConflict("You already have a skill called " + req.Name)
	}
	return s.repo.Create(ctx, userID, req.Name, req.Color)
}

func (s *Service) GetByID(ctx context.Context, id, userID int64) (*Skill, error) {
	return s.repo.GetByID(ctx, id, userID)
}
