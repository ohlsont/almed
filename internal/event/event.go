package event

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

func (client *AlmedClient) GetEventIds(ctx context.Context) ([]int, error) {
	body := url.Values{
		"search":        []string{"S%C3%B6k"},
		"date_from":     []string{"2022-07-03"},
		"date_to":       []string{"2022-07-07"},
		"subject":       []string{},
		"event_form":    []string{},
		"eventType":     []string{},
		"organizer":     []string{},
		"orgtype":       []string{},
		"place":         []string{},
		"language":      []string{},
		"accessibility": []string{},
		"status":        []string{},
	}
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		client.BaseURL+"/main/search",
		strings.NewReader(body.Encode()),
	)
	if err != nil {
		return []int{}, fmt.Errorf("getIdsHTMLJSON: %w", err)
	}
	req.Header.Set("Accept", "text/html")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Access-Control-Allow-Origin", "*")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return []int{}, fmt.Errorf("getIdsHTMLJSON: %w", err)
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return []int{}, fmt.Errorf("getIdsHTMLJSON: %w", err)
	}
	allIds := []int{}
	for _, child := range doc.Find("#search_result ul").Children().Nodes {
		hrefStr := child.Attr[0].Val
		id, err := strconv.Atoi(strings.Split(hrefStr, "/")[2])
		if err != nil {
			return []int{}, fmt.Errorf("getIdsHTMLJSON: %w", err)
		}
		allIds = append(allIds, id)
	}
	return allIds, nil
}

const (
	orgFieldType                = "Arrangör:"
	dateFieldType               = "Dag:"
	typeFieldType               = "Typ:"
	subject1FieldType           = "Ämnesområde:"
	subject2FieldType           = "Ämnesområde 2:"
	languageFieldType           = "Språk:"
	locationFieldType           = "Plats:"
	locationDesciptionFieldType = "Platsbeskrivning:"
	greenFieldType              = "Grönt evenemang:"
	accessabilityFieldType      = "Tillgänglighet:"
	liveFieldType               = "Direktsänds på internet:"
	foodFieldType               = "Förtäring:"
	participantsFieldType       = "Medverkande:"
)

type AlmedClient struct {
	BaseURL string
}

func (client *AlmedClient) GetEvent(ctx context.Context, id int) (*AlmedEvent, error) {
	eventURL := fmt.Sprintf(client.BaseURL+"/event/%d", id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, eventURL, nil)
	if err != nil {
		return nil, fmt.Errorf("get html item: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("get html item: %w", err)
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("get html item: %w", err)
	}
	event := doc.Find("#event")
	res := &AlmedEvent{
		ID: id,
	}
	event.Children().Each(func(i int, selection *goquery.Selection) {
		if selection.Is("h1") {
			res.Title = selection.Text()
			return
		}
		// is a section
		selection.Children().Each(func(i int, selection *goquery.Selection) {
			switch selection.Find("strong").Text() {
			case orgFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Organizer = fields[len(fields)-1]
			case dateFieldType:
				start, end, err := eventTime(selection)
				if err != nil {
					log.Println("could not handle time: ", err)
					return
				}
				res.StartTime = start
				res.EndTime = end
			case typeFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Type = fields[1]
			case subject1FieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Subject = []string{fields[1]}
			case subject2FieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Subject = append(res.Subject, fields[1])
			case languageFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Language = fields[1]
			case locationFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Location = fields[1]
			case locationDesciptionFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Location = fields[1]
			case greenFieldType, liveFieldType, foodFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Green = fields[1] == "Nej"
			case accessabilityFieldType:
				fields := strings.Split(selection.Text(), ":")
				res.Availability = fields[1]
			default:
				if selection.Text() == "" ||
					strings.Contains(selection.Text(), "https://") ||
					selection.Text() == participantsFieldType {
					return
				}
				log.Println(i, " unhandled type: ", selection.Text())
			}
		})
		web, err := selection.Find("section p a").Html()
		if err != nil {
			log.Println("could not find web page")
			return
		}
		res.Web = []string{web}
		res.URL = eventURL
		switch i {
		case 3:
			res.Description = selection.Text()
		case 4:
			participantsHTML, err := selection.Find("section").Html()
			if err != nil {
				return
			}
			parts, parties, err := participants(participantsHTML)
			if err != nil {
				return
			}
			res.Participants = parts
			res.Parties = parties
		}
	})
	return res, nil
}

type Party string

const (
	s  Party = "socialdemokraterna"
	m  Party = "moderaterna"
	l  Party = "liberalerna"
	c  Party = "centerpartiet"
	v  Party = "vänsterpartiet"
	sd Party = "sverigedemokraterna"
	mp Party = "miljöpartiet"
)

func parties() map[Party]string {
	return map[Party]string{
		s:  "s",
		m:  "m",
		l:  "l",
		c:  "c",
		v:  "v",
		sd: "sd",
		mp: "mp",
	}
}

func participants(participantsHTML string) ([]AlmedParticipant, []Party, error) {
	delimiter := "</strong> "
	index := strings.Index(participantsHTML, delimiter)
	if index < 0 {
		return []AlmedParticipant{}, []Party{}, errors.New("bad participant string")
	}
	parts := strings.Split(participantsHTML[index+len(delimiter):], "<br>")
	res := []AlmedParticipant{}
	for _, p := range parts[:len(parts)-1] {
		nameParts := strings.Split(p, ",")
		res = append(res, AlmedParticipant{
			Name:    nameParts[0],
			Title:   nameParts[1],
			Company: nameParts[2],
		})
	}
	eventParties := []Party{}
	for _, participant := range res {
		for party, name := range parties() {
			if strings.Contains(participant.Company, string(party)) ||
				strings.Contains(participant.Company, "("+name+")") {
				eventParties = append(eventParties, party)
			}
		}
	}
	return res, eventParties, nil
}

func eventTime(selection *goquery.Selection) (time.Time, time.Time, error) {
	dateStrClean := strings.TrimSpace(strings.Replace(selection.Text(), dateFieldType, "", 1))
	fields := strings.Split(dateStrClean, ",")
	dateFields := strings.Split(fields[0], " ")
	year, err := strconv.Atoi(dateFields[1])
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("evenTime: %w", err)
	}
	dayMonth := strings.Split(dateFields[0], "/")
	day, err := strconv.Atoi(dayMonth[0])
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("evenTime: %w", err)
	}
	month, err := strconv.Atoi(dayMonth[1])
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("evenTime: %w", err)
	}
	timeFields := strings.Split(fields[1], "–")
	startHour, startMinute, err := ts(timeFields[0])
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("evenTime: %w", err)
	}
	endHour, endMinute, err := ts(timeFields[1])
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("evenTime: %w", err)
	}
	loc, _ := time.LoadLocation("Europe/Berlin")
	return time.Date(year, time.Month(month), day, startHour, startMinute, 0, 0, loc),
		time.Date(year, time.Month(month), day, endHour, endMinute, 0, 0, loc), nil
}

func ts(str string) (int, int, error) {
	timeFields := strings.Split(strings.TrimSpace(str), "–")
	startTimeStr := strings.Split(timeFields[0], ":")
	hour, err := strconv.Atoi(startTimeStr[0])
	if err != nil {
		return 0, 0, fmt.Errorf("ts: %w", err)
	}
	minute, err := strconv.Atoi(startTimeStr[1])
	if err != nil {
		return 0, 0, fmt.Errorf("ts: %w", err)
	}
	return hour, minute, nil
}

type AlmedEvent struct {
	ID                  int                `json:"id"`
	Title               string             `json:"title"`
	Organizer           string             `json:"organizer"`
	StartTime           time.Time          `json:"start_time"`
	EndTime             time.Time          `json:"end_time"`
	Type                string             `json:"type"`
	Subject             []string           `json:"subject"`
	Language            string             `json:"language"`
	Location            string             `json:"location"`
	LocationDescription string             `json:"location_description"`
	Description         string             `json:"description"`
	Latitude            float64            `json:"latitude"`
	Longitude           float64            `json:"longitude"`
	Participants        []AlmedParticipant `json:"participants"`
	Parties             []Party            `json:"parties"`
	Green               bool               `json:"green"`
	Availability        string             `json:"Availability"`
	Live                bool               `json:"live"`
	Food                bool               `json:"food"`
	Web                 []string           `json:"web"`
	URL                 string             `json:"url"`
}

type AlmedParticipant struct {
	Name    string
	Title   string
	Company string
}
