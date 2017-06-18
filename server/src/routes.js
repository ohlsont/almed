import { Router } from 'express'
import fetch from 'node-fetch'
import himalaya from 'himalaya'

const routes = Router()

/**
 * GET home page
 */
routes.get('/', async (req, res) => {
  const ids = await getIds()
  const allData = await Promise.all(ids.slice(0, 10).map(id => getItem(id)))
  res.json(allData)
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

export const getAll = async () => {
  const resp = await fetch('https://almedalsguiden.com/api?version=js', {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'search_place=a',
  })
  switch (resp.status) {
    case 204:
      return {}
    case 401:
      return new Error('bad permissions, 401 response code')
    default:
      break
  }

  if (!resp.ok) {
    console.log('response is not ok ', resp)
    throw new Error(`bad response from server ${resp.status}`)
  }

  return resp.json() || {}
}

const applyChildren = (json: Object, arr: Array<number>) => arr
  .reduce((acc, item) => acc.children && acc.children[item] ? acc.children[item] : {}, json).content
async function getIds() {
  const url = 'https://almedalsguiden.com/main/search'
  const resp = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Access-Control-Allow-Origin': '*',
    },
    body: 'search=S%C3%B6k&' +
    'freetext=&' +
    'date_from=2017-07-02&' +
    'date_to=2017-07-09&' +
    'subject=&' +
    'event_form=&' +
    'eventType=&' +
    'organizer=&' +
    'orgtype=&' +
    'place=&' +
    'language=&' +
    'status=&' +
    'accessibility=',
  })

  switch (resp.status) {
    case 204:
      return {}
    case 401:
      throw new Error('bad permissions, 401 response code')
    default:
      break
  }
  const res = await resp.text()
  const json = himalaya.parse(res)
  const elements = json[2].children[3].children[5].children[5].children[1].children[3].children
  return elements.map(elem => elem.attributes ? elem.attributes.href : null).filter(e => e)
}

async function getItem(href) {
  const url = `https://almedalsguiden.com/${href}`
  const resp = await fetch(url)
  const res = await resp.text()
  const json = himalaya.parse(res)
  const itemContent = json[2].children[3].children[5].children[5].children[3]

  const p = itemContent.children[9].children
  // $FlowFixMe
  const a2 = Array.apply(null, {length: p.length}) // eslint-disable-line
  // $FlowFixMe
    .map(Number.call, Number)
    .filter(no => no % 2 !== 0) // eslint-disable-line
  const participants = a2.map(no => p[no].content).filter(e => e)
  // console.log('participants', p)
  return {
    title: applyChildren(itemContent, [1,0]),
    organiser: applyChildren(itemContent, [3,1,1]),
    date: applyChildren(itemContent, [3,3,1]),
    type: applyChildren(itemContent, [5,1,1]),
    subject: applyChildren(itemContent, [5,3,1]),
    language: applyChildren(itemContent, [5,5,1]),
    location: applyChildren(itemContent, [5,7,1]),
    locationDescription: applyChildren(itemContent, [5,9,1]),
    description: applyChildren(itemContent, [7,0]),
    participants,
    green: applyChildren(itemContent, [11,1,1]),
    availabilty: applyChildren(itemContent, [11,3,1]),
    live: applyChildren(itemContent, [11,5,1]),
    food: applyChildren(itemContent, [11,7,1]),
    web: applyChildren(itemContent, [13,1,0,0]),
    url,
    // contact: applyChildren(itemContent, [15,1,1,0,0]),
    // contactOrg: applyChildren(itemContent, [15,1,1]),
    // contactNumber: applyChildren(itemContent, [6,1,1]),
  }
}

export default routes
