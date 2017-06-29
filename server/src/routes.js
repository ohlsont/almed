// @flow
import { Router } from 'express'

import { getCollection, add, del } from './storage'
import { getEvents, getMapPoints, getIds, getItem, getParsedItem, traverseTree } from './almed'

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

routes.get('/debugPureItem/:id', async (req: any, res) => {
  const id = req.params.id
  const item = await getParsedItem(id)
  res.json(item)
})

routes.get('/debugItem/:id', async (req: any, res) => {
  const id = req.params.id
  const item = await getParsedItem(id)
  // recursive parsed data cleaner
  const ress = traverseTree({ children: item }, (tree2) => !!tree2.attributes && tree2.attributes.id === 'event')
  res.json(ress)
})

routes.get('/item/:id', async (req: any, res) => {
  const id = req.params.id
  const item = await getItem(`/events/${id}`, {})
  res.json(item)
})

routes.get('/empty', async (req, res) => {
  await del(dataKey)
  res.sendStatus(200)
})

routes.get('/update', async (req, res) => {
  const allData = await getEvents()
  console.log('inserting items: ', allData.length)
  await add(dataKey, allData)
  res.sendStatus(200)
})

export default routes
