// @flow
import React from 'react'
import ReactMapboxGl, { Cluster, Marker } from 'react-mapbox-gl'

import { ItemDrawer  } from './'

type Coord = {
    lat: number,
    lng: number,
}


class Map extends React.Component {
    state: {
        choosenPoint?: ?AlmedEvent,
        bounds: {
            nw: Coord,
            se: Coord,
            sw: Coord,
            ne: Coord,
        }
    } = {
        bounds: {
            nw: { lat: 0, lng: 0 },
            se: { lat: 0, lng: 0 },
            sw: { lat: 0, lng: 0 },
            ne: { lat: 0, lng: 0 },
        },
    }

    componentWillMount() {
        const { points } = this.props
        const bounds = points.reduce((boundsAcc, point: AlmedEvent) => {
            const la = parseFloat(point.latitude)
            const lo = parseFloat(point.longitude)
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

        this.setState({ bounds })
    }

    props: {
        points: Array<AlmedEvent>,
    }

    render() {
        const { points } = this.props
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
                cursor: 'pointer',
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
                {point.subject && point.subject.length ? point.subject[0].charAt(0) : 'Ö'}
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
                    width: "25vw"
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
}

export default Map