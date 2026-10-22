package main

import (
	"backloggat/internal/config"
	"backloggat/internal/database"
	"backloggat/runner/server"
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	cfg := config.Load() // get config

	db, err := database.Open(cfg.DataDir, cfg.DBName) // get database config
	if err != nil {
		return err
	}
	defer db.Close()

	/*var tables int
	if err := db.Get(&tables, `SELECT COUNT(*) FROM sqlite_master WHERE type = 'table'`); err != nil {
		return err
	}
	log.Printf("database ready, %d tables", tables)
	return nil*/
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Printf("server running on http://%s", cfg.Addr) // <- the log

	// return a server
	return server.New(cfg, db).Run(ctx)
}
