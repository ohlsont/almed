// @flow
import fetch from 'node-fetch'
import himalaya from 'himalaya'
import moment from 'moment'

import { makeChunks } from './utils'

export type MapPoint = {
  id: string,
  PLACE: string,
  PLACE_DESCRIPTION: string,
  LONGITUDE: string,
  LATITUDE: string,
}

type HTMLTreeChild = {
  type?: string,
  tagName?: string,
  content?: string,
  className?: Array<string>,
  attributes?: {
    id: string,
    titel: string,
    href: string,
  },
  children: Array<HTMLTreeChild>,
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
    await sleep(3000)
    res.push(...eventsChunk.filter(Boolean))
  }
  return res.filter(Boolean)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
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
  return withContent ? removeFirstSpace(res.content) : res
}

export const traverseTree = (
  tree: HTMLTreeChild,
  func: (tree2: HTMLTreeChild)=>boolean
): ?HTMLTreeChild => {
  if (func(tree)) {
    return tree
  }
  let res
  const producedResult = (tree.children || []).some(child => {
    res = traverseTree(child, func)
    return !!res
  })
  return res
}

export async function getIds(): Promise<Array<string>> {
  const url = 'https://almedalsguiden.com/main/search'
  console.log('requesting', url)
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
  console.log('got response', url)

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
  return [...new Set(elements.map(elem => elem.attributes ? elem.attributes.href : null).filter(Boolean))]
}

export async function getParsedItem(id: string): Promise<Array<any>> {
  const url = `https://almedalsguiden.com/event/${id}`
  const resp = await fetch(url)
  const res = await resp.text()
  return himalaya.parse(res)
}

export const partiesFromParticipants = (parts: AlmedParticipant[]): Array<string> => {
  const partsParties: Array<string> = parts.map((part) => {
    const f = (substrings: Array<string>, ret): ?string => [part.company, part.title]
      .some((str) => substrings
        .some((substr) => str
          .search(substr) > -1)) ? ret : null
    const partiesStr = [
      f(['\\(s\\)', 'socialdemokraterna'], 's'),
      f(['\\(m\\)', 'moderaterna'], 'm'),
      f(['\\(l\\)', 'liberalerna'], 'l'),
      f(['\\(c\\)', 'centerpartiet'], 'c'),
      f(['\\(v\\)', 'vänsterpartiet'], 'v'),
      f(['\\(sd\\)', 'sverigedemokraterna'], 'sd'),
      f(['\\(mp\\)', 'miljöpartiet'], 'mp'),
    ].filter(Boolean)
    return partiesStr
  }).reduce((acc, strs: Array<string>) => {
    return acc.concat(strs)
  }, [])
  return [...new Set(partsParties)]
}

const alphabetRegexp = /[a-z\wåäöÅÄÖ]/i
const removeFirstSpace = (str: string): string => str && !str.charAt(0).match(alphabetRegexp) ? str.slice(1) : str
export async function getItem(href: string, mapMapPoints: {[key: string]: MapPoint}): Promise<?AlmedEvent> {
  const id = href.split('/').pop()
  const mapPoint = mapMapPoints[id] || {}
  try {
    const json = await getParsedItem(id)
    let article: ?HTMLTreeChild = traverseTree({ children: json }, (tree2) => !!tree2.attributes && tree2.attributes.id === 'event')
    if (!article || !article.children || !article.children.length) {
      // try 2
      article = traverseTree({ children: json }, (tree2: HTMLTreeChild) => !!tree2.attributes &&
        !!tree2.attributes.className &&
        Array.isArray(tree2.attributes.className) &&
        tree2.attributes.className.some(s => s === 'main-content'))
      if (!article || !article.children || !article.children.length) {
        console.warn('no child found')
        return
      }
    }

    if (!article) {
      return
    }
    // console.log('article', article, (article.attributes || {}))
    const itemContent: HTMLTreeChild = article
    const filterFuncChildren = (filterFor: string): ?HTMLTreeChild => {
      const item = traverseTree(itemContent, (tree: HTMLTreeChild) => {
        const child = applyChildren(tree, [0, 0])
        return !!child && child === filterFor
      })
      if (!item || !item.children) {
        return null
      }
      return item
    }
    const filterFunc = (filterFor: string): ?string => {
      const item = filterFuncChildren(filterFor)
      if (!item || !item.children[1]) {
        return null
      }
      const r = (item.children[1] || {}).content
      return r ? removeFirstSpace(r) : null
    }

    const p: ?Array<any> = (filterFuncChildren('Medverkande:') || {}).children
    let participants = []
    if (p) {
      const a2 = p.filter(item => item.content && item.content.match(alphabetRegexp))
      participants = a2.filter(e => e && e.content).map(no => {
        const pList: Array<string> = no.content.split(',').map(removeFirstSpace)
        return {
          name: pList[0],
          title: pList[1],
          company: pList[2],
        }
      })
    }


    const dd = filterFunc('Dag:')
    let endDate = null
    let date = null
    if (dd) {
      const d = dd.split('&ndash;')
      date = moment(d[0], 'DD/MM YYYY HH:mm')
      if (date && d.length > 1) {
        endDate = date.clone()
        const endTimeList = d[1].split(':')
        if (endDate && endTimeList.length > 1) {
          endDate.hour(endTimeList[0])
          endDate.minute(endTimeList[1])
        }
      }
    }

    const live = filterFunc('Direktsänds på internet:')
    const food = filterFunc('Förtäring:')
    const green = filterFunc('Grönt evenemang:')

    const organiser: string = filterFunc('Arrangör:') || ''
    const eventResult: AlmedEvent = {
      id,
      title: (article.attributes || {}).titel,
      organiser,
      date: date ? date.format() : null,
      endDate: endDate ? endDate.format() : null,
      type: filterFunc('Typ:') || '',
      subject: [filterFunc('Ämnesområde:'), filterFunc('Ämnesområde 2:')].filter(Boolean),
      language: filterFunc('Språk:') || '',
      location: filterFunc('Plats:') || '',
      locationDescription: filterFunc('Platsbeskrivning:') || '',
      description: applyChildren(itemContent, [7,0]),
      latitude: parseFloat(mapPoint.LATITUDE),
      longitude: parseFloat(mapPoint.LONGITUDE),
      participants,
      green: !!(green && green.includes('Ja')),
      availabilty: filterFunc('Tillgänglighet:') || '',
      live: !!(live && live.includes('Ja')),
      food: !!(food && food.includes('Ja')),
      web: [((traverseTree(itemContent, (child) => !!((child || {}).attributes || {}).href) || {}).attributes || {}).href]
        .filter(Boolean),
      url: `https://almedalsguiden.com/event/${id}`,
      parties: partiesFromParticipants(participants)
      // contact: applyChildren(itemContent, [15,1,1,0,0]),
      // contactOrg: applyChildren(itemContent, [15,1,1]),
      // contactNumber: applyChildren(itemContent, [6,1,1]),
    }

    return eventResult
  } catch (error) {
      console.error('try get event ', error)
      return null
  }
}
