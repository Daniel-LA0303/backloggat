package server

import (
	"backloggat/internal/config"
	"backloggat/runner/modules/knowledge"
	"backloggat/runner/modules/skills"
	"backloggat/runner/modules/user"
	"backloggat/runner/platform/apperr"
	"backloggat/runner/platform/response"
	"context"
	"net/http"
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
