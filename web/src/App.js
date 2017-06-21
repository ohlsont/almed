// @flow
import React, { Component } from 'react';
import { FlatButton, AppBar, SelectField, MenuItem, Slider } from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin'
import ReactMapboxGl, { Cluster, Marker } from 'react-mapbox-gl'
import moment from 'moment'
import './App.css';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

type Coord = {
    lat: number,
    lng: number,
}

type Appstate = {
    points: Array<AlmedEvent>,
    subjects?: Array<string>,
    choosenSubjectIndex?: number,

    unixSecondsMax?: number,
    unixSecondsMin?: number,
    choosenUnixSecondsMax?: number,
    choosenUnixSecondsMin?: number,

    bounds: {
        nw: Coord,
        se: Coord,
        sw: Coord,
        ne: Coord,
    }
}

class App extends Component {
    state: Appstate  = {
        points: [],
        bounds: {
            nw: { lat: 0, lng: 0 },
            se: { lat: 0, lng: 0 },
            sw: { lat: 0, lng: 0 },
            ne: { lat: 0, lng: 0 },
        },
    }

    static async fetchJson(method: string, url: string, body?: string): Promise<any> {
        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body,
        })

        switch (resp.status) {
            case 204:
                return {}
            case 401:
                throw new Error('bad permissions, 401 response code')
            default:
                break
        }

        if (!resp.ok) {
            console.log('response is not ok ', resp)
            throw new Error(`bad response from server ${resp.status}`)
        }

        return resp.json()
    }

    componentWillMount() {
        const items = localStorage.getItem('items')
        if (!items || items === 'undefined') return
        const points: Array<AlmedEvent> = JSON.parse(items)
        const subjectsObject = {}
        const times = []
        const bounds = points.reduce((boundsAcc, point: AlmedEvent) => {
            const la = parseFloat(point.latitude)
            const lo = parseFloat(point.longitude)
            subjectsObject[point.subject] = true
            if (point.date) {
                const d = Math.round(new Date(point.date).getTime()/1000)
                if (!isNaN(d)) times.push(d)
            }

            const f = (prop: string,
                       f1: (n1: number, n2: number)=>number,
                       f2: (n1: number, n2: number)=>number) => (boundsAcc[prop] = {
                lat: boundsAcc[prop] && boundsAcc[prop].lat ? f1(boundsAcc[prop].lat, la) : la,
                lng: boundsAcc[prop] && boundsAcc[prop].lng ? f2(boundsAcc[prop].lng, lo) : lo,
            })
            f('nw', Math.max, Math.min)
            f('sw', Math.min, Math.min)
            f('ne', Math.max, Math.max)
            f('se', Math.min, Math.max)
            return boundsAcc
        }, this.state.bounds)
        console.log('debug', times.sort(), Math.min(...times))
        this.setState({
            points,
            bounds,
            subjects: Object.keys(subjectsObject).sort(),
            unixSecondsMin: Math.min(...times),
            unixSecondsMax: Math.max(...times),
        })
    }

    map: any
    async downloadSaveData(): Promise<void> {
        const allData: Array<AlmedEvent> = await App.fetchJson(
            'GET',
            'http://localhost:8080',
            // 'https://almed-171122.appspot.com/',
        )
        console.log('items gotten from server', allData)
        localStorage.setItem('items', JSON.stringify(allData))
        this.setState({ points: allData })
    }

    renderMap(points: Array<AlmedEvent>) {
        const { bounds } = this.state
        const Map = ReactMapboxGl({
            accessToken: "pk.eyJ1IjoiaGluayIsImEiOiJ0emd1UlZNIn0.NpY-l_Elzhz9aOLoql6zZQ"
        });

        const styles = {
            clusterMarker: {
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: '#51D5A0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                border: '2px solid #56C498',
                pointerEvents: 'none'
            },
            marker: {
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: '#E0E0E0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '2px solid #C9C9C9',
                pointerEvents: 'none'
            }
        }
        const clusterMarker = (coordinates: Array<number>, pointCount: number) => <Marker
            key={`${pointCount}-${coordinates[0]}-${coordinates[1]}`}
            coordinates={coordinates}
            style={styles.clusterMarker}
        >
            <div>{pointCount}</div>
        </Marker>

        const markers = points
            .filter((e: AlmedEvent) => e.longitude && e.latitude)
            .map((point: AlmedEvent) => <Marker
            key={`id-${point.id}`}
            coordinates={[point.longitude, point.latitude]}
            style={styles.marker}
            onClick={() => console.log('click', point)}>
                {point.subject ? point.subject.charAt(0) : 'Ö'}
        </Marker>)
        console.log('debug', points.length, markers.length)
        return <Map
            ref={map => this.map = map}
            style={'mapbox://styles/mapbox/streets-v9'} // eslint-disable-line
            fitbounds={[[bounds.sw.lng, bounds.sw.lat],[bounds.ne.lng, bounds.ne.lat]]}
            center={[18.290711, 57.640484]}
            containerStyle={{
                height: "70vh",
                width: "100vw"
            }}>
            <Cluster ClusterMarkerFactory={clusterMarker}>
                {markers}
            </Cluster>
        </Map>
    }

    render() {
        const { subjects, choosenSubjectIndex, points,
            unixSecondsMax, unixSecondsMin,
            choosenUnixSecondsMax, choosenUnixSecondsMin,
        } = this.state
        const choosenSubject = choosenSubjectIndex && subjects ? subjects[choosenSubjectIndex] : null
        const filteredPoints = points
            .filter(point => (choosenSubject ? point.subject === choosenSubject : true)
                // && (choosenUnixSecondsMin && choosenUnixSecondsMax &&
                //     point.date && new Date(point.date).getTime()/1000  )
            )
        const format = 'dddd HH:mm'
        const minTime = unixSecondsMin && Date.now()/1000 > unixSecondsMin ? Date.now()/1000 : unixSecondsMin
        return (
            <div className="App">
                <AppBar
                    title="Title"
                    iconElementRight={<FlatButton label={'Download'} onClick={() => this.downloadSaveData()} />}
                />
                {subjects && <SelectField
                    floatingLabelText="Ämnen"
                    value={choosenSubjectIndex}
                    onChange={(event, newChoosenSubjectIndex) => this.setState({
                        choosenSubjectIndex: newChoosenSubjectIndex})
                    }
                >
                    {subjects.map((subject, index) => <MenuItem
                        key={subject}
                        value={index}
                        primaryText={subject}
                    />)}
                </SelectField>}
                <h4>Tid</h4>
                <p>Max tid</p>
                <Slider
                    style={{ margin: '1em' }}
                    min={minTime}
                    max={unixSecondsMax}
                    step={3600}
                    value={choosenUnixSecondsMin || unixSecondsMax}
                    onChange={(e, time) => this.setState({ choosenUnixSecondsMin: time })}
                />
                {choosenUnixSecondsMin && moment(choosenUnixSecondsMin * 1000).format(format)}
                <p>Min tid</p>
                <Slider
                    style={{ margin: '1em' }}
                    min={minTime}
                    max={unixSecondsMax}
                    step={3600}
                    value={choosenUnixSecondsMax || unixSecondsMax}
                    onChange={(e, time: number) => this.setState({ choosenUnixSecondsMax: time })}
                />
                {choosenUnixSecondsMax && moment(choosenUnixSecondsMax * 1000).format(format)}
                <p>
                    Visar: {filteredPoints.length}
                </p>
                {this.renderMap(filteredPoints)}
            </div>
        );
    }
}

export default App;
