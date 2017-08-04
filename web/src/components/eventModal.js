// @flow
import React from 'react'
import {
    Dialog,
} from 'material-ui'

import { EventItem } from './'

export default class EventModal extends React.Component {
    state = { open: false }
    props: {
        item?: ?AlmedEvent,
        onClose: ()=>void,
        style?: any
    }

    render() {
        const { item, onClose } = this.props
        return <Dialog
            title={(item || {}).title}
            modal={false}
            open={!!item}
            autoScrollBodyContent={true}
            onRequestClose={() => onClose()}
        >
            {item && <EventItem item={item} noTitle={true} />}
        </Dialog>
    }
}