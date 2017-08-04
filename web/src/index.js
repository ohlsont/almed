// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import App from './App'
import { Events } from './services'
import registerServiceWorker from './registerServiceWorker'
import './index.css';

Events.migrateDB()
const rootEl = document.getElementById('root')
ReactDOM.render(
    <MuiThemeProvider><App /></MuiThemeProvider>, rootEl);
registerServiceWorker();

if (module.hot && module.hot.accept) {
    const rerenderCallback = () => {
        const NextApp = require('./App').default
        ReactDOM.render(<MuiThemeProvider><NextApp /></MuiThemeProvider>, rootEl)
    }
    // $FlowFixMe
    module.hot.accept('./App', rerenderCallback)
}
