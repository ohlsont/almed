// @flow
import React from 'react'
import {
    Dialog, FlatButton, TextField, Toggle, IconButton,
    Table, TableRow, TableHeader, TableHeaderColumn, TableRowColumn, TableBody,
} from 'material-ui'
import Star from 'material-ui/svg-icons/toggle/star'
import Check from 'material-ui/svg-icons/navigation/check'
import moment from 'moment'

import { Favorites } from '../services'
import { EventItem } from './'

const customContentStyle = {
    width: '98%',
    maxWidth: 'none',
}
const timeFormat = 'HH:mm dddd DD/MM'

class EventModal extends React.Component {
    state = { open: false }
    props: {
        item?: ?AlmedEvent,
        onClose: ()=>void,
    }

    render() {
        const { item, onClose } = this.props
        console.log('showing event', item)
        return <Dialog
            title={(item || {}).title}
            modal={false}
            open={!!item}
            autoScrollBodyContent={true}
            onRequestClose={() => onClose()}
        >
            <EventItem item={item} />
        </Dialog>
    }
}

export default class EventsModal extends React.Component {
    state = {
        open: false,
        choosenEvent: null,
        sort: 'name',
        titleFilterText: '',
        participantFilterText: '',
        foodFilter: false,
        onlyFavs: false,
        orgFilterText: '',
        asc: true,
        favs: Favorites.all(),
    }

    handleOpen = () => {
        this.setState({open: true})
    }

    handleClose = () => {
        const { withOutButton, onCloseCallback } = this.props
        if (!withOutButton) {
            this.setState({open: false})
        }

        if (onCloseCallback) onCloseCallback()
    }

    props: {
        events: Array<AlmedEvent>,
        choosenEvent?: AlmedEvent,
        buttonStyle?: Object,
        withOutButton?: boolean,
        onCloseCallback?: () => void
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

    render() {
        const { events, buttonStyle, withOutButton } = this.props
        const { sort, asc, open, choosenEvent, titleFilterText,
            orgFilterText, foodFilter, onlyFavs, favs } = this.state
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
        ]
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
                    return sortF(a < b)
                case 'org':
                    return sortF(e1.organiser < e2.organiser)
                case 'name':
                default:
                    return sortF(e1.title < e2.title)
            }
        }))
        const filter = (prop: string, filterText: string) => {
            if (!filterText) {
                return
            }
            sortedEvents = sortedEvents.filter((event: AlmedEvent) => {
                if (!event[prop]) {
                    return false
                }
                return filterText.toLowerCase() !== '' && event[prop].toLowerCase().indexOf(filterText) !== -1
            })
        }
        filter('title', titleFilterText)
        filter('company', orgFilterText)

        if (foodFilter) {
            sortedEvents = sortedEvents.filter(event => event.food)
        }

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
        const limit = 100
        return (
            <div style={{ marginRight: '1em' }}>
                {!withOutButton && <FlatButton label="Seminars" onTouchTap={this.handleOpen} labelStyle={buttonStyle} />}
                <Dialog
                    title={`All seminars (showing ${limit})`}
                    actions={actions}
                    modal={false}
                    open={withOutButton ? !!events.length : open}
                    autoScrollBodyContent={true}
                    onRequestClose={this.handleClose}
                    contentStyle={customContentStyle}
                >
                    <EventModal
                        item={choosenEvent}
                        onClose={() => this.setState({ choosenEvent: null })}
                    />
                    <div
                        style={{ display: 'flex', justifyContent: 'spaceBetween'}}
                    >
                        <TextField
                            hintText="Filter title"
                            onChange={(e, text) => this.setState({ titleFilterText: text })}
                        />
                        <TextField
                            hintText="Filter org"
                            onChange={(e, text) => this.setState({ orgFilterText: text })}
                        />
                        <Toggle
                            style={{ width: 20 }}
                            label="Food"
                            onToggle={(e, value) => this.setState({ foodFilter: value })}
                        />
                        <Toggle
                            style={{ width: 20 }}
                            label="Only favs"
                            onToggle={(e, value) => this.setState({ onlyFavs: value })}
                        />
                    </div>
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
                                    const s = (): string => {
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
                                <TableHeaderColumn>Title</TableHeaderColumn>
                                <TableHeaderColumn>Time</TableHeaderColumn>
                                <TableHeaderColumn>Organiser</TableHeaderColumn>
                                <TableHeaderColumn>Participants</TableHeaderColumn>
                                <TableHeaderColumn
                                    style={{ width: 20 }}
                                >Food</TableHeaderColumn>
                                <TableHeaderColumn
                                    style={{ width: 20 }}
                                >Favorite</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody
                            displayRowCheckbox={false}
                        >
                            {sortedEvents.slice(0, limit).map((event: AlmedEvent) => {
                                return <TableRow
                                    key={`${event.id}`}
                                    onMouseUp={() => {
                                        this.setState({
                                            // $FlowFixMe
                                            choosenEvent: event,
                                        })
                                    }}
                                >
                                    <TableRowColumn>{event.title}</TableRowColumn>
                                    <TableRowColumn>{moment(event.date).format(timeFormat)}</TableRowColumn>
                                    <TableRowColumn>{event.organiser}</TableRowColumn>
                                    <TableRowColumn>{(event.participants || []).reduce((acc, part) => acc + `${part.name}, ${part.title}, ${part.company} \n`, '')}</TableRowColumn>
                                    <TableRowColumn
                                        style={{ width: smallRowWidth }}
                                    >
                                        {event.food && <Check />}
                                    </TableRowColumn>
                                    <TableRowColumn
                                        style={{ width: smallRowWidth }}
                                    >
                                        <IconButton
                                            onTouchTap={() => this.handleToggle(event)}
                                            iconStyle={{ color: favMap[event.id] ? '#eed383' : '#CCC' }}
                                        >
                                            <Star />
                                        </IconButton>
                                    </TableRowColumn>
                                </TableRow>
                            })}
                        </TableBody>
                    </Table>
                </Dialog>
            </div>
        );
    }
}