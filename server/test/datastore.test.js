// @flow
import { add, del, get } from '../src/storage'

describe('set get item from storage', () => {
  it('should return', async () => {
    const key = 'apa'
    const item = { bepa: 'kepa' }
    await add(key, item)
    const readItem = await get(key)
    expect(item === readItem)
    await del(key)
    const readItem2 = await get(key)
    expect(readItem2 === null)
  })
})
