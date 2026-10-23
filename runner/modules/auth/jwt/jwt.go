package jwt

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret = []byte("super_secret_key_change_me")
var JWTExpiration = time.Hour * 48 // 48 hours

type contextKey string

const userKeyId contextKey = "userId"

type CustomClaims struct {
	UserId   string `json:"userId"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func GetUserIdFromContext(ctx context.Context) string {
	userId, ok := ctx.Value(userKeyId).(string)
	if !ok {
		return ""
	}
	return userId
}

// we create a new token
func CreateJWT(
	userId string,
	username string,
	email string,
) (
	string, error,
) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   userId,
		"username": username,
		"email":    email,
		"exp":      time.Now().Add(JWTExpiration).Unix(),
	})

	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// to validate our jwt
func ValidateJWT(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	// Hacemos el "type assertion" para obtener los claims
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("token no válido o claims incorrectos")
}

// middleware to ckech if is auth
func WithJWTAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "unauthorized: missing header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 1. validate token
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// 2. access claims direct
		userId := claims.UserId

		if userId == "" {
			http.Error(w, "unauthorized: empty user id", http.StatusUnauthorized)
			return
		}

		// 3. send values to ctx
		ctx := context.WithValue(r.Context(), userKeyId, userId)
		//ctx = context.WithValue(ctx, OrgIDKey, orgId)

		next(w, r.WithContext(ctx))
	}
}
