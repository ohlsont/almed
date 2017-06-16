import React, { Component } from 'react';
import { FlatButton } from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MapGL from 'react-map-gl';

import logo from './logo.svg';
import './App.css';



// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

class App extends Component {
    static async getAll() {
        const resp = await fetch('https://almedalsguiden.com/api?version=js', {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*',
            },
            body: 'search_place=a',
        })

        switch (resp.status) {
        case 204:
            return {}
        case 401:
            return new Error('bad permissions, 401 response code')
        default:
            break
        }

        if (!resp.ok) {
            console.log('response is not ok ', resp)
            throw new Error(`bad response from server ${resp.status}`)
        }

        return resp.json() || {}
    }

    async downloadSaveData() {
        const almData = await App.getAll()
        // const a = {
        //     LATITUDE: "57.638872",
        //     LONGITUDE:"18.290607",
        //     PLACE:"Donners plats, H407",
        //     PLACE_DESCRIPTION:"",
        //     id:"7107",
        // }
        console.log('debug', almData)
        localStorage.setItem('state', 'off');
    }

    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h2>Welcome to React</h2>
                </div>
                <p className="App-intro">
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
                <FlatButton label={'Download'} onClick={() => this.downloadSaveData()} />
                <MapGL
                    width={400}
                    height={400}
                    latitude={37.7577}
                    longitude={-122.4376}
                    zoom={8}
                    onChangeViewport={viewport => {
                        const {latitude, longitude, zoom} = viewport;
                        // Optionally call `setState` and use the state to update the map.
                    }}
                />
            </div>
        );
    }
}

export default App;
