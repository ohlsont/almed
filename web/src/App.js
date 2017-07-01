// @flow
import React, { Component } from 'react';
import {
    FlatButton, AppBar, SelectField, MenuItem,
    Slider, AutoComplete, Toggle
} from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin'
import moment from 'moment'

import { EventsModal, ParticipantModal, CalendarModal, AlmedDrawer, Map } from './components'
import { Events, Favorites } from './services'
import EventsTable from "./components/eventsTable";

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

type Appstate = {
    points: Array<AlmedEvent>,
    filteredPoints: Array<AlmedEvent>,
    participantsMap: {[key: string]: [AlmedParticipant, number]},
    choosenPoint?: ?AlmedEvent,

    choosenParticipant?: AlmedParticipant,
    subjectsObject?: {[key: string]: number},
    choosenSubjectIndex?: ?number,
    choosenDay?: ?string,

    unixSecondsMax?: number,
    unixSecondsMin?: number,
    choosenUnixSecondsMax?: number,
    choosenUnixSecondsMin?: number,

    food?: boolean,
}

class App extends Component {
    state: Appstate = {
        choosenDay: null,
        points: [],
        filteredPoints: [],
        participantsMap: {},
    }

    componentWillMount() {
        this.setState({ points: Events.getPersistentEvents() }, () => this.setup())
    }

    setup() {
        const { points } = this.state
        const filteredPoints = this.filterPoints()
        const subjectsObject = {}
        const times = []
        const participantsMap: {[key: string]: [AlmedParticipant, number]} = {}
        filteredPoints.forEach((point) => {
            if (point.subject && point.subject.length) {
                point.subject.forEach(sub => {
                    subjectsObject[sub] = subjectsObject[sub] ? subjectsObject[sub] + 1 : 1
                })
            }
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
        })

        console.log('participantsMap', participantsMap)
        const d = {
            unixSecondsMin: Math.min(...times),
            unixSecondsMax: Math.max(...times),
        }

        this.setState({
            points,
            filteredPoints,
            participantsMap,
            subjectsObject,
            ...d,
            choosenUnixSecondsMin: d.unixSecondsMin,
            choosenUnixSecondsMax: d.unixSecondsMax,
        })
    }

    map: any
    async downloadSaveData(): Promise<void> {
        const allData = await Events.saveData()
        this.setState({ points: allData })
    }

    filterPoints() {
        const { points, choosenSubjectIndex, subjectsObject, choosenDay,
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

            if (choosenDay) {
                keep = keep && moment(point.date).isSame(choosenDay, 'day')
            }

            return keep
        })
        // console.log('choosenSubjectIndex', choosenSubjectIndex, res, choosenSubject)

        return res
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

    renderDaySelector() {
        const { points, choosenDay } = this.state
        const format = 'YYYY-MM-DDTHH:mm:ss'
        const days = (points || [])
            .reduce((acc, point) => {
                if (point.date && !acc[moment(point.date, format).startOf('day').format()]) {
                    acc[moment(point.date, format).startOf('day').format()] = true
                }
                return acc
            }, {})
        const dayKeys = Object.keys(days)
        return !!dayKeys.length && <SelectField
            floatingLabelText="Day"
            value={choosenDay}
            onChange={(e, index, value) => {
                this.setState({ choosenDay: value }, () => this.setup())
            }}
            floatingLabelStyle={{color:'white'}}
            labelStyle={{
                color:'white',
                WebkitTextFillColor: 'white',
                WebkitTapHighlightColor: 'white',
            }}
        >
            <MenuItem key={'alla'} value={null} primaryText={'All days'} />
            {dayKeys.map((key) => <MenuItem key={key} value={key} primaryText={moment(key).format('dddd DD/MM')} />)}
        </SelectField>
    }

    renderAppBar(filteredPoints: Array<AlmedEvent>) {
        const { participantsMap, points } = this.state
        const buttonStyle = { color: 'white' }

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
        return <AppBar
            title={'Almedalen'}
            iconElementLeft={<AlmedDrawer content={content} />}
            iconElementRight={
                <div
                    style={{ display: 'flex' }}
                >
                    <div style={{ color: 'white' }}>{filteredPoints.length}</div>
                    {this.renderDaySelector()}
                    <ParticipantModal participantsMap={participantsMap} buttonStyle={buttonStyle}/>
                    <EventsModal events={filteredPoints} buttonStyle={buttonStyle} />
                    <CalendarModal events={filteredPoints} buttonStyle={buttonStyle} />
                    <FlatButton
                        label={'Download'}
                        onClick={() => this.downloadSaveData()}
                        labelStyle={buttonStyle}
                    />
                </div>
            }
        />
    }

    render() {
        const { points, filteredPoints } = this.state
        return <div className="App">
            {this.renderAppBar(filteredPoints)}
            <div style={{ display: 'flex' }}>
                <div style={{ width: '75%' }}>
                    <EventsTable
                        events={points}
                        onlyFavs={true}
                        defaultSort="time"
                    />
                </div>
                <div style={{ width: '25%' }}>
                    <Map points={Favorites.all()} />
                </div>
            </div>
        </div>
    }
}

export default App;
