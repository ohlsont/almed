package event

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"gotest.tools/v3/assert"
)

func TestGetHTMLItem(t *testing.T) {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	data, err := os.ReadFile("event.html")
	assert.NilError(t, err)
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write(data); err != nil {
			log.Println("test", err)
			return
		}
	}))
	defer ts.Close()
	client := AlmedClient{BaseURL: ts.URL}
	res, err := client.GetEvent(context.Background(), 20314)
	assert.NilError(t, err)
	fmt.Println(res)
}

func TestParticipants(t *testing.T) {
	const str = `<section><strong>Medverkande:</strong> 
		Erik Svensson, Nordisk Lead för Retail, Accenture Strategy &amp; Consulting<br>
		Snjezana Maric, Senior Manager, Strategy Consulting, Accenture<br>
		Amanda Frick, Strategy Consultant, Accenture<br>
		Karin Brynell, VD, Svensk Dagligvaruhandel<br>
		Isabella Melkersson, Partnership lead, SSE Business Lab<br>
		Maria Smith, Generalsekreterare, Axfoundation<br>
		Roberto Rufo Gonzalez, CEO, Consupedia<br>
	</section>`

	res, parties, err := participants(str)
	assert.NilError(t, err)
	assert.Equal(t, len(res), 7)
	assert.Equal(t, len(parties), 0)
}
