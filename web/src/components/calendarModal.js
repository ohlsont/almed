// @flow
import React from 'react'
import {
    Dialog, FlatButton,
} from 'material-ui'
import moment from 'moment'
import BigCalendar from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import { EventModal } from './'
import Favorites from '../services/favorites'

BigCalendar.momentLocalizer(moment)

const preSelectedView = 'week'
export default class CalendarModal extends React.Component {
    state: {
        open: boolean,
        view: string,
        choosenEvent: ?AlmedEvent,
    } = {
        open: false,
        view: preSelectedView,
        choosenEvent: null,
    }

    handleOpen = () => {
        this.setState({open: true})
    }

    handleClose = () => {
        this.setState({open: false})
    }

    props: {
        events: Array<AlmedEvent>,
        buttonStyle?: Object,
    }

    render() {
        const events = Favorites.all()
        const { buttonStyle } = this.props
        const { open, view, choosenEvent } = this.state
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
        ]

        const calendarEvents: Array<any> = events.map((event: AlmedEvent) => {
            if (!event.date || !event.endDate) return null
            return {
                id: event.id,
                title: event.title,
                start: new Date(event.date),
                end: new Date(event.endDate),
                desc: event.description,
                food: event.food,
            }
        }).filter(Boolean)

        return (
            <div style={{ marginRight: '1em' }}>
                <FlatButton label="Calendar" onTouchTap={this.handleOpen} labelStyle={buttonStyle} />
                <Dialog
                    title="Calendar"
                    actions={actions}
                    modal={false}
                    open={open}
                    autoScrollBodyContent={true}
                    onRequestClose={this.handleClose}
                    contentStyle={{
                        width: '98%',
                        maxWidth: 'none',
                    }}
                >
                    <div
                        style={{ height: '90vh' }}
                    >
                        <EventModal
                            item={choosenEvent}
                            onClose={() => this.setState({ choosenEvent: null })}
                        />
                        <BigCalendar
                            events={calendarEvents}
                            startAccessor='start'
                            endAccessor='end'
                            view={view}
                            onView={(newView)=> this.setState({ view: newView })}
                            views={[preSelectedView, 'day', 'agenda']}
                            eventPropGetter={(e) => ({ style: { backgroundColor: e.food ? 'green' : 'blue' }})}
                            onSelectEvent={(e, ev) => {
                                const almedE = events.find(almedEvent => almedEvent.id === e.id)
                                console.log('debug', e.id, almedE)
                                this.setState({ choosenEvent: almedE })
                            }}
                            defaultDate={new Date(Math.min(...calendarEvents.map(e => e.start.getTime()).filter(Boolean)))}
                        />
                    </div>
                </Dialog>
            </div>
        );
    }
}