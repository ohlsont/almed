// @flow
import {add, del, get, getRedisPipeline, addRedisPipeline, addEvents} from '../src/storage'
import {getEventsCollection} from "../src/almed";

describe('set get item from storage', () => {
  it('should return', async () => {
    const key = 'apa2'
    const item = { bepa: 'kepa' }
    await add(key, item)
    const readItem = await get(key)
    expect(item === readItem)
    await del(key)
    const readItem2 = await get(key)
    expect(readItem2 === null)
  })
})

describe('add 202 items to storage', () => {
  it('should return', async () => {
    let items = []
    for (let i = 0;i<202;i++) {
      const key = 'apaa-' + i
      const item = { bepa: 'kepa' }
      items.push(item)
    }
    const testKey = 'test-key'
    await add(testKey, items)
    const readItem = await get(testKey)
    expect(items === readItem)
    await del(testKey)
    const readItem2 = await get(testKey)
    expect(readItem2 === null)
  })
})

describe('test horizontal get', () => {
  it('should return', async () => {
    await addEvents([{ id: 'bepa'},{ id: 'bep'}])
    const data = await getEventsCollection()
    if (data) {
      expect(data.length === 2)
    }
    expect(data !== null)
  })
})
