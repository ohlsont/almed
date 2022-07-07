package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"

	"github.com/ohlsont/almed/internal/event"
	"golang.org/x/sync/errgroup"
)

func WebServer(ctx context.Context, cancelFunc context.CancelFunc) error {
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

	mux.HandleFunc("/ids", func(writer http.ResponseWriter, request *http.Request) {
		ids, err := client.GetIdsHTMLJSON(ctx)
		if err != nil {
			fmt.Println(err)
			writer.WriteHeader(http.StatusBadRequest)
			return
		}
		data, err := json.Marshal(ids)
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
	mux.HandleFunc("/events", func(writer http.ResponseWriter, request *http.Request) {
		id, err := strconv.Atoi(request.URL.Query().Get("id"))
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, err := writer.Write([]byte("bad id"))
			if err != nil {
				log.Println(err)
				return
			}
			return
		}
		event, err := client.GetEvent(ctx, id)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			if _, err := writer.Write([]byte("could not get event")); err != nil {
				log.Println(err)
				return
			}
			return
		}
		data, err := json.Marshal(event)
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
	var g errgroup.Group
	g.Go(func() error {
		if err := http.Serve(ln, mux); err != nil {
			cancelFunc()
			// log why we shut down the context
			return fmt.Errorf("server: %w", err)
		}
		return nil
	})
	return g.Wait()
}
