package main

import (
	"context"
	"log"
	"os"
	"os/signal"

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
	if err := server.WebServer(ctx, storageClient); err != nil {
		log.Println(err)
		return
	}
}
