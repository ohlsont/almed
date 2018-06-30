// @flow
import { getEvents, getItem } from '../src/almed'
// getParsedItem, traverseTree, partiesFromParticipants,

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

// describe('filter parties', () => {
//   it('should return', () => {
//     const participant: AlmedParticipant = {
//       name: 'Daniel Helldén',
//       title: 'Trafikborgarråd',
//       company: '(MP)'
//     }
//     const res = partiesFromParticipants([participant])
//     expect(res).not.toBe(null)
//     expect(res.pop()).toBe(['mp'].pop())
//   })
// })

const testItemId = '10008'
// describe('get item', () => {
//   it('should return', async () => {
//     const items = await getParsedItem(testItemId)
//     const foundItem = traverseTree({ children: items }, (tree2) => !!tree2.attributes && tree2.attributes.id === 'event')
//     expect(foundItem !== null)
//     expect(Array.isArray(foundItem))
//   })
// })

describe('get item full', () => {
  it('should return', async () => {
    expect.assertions(2)
    const foundItem = await getItem(`/events/${testItemId}`, {})
    expect(foundItem).not.toBe(null)

    if (foundItem) {
      expect(foundItem.parties.pop()).toBe(['mp'].pop())
    }
  })
})

describe('get 100 items', async () => {
  expect.assertions(1)
  const from = '3600'
  const to = '3900'
  const allData = await getEvents(null, from ,to)
  expect(allData.length).toBe(parseInt(to) - parseInt(from))
  console.log('done with test ', allData.length)
})
