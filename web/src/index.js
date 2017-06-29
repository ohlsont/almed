import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import App from './App'
import { Events } from './services'
import registerServiceWorker from './registerServiceWorker'
import './index.css';

Events.migrateDB()
ReactDOM.render(
    <MuiThemeProvider><App /></MuiThemeProvider>, document.getElementById('root'));
registerServiceWorker();
