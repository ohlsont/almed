package storage

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
	"github.com/ohlsont/almed/internal/event"
	"google.golang.org/api/option"
)

type Storage interface {
	SaveEvents(ctx context.Context, events map[int]*event.AlmedEvent) error
	GetEvents(ctx context.Context) (map[int]*event.AlmedEvent, error)
}

type Client struct {
	App *firebase.App
}

const databaseURL = "https://almedale-default-rtdb.europe-west1.firebasedatabase.app/"

func New(ctx context.Context) (Storage, error) {
	// Use a service account
	sa := option.WithCredentialsFile("service-account.json")
	cfg := &firebase.Config{
		ProjectID:   "almedale",
		DatabaseURL: databaseURL,
	}
	app, err := firebase.NewApp(ctx, cfg, sa)
	if err != nil {
		return nil, fmt.Errorf("new storage client: %w", err)
	}
	client, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("new storage client: %w", err)
	}
	defer client.Close()
	return &Client{
		App: app,
	}, nil
}

func (c *Client) SaveEvents(ctx context.Context, events map[int]*event.AlmedEvent) error {
	d, err := c.App.Database(ctx)
	if err != nil {
		return fmt.Errorf("save: %w", err)
	}
	if err := d.NewRef("2022").Child("events").Set(ctx, events); err != nil {
		return fmt.Errorf("save events: %w", err)
	}
	log.Println("finished getting events", len(events))
	return nil
}

func (c *Client) GetEvents(ctx context.Context) (map[int]*event.AlmedEvent, error) {
	res := map[int]*event.AlmedEvent{}
	d, err := c.App.Database(ctx)
	if err != nil {
		return res, fmt.Errorf("save: %w", err)
	}
	if err := d.NewRef("2022").Child("events").Get(ctx, &res); err != nil {
		return res, fmt.Errorf("get events: %w", err)
	}
	return res, nil
}
