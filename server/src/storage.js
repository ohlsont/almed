// @flow
import Redis from 'ioredis'

export async function add(dataKey: string, data: any): Promise<any> {
  const item = await getRedis(dataKey) || []
  if (Array.isArray(item)) {
    const reduceF = (acc, ev) => {
      acc[ev.id] = ev
      return acc
    }

    const itemMap = [].concat(data).reduce(reduceF, item.reduce(reduceF, {}))
    const resMap = Object.keys(itemMap).map(key => itemMap[key])
    return addRedis(dataKey, resMap)
  }
  return addRedis(dataKey, data)
}

export async function delItem(key: string, id: string): Promise<void> {
  const col: ?Array<AlmedEvent> = await getCollection(key)
  const newCol = (col || [])
    .filter((item: AlmedEvent) => item.id !== `${id}`)
  console.log('changing size', (col || []).length, newCol.length, `${id}`, (col || []).some((item: AlmedEvent) => item.id === `${id}`))
  return addRedis(key, newCol)
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
  const result = await getRedisPrivate(key)
  if (!Array.isArray(result)) {
    return result
  }

  if (result.length !== redisItemLength) {
    const resultExtended = await getRedis(key + redisKeyExtender)
    return result + resultExtended
  }
  return result
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
