package config

import "os"

type Config struct {
	DataDir string
	DBName  string
}

func Load() Config {
	return Config{
		DataDir: getenv("APP_DATA_DIR", "data"),
		DBName:  getenv("APP_DB_NAME", "app.db"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
