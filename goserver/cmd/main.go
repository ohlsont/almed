package main

import (
	"context"
	"github.com/ohlsont/almed/internal/server"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	c := make(chan os.Signal)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("exiting")
		os.Exit(1)
	}()
	ctx, cancel := context.WithCancel(context.Background())
	if err := server.WebServer(ctx, cancel); err != nil {
		log.Fatal(err)
		return
	}
}
