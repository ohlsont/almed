// @flow
import Redis from 'ioredis'
import fs from 'fs'
import {getEvents, getEventsCollection} from "./almed";

export async function add(dataKey: string, data: any): Promise<any> {
  const item = await getRedis(dataKey) || []
  if (Array.isArray(item)) {
    const reduceF = (acc, ev) => {
      if (ev) {
        acc[ev.id] = ev
      }
      return acc
    }

    const itemMap = [].concat(data).reduce(reduceF, item.reduce(reduceF, {}))
    const resMap = Object.keys(itemMap).map(key => itemMap[key])
    return addRedis(dataKey, resMap)
  }
  return addRedis(dataKey, data)
}

export async function delItem(id: string): Promise<void> {
  const col: ?Array<AlmedEvent> = await getEventsCollection()
  const newCol = (col || [])
    .filter((item: AlmedEvent) => item.id !== `${id}`)
  console.log('changing size', (col || []).length, newCol.length, `${id}`, (col || []).some((item: AlmedEvent) => item.id === `${id}`))
  return addEvents(newCol)
}

export async function del(key: string): Promise<void> {
  return delRedis(key)
}

export async function get(key: string): Promise<any> {
  return getRedis(key)
}

export async function getCollection(key: string): Promise<any> {
  return getRedis(key)
}


// redis
const redisClient = new Redis(process.env.REDIS_URL)
async function addRedis(dataKey: string, data: any): Promise<any> {
  if (!Array.isArray(data) || data.length < redisItemLength) {
    return addRedisPrivate(dataKey, data)
  }

  let i,j,temparray,chunk = redisItemLength
  let promises = []
  for (i=0 , j=data.length; i<j; i+=chunk) {
    temparray = data.slice(i,i+chunk)
    promises.push(await addRedisPrivate(dataKey + redisKeyExtender, temparray))
  }
  return Promise.all(promises)
}

export const collectionKey = 'events'
export async function addEvents(data: Array<AlmedEvent>): Promise<any> {
  const items: Array<AlmedEvent> = await getRedisPipeline(collectionKey + ':*')
  const reduceF = (acc, ev) => {
    acc[ev.id] = ev
    return acc
  }

  const itemMap = [].concat(data).reduce(reduceF, items.reduce(reduceF, {}))
  const resMap = Object.keys(itemMap).map(key => itemMap[key])
  return addRedisPipeline(collectionKey, 'id', resMap)
}

async function addRedisPrivate(dataKey: string, data: any): Promise<any> {
  return new Promise((r, re) => {
    redisClient.set(dataKey, JSON.stringify(data), (err, result) => {
      if (err) {
        re(err)
        return
      }
      r(result)
    })
  })
}

async function delRedis(key: string): Promise<void> {
  return addRedis(key, null)
}

const redisItemLength = 1000
const redisKeyExtender = '#'
async function getRedis(key: string): Promise<?any> {
  return getRedisPipeline(key)
}

async function getRedisPrivate(key: string): Promise<?any> {
  return new Promise((r, re) => {
    redisClient.get(key, (err, result) => {
      if (err) {
        re(err)
        return
      }
      r(JSON.parse(result))
    })
  })
}

export function writeToFile(fileName: string, obj: any) {
  let json = JSON.stringify(obj);
  fs.writeFile(fileName + '.json', json, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  })
}

export function readFiles(fileName: string): Promise<Array<any>> {
  return new Promise((r, re) => {
    fs.readFile(fileName + '.json', 'utf8', (err, data) => {
      if (err){
        r([])
      } else {
        r(JSON.parse(data))
      }})
  })
}

export async function getRedisPipeline(key: string): Promise<any> {
  return new Promise(async (r, re) => {
    const keys = await redisClient.keys(key)
    const pipeline = redisClient.pipeline();
    keys.forEach(function (key) {
      pipeline.get(key);
    })
    const res = await pipeline.exec()
    if (res) {
      const rrr = res.map(p => JSON.parse(p[1]))
      r(rrr)
    } else {
      r(null)
    }
  })
}

export async function addRedisPipeline(collection: string, idKey: string, items: Array<any>): Promise<?any> {
  return new Promise(async (r, re) => {
    console.log('adding to db ', items.length)
    const pipeline = redisClient.pipeline()
    items.forEach(item => {
      pipeline.set(collection + ':' + item[idKey], JSON.stringify(item))
    })
    const res = await pipeline.exec()
    r(res)
  })
}
