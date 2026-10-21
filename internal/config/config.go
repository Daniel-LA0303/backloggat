package config

import "os"

type Config struct {
	DataDir string
	DBName  string
	Addr    string
}

func Load() Config {
	return Config{
		DataDir: getenv("APP_DATA_DIR", "data"),
		DBName:  getenv("APP_DB_NAME", "app.db"),
		Addr:    getenv("APP_ADDR", "127.0.0.1:8080"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
