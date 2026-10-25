package knowledge

import (
	"backloggat/runner/platform/apperr"
	"context"
	"log"
)

type KnowledgeService struct {
	repo *KnowledgeRepository
}

func NewKnowledgeService(repo *KnowledgeRepository) *KnowledgeService {
	return &KnowledgeService{repo: repo}
}

// get all Knowledge by user
func (s *KnowledgeService) GetKnowledgesByUser(
	ctx context.Context,
	userId int64,
) ([]Knowlage, error) {

	return s.repo.ListKnowledge(userId)
}

// // TODO: this repo should be in skill service
func (s *KnowledgeService) GetKnowledgesBySkillAndUser(
	ctx context.Context,
	userId int64,
	skill int64,
) ([]Knowlage, error) {

	return s.repo.ListKnowledgeBySkill(userId, skill)
}

// create knowledge
func (s *KnowledgeService) CreateKnowledge(
	ctx context.Context,
	userId int64,
	req CreateKnowledge,
) (*Knowlage, error) {

	// 1. business rule: a user can't have two skills with the same name
	knowledge, err := s.repo.CreateKnowledge(ctx, userId, &req)
	if err != nil {
		return nil, err
	}
	log.Printf("created knowledge id=%d userId=%d skills=%v", knowledge.KnowlageId, userId, req.SkillsIds)
	// 2. asotiation with skills
	// TODO: maybe add to validate thta ids
	for _, skillId := range req.SkillsIds {
		if err := s.repo.InserKnowledgeSkill(ctx, skillId, knowledge.KnowlageId); err != nil {
			return nil, err
		}
	}

	return &Knowlage{
		KnowlageId:  knowledge.KnowlageId,
		UserId:      knowledge.UserId,
		Name:        knowledge.Name,
		Description: knowledge.Description,
		Color:       knowledge.Color,
		CreatedAt:   knowledge.CreatedAt,
		UpdatedAt:   "",
	}, nil
}

// deelte by id
func (s *KnowledgeService) DeleteById(ctx context.Context, knowledgeId int64, userId int64) error {

	// 1. valid skills
	exists, err := s.repo.GetByID(ctx, knowledgeId, userId)
	if err != nil {
		return err
	}
	if exists == nil {
		return apperr.NewNotFound("This knowledge does not exists, ")
	}
	// 2. return skill
	return s.repo.DeleteKnowledge(ctx, knowledgeId)
}
