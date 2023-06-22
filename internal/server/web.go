package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/ohlsont/almed/internal/event"
	"github.com/ohlsont/almed/internal/storage"
	"golang.org/x/sync/errgroup"
)

const (
	indexRoute     = "/"
	mapPointsRoute = "/map"
	idsRoute       = "/ids"
	eventRoute     = "/item/"
	updateDatabase = "/update"

	address = "127.0.0.1:8080"
)

func WebServer(
	ctx context.Context,
	storage storage.Storage,
	client *event.AlmedClient,
) error {
	mux := http.NewServeMux()

	addDebugHandles(ctx, client, mux)
	mux.HandleFunc(indexRoute, func(writer http.ResponseWriter, request *http.Request) {
		events, err := storage.GetEvents(ctx)
		if err != nil {
			fmt.Println(err)
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte("could not get events"))
			return
		}
		if len(events) == 0 {
			_, _ = writer.Write([]byte("no events in storage, run update"))
			return
		}
		var data []byte
		data, err = json.Marshal(events)
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
	mux.HandleFunc(mapPointsRoute, func(writer http.ResponseWriter, request *http.Request) {
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

	mux.HandleFunc(updateDatabase, func(writer http.ResponseWriter, request *http.Request) {
		ids, err := client.GetEventIds(ctx)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte("could not get event ids"))
			return
		}
		points, err := client.GetMapPoints(ctx)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte("could not get points"))
			return
		}
		events, err := client.ChunkGetterAllEvents(ctx, ids, points, time.Second)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte("could not get events"))
			return
		}
		if err := storage.SaveEvents(ctx, events); err != nil {
			err := fmt.Errorf("update events: %w", err)
			log.Println(err)
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
		log.Println("number of updates; " + strconv.Itoa(len(events)))
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
	return setupServer(ctx, mux, address)
}

func setupServer(ctx context.Context, mux *http.ServeMux, address string) error {
	lc := net.ListenConfig{}
	ln, err := lc.Listen(ctx, "tcp4", address)
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
	log.Println("Listning to " + address + "...")
	return g.Wait()
}
