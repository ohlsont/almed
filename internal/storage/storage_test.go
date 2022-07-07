package storage

import (
	"context"
	"testing"

	"github.com/ohlsont/almed/internal/event"
	"gotest.tools/v3/assert"
)

func TestName(t *testing.T) {
	ctx := context.Background()
	app, err := New(ctx)
	assert.NilError(t, err)
	err = app.SaveEvents(ctx, map[int]*event.AlmedEvent{})
	assert.NilError(t, err)
}
