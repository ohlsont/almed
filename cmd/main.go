package main

import (
	"context"
	"log"
	"os"
	"os/signal"

	"github.com/ohlsont/almed/internal/server"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	if err := server.WebServer(ctx, stop); err != nil {
		log.Println(err)
		return
	}
}
