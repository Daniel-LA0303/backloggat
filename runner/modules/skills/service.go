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

func (s *Service) GetSkillByUser(
	ctx context.Context,
	userId int64,
) ([]SkillResponseDTO, error) {

	return s.repo.ListSkills(userId)
}

func (s *Service) Create(
	ctx context.Context,
	userId int64,
	req CreateSkillRequest,
) (*SkillResponseDTO, error) {

	// 1. business rule: a user can't have two skills with the same name
	exists, err := s.repo.ExistsByName(ctx, userId, req.Name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperr.NewConflict("You already have a skill called " + req.Name)
	}

	skill, err := s.repo.Create(ctx, userId, req.Name, req.Color)
	if err != nil {
		return nil, err
	}

	return &SkillResponseDTO{
		SkillId:   skill.ID,
		UserId:    skill.UserID,
		Name:      skill.Name,
		Color:     skill.Color,
		CreatedAt: skill.CreatedAt,
		UpdatedAt: skill.UpdatedAt,
		// set all count in 0
		CountProjects:   0,
		CountNotes:      0,
		CountResources:  0,
		CountKnowledges: 0,
	}, nil
}

func (s *Service) GetByID(ctx context.Context, id, userID int64) (*Skill, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *Service) DeleteById(ctx context.Context, skillId int64, userId int64) error {

	// 1. valid skills
	exists, err := s.repo.GetByID(ctx, skillId, userId)
	if err != nil {
		return err
	}
	if exists == nil {
		return apperr.NewNotFound("This skill does not exists, ")
	}
	// 2. return skill
	return s.repo.DeleteSkill(ctx, skillId)
}
