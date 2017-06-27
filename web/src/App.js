// @flow
import React, { Component } from 'react';
import {
    FlatButton, AppBar, SelectField, MenuItem, Slider, AutoComplete, Toggle
} from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin'
import ReactMapboxGl, { Cluster, Marker, Popup } from 'react-mapbox-gl'
import moment from 'moment'

import ParticipantModal from './participantModal'
import EventsModal from './eventsModal'
import AlmedDrawer from './drawer'
import ItemDrawer from './itemDrawer'
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
    participantsMap: {[key: string]: [AlmedParticipant, number]},
    choosenPoint?: AlmedEvent,

    choosenParticipant?: AlmedParticipant,
    subjectsObject?: {[key: string]: number},
    choosenSubjectIndex?: ?number,

    unixSecondsMax?: number,
    unixSecondsMin?: number,
    choosenUnixSecondsMax?: number,
    choosenUnixSecondsMin?: number,

    food?: boolean,

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
        participantsMap: {},
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
        const participantsMap: {[key: string]: AlmedParticipant} = {}
        const bounds = points.reduce((boundsAcc, point: AlmedEvent) => {
            const la = parseFloat(point.latitude)
            const lo = parseFloat(point.longitude)
            if (point.subject) subjectsObject[point.subject] = subjectsObject[point.subject] ? subjectsObject[point.subject] + 1 : 1
            if (point.participants && point.participants.length) {
                point.participants.forEach(part => {
                    const p: ?[AlmedParticipant, number] = participantsMap[part.name]
                    if (p) {
                        participantsMap[part.name] = [part, (p[1] || 0) + 1]
                    } else {
                        participantsMap[part.name] = [part, 1]
                    }
                })

            }
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
        console.log('participantsMap', participantsMap)
        const d = {
            unixSecondsMin: Math.min(...times),
            unixSecondsMax: Math.max(...times),
        }
        this.setState({
            points,
            participantsMap,
            bounds,
            subjectsObject,
            ...d,
            choosenUnixSecondsMin: d.unixSecondsMin,
            choosenUnixSecondsMax: d.unixSecondsMax,
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

    filterPoints() {
        const { points, choosenSubjectIndex, subjectsObject,
            choosenUnixSecondsMin, choosenUnixSecondsMax, food } = this.state
        const subjects = Object.keys(subjectsObject || {}).sort()
        const choosenSubject = choosenSubjectIndex != null && subjects ? subjects[choosenSubjectIndex] : null
        const res = points.filter(point => {
            let keep = choosenSubject ? point.subject === choosenSubject : true
            if (point.date) {
                const time = new Date(point.date).getTime()/1000
                if (choosenUnixSecondsMin) keep = keep && choosenUnixSecondsMin < time
                if (choosenUnixSecondsMax) keep = keep && choosenUnixSecondsMax > time
            }

            if (food) {
                keep = keep && point.food
            }
            return keep
        })
        // console.log('choosenSubjectIndex', choosenSubjectIndex, res, choosenSubject)
        return res
    }


    renderMap(points: Array<AlmedEvent>) {
        const { bounds, choosenPoint } = this.state
        const Map = ReactMapboxGl({
            accessToken: "pk.eyJ1IjoiaGluayIsImEiOiJ0emd1UlZNIn0.NpY-l_Elzhz9aOLoql6zZQ"
        });

        const markerSize = 40
        const styles = {
            clusterMarker: {
                width: markerSize,
                height: markerSize,
                borderRadius: '50%',
                backgroundColor: '#51D5A0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                border: '2px solid #56C498',
            },
            marker: {
                width: markerSize,
                height: markerSize,
                borderRadius: '50%',
                backgroundColor: '#E0E0E0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '2px solid #C9C9C9',
            }
        }
        const clusterMarker = (coordinates: Array<number>, pointCount: number) => <Marker
            key={`${pointCount}-${coordinates[0]}-${coordinates[1]}`}
            coordinates={coordinates}
            style={styles.clusterMarker}
            onClick={(event, item, c) => {
                console.log('cluster', event, item, c)
            }}
        >
            <div>{pointCount}</div>
        </Marker>

        const markers = points
            .filter((e: AlmedEvent) => e.longitude && e.latitude)
            .map((point: AlmedEvent) => <Marker
                key={`id-${point.id}`}
                coordinates={[point.longitude, point.latitude]}
                style={styles.marker}
                onClick={(event, item, c) => {
                    console.log('marker click', point)
                    this.setState({
                        choosenPoint: point,
                    })
                }}
            >
                {point.subject ? point.subject.charAt(0) : 'Ö'}
        </Marker>)
        return <div>
            <ItemDrawer item={choosenPoint}/>
            <Map
                style={'mapbox://styles/mapbox/streets-v9'} // eslint-disable-line
                fitbounds={[[bounds.sw.lng, bounds.sw.lat],[bounds.ne.lng, bounds.ne.lat]]}
                center={[18.290711, 57.640484]}
                onClick={() => this.setState({ choosenPoint: null })}
                containerStyle={{
                    height: "93vh",
                    width: "100vw"
                }}
            >
                <Cluster ClusterMarkerFactory={clusterMarker}>
                    {markers}
                </Cluster>
                {/*{choosenPoint && <Popup*/}
                    {/*coordinates={[choosenPoint.longitude, choosenPoint.latitude]}*/}
                    {/*offset={{*/}
                        {/*'bottom-left': [12, -38],  'bottom': [0, -38], 'bottom-right': [-12, -38]*/}
                    {/*}}>*/}
                    {/*<h4>{choosenPoint.title}</h4>*/}
                    {/*<p>{choosenPoint.subject}</p>*/}
                    {/*<p>{choosenPoint.type}</p>*/}
                {/*</Popup>}*/}
            </Map>
        </div>
    }

    renderSubjectSelect() {
        const { subjectsObject, choosenSubjectIndex, points } = this.state
        const subjects = Object.keys(subjectsObject || {}).sort()
        return subjects && <SelectField
            floatingLabelText="Ämnen"
            value={choosenSubjectIndex}
            onChange={(event, newChoosenSubjectIndex, value) => {
                console.log('newChoosenSubjectIndex', value)
                return this.setState({
                    choosenSubjectIndex: value,
                })
            }}
        >
            <MenuItem
                primaryText={`Alla - ${points.length}`}
                value={null}
            />
            {subjects.map((subject, index) => <MenuItem
                key={subject}
                value={index}
                primaryText={`${subject} - ${subjectsObject ? subjectsObject[subject] : ''}`}
            />)}
        </SelectField>
    }

    renderParticipants() {
        const { participantsMap } = this.state
        const participants = Object.keys(participantsMap).sort().map(key => participantsMap[key][0])
        const getP = (part) => `${part.name} - ${participantsMap ? participantsMap[part.name][1] : ''}`
        return <div
            style={{ display: 'flex' }}
        >
            <ParticipantModal participantsMap={participantsMap} />
            <AutoComplete
                hintText="Deltagare"
                dataSource={participants.map(getP)}
                onUpdateInput={(e, a, b)=> console.log('debug',e, a, b)}
                filter={(searchText: string, key) => searchText.length > 2 && searchText.toLowerCase() !== '' && key.toLowerCase().indexOf(searchText) !== -1}
            />
        </div>
    }

    renderTimeSelectors() {
        const { unixSecondsMax, unixSecondsMin,
            choosenUnixSecondsMax, choosenUnixSecondsMin,
        } = this.state
        const format = 'HH:mm dddd DD/MM'
        const minTime = unixSecondsMin && Date.now()/1000 > unixSecondsMin ? Date.now()/1000 : unixSecondsMin
        return <div>
            <h4>Tid</h4>
            <p>Min tid</p>
            <Slider
                style={{ margin: '1em' }}
                min={minTime}
                max={unixSecondsMax}
                step={3600}
                value={choosenUnixSecondsMin || unixSecondsMin}
                onChange={(e, time) => this.setState({ choosenUnixSecondsMin: time })}
            />
            {choosenUnixSecondsMin && moment(choosenUnixSecondsMin * 1000).format(format)}
            <p>Max tid</p>
            <Slider
                style={{ margin: '1em' }}
                min={minTime}
                max={unixSecondsMax}
                step={3600}
                value={choosenUnixSecondsMax || unixSecondsMax}
                onChange={(e, time: number) => this.setState({ choosenUnixSecondsMax: time })}
            />
            {choosenUnixSecondsMax && moment(choosenUnixSecondsMax * 1000).format(format)}
        </div>
    }

    render() {
        const { participantsMap } = this.state
        const buttonStyle = { color: 'white' }
        const filteredPoints = this.filterPoints()
        const content = <div>
            <Toggle
                style={{ width: '3em' }}
                label="Mat"
                onToggle={(e, res: boolean) => this.setState({
                    food: res,
                })}
            />
            {this.renderSubjectSelect()}
            {this.renderTimeSelectors()}
            {this.renderParticipants()}
            <p>
                Visar: {filteredPoints.length}
            </p>
        </div>

        return (
            <div className="App">
                <AppBar
                    title={'Almedalen'}
                    iconElementLeft={<AlmedDrawer content={content} />}
                    iconElementRight={
                        <div
                            style={{ display: 'flex' }}
                        >
                            <ParticipantModal participantsMap={participantsMap} buttonStyle={buttonStyle}/>
                            <EventsModal events={filteredPoints} buttonStyle={buttonStyle}/>
                            <FlatButton label={'Download'} onClick={() => this.downloadSaveData()} labelStyle={buttonStyle} />
                        </div>
                    }
                />
                {this.renderMap(filteredPoints)}
            </div>
        );
    }
}

export default App;
