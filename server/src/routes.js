// @flow
import { Router } from 'express'

import { get, add, del } from './storage'
import { getEvents, getMapPoints } from './almed'

const routes: any = Router()

const dataKey = 'dataKey'
routes.get('/', async (req, res) => {
  const data = await get(dataKey)
  res.json(data)
})

routes.get('/map', async (req, res) => {
  res.json(getMapPoints())
})

routes.get('/empty', async (req, res) => {
  await del(dataKey)
  res.sendStatus(200)
})
routes.get('/update', async (req, res) => {
  const allData = await getEvents()
  await del(dataKey)
  await add(dataKey, allData)
  res.sendStatus(200)
})

routes.get('/list', (req, res, next) => {
  const { title } = req.query

  if (title == null || title === '') {
    // You probably want to set the response HTTP status to 400 Bad Request
    // or 422 Unprocessable Entity instead of the default 500 of
    // the global error handler (e.g check out https://github.com/kbariotis/throw.js).
    // This is just for demo purposes.
    next(new Error('The "title" parameter is required'))
    return
  }

  res.render('index', { title })
})



export default routes
