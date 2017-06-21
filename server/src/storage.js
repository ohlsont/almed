// @flow
import Datastore from '@google-cloud/datastore'

const datastore = Datastore()

const getKey = (key: string, id: string = 'data') => datastore.key([key, id])

export async function add(dataKey: string, data: Array<any>): Promise<any> {
  const entitys = data.map(d => ({
    key: getKey(dataKey, d.id),
    data: Object.keys(d)
      .filter(key => d[key])
      .map(key => ({
        name: key,
        value: d[key],
      }))
  }))
  await datastore.save(entitys)
  console.log(`Task ${dataKey} created successfully.`)
  return dataKey
}

export async function del(key: string): Promise<void> {
  const col = await getCollection(key)
  const transaction = datastore.transaction()

  transaction.run(async (err) => {
    col.map(async (item) => {
      transaction.delete(getKey(key, item.id), () => {
        transaction.commit()
      })
    })
  })
  console.log('delete result')
}

export async function get(key: string): Promise<any> {
  return await datastore.get(getKey(key))
}

export async function getCollection(key: string): Promise<any> {
  const query = datastore.createQuery(key)
  const res = await datastore.runQuery(query)
  return res[0]
}
