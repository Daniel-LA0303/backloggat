package utils

import "context"

type contextKey string

const userKeyId contextKey = "userId"

func UserIDFromContext(ctx context.Context) (int64, bool) {
	id, ok := ctx.Value("userId").(int64)
	return id, ok
}
