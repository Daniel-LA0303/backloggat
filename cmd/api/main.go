package main

import (
	"backloggat/internal/config"
	"backloggat/internal/database"
	"log"
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

	var tables int
	if err := db.Get(&tables, `SELECT COUNT(*) FROM sqlite_master WHERE type = 'table'`); err != nil {
		return err
	}
	log.Printf("database ready, %d tables", tables)
	return nil
}
