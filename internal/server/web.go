package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/ohlsont/almed/internal/event"
	"github.com/ohlsont/almed/internal/storage"
	"golang.org/x/sync/errgroup"
)

func WebServer(ctx context.Context, storage *storage.Client) error {
	mux := http.NewServeMux()
	client := event.AlmedClient{BaseURL: "https://almedalsguiden.com"}
	mux.HandleFunc("/mapPoints", func(writer http.ResponseWriter, request *http.Request) {
		points, err := client.GetMapPoints(ctx)
		if err != nil {
			fmt.Println(err)
			writer.WriteHeader(http.StatusBadRequest)
			return
		}
		var data []byte
		data, err = json.Marshal(points)
		if err != nil {
			fmt.Println(err)
			writer.WriteHeader(http.StatusBadRequest)
			return
		}
		writer.Header().Set("Content-Type", "application/json")
		if _, err := writer.Write(data); err != nil {
			fmt.Println(err)
			writer.WriteHeader(http.StatusBadRequest)
			return
		}
	})

	mux.HandleFunc("/updateEvents", func(writer http.ResponseWriter, request *http.Request) {
		ids, err := client.GetEventIds(ctx)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, err := writer.Write([]byte("bad id"))
			if err != nil {
				log.Println(err)
				return
			}
			return
		}
		mapLock := sync.Mutex{}
		events := map[int]*event.AlmedEvent{}
		for _, chunk := range chunkBy(ids, 100) {
			newCtx, cancelFunc := context.WithTimeout(ctx, 10*time.Second)
			defer cancelFunc()
			g, ctx := errgroup.WithContext(newCtx)

			for _, id := range chunk {
				id := id
				g.Go(func() error {
					ev, err := client.GetEvent(ctx, id)
					if err != nil {
						return fmt.Errorf("getting chunked id: %w", err)
					}
					mapLock.Lock()
					events[ev.ID] = ev
					mapLock.Unlock()
					return nil
				})
			}
			if err := g.Wait(); err != nil {
				err := fmt.Errorf("update events: get chunks: %w", err)
				log.Println(err)
				writer.WriteHeader(http.StatusInternalServerError)
				return
			}
		}
		if err := storage.SaveEvents(ctx, events); err != nil {
			err := fmt.Errorf("update events: %w", err)
			log.Println(err)
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
	})
	mux.HandleFunc("/events", func(writer http.ResponseWriter, request *http.Request) {
		events, err := storage.GetEvents(ctx)
		if err != nil {
			log.Println(err)
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
		data, err := json.Marshal(events)
		if err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
		writer.Header().Set("Content-Type", "application/json")
		if _, err = writer.Write(data); err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
	})
	lc := net.ListenConfig{}
	ln, err := lc.Listen(ctx, "tcp4", "127.0.0.1:8080")
	if err != nil {
		return fmt.Errorf("webServer: %w", err)
	}
	g, _ := errgroup.WithContext(ctx)
	s := &http.Server{Handler: mux, ReadHeaderTimeout: 3 * time.Second}
	g.Go(func() error {
		if err := s.Serve(ln); err != nil {
			// log why we shut down the context
			return fmt.Errorf("server: %w", err)
		}
		return nil
	})
	g.Go(func() error {
		<-ctx.Done()
		return s.Shutdown(context.Background())
	})
	log.Println("Listning...")
	return g.Wait()
}

func chunkBy[T any](items []T, chunkSize int) (chunks [][]T) {
	for chunkSize < len(items) {
		items, chunks = items[chunkSize:], append(chunks, items[0:chunkSize:chunkSize])
	}
	return append(chunks, items)
}
