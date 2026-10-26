package knowledge

import (
	"context"
	"strings"
)

type KnowledgeService struct {
	repo *KnowledgeRepository
}

func NewKnowledgeService(repo *KnowledgeRepository) *KnowledgeService {
	return &KnowledgeService{repo: repo}
}

// get all knowledge by user
func (s *KnowledgeService) GetKnowledgesByUser(ctx context.Context, userId int64, f KnowledgeFilters) ([]Knowlage, error) {
	f.Search = strings.TrimSpace(f.Search)
	f.SortBy = strings.ToLower(f.SortBy)
	f.Order = strings.ToLower(f.Order)
	return s.repo.ListKnowledge(userId, f)
}

// create knowledge and link it to its skills
func (s *KnowledgeService) CreateKnowledge(ctx context.Context, userId int64, req CreateKnowledge) (*Knowlage, error) {
	return s.repo.CreateKnowledge(ctx, userId, &req)
}

// update name, description and color (skills links are not touched)
func (s *KnowledgeService) UpdateKnowledge(ctx context.Context, userId, knowledgeId int64, req UpdateKnowledge) (*Knowlage, error) {
	return s.repo.UpdateKnowledge(ctx, userId, knowledgeId, &req)
}

// delete by id
func (s *KnowledgeService) DeleteById(ctx context.Context, knowledgeId, userId int64) error {
	return s.repo.DeleteKnowledge(ctx, userId, knowledgeId)
}
