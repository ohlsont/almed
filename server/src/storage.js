// @flow
import Datastore from '@google-cloud/datastore'
import Redis from 'ioredis'

import { makeChunks } from './utils'

export async function add(dataKey: string, data: Array<AlmedEvent>): Promise<any> {
  const reduceF = (acc, ev) => {
    acc[ev.id] = ev
    return acc
  }
  const items = await getRedis(dataKey)
  const itemMap = data
    .reduce(reduceF, items.reduce(reduceF, {}))
  return addRedis(dataKey, Object.keys(itemMap).map(key => itemMap[key]))
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
const redisClient = new Redis()
async function addRedis(dataKey: string, data: any): Promise<any> {
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

async function getRedis(key: string): Promise<any> {
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

// Google datastore
const datastore = Datastore()

const getKey = (key: string, id: string = 'data') => datastore.key([key, id])
async function addGAE(dataKey: string, data: Array<any>): Promise<any> {
  const entitys = data.map(d => ({
    key: getKey(dataKey, d.id),
    data: Object.keys(d)
      .filter(key => d[key])
      .map(key => ({
        name: key,
        value: d[key],
      }))
  }))
  makeChunks(entitys, 499).map(async (chunk) =>{
    await datastore.save(chunk)
  })

  //
  console.log(`Task ${dataKey} created successfully.`)
  return dataKey
}

async function delGAE(key: string): Promise<void> {
  const col = await getCollectionGoogle(key)
  const transaction = datastore.transaction()

  transaction.run(() => {
    makeChunks(col, 499).map(chunk => chunk.map((item) => {
      transaction.delete(getKey(key, item.id))
    }))
    transaction.commit()
  })
  console.log('delete result')
}

async function getGAE(key: string): Promise<any> {
  return await datastore.get(getKey(key))
}

async function getCollectionGoogle(key: string): Promise<any> {
  const query = datastore.createQuery(key)
  const res = await datastore.runQuery(query)
  console.log('got from remote', res[0].length)
  return res[0]
}
