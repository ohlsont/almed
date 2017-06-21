// @flow
import React, { Component } from 'react';
import { FlatButton, AppBar } from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin';
import GoogleMapReact from 'google-map-react';
import { fitBounds } from 'google-map-react/utils';
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

type Coord = {
    lat: number,
    lng: number,
}

class App extends Component {
    state: {
        points: Array<AlmedEvent>,
        bounds: { nw: Coord, se: Coord }
    } = {
        points: [],
        bounds: {
            nw: { lat: 0, lng: 0 },
            se: { lat: 0, lng: 0 }
        },
    }

    static async fetchJson(method: string, url: string, body?: string): Promise<any> {
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

        return resp.json()
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
        const allData: Array<AlmedEvent> = await App.fetchJson('GET', 'https://almed-171122.appspot.com/')
        console.log('items gotten from server', allData)
        localStorage.setItem('items', JSON.stringify(allData))
        this.setState({ points: allData })
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
                        {Array.isArray(points) && points.map((point: AlmedEvent) => <AnyReactComponent
                            key={point.id}
                            lat={point.latitude}
                            lng={point.longitude}
                            text={point.location}
                        />)}
                    </GoogleMapReact>}
                </div>
            </div>
        );
    }
}

export default App;
