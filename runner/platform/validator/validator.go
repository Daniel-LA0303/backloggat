package validator

import (
	"backloggat/runner/platform/apperr"
	"fmt"
	"net/mail"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

// collects errors for a whole form
type Validator struct {
	fields map[string]string
}

func New() *Validator {
	return &Validator{fields: map[string]string{}}
}

// nil when everything is valid, otherwise an AppError with the fields
func (v *Validator) Err() error {
	if len(v.fields) == 0 {
		return nil
	}
	return apperr.NewValidationFields("Please fix the highlighted fields", v.fields)
}

// Field trims spaces; Secret keeps the value as typed (passwords)
func (v *Validator) Field(name, value string) *Field {
	return &Field{v: v, name: name, value: strings.TrimSpace(value)}
}

func (v *Validator) Secret(name, value string) *Field {
	return &Field{v: v, name: name, value: value}
}

type Field struct {
	v     *Validator
	name  string
	value string
}

// cleaned value, after the rules
func (f *Field) Value() string { return f.value }

// ---- helpers ----

// keeps only the first error per field
func (f *Field) fail(msg string) *Field {
	if _, exists := f.v.fields[f.name]; !exists {
		f.v.fields[f.name] = msg
	}
	return f
}

// optional empty fields skip every rule except Required
func (f *Field) skip() bool {
	_, hasError := f.v.fields[f.name]
	return f.value == "" || hasError
}

// "start_date" -> "Start date"
func (f *Field) label() string {
	s := strings.ReplaceAll(f.name, "_", " ")
	return strings.ToUpper(s[:1]) + s[1:]
}

// ---- rules ----

// value used when the field is empty (call before the other rules)
func (f *Field) Default(def string) *Field {
	if f.value == "" {
		f.value = def
	}
	return f
}

func (f *Field) Lower() *Field {
	f.value = strings.ToLower(f.value)
	return f
}

func (f *Field) Required() *Field {
	if f.value == "" {
		return f.fail(f.label() + " is required")
	}
	return f
}

func (f *Field) Min(n int) *Field {
	if f.skip() {
		return f
	}
	if utf8.RuneCountInString(f.value) < n {
		return f.fail(fmt.Sprintf("%s must be at least %d characters", f.label(), n))
	}
	return f
}

func (f *Field) Max(n int) *Field {
	if f.skip() {
		return f
	}
	if utf8.RuneCountInString(f.value) > n {
		return f.fail(fmt.Sprintf("%s must be %d characters or less", f.label(), n))
	}
	return f
}

func (f *Field) Email() *Field {
	if f.skip() {
		return f
	}
	addr, err := mail.ParseAddress(f.value)
	if err != nil || addr.Address != f.value { // rejects "Name <a@b.com>"
		return f.fail("Enter a valid email")
	}
	return f
}

// whole number
func (f *Field) Number() *Field {
	if f.skip() {
		return f
	}
	if _, err := strconv.Atoi(f.value); err != nil {
		return f.fail(f.label() + " must be a number")
	}
	return f
}

// custom pattern, you give the message
func (f *Field) Match(re *regexp.Regexp, msg string) *Field {
	if f.skip() {
		return f
	}
	if !re.MatchString(f.value) {
		return f.fail(msg)
	}
	return f
}

// value must be one of the options
func (f *Field) OneOf(options ...string) *Field {
	if f.skip() {
		return f
	}
	for _, o := range options {
		if f.value == o {
			return f
		}
	}
	return f.fail(f.label() + " has an invalid value")
}
