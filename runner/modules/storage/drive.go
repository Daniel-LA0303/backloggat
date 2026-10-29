package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/googleapi"
	"google.golang.org/api/option"
)

type DriveConfig struct {
	ClientID     string
	ClientSecret string
	RefreshToken string
	FolderName   string
}

type UploadedFile struct {
	ID          string
	WebViewLink string
}

type DriveUploader struct {
	svc      *drive.Service
	folderID string
}

func NewDriveUploader(cfg DriveConfig) (*DriveUploader, error) {
	ctx := context.Background() // el TokenSource guarda este ctx para refrescar

	oauthCfg := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		Endpoint:     google.Endpoint,
		Scopes:       []string{drive.DriveFileScope},
	}
	client := oauthCfg.Client(ctx, &oauth2.Token{RefreshToken: cfg.RefreshToken})

	svc, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("drive service: %w", err)
	}

	d := &DriveUploader{svc: svc}
	d.folderID, err = d.ensureFolder(ctx, cfg.FolderName)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (d *DriveUploader) ensureFolder(ctx context.Context, name string) (string, error) {
	q := fmt.Sprintf(
		"name='%s' and mimeType='application/vnd.google-apps.folder' and trashed=false",
		strings.ReplaceAll(name, "'", `\'`),
	)
	list, err := d.svc.Files.List().Q(q).Fields("files(id)").Context(ctx).Do()
	if err != nil {
		return "", fmt.Errorf("drive list folder: %w", err)
	}
	if len(list.Files) > 0 {
		return list.Files[0].Id, nil
	}
	folder, err := d.svc.Files.Create(&drive.File{
		Name:     name,
		MimeType: "application/vnd.google-apps.folder",
	}).Fields("id").Context(ctx).Do()
	if err != nil {
		return "", fmt.Errorf("drive create folder: %w", err)
	}
	return folder.Id, nil
}

func (d *DriveUploader) Upload(ctx context.Context, name, mimeType string, r io.Reader) (*UploadedFile, error) {
	res, err := d.svc.Files.Create(&drive.File{
		Name:    name,
		Parents: []string{d.folderID},
	}).
		Media(r, googleapi.ContentType(mimeType)).
		Fields("id, webViewLink").
		Context(ctx).Do()
	if err != nil {
		return nil, fmt.Errorf("drive upload: %w", err)
	}

	// Cualquiera con el link puede ver. Quita este bloque si lo quieres privado.
	_, err = d.svc.Permissions.Create(res.Id, &drive.Permission{
		Type: "anyone",
		Role: "reader",
	}).Context(ctx).Do()
	if err != nil {
		_ = d.svc.Files.Delete(res.Id).Context(ctx).Do()
		return nil, fmt.Errorf("drive permission: %w", err)
	}

	return &UploadedFile{ID: res.Id, WebViewLink: res.WebViewLink}, nil
}

// Delete ignora el 404 (si ya no existe en Drive, no es error).
func (d *DriveUploader) Delete(ctx context.Context, fileID string) error {
	err := d.svc.Files.Delete(fileID).Context(ctx).Do()
	var gerr *googleapi.Error
	if errors.As(err, &gerr) && gerr.Code == http.StatusNotFound {
		return nil
	}
	return err
}
