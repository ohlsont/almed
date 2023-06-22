//go:build exclude

package server

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"

	"github.com/ohlsont/almed/internal/event"
	"github.com/ohlsont/almed/internal/storage"
	"gotest.tools/v3/assert"
)

const testDataFolder = "local/"

func TestWebServer(t *testing.T) {
	ts := testFileServer()
	defer ts.Close()

	ctx := context.Background()
	client := &event.AlmedClient{BaseURL: ts.URL}
	err := WebServer(ctx, storage.NewLocal(), client)
	assert.NilError(t, err)
}

func testFileServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		filepath := ""
		switch {
		case r.URL.Path == "/main/search":
			filepath = testDataFolder + "ids.html"
		case strings.HasPrefix(r.URL.Path, "/event"):
			filepath = testDataFolder + strings.TrimPrefix(r.URL.Path, "/event/") + ".html"
		case r.URL.Path == "/api":
			filepath = testDataFolder + "mappoints.json"
		}
		log.Println("getting file for " + r.URL.Path + "; " + filepath)
		data, err := os.ReadFile(filepath)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		_, _ = w.Write(data)
	}))
}

func TestGetAllEvents(t *testing.T) {
	// setup file server
	ts := testFileServer()
	defer ts.Close()

	err := getSaveHTMLFile("ids", "/main/search")
	assert.NilError(t, err)

	ctx := context.Background()
	client := event.AlmedClient{BaseURL: ts.URL}
	ids, err := client.GetEventIds(ctx)
	assert.NilError(t, err)
	// get all the events
	for _, id := range ids {
		idStr := strconv.Itoa(id)
		// if not already downloaded
		err = getSaveHTMLFile(idStr, "/event/"+idStr)
		assert.NilError(t, err)
	}
}

func getSaveHTMLFile(fileName string, urlPath string) error {
	filePath := testDataFolder + fileName + ".html"
	_, statErr := os.Stat(filePath)
	if statErr == nil {
		// exists
		return nil
	}
	u := "https://almedalsguiden.com" + urlPath
	log.Println("not found locally, getting ", u)
	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodGet,
		u,
		nil,
	)
	if err != nil {
		return fmt.Errorf("get html file: req: %v", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("get html file: do: %v", err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("get html file: read all: %v", err)
	}
	log.Println("writing: " + filePath)
	err = os.WriteFile(filePath, data, 0o600)
	if err != nil {
		return fmt.Errorf("get html file: wrote: %v", err)
	}
	return nil
}
