// @flow
import React from 'react'
import {
    Dialog, FlatButton, RaisedButton, TextField,
    Table, TableRow, TableHeader, TableHeaderColumn, TableRowColumn, TableBody,
} from 'material-ui'

export default class ParticipantModal extends React.Component {
    state = {
        open: false,
        sort: 'name',
        asc: true,
        titleFilterText: '',
        companyFilterText: '',
        nameFilterText: '',
    }

    handleOpen = () => {
        this.setState({open: true})
    }

    handleClose = () => {
        this.setState({open: false})
    }

    props: {
        participantsMap: {[key: string]: [AlmedParticipant, number]},
        buttonStyle?: Object,
    }

    render() {
        const { participantsMap, buttonStyle } = this.props
        const { sort, asc, open, titleFilterText, companyFilterText, nameFilterText } = this.state
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
        ]
        let parts = Object.keys(participantsMap).sort(((p1, p2) => {
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
        const filter = (prop: string, filterText: string) => {
            if (!filterText) {
                return
            }
            parts = parts
                // .slice(0, 30)
                .filter((key: string) => {
                const p: ?AlmedParticipant = participantsMap[key][0]
                if (!p || !p[prop]) {
                    return false
                }
                return filterText.length > 2 && filterText.toLowerCase() !== '' && p[prop].toLowerCase().indexOf(filterText) !== -1
            })
        }
        filter('title', titleFilterText)
        filter('company', companyFilterText)
        filter('name', nameFilterText)

        return (
            <div style={{ marginRight: '1em' }}>
                <FlatButton label="Participants" onTouchTap={this.handleOpen} labelStyle={buttonStyle} />
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
                            hintText="Filter name"
                            onChange={(e, text) => this.setState({ nameFilterText: text })}
                        />
                        <TextField
                            hintText="Filter title"
                            onChange={(e, text) => this.setState({ titleFilterText: text })}
                        />
                        <TextField
                            hintText="Filter company"
                            onChange={(e, text) => this.setState({ companyFilterText: text })}
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
                                <TableHeaderColumn>Participates in (no.)</TableHeaderColumn>
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