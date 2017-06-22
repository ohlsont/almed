// @flow
import React from 'react'
import {
    Dialog, FlatButton, RaisedButton,
    Table, TableRow, TableHeader, TableHeaderColumn, TableRowColumn, TableBody,
} from 'material-ui'

export default class ParticipantModal extends React.Component {
    state = {
        open: false,
        sort: 'name',
        asc: true,
    }

    handleOpen = () => {
        this.setState({open: true})
    }

    handleClose = () => {
        this.setState({open: false})
    }

    props: {
        participantsMap: {[key: string]: [AlmedParticipant, number]},
    }

    render() {
        const { participantsMap } = this.props
        const { sort, asc, open } = this.state
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
        ]
        const parts = Object.keys(participantsMap).sort(((p1, p2) => {
            const part1 = participantsMap[p1]
            const part2 = participantsMap[p2]
            const sortF = (b) => asc ? (b ? -1 : 1) : (b ? 1 : -1)
            switch(sort) {
            case 'org':
                return sortF(part1[0].company < part2[0].company)
            case 'count':
                return sortF(part1[1] < part2[1])
            case 'name':
            default:
                return sortF(part1[0].name < part2[0].name)
            }
        }))
        return (
            <div style={{ marginRight: '1em' }}>
                <RaisedButton label="Alla deltagare" onTouchTap={this.handleOpen} />
                <Dialog
                    title="Alla deltagare"
                    actions={actions}
                    modal={false}
                    open={open}
                    autoScrollBodyContent={true}
                    onRequestClose={this.handleClose}
                >
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
                                    let s = 'name'
                                    switch (b) {
                                    case 1:
                                        s = 'name'
                                        break
                                    case 3:
                                        s = 'org'
                                        break
                                    case 4:
                                        s = 'count'
                                        break
                                    default:
                                        break
                                    }
                                    this.setState({
                                        sort: s,
                                        asc: s === sort ? !asc : asc,
                                    })
                                }}
                            >
                                <TableHeaderColumn>Name</TableHeaderColumn>
                                <TableHeaderColumn>Title</TableHeaderColumn>
                                <TableHeaderColumn>Company</TableHeaderColumn>
                                <TableHeaderColumn>Count</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody
                            displayRowCheckbox={false}
                        >
                            {parts.map(key => {
                                const p: [AlmedParticipant, number] = participantsMap[key]
                                return <TableRow
                                    key={`${p[0].name}`}
                                >
                                    <TableRowColumn><b>{p[0].name}</b></TableRowColumn>
                                    <TableRowColumn>{p[0].title}</TableRowColumn>
                                    <TableRowColumn>{p[0].company}</TableRowColumn>
                                    <TableRowColumn>{p[1]}</TableRowColumn>
                                </TableRow>
                            })}
                        </TableBody>
                    </Table>
                </Dialog>
            </div>
        );
    }
}