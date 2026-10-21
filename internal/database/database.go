package database

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func Open(dataDir, name string) (*sqlx.DB, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}

	dsn := "file:" + filepath.ToSlash(filepath.Join(dataDir, name)) +
		"?_pragma=foreign_keys(1)" +
		"&_pragma=journal_mode(WAL)" +
		"&_pragma=busy_timeout(5000)"

	db, err := sqlx.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	if err := migrate(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return db, nil
}

func migrate(db *sqlx.DB) error {
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		name       TEXT PRIMARY KEY,
		applied_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`); err != nil {
		return err
	}

	entries, err := fs.ReadDir(migrationsFS, "migrations") // already sorted by name
	if err != nil {
		return err
	}

	found := 0
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		found++

		var n int
		if err := db.Get(&n, `SELECT COUNT(*) FROM schema_migrations WHERE name = ?`, e.Name()); err != nil {
			return err
		}
		if n > 0 {
			continue
		}

		body, err := migrationsFS.ReadFile(path.Join("migrations", e.Name()))
		if err != nil {
			return err
		}
		if err := apply(db, e.Name(), string(body)); err != nil {
			return fmt.Errorf("%s: %w", e.Name(), err)
		}
	}
	if found == 0 {
		return fmt.Errorf("no .sql files embedded, check the //go:embed line")
	}
	return nil
}

func apply(db *sqlx.DB, name, body string) error {
	tx, err := db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback() // does nothing after a successful Commit

	if _, err := tx.Exec(body); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO schema_migrations (name) VALUES (?)`, name); err != nil {
		return err
	}
	return tx.Commit()
}
