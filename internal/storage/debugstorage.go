package storage

import (
	"context"
	"sync"

	"github.com/ohlsont/almed/internal/event"
)

type LocalClient struct {
	m      sync.Mutex
	events map[int]*event.AlmedEvent
}

func NewLocal() *LocalClient {
	return &LocalClient{events: map[int]*event.AlmedEvent{}}
}

func (l *LocalClient) SaveEvents(_ context.Context, events map[int]*event.AlmedEvent) error {
	l.m.Lock()
	defer l.m.Unlock()
	l.events = events
	return nil
}

func (l *LocalClient) GetEvents(_ context.Context) (map[int]*event.AlmedEvent, error) {
	l.m.Lock()
	defer l.m.Unlock()
	return l.events, nil
}
