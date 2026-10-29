package server

import (
	"backloggat/internal/config"
	"backloggat/runner/modules/knowledge"
	"backloggat/runner/modules/lists"
	"backloggat/runner/modules/notes"
	"backloggat/runner/modules/projects"
	"backloggat/runner/modules/resources"
	"backloggat/runner/modules/skills"
	"backloggat/runner/modules/storage"
	"backloggat/runner/modules/user"
	"backloggat/runner/modules/vault"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jmoiron/sqlx"
)

type Server struct {
	http *http.Server
}

func New(cfg config.Config, db *sqlx.DB) *Server {
	// 1. BUILD: repo -> service -> handler (this is the "injection")
	skillsRepo := skills.NewRepository(db)
	skillsSvc := skills.NewService(skillsRepo)
	skillsHandler := skills.NewHandler(skillsSvc)

	userRepo := user.NewUserRepository(db)
	userSvc := user.NewUserService(userRepo)
	userHandler := user.NewUserHandler(userSvc)

	knowledgeRepo := knowledge.NewKnowledgeRepository(db)
	knowledgeService := knowledge.NewKnowledgeService(knowledgeRepo)
	knowledgeHanlder := knowledge.NewKnowledgeHandler(knowledgeService)

	passRepo := vault.NewPasswordRepository(db)
	passSvc := vault.NewPasswordService(passRepo)
	passHanlder := vault.NewPasswordHandler(passSvc)

	drv, err := storage.NewDriveUploader(storage.DriveConfig{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RefreshToken: os.Getenv("GOOGLE_REFRESH_TOKEN"),
		FolderName:   os.Getenv("GOOGLE_DRIVE_FOLDER_NAME"),
	})
	if err != nil {
		log.Fatalf("drive: %v", err)
	}

	resoRepo := resources.NewResourceRepository(db)
	resoSvc := resources.NewResourceService(resoRepo, drv)
	resoHandler := resources.NewResourceHandler(resoSvc)

	noteRepo := notes.NewNoteRepository(db)
	noteSvc := notes.NewNoteService(noteRepo)
	noteHandler := notes.NewNoteHandler(noteSvc)

	listRepo := lists.NewListRepository(db)
	listSvc := lists.NewListService(listRepo)
	listHandler := lists.NewListHandler(listSvc)

	proRepo := projects.NewProjectRepository(db)
	proSvc := projects.NewProjectService(proRepo)
	proHandler := projects.NewProjectHandler(proSvc)

	// 2. ROUTER
	r := chi.NewRouter()
	r.Use(chimw.Logger, chimw.Recoverer)

	// cors config
	r.Use(cors.Handler((cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	})))
	r.NotFound(response.Handle(func(w http.ResponseWriter, r *http.Request) error {
		return apperr.NewNotFound("Route")
	}))

	// 3. MOUNT every module under /api
	r.Route("/api", func(api chi.Router) {
		skills.RegisterRoutes(api, skillsHandler)
		user.RegisterUserRoutes(api, userHandler)
		knowledge.RegisterRoutes(api, knowledgeHanlder)
		vault.RegisterRoutes(api, passHanlder)
		resources.RegisterRoutes(api, resoHandler)
		notes.RegisterRoutes(api, noteHandler)
		lists.RegisterRoutes(api, listHandler)
		projects.RegisterRoutes(api, proHandler)
		// projects.RegisterRoutes(api, projectsHandler)  <- later
	})

	return &Server{http: &http.Server{
		Addr:              cfg.Addr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}}
}

// Run blocks until the server fails or ctx is cancelled (Ctrl+C).
func (s *Server) Run(ctx context.Context) error {
	errCh := make(chan error, 1)
	go func() { errCh <- s.http.ListenAndServe() }()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return s.http.Shutdown(shutdownCtx)
	}
}
