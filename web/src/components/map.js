// @flow
import React from 'react'
import { Dialog, IconButton, FlatButton } from 'material-ui'
import MapIcon from 'material-ui/svg-icons/maps/map'

import { MapItem } from './mapItem'

class Map extends React.Component {
    state: {
        open?: boolean
    } = {
        open: false
    }

    props: {
        points: Array<AlmedEvent>,
        modal?: boolean,
        button?: boolean,
    }

    renderModalMap() {
        const { button, points } = this.props
        return <div>
            {button ? <FlatButton
                label={'Map'}
                onClick={() => this.setState({ open: true })}
            /> : <IconButton
                tooltip="View all favorites on map"
                onClick={() => this.setState({ open: true })}
            >
                <MapIcon color="white" />
            </IconButton>}
            <Dialog
                title={'Map'}
                modal={false}
                maxWidth={'md'}
                open={!!this.state.open}
                autoScrollBodyContent={true}
                onRequestClose={() => this.setState({ open: false })}
            >
                <MapItem points={points} />
            </Dialog>
        </div>
    }


    render() {
        const { modal, points } = this.props
        return modal ? this.renderModalMap() : <MapItem points={points} />
    }
}

export default Map