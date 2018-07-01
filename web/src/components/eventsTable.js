// @flow
import React from 'react'
import {
    IconButton, FlatButton,
    Table, TableRow, TableHeader, TableHeaderColumn, TableRowColumn, TableBody,
} from 'material-ui'
import Star from 'material-ui/svg-icons/toggle/star'
import Check from 'material-ui/svg-icons/navigation/check'
import moment from 'moment'

import { EventModal } from './'
import { Favorites } from '../services'
import { isMobile } from '../constants'

type SortTypes = 'time' | 'name' | 'org' | 'title'

export default class EventsTable extends React.Component {
    state: {
        choosenEvent?: ?AlmedEvent,
        sort: SortTypes,
        asc: boolean,
        favs: Array<AlmedEvent>,
        limit: number,
    } = {
        sort: 'time',
        asc: true,
        limit: 100,
        favs: Favorites.all(),
    }

    componentWillMount() {
        const { defaultSort } = this.props
        if (!defaultSort) return
        this.setState({ sort: defaultSort })
    }

    handleToggle(event: AlmedEvent) {
        const { favs } = this.state
        const exists = favs.some((fav) => fav.id === event.id)
        if (exists) {
            Favorites.delete(event)
        } else {
            Favorites.save(event)
        }
        this.setState({ favs: Favorites.all() })
    }

    props: {
        events: Array<AlmedEvent>,
        onlyFavs: boolean,
        defaultSort?: SortTypes,
        onLimitChange?: (newLimit: number)=>void,
    }

    render() {
        const { events, onlyFavs, onLimitChange } = this.props
        const { sort, asc, choosenEvent, favs, limit } = this.state

        let sortedEvents = events
        // .slice(0, 30)
            .sort(((e1: AlmedEvent, e2: AlmedEvent) => {
                const sortF = (b) => asc ? (b ? -1 : 1) : (b ? 1 : -1)
                switch(sort) {
                    case 'time':
                        if (!e1.date || !e2.date) {
                            console.log('missing date', e2.url, e1.url)
                            return -1
                        }
                        const a = new Date(e1.date).getTime()
                        const b = new Date(e2.date || '').getTime()
                        if (a === b) {
                            return sortF(e1.id < e2.id)
                        }
                        return sortF(a < b)
                    case 'org':
                        return sortF(e1.organiser < e2.organiser)
                    case 'name':
                    default:
                        return sortF(e1.title < e2.title)
                }
            }))

        if (onlyFavs) {
            sortedEvents = sortedEvents
                .filter((event: AlmedEvent) => favs
                    .some((fav: AlmedEvent) => fav.id === event.id))
        }

        const favMap = favs.reduce((arr, fav) => {
            arr[fav.id] = fav
            return arr
        }, {})

        const smallRowWidth = 20
        const timeFormat = 'HH:mm dddd DD/MM'

        return <div>
            <EventModal
                item={choosenEvent}
                onClose={() => this.setState({ choosenEvent: null })}
            />
            <Table
                fixedHeader={true}
            >
                <TableHeader
                    adjustForCheckbox={false}
                    displaySelectAll={false}
                >
                    <TableRow
                        onCellClick={(event, a, b) => {
                            console.log('sorting with params', b, asc, sort)
                            const s = (): SortTypes => {
                                switch (b) {
                                    case 2:
                                        return 'time'
                                    case 3:
                                        return 'org'
                                    default:
                                        return 'title'
                                }
                            }
                            this.setState({
                                sort: s(),
                                asc: s() === sort ? !asc : asc,
                            })
                        }}
                    >
                        {!isMobile && <TableHeaderColumn
                            style={{ width: 20 }}
                        >Favorite</TableHeaderColumn>}
                        <TableHeaderColumn>Title</TableHeaderColumn>
                        <TableHeaderColumn>Time</TableHeaderColumn>
                        <TableHeaderColumn>Organiser</TableHeaderColumn>
                        <TableHeaderColumn>Participants</TableHeaderColumn>
                        <TableHeaderColumn>Subjects</TableHeaderColumn>
                        <TableHeaderColumn
                            style={{ width: 20 }}
                        >Food</TableHeaderColumn>
                    </TableRow>
                </TableHeader>
                <TableBody
                    displayRowCheckbox={false}
                >
                    {sortedEvents.slice(0, limit).map((event: AlmedEvent) => {
                        return <TableRow
                            key={`${event.id}`}
                            style={{ background: (moment().isAfter(moment(event.date))) ? 'lightgrey' : 'white' }}
                            onMouseUp={() => {
                                this.setState({
                                    choosenEvent: event,
                                })
                            }}
                        >
                            {!isMobile && <TableRowColumn
                                style={{ width: smallRowWidth }}
                            >
                                <IconButton
                                    onTouchTap={(e) => {
                                        e.preventDefault()
                                        this.handleToggle(event)
                                    }}
                                    iconStyle={{ color: favMap[event.id] ? '#eed383' : '#CCC' }}
                                >
                                    <Star />
                                </IconButton>
                            </TableRowColumn>}
                            <TableRowColumn>
                                {event.title}
                            </TableRowColumn>
                            <TableRowColumn>{moment(event.date).format(timeFormat)}</TableRowColumn>
                            <TableRowColumn>{event.organiser}</TableRowColumn>
                            <TableRowColumn>{(event.participants || []).reduce((acc, part) => acc + `${part.name}, ${part.title}, ${part.company} \n`, '')}</TableRowColumn>
                            <TableRowColumn>{(event.subject || []).reduce((acc, part) => acc + `, ${part}`)}</TableRowColumn>
                            <TableRowColumn
                                style={{ width: smallRowWidth }}
                            >
                                {event.food && <Check />}
                            </TableRowColumn>
                        </TableRow>
                    })}
                </TableBody>
            </Table>
            {sortedEvents.length > limit && <FlatButton
                label="Load 100 more.."
                onClick={() => {
                    const newLimit = limit + 100
                    if (onLimitChange) onLimitChange(newLimit)
                    this.setState({ limit: newLimit })
                }}
            />}
        </div>
    }
}