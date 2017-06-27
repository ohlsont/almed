// @flow
import React from 'react'
import {
    Dialog, FlatButton, RaisedButton, TextField, Toggle,
    Table, TableRow, TableHeader, TableHeaderColumn, TableRowColumn, TableBody,
} from 'material-ui'

export default class EventsModal extends React.Component {
    state = {
        open: true,
        sort: 'name',
        titleFilterText: '',
        asc: true,
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
        const { events, buttonStyle } = this.props
        const { sort, asc, open, titleFilterText } = this.state
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
        ]
        let sortedEvents = events
            .slice(0, 30)
            .sort(((e1: AlmedEvent, e2: AlmedEvent) => {
            const sortF = (b) => asc ? (b ? -1 : 1) : (b ? 1 : -1)
            switch(sort) {
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
                return filterText.length > 2 && filterText.toLowerCase() !== '' && event[prop].toLowerCase().indexOf(filterText) !== -1
            })
        }
        filter('title', titleFilterText)

        return (
            <div style={{ marginRight: '1em' }}>
                <FlatButton label="Seminars" onTouchTap={this.handleOpen} labelStyle={buttonStyle} />
                <Dialog
                    title="Alla deltagare"
                    actions={actions}
                    modal={false}
                    open={open}
                    autoScrollBodyContent={true}
                    onRequestClose={this.handleClose}
                >
                    <div
                        style={{ display: 'flex', justifyContent: 'spaceBetween'}}
                    >
                        <TextField
                            hintText="Filter title"
                            onChange={(e, text) => this.setState({ titleFilterText: text })}
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
                                    console.log('debug', b, asc, sort)
                                    let s = 'title'
                                    switch (b) {
                                        default:
                                            break
                                    }
                                    this.setState({
                                        sort: s,
                                        asc: s === sort ? !asc : asc,
                                    })
                                }}
                            >
                                <TableHeaderColumn>Title</TableHeaderColumn>
                                <TableHeaderColumn>Company</TableHeaderColumn>
                                <TableHeaderColumn>Participants</TableHeaderColumn>
                                <TableHeaderColumn>Participates in (no.)</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody
                            displayRowCheckbox={false}
                        >
                            {sortedEvents.map((event: AlmedEvent) => {
                                return <TableRow
                                    key={`${event.id}`}
                                >
                                    <TableRowColumn>{event.title}</TableRowColumn>
                                    <TableRowColumn tooltip="hej" >{event.organiser}</TableRowColumn>
                                    <TableRowColumn>{(event.participants || []).reduce((acc, part) => acc + `${part.name}, ${part.title}, ${part.company} \n`, '')}</TableRowColumn>
                                    <TableRowColumn>
                                        {event.food && <Toggle
                                            label="Food"
                                            defaultToggled={event.food}
                                            disabled={!event.food}
                                        />}
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