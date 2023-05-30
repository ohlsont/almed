package main

import (
	"context"
	"os"
	"os/exec"
	"os/signal"

	"go.einride.tech/sage/sg"
)

func Run(ctx context.Context) error {
	return run(ctx, sg.Command(ctx, "go", "run", "./cmd/main.go"))
}

func run(ctx context.Context, cmd *exec.Cmd) error {
	ctx, cancel := context.WithCancel(ctx)
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)
	defer func() {
		signal.Stop(ch)
		cancel()
	}()
	go func() {
		select {
		case <-ch:
			cancel()
		case <-ctx.Done():
		}
	}()
	return cmd.Run()
}
