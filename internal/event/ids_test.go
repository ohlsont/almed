package event

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"gotest.tools/v3/assert"
)

func TestAlmedClient_GetEventIds_Equal(t *testing.T) {
	data, err := os.ReadFile(testDataFolder + "ids.html")
	assert.NilError(t, err)
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write(data); err != nil {
			log.Println("test", err)
			return
		}
	}))
	defer ts.Close()
	client := AlmedClient{BaseURL: ts.URL}
	res, err := client.GetEventIds(context.Background())
	assert.NilError(t, err)
	expectedData, err := os.ReadFile(testDataFolder + "ids.json")
	assert.NilError(t, err)
	expected := []int{}
	assert.NilError(t, json.Unmarshal(expectedData, &expected))
	assert.DeepEqual(t, res, expected)
}

func TestAlmedClient_GetEventIds_Len(t *testing.T) {
	data, err := os.ReadFile(testDataFolder + "ids.html")
	assert.NilError(t, err)
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write(data); err != nil {
			log.Println("test", err)
			return
		}
	}))
	defer ts.Close()
	client := AlmedClient{BaseURL: ts.URL}
	res, err := client.GetEventIds(context.Background())
	assert.NilError(t, err)
	assert.Equal(t, len(res), 2066)
}
