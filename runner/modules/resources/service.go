package resources

import (
	"backloggat/runner/modules/storage"
	"backloggat/runner/platform/apperr"
	"context"
	"log"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/jmoiron/sqlx"
)

type ResourceService struct {
	repo  *ResourceRepository
	drive *storage.DriveUploader
}

func NewResourceService(repo *ResourceRepository, drive *storage.DriveUploader) *ResourceService {
	return &ResourceService{repo: repo, drive: drive}
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
func (s *ResourceService) uploadToDrive(ctx context.Context, fh *multipart.FileHeader) (*storage.UploadedFile, error) {
	f, err := fh.Open()
	if err != nil {
		return nil, apperr.NewConflict("cannot read file")
	}
	defer f.Close()

	mime := fh.Header.Get("Content-Type")
	if mime == "" {
		mime = "application/octet-stream"
	}

	up, err := s.drive.Upload(ctx, filepath.Base(fh.Filename), mime, f)
	if err != nil {
		log.Printf("Drive upload ERROR: %v", err)
		return nil, apperr.NewConflict("upload to drive failed")
	}
	return up, nil
}

func (s *ResourceService) deleteFromDrive(ctx context.Context, fileID string) {
	// WithoutCancel: que el cleanup no muera si el request se canceló
	if err := s.drive.Delete(context.WithoutCancel(ctx), fileID); err != nil {
		log.Printf("Drive cleanup ERROR (%s): %v", fileID, err)
	}
}

func (s *ResourceService) CreateResource(ctx context.Context, userID int64, req ResourceRequest, file *multipart.FileHeader) (*ResourceInfo, error) {
	var driveID *string

	if file != nil {
		up, err := s.uploadToDrive(ctx, file)
		if err != nil {
			return nil, err
		}
		req.Link = up.WebViewLink
		driveID = &up.ID
	}

	var item *ResourceInfo
	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		var err error
		item, err = s.repo.InsertResource(ctx, tx, userID, &req, driveID)
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
		if driveID != nil {
			s.deleteFromDrive(ctx, *driveID) // no dejar archivo huérfano
		}
		return nil, err
	}
	return item, nil
}

func (s *ResourceService) UpdateResource(ctx context.Context, userID, resourceID int64, req ResourceRequest, file *multipart.FileHeader) (*ResourceInfo, error) {
	var newDriveID *string

	if file != nil {
		up, err := s.uploadToDrive(ctx, file)
		if err != nil {
			return nil, err
		}
		req.Link = up.WebViewLink
		newDriveID = &up.ID
	}

	var (
		item       *ResourceInfo
		oldDriveID *string // lo que tenía antes
		finalID    *string // lo que queda guardado
	)

	err := s.repo.InTx(ctx, func(tx *sqlx.Tx) error {
		cur, err := s.repo.GetResourceByID(ctx, tx, userID, resourceID)
		if err != nil {
			return err
		}
		oldDriveID = cur.DriveFileId

		link := req.Link
		switch {
		case file != nil:
			finalID = newDriveID // archivo nuevo
		case strings.TrimSpace(req.Link) == "" || req.Link == cur.Link:
			link, finalID = cur.Link, cur.DriveFileId // conservar
		default:
			finalID = nil // link externo nuevo
		}

		item, err = s.repo.UpdateResource(ctx, tx, userID, resourceID, req.Name, link, req.Type, finalID)
		if err != nil {
			return err
		}
		return s.repo.ReplaceResourceSkills(ctx, tx, resourceID, req.SkillsIds)
	})
	if err != nil {
		if newDriveID != nil {
			s.deleteFromDrive(ctx, *newDriveID) // revertir el archivo recién subido
		}
		return nil, err
	}

	// Éxito: si el archivo anterior de Drive ya no se usa, se borra.
	if oldDriveID != nil && (finalID == nil || *finalID != *oldDriveID) {
		s.deleteFromDrive(ctx, *oldDriveID)
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
