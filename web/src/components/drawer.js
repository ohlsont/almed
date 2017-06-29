// @flow
import React from 'react';
import {
    Drawer, IconButton,
} from 'material-ui';
import ActionHome from 'material-ui/svg-icons/navigation/menu'

export default class AlmedDrawer extends React.Component {
    state = {
        open: false,
    }

    handleToggle = () => this.setState({open: !this.state.open})

    handleClose = () => this.setState({open: false})

    props: {
        content: any,
    }

    render() {
        return (
            <div>
                <IconButton
                    onTouchTap={() => this.handleToggle()}
                    iconStyle={{ color: 'white' }}
                >
                    <ActionHome />
                </IconButton>
                <Drawer
                    docked={false}
                    width={200}
                    open={this.state.open}
                    onRequestChange={(open) => this.setState({open})}
                >
                    {this.props.content}
                </Drawer>
            </div>
        );
    }
}