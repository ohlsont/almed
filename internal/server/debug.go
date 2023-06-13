package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/ohlsont/almed/internal/event"
)

func addDebugHandles(ctx context.Context, client event.AlmedClient, mux *http.ServeMux) {
	mux.HandleFunc(idsRoute, func(writer http.ResponseWriter, request *http.Request) {
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
		sort.Ints(ids)
		data, err := json.Marshal(ids)
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
	mux.HandleFunc(eventRoute, func(writer http.ResponseWriter, request *http.Request) {
		parts := strings.Split(request.URL.Path, "/")
		if len(parts) < 2 {
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte("bad url"))
			return
		}
		id, err := strconv.Atoi(parts[len(parts)-1])
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte("bad id"))
			return
		}
		ev, err := client.GetEvent(ctx, id)
		if err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			_, _ = writer.Write([]byte("bad event"))
			fmt.Println(err)
			return
		}
		data, err := json.Marshal(ev)
		if err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
		if _, err = writer.Write(data); err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
	})
}
