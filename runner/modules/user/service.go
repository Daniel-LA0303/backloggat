package user

import (
	"backloggat/runner/modules/auth/jwt"
	"backloggat/runner/platform/apperr"
	"context"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo *UserRespository
}

var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("dummy-password"), bcrypt.DefaultCost)

func NewUserService(repo *UserRespository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) LoginUser(
	ctx context.Context,
	req UserLoginRequestDTO,
) (
	*UserLoginResponseDTO,
	error,
) {

	// 1. valid user
	exists, _ := s.repo.GetByEmailLogin(ctx, req.Email) // _ means i know exist an error but sen to console print
	if exists == nil {
		return nil, apperr.NewNotFound("There email not found " + req.Email)
	}

	// 2. valid passoword
	if bcrypt.CompareHashAndPassword([]byte(exists.PasswordHash), []byte(req.PasswordHash)) != nil {
		return nil, apperr.NewUnauthorized("Invalid user or credentials")
	}

	// 3 create token and send info response
	token, err := jwt.CreateJWT(strconv.FormatInt(exists.UserId, 10), exists.Username, exists.Email)

	if err != nil {
		return nil, err
	}

	return &UserLoginResponseDTO{
		UserId:   exists.UserId,
		Username: exists.Username,
		Email:    exists.Email,
		Token:    token,
	}, nil
}

func (s *UserService) CreateUser(
	ctx context.Context,
	user User,
) (
	*UserInfoDTO, error,
) {

	// 1. validate user
	exists, _ := s.repo.GetByEmail(ctx, user.Email) // _ means i know exist an error but send to console print
	if exists != nil {
		return nil, apperr.NewConflict("There is already this email registered " + user.Email)
	}

	// 2. create user with pass hasehd
	hash, err := hashPassword(user.PasswordHash)
	if err != nil {
		return nil, err
	}

	user.PasswordHash = hash

	var userResponse *UserInfoDTO

	userResponse, err = s.repo.RegisterUser(ctx, &user)
	if err != nil {
		return nil, err
	}

	token, err := jwt.CreateJWT(strconv.FormatInt(userResponse.UserId, 10), userResponse.Username, userResponse.Email)

	if err != nil {
		return nil, err
	}
	userResponse.Token = token
	return userResponse, nil
}

func hashPassword(plain string) (string, error) {

	// hash plain
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", apperr.NewInternal(err)
	}

	return string(b), nil
}
