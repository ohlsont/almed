package event

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"gotest.tools/v3/assert"
)

const testDataFolder = "testdata/"

func TestGetEvents(t *testing.T) {
	for i, id := range []int{
		19611,
		19120,
		18571,
	} {
		t.Run(fmt.Sprintf("test-%d", i), func(t *testing.T) {
			log.SetFlags(log.LstdFlags | log.Lshortfile)
			idStr := strconv.Itoa(id)
			data, err := os.ReadFile(testDataFolder + idStr + ".html")
			assert.NilError(t, err)
			ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if _, err := w.Write(data); err != nil {
					log.Println("test", err)
					return
				}
			}))
			defer ts.Close()
			client := AlmedClient{BaseURL: ts.URL}
			res, err := client.GetEvent(context.Background(), id)
			assert.NilError(t, err)
			expectedData, err := os.ReadFile(testDataFolder + idStr + ".json")
			assert.NilError(t, err)
			expected := AlmedEvent{}
			assert.NilError(t, json.Unmarshal(expectedData, &expected))
			// d, _ := json.Marshal(res)
			// log.Println(string(d))
			assert.DeepEqual(t, *res, expected)
		})
	}
}

func TestParticipants(t *testing.T) {
	const str = `<strong>Medverkande:</strong> 
		Erik Svensson, Nordisk Lead för Retail, Accenture Strategy &amp; Consulting<br/>
		Snjezana Maric, Senior Manager, Strategy Consulting, Accenture<br/>
		Amanda Frick, Strategy Consultant, Accenture<br/>
		Karin Brynell, VD, Svensk Dagligvaruhandel<br/>
		Isabella Melkersson, Partnership lead, SSE Business Lab<br/>
		Maria Smith, Generalsekreterare, Axfoundation<br/>
		Roberto Rufo Gonzalez, CEO, Consupedia<br/>`

	res, parties, err := participants(str)
	assert.NilError(t, err)
	assert.Equal(t, len(res), 7)
	assert.Equal(t, len(parties), 0)
}
