// @flow
import React, { Component } from 'react';
import {
    FlatButton, AppBar, SelectField, MenuItem, Toggle,
    Slider, AutoComplete, TimePicker,
} from 'material-ui';
import injectTapEventPlugin from 'react-tap-event-plugin'
import moment from 'moment'

import { EventsModal, ParticipantModal, CalendarModal, AlmedDrawer, Map, GDriveSave } from './components'
import { Events, Favorites } from './services'
import EventsTable from "./components/eventsTable"

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

type Appstate = {
    points: Array<AlmedEvent>,
    filteredPoints: Array<AlmedEvent>,
    participantsMap: {[key: string]: [AlmedParticipant, number]},
    choosenPoint?: ?AlmedEvent,

    nonColliding?: boolean,
    inFuture: boolean,
    choosenParticipant?: AlmedParticipant,
    subjectsObject?: {[key: string]: number},
    choosenSubjectIndex?: ?number,
    choosenDay?: ?string,
    choosenDayEnd?: ?string,

    unixSecondsMax?: number,
    unixSecondsMin?: number,
    choosenUnixSecondsMax?: number,
    choosenUnixSecondsMin?: number,

    food?: boolean,
}

function saveToDisk(text: string, name: string = 'favorites.txt', type: string = 'text/plain') {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

class App extends Component {
    state: Appstate = {
        points: [],
        filteredPoints: [],
        participantsMap: {},
        inFuture: true,
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
        let d = {}
        if (times.length) {
            d = {
                unixSecondsMin: Math.min(...times),
                unixSecondsMax: Math.max(...times),
            }
        }


        this.setState({
            points,
            filteredPoints,
            participantsMap,
            subjectsObject,
            ...d,
            choosenUnixSecondsMin: d.unixSecondsMin ? d.unixSecondsMin : 0,
            choosenUnixSecondsMax: d.unixSecondsMax ? d.unixSecondsMax : Infinity,
        })
    }

    map: any
    async downloadSaveData(): Promise<void> {
        const allData = await Events.saveData()
        this.setState({ points: allData })
    }

    filterPoints() {
        const { points, choosenSubjectIndex, subjectsObject, choosenDay, choosenDayEnd, nonColliding, inFuture,
            choosenUnixSecondsMin, choosenUnixSecondsMax, food } = this.state
        const subjects = Object.keys(subjectsObject || {}).sort()
        const choosenSubject = choosenSubjectIndex !== null && subjects ? subjects[choosenSubjectIndex] : null

        const favs = Favorites.all()
        const res = points.filter((point: AlmedEvent) => {
            let keep = choosenSubject ? point.subject === choosenSubject : true
            if (point.date) {
                const time = new Date(point.date).getTime()/1000
                if (choosenUnixSecondsMin) {
                    keep = keep && choosenUnixSecondsMin < time
                }
                if (choosenUnixSecondsMax) {
                    keep = keep && choosenUnixSecondsMax > time
                }
            }

            if (food) {
                keep = keep && point.food
            }

            if (nonColliding) {
                keep = keep && !favs.some((fav: AlmedEvent) => {
                    if (!fav.date || !fav.endDate || !point.date || !point.endDate) {
                        return false
                    }
                    const start1 = (new Date(fav.date)).getTime()
                    const end1 = (new Date(fav.endDate || '')).getTime()
                    const start2 = (new Date(point.date || '')).getTime()
                    const end2 = (new Date(point.endDate  || '')).getTime()
                    return Math.max(start1, start2) < Math.min(end1, end2)
                })
            }

            if (inFuture) {
                keep = keep && moment(point.endDate).isAfter(moment())
            }

            const d = moment(point.date)
            if (choosenDay) {
                keep = keep && d.isAfter(choosenDay)
            }

            if (choosenDayEnd) {
                keep = keep && d.isBefore(choosenDayEnd)
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
        const { points, choosenDay, choosenDayEnd } = this.state
        const format = 'YYYY-MM-DDTHH:mm:ss'
        const days = (points || [])
            .reduce((acc, point) => {
                if (point.date && !acc[moment(point.date, format).startOf('day').format()]) {
                    acc[moment(point.date, format).startOf('day').format()] = true
                }
                return acc
            }, {})
        const dayKeys = Object.keys(days)
        // const labelColor = {
        //     // color:'white',
        //     // WebkitTextFillColor: 'white',
        //     // WebkitTapHighlightColor: 'white',
        // }
        return <div style={{ display: 'flex' }}>
            {!!dayKeys.length && <SelectField
                key={'date'}
                floatingLabelText="Day"
                value={choosenDay}
                onChange={(e, index, value) => {
                    let state = {
                        choosenDay: null,
                        choosenDayEnd: null,
                    }
                    if (value) {
                        state.choosenDay = value
                        state.choosenDayEnd = moment(value).endOf('day').format()
                    }
                    console.log('did set date', state)
                    this.setState(state, () => this.setup())

                }}
            >
                <MenuItem key={'alla'} value={null} primaryText={'All days'} />
                {dayKeys.map((key) => <MenuItem key={key} value={key} primaryText={moment(key).format('dddd DD/MM')} />)}
            </SelectField>}
            <div>
            {!!choosenDay &&
                <TimePicker
                    key={'startDate'}
                    format="24hr"
                    value={new Date(choosenDay)}
                    onChange={(e, value) => this.setState({ choosenDay: moment(value).format() }, () => this.setup())}
                />}
            {!!choosenDayEnd && <TimePicker
                key={'endDate'}
                format="24hr"
                value={new Date(choosenDayEnd)}
                onChange={(e, value) => this.setState({ choosenDayEnd: moment(value).format() }, () => this.setup())}
            />}
            </div>
        </div>
    }

    renderAppBar(filteredPoints: Array<AlmedEvent>) {
        const { participantsMap, points } = this.state

        const content = <div>
            <div>Seminars showing {points.length}</div>
            <div>Seminars in store {filteredPoints.length}</div>
            {this.renderDaySelector()}
            <Toggle
                style={{ width: 20 }}
                label="Non colliding"
                onToggle={(e, value) => this.setState({ nonColliding: value }, () => this.setup())}
            />
            <Toggle
                style={{ width: 20 }}
                defaultToggled={true}
                label="In the future"
                onToggle={(e, value) => this.setState({ inFuture: value }, () => this.setup())}
            />
            <GDriveSave />
            <ParticipantModal participantsMap={participantsMap}/>
            <EventsModal events={filteredPoints}/>
            <CalendarModal events={filteredPoints}/>
            <FlatButton
                label={'Download'}
                onClick={() => this.downloadSaveData()}
            />
            <FlatButton
                label={'Update backend'}
                onClick={() => Events.updateData()}
            />
            <FlatButton
                label={'Export'}
                onClick={() => saveToDisk(JSON.stringify(Favorites.all()))}
            />

        </div>
        return <AppBar
            title={'Almedalen'}
            iconElementLeft={<AlmedDrawer content={content} />}
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
