// @flow
import { getParsedItem, getItem, traverseTree } from '../src/almed'

// describe('GET /', () => {
//   it('should render properly', async () => {
//     await request(app).get('/').expect(200)
//   })
// })

// describe('GET /list', () => {
//   it('should render properly with valid parameters', async () => {
//     await request(app)
//       .get('/list')
//       .query({ title: 'List title' })
//       .expect(200)
//   })
//
//   it('should error without a valid parameter', async () => {
//     await request(app).get('/list').expect(500)
//   })
// })

// describe('GET /404', () => {
//   it('should return 404 for non-existent URLs', async () => {
//     await request(app).get('/404').expect(404)
//     await request(app).get('/notfound').expect(404)
//   })
// })

const testItemId = '6862'
describe('get item', () => {
  it('should return', async () => {
    const items = await getParsedItem(testItemId)
    const foundItem = traverseTree({ children: items }, (tree2) => !!tree2.attributes && tree2.attributes.id === 'event')
    expect(foundItem !== null)
    expect(Array.isArray(foundItem))
  })
})

describe('get item', () => {
  it('should return', async () => {
    const foundItem = await getItem(`/events/${testItemId}`, {})
    expect(foundItem !== null)
    expect(Array.isArray(foundItem))
  })
})
