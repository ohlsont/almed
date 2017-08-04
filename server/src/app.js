// @flow
import express from 'express'
import expressSession from 'express-session'
import cookieParser from 'cookie-parser'

import compression from 'compression'
import cors from 'cors'
import path from 'path'
import logger from 'morgan'
import bodyParser from 'body-parser'
import passport from 'passport'

import routes from './routes'

const whitelist = [
  'https://ohlsont.github.com/almed',
  'https://almed.herokuapp.com/almed',
  // 'http://localhost:8080',
  // 'http://localhost:3000',
  'http://evil.com/',
]
const corsOptions = {
  origin: (origin: string, callback: (err2: ?Error, origin: ?boolean)=>void) => {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error(`${origin} Not allowed by CORS`))
    }
  }
}

const app: any = express()
app.use(compression())
app.use(cors())
app.disable('x-powered-by')

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '../public')))
app.use(expressSession({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

// app.use(cors(corsOptions))
app.use(logger('dev', {
  skip: () => app.get('env') === 'test'
}))

// Routes
app.use('/', routes)

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  // $FlowFixMe
  err.status = 404
  next(err)
})

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res
    .status(err.status || 500)
    .json({
      message: err.message
    })
})

export default app
