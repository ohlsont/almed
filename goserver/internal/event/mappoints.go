package event

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

func GetMapPoints() (map[int]MapPoint, error) {
	body := url.Values{
		"search_place": []string{"a"},
	}
	req, err := http.NewRequest("POST", "https://almedalsguiden.com/api?version=js", strings.NewReader(body.Encode()))
	if err != nil {
		return nil, fmt.Errorf("get map points: %w", err)
	}
	req.Header.Set("Accept", "text/html")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Access-Control-Allow-Origin", "*")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("get map points: %w", err)
	}
	defer resp.Body.Close()
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("get map points: %w", err)
	}
	res := Result{}
	if err := json.Unmarshal(data, &res); err != nil {
		return nil, fmt.Errorf("get map points: %w", err)
	}
	points := map[int]MapPoint{}
	for _, p := range res.Result {
		id, err := strconv.Atoi(p.Id)
		if err != nil {
			return nil, fmt.Errorf("get map points: %w", err)
		}
		lng, err := strconv.ParseFloat(strings.TrimSpace(p.Longitude), 32)
		if err != nil {
			return nil, fmt.Errorf("get map points: %w", err)
		}
		lat, err := strconv.ParseFloat(strings.TrimSpace(p.Latitude), 32)
		if err != nil {
			return nil, fmt.Errorf("get map points: %w", err)
		}
		points[id] = MapPoint{
			Id:               id,
			Place:            p.Place,
			PlaceDescription: p.PlaceDescription,
			Longitude:        lng,
			Latitude:         lat,
		}
	}
	return points, nil
}

type Result struct {
	Result []MapPointInternal `json:"result"`
	Error  []string           `json:"error"`
}

type MapPointInternal struct {
	Id               string `json:"id"`
	Place            string `json:"PLACE"`
	PlaceDescription string `json:"PLACE_DESCRIPTION"`
	Longitude        string `json:"LONGITUDE"`
	Latitude         string `json:"LATITUDE"`
}

type MapPoint struct {
	Id               int     `json:"id"`
	Place            string  `json:"place"`
	PlaceDescription string  `json:"place_description"`
	Longitude        float64 `json:"longitude"`
	Latitude         float64 `json:"latitude"`
}
