// @flow
import { Router } from 'express'

import { getCollection, add, del } from './storage'
import { getEvents, getMapPoints, getIds } from './almed'

const routes: any = Router()

const dataKey = 'almedEvent'
routes.get('/', async (req, res) => {
  const data = await getCollection(dataKey)
  res.json(data)
})

routes.get('/map', async (req, res) => {
  res.json(getMapPoints())
})

routes.get('/ids', async (req, res) => {
  res.json((await getIds()).sort())
})

routes.get('/empty', async (req, res) => {
  await del(dataKey)
  res.sendStatus(200)
})
routes.get('/update', async (req, res) => {
  await getEvents().then(allData => add(dataKey, allData))
  res.sendStatus(200)
})

export default routes
