// @flow
import fetch from 'node-fetch'
import himalaya from 'himalaya'
import moment from 'moment'

import { makeChunks } from './utils'

type MapPoint = {
  id: string,
  PLACE: string,
  PLACE_DESCRIPTION: string,
  LONGITUDE: string,
  LATITUDE: string,
}

export async function getEvents(): Promise<Array<?AlmedEvent>> {
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
    res.push(...eventsChunk.filter(e => e))
  }
  return res
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
export async function getIds(): Promise<Array<string>> {
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
  return [...new Set(elements.map(elem => elem.attributes ? elem.attributes.href : null).filter(e => e))]
}

export async function getParsedItem(id: string): Promise<Array<any>> {
  const url = `https://almedalsguiden.com/event/${id}`
  const resp = await fetch(url)
  const res = await resp.text()
  return himalaya.parse(res)
}

const removeFirstSpace = (str: string): string => str && !str.charAt(0).match(/[a-z]/i) ? str.slice(1) : str
export async function getItem(href: string, mapMapPoints: {[key: string]: MapPoint}): Promise<?AlmedEvent> {
  const id = href.split('/').pop()
  const mapPoint = mapMapPoints[id] || {}
  try {
    const json = await getParsedItem(id)
    const itemContent = applyChildren(json[2], [3,5,5,3], false)
    const p: ?Array<any> = applyChildren(itemContent, [9], false).children
    let participants = []
    if (p) {
      const a2 = p.filter(item => item.content && item.content.match(/[a-z]/i))
      participants = a2.filter(e => e && e.content).map(no => {
        const pList: Array<string> = no.content.split(',').map(removeFirstSpace)
        return {
          name: pList[0],
          title: pList[1],
          company: pList[2],
        }
      })
    }


    const dd = applyChildren(itemContent, [3,3,1])
    let endDate = null
    let date = null
    if (dd) {
      const d = dd.split('&ndash;')
      date = moment(d[0], 'DD/MM YYYY HH:mm')
      if (date && d.length > 1) {
        endDate = date.clone()
        const endTimeList = d[1].split(':')
        if (endTimeList.length > 1) {
          endDate.hour(endTimeList[0])
          endDate.minute(endTimeList[1])
        }
      }
    }

    const live = applyChildren(itemContent, [11,5,1])
    const food = applyChildren(itemContent, [11,7,1])
    const green = applyChildren(itemContent, [11,1,1])
    return {
      id,
      title: applyChildren(itemContent, [1,0]),
      organiser: applyChildren(itemContent, [3,1,1]),
      date: date ? date.format() : null,
      endDate: endDate ? endDate.format() : null,
      type: applyChildren(itemContent, [5,1,1]),
      subject: applyChildren(itemContent, [5,3,1]),
      language: applyChildren(itemContent, [5,5,1]),
      location: applyChildren(itemContent, [5,7,1]),
      locationDescription: applyChildren(itemContent, [5,9,1]),
      description: applyChildren(itemContent, [7,0]),
      latitude: parseFloat(mapPoint.LATITUDE),
      longitude: parseFloat(mapPoint.LONGITUDE),
      participants,
      green: !!(green && green.includes('Ja')),
      availabilty: applyChildren(itemContent, [11,3,1]),
      live: !!(live && live.includes('Ja')),
      food: !!(food && food.includes('Ja')),
      web: applyChildren(itemContent, [13,1,0,0]),
      url: `https://almedalsguiden.com/event/${id}`,
      // contact: applyChildren(itemContent, [15,1,1,0,0]),
      // contactOrg: applyChildren(itemContent, [15,1,1]),
      // contactNumber: applyChildren(itemContent, [6,1,1]),
    }
  } catch (error) {
      console.error('try get event ', error)
      return null
  }
}
