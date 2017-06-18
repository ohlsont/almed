// @flow
import React, { Component } from 'react';
import { FlatButton, AppBar } from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin';
import GoogleMapReact from 'google-map-react';
import { fitBounds } from 'google-map-react/utils';
import himalaya from 'himalaya'
import './App.css';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

type AlmPoint = {
    LATITUDE: string,
    LONGITUDE: string,
    PLACE: string,
    PLACE_DESCRIPTION: string,
    id: string,
}

const applyChildren = (json: Object, arr: Array<number>) => arr
    .reduce((acc, item) => acc.children && acc.children[item] ? acc.children[item] : {}, json).content
class App extends Component {
    state = {
        points: [],
        bounds: { nw: { lat: 0, lng: 0 }, se: { lat: 0, lng: 0 } },
    }

    static async fetchJson(method: string, url: string, body: string) {
        const resp = await fetch(url, {
            mode: 'no-cors',
            method,
            headers: {
                'Content-Type': 'text/plain',
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

        return resp.json() || {}
    }
    static async getIds() {
        const url = 'https://almedalsguiden.com/main/search'
        const resp = await fetch(url, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*',
            },
            body: 'search=S%C3%B6k&' +
            'freetext=&' +
            'date_from=2017-07-02&' +
            'date_to=2017-07-09&' +
            'subject=&' +
            'event_form=&' +
            'eventType=&' +
            'organizer=&' +
            'orgtype=&' +
            'place=&' +
            'language=&' +
            'status=&' +
            'accessibility=',
        })

        switch (resp.status) {
            case 204:
                return {}
            case 401:
                throw new Error('bad permissions, 401 response code')
            default:
                break
        }
        const res = await resp.text()
        const json = himalaya.parse(res)
        const elements = json[2].children[3].children[5].children[5].children[1].children[3].children
        return elements.map(elem => elem.attributes ? elem.attributes.href : null).filter(e => e)
    }

    static async getItem(href) {
        const resp = await fetch(`https://almedalsguiden.com/${href}`)
        const res = await resp.text()
        const json = himalaya.parse(res)
        const itemContent = json[2].children[3].children[5].children[5].children[3]

        const p = itemContent.children[9].children
        // $FlowFixMe
        const a2 = Array.apply(null, {length: p.length}) // eslint-disable-line
        // $FlowFixMe
            .map(Number.call, Number).filter(no => no % 2 !== 0) // eslint-disable-line
        const participants = a2.map(no => p[no].content)
        return {
            title: applyChildren(itemContent, [1,0]),
            organiser: applyChildren(itemContent, [3,1,1]),
            date: applyChildren(itemContent, [3,3,1]),
            type: applyChildren(itemContent, [5,1,1]),
            subject: applyChildren(itemContent, [5,3,1]),
            language: applyChildren(itemContent, [5,5,1]),
            location: applyChildren(itemContent, [5,7,1]),
            locationDescription: applyChildren(itemContent, [5,9,1]),
            description: applyChildren(itemContent, [7,0]),
            participants,
            green: applyChildren(itemContent, [11,1,1]),
            availabilty: applyChildren(itemContent, [11,3,1]),
            live: applyChildren(itemContent, [11,5,1]),
            food: applyChildren(itemContent, [11,7,1]),
            web: applyChildren(itemContent, [13,1,0,0]),
            // contact: applyChildren(itemContent, [15,1,1,0,0]),
            // contactOrg: applyChildren(itemContent, [15,1,1]),
            // contactNumber: applyChildren(itemContent, [6,1,1]),
        }
    }

    static async getAll(): Promise<any> {
        return App.fetchJson(
            'POST',
            'https://almedalsguiden.com/api?version=js',
            'search_place=a',
        )
    }

    componentWillMount() {
        const items = localStorage.getItem('items')
        if (!items || items === 'undefined') return
        const points = JSON.parse(items)
        const bounds = points.reduce((boundsAcc, point: AlmPoint) => {
            const la = parseFloat(point.LATITUDE)
            const lo = parseFloat(point.LONGITUDE)
            boundsAcc['nw'] = {
                lat: boundsAcc['nw'].lat ? Math.max(boundsAcc['nw'].lat, la) : la,
                lng: boundsAcc['nw'].lng ? Math.min(boundsAcc['nw'].lng, lo) : lo,
            }
            boundsAcc['se'] = {
                lat: boundsAcc['se'].lat ? Math.min(boundsAcc['se'].lat, la) : la,
                lng: boundsAcc['se'].lng ? Math.max(boundsAcc['se'].lng, lo) : lo,
            }
            return boundsAcc
        }, { nw: {}, se: {}})
        this.setState({ points, bounds })
    }

    async downloadSaveData(): Promise<void> {
        // const almData: { result: Array<AlmPoint> } = await App.getAll()
        // localStorage.setItem('items', JSON.stringify(almData.result))
        // this.setState({ points: almData.result })
        const ids = await App.getIds()
        const allData = await Promise.all(ids.slice(0, 10).map(id => App.getItem(id)))
        console.log('allData', allData)
    }

    render() {
        const AnyReactComponent = ({ text }) => <div>{text}</div>;
        const { points, bounds } = this.state
        const { center, zoom } = fitBounds(bounds, { height: 640, width: 320 });
        console.log('using', points, bounds, center, zoom)
        // const center = points.length ? { lat: points[0].LATITUDE, lng: points[0].LONGITUDE } : { lat: 0, lng: 0 }
        return (
            <div className="App">
                <AppBar
                    title="Title"
                    iconElementRight={<FlatButton label={'Download'} onClick={() => this.downloadSaveData()} />}
                />
                <div style={{ height: '90vh' }}>
                    {false && !!points.length && <GoogleMapReact
                        defaultCenter={center}
                        defaultZoom={zoom}
                    >
                        {Array.isArray(points) && points.map((point: AlmPoint) => <AnyReactComponent
                            key={point.id}
                            lat={point.LATITUDE}
                            lng={point.LONGITUDE}
                            text={point.PLACE}
                        />)}
                    </GoogleMapReact>}
                </div>
            </div>
        );
    }
}

export default App;
