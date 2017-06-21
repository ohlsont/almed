// @flow
import { Router } from 'express'

import { getCollection, add, del } from './storage'
import { getEvents, getMapPoints, getIds, getItem, getParsedItem } from './almed'

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

routes.get('/debugItem/:id', async (req: any, res) => {
  const id = req.params.id
  const item = await getParsedItem(id)
  // recursive parsed data cleaner
  const f = (item: Object, order: number = 0, child: number = 0) => {
    const res = {}
    res.order = order
    res.child = child
    if (item.type === 'Text' && item.content.match(/[a-z]/i)) {
      res.content = item.content
    }
    if (item.children) {
      const c = item.children.map((e, index) => f(e, order + 1, index))
      if (c.length) res.children = c.filter(e => (e.children && e.children.length )|| e.content)
    }
    return res
  }
  res.json(f(item[2]))
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
