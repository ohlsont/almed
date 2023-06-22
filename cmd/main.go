package main

import (
	"context"
	"log"
	"os"
	"os/signal"

	"github.com/ohlsont/almed/internal/event"
	"github.com/ohlsont/almed/internal/server"
	"github.com/ohlsont/almed/internal/storage"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	storageClient, err := storage.New(ctx)
	if err != nil {
		log.Println(err)
		return
	}
	client := &event.AlmedClient{BaseURL: "https://almedalsguiden.com"}
	if err := server.WebServer(ctx, storageClient, client); err != nil {
		log.Println(err)
		return
	}
}
