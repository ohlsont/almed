// @flow
import React from 'react'
import { FlatButton } from 'material-ui'

const CLIENT_ID = '529183959033-f5im51pr8hh65jlk27chqdvm1og6je7l.apps.googleusercontent.com'

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

// $FlowFixMe
const gDriveApi = () => gapi // eslint-disable-line

export default class GDriveSave extends React.Component {
    state = {
        isSignedIn: false,
        files: '',
    }

    componentWillMount() {
        setTimeout(() => {
            const resp = gDriveApi().load('client:auth2', () => this.initClient())
            console.log('rreesp', resp)
        }, 5000)

    }
    /**
     *  Initializes the API client library and sets up sign-in state
     *  listeners.
     */
    async initClient() {
        await gDriveApi().client.init({
            discoveryDocs: DISCOVERY_DOCS,
            clientId: CLIENT_ID,
            scope: SCOPES
        })

        gDriveApi().auth2.getAuthInstance().isSignedIn.listen((arg) => console.log('stuff happend', arg))
        // Handle the initial sign-in state.
        this.setState({ isSignedIn: gDriveApi().auth2.getAuthInstance().isSignedIn.get() })
    }

    /**
     *  On load, called to load the auth2 library and API client library.
     */
    handleClientLoad() {
        const resp = gDriveApi().load('client:auth2', () => this.initClient(), () => console.log('callback'))
        console.log('resp', resp)
    }

    /**
     *  Sign out the user upon button click.
     */
    handleSignoutClick() {
        gDriveApi().auth2.getAuthInstance().signOut()
    }

    /**
     * Append a pre element to the body containing the given message
     * as its text node. Used to display the results of the API call.
     *
     * @param {string} message Text to be placed in pre element.
     */
    appendPre(message: string) {
        this.setState({ files: `${message}\n` + this.state.files })
    }

    /**
     * Print files.
     */
    listFiles() {
        gDriveApi().client.drive.files.list({
            'pageSize': 10,
            'fields': "nextPageToken, files(id, name)"
        }).then(function(response) {
            this.appendPre('Files:');
            const files = response.result.files;
            if (files && files.length > 0) {
                files.forEach((file) => this.appendPre(file.name + ' (' + file.id + ')'))
            } else {
                this.appendPre('No files found.');
            }
        });
    }

    render() {
        return <div>
            <FlatButton
                label="Sign in"
                onClick={()=> {
                    const resp = gDriveApi().auth2.getAuthInstance().signIn()
                    console.log('debug', resp)
                }}
            />
        </div>
    }
}