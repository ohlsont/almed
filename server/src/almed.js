// @flow
import fetch from 'node-fetch'
import himalaya from 'himalaya'

type MapPoint = {
  id: string,
  PLACE: string,
  PLACE_DESCRIPTION: string,
  LONGITUDE: string,
  LATITUDE: string,
}

type AlmedEvent = {
  id: string,
  title: string,
  organiser: string,
  date: string,
  type: string,
  subject: string,
  language: string,
  location: string,
  locationDescription: string,
  description: string,
  latitude: string,
  longitude: string,
  participants: string,
  green: string,
  availabilty: string,
  live: string,
  food: string,
  web: string,
  url: string,
}

export async function getEvents(): Promise<Array<AlmedEvent>> {
  const ids: Array<string> = await getIds()
  const mapPoints = await getMapPoints()
  const mapMapPoints = mapPoints.result.reduce((acc, mapPoint: MapPoint) => {
    acc[mapPoint.id] = mapPoint
    return acc
  }, {})
  console.log('getting ids: ', ids.length)
  const idsChunks: Array<Array<string>> = makeChunks(ids, 100)
  const res = []
  for (let i = 0; i<idsChunks.length; i++) {
    const idsChunk = idsChunks[i]
    const eventsChunk = await Promise.all(idsChunk.map((id: string, index: number) => {
      console.log('chunkIndex' + i + ' item', index, ' id ', id)
      return getItem(id, mapMapPoints)
    }))
    await sleep(5000)
    res.push(...eventsChunk.filter(e => e))
  }
  return res
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Resp = { result: Array<MapPoint> }

export const getMapPoints = async (): Promise<Resp> => {
  const resp = await fetch('https://almedalsguiden.com/api?version=js', {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'search_place=a',
  })
  switch (resp.status) {
    case 401:
      throw new Error('bad permissions, 401 response code')
    default:
      break
  }

  if (!resp.ok) {
    console.log('response is not ok ', resp)
    throw new Error(`bad response from server ${resp.status}`)
  }

  return resp.json() || {}
}

const applyChildren = (json: Object, arr: Array<number>, withContent: boolean = true): any => {
  const res = arr.reduce((acc, item) => acc.children && acc.children[item] ? acc.children[item] : {}, json)
  return withContent ? res.content : res
}
async function getIds(): Promise<Array<string>> {
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
      return []
    case 401:
      throw new Error('bad permissions, 401 response code')
    default:
      break
  }
  const res = await resp.text()
  const json = himalaya.parse(res)
  const elements = applyChildren(json[2], [3,5,5,1,3], false).children
  return elements.map(elem => elem.attributes ? elem.attributes.href : null).filter(e => e)
}

async function getItem(href: string, mapMapPoints: {[key: string]: MapPoint}): Promise<AlmedEvent> {
  const id = href.split('/').pop()
  const mapPoint = mapMapPoints[id] || {}
  const url = `https://almedalsguiden.com${href}`
  const resp = await fetch(url)
  const res = await resp.text()
  const json = himalaya.parse(res)
  const itemContent = applyChildren(json[2], [3,5,5,3], false)

  const p = applyChildren(itemContent, [9], false)
  // $FlowFixMe
  const a2 = Array.apply(null, {length: p.length}) // eslint-disable-line
  // $FlowFixMe
    .map(Number.call, Number)
    .filter(no => no % 2 !== 0) // eslint-disable-line
  const participants = a2.map(no => p[no].content).filter(e => e)
  return {
    id,
    title: applyChildren(itemContent, [1,0]),
    organiser: applyChildren(itemContent, [3,1,1]),
    date: applyChildren(itemContent, [3,3,1]),
    type: applyChildren(itemContent, [5,1,1]),
    subject: applyChildren(itemContent, [5,3,1]),
    language: applyChildren(itemContent, [5,5,1]),
    location: applyChildren(itemContent, [5,7,1]),
    locationDescription: applyChildren(itemContent, [5,9,1]),
    description: applyChildren(itemContent, [7,0]),
    latitude: mapPoint.LATITUDE,
    longitude: mapPoint.LONGITUDE,
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

function makeChunks<T>(arr: Array<T>, chunkSize: number, splice?: number): Array<Array<T>> {
  return (splice ? arr.splice(0, splice) : arr).reduce((ar, it, i) => {
    const ix = Math.floor(i / chunkSize)

    if(!ar[ix]) {
      ar[ix] = [];
    }

    ar[ix].push(it)

    return ar
  }, [])
}

