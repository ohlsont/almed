// @flow
import React from 'react'
import {
    Dialog, FlatButton,
} from 'material-ui'
import moment from 'moment'
import BigCalendar from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import Favorites from './favorites'

BigCalendar.momentLocalizer(moment)
let allViews = Object.keys(BigCalendar.views).map(k => BigCalendar.views[k])

export default class CalendarModal extends React.Component {
    state = {
        open: true,
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
        const { open } = this.state
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
                title: event.title,
                start: new Date(event.date),
                end: new Date(event.endDate),
                desc: event.description,
            }
        }).filter(e => e)

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
                        <BigCalendar
                            events={calendarEvents}
                            startAccessor='start'
                            endAccessor='end'
                            views={allViews}
                            defaultDate={new Date(Math.min(...calendarEvents.map(e => e.start.getTime()).filter(e => e)))}
                        />
                    </div>
                </Dialog>
            </div>
        );
    }
}