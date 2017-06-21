// @flow
import Datastore from '@google-cloud/datastore'

const datastore = Datastore()

const getKey = (key: string) => datastore.key([key, 'data'])

export async function add(dataKey: string, data: any): Promise<any> {
  const entity = {
    key: getKey(dataKey),
    data: [
      {
        name: 'data',
        value: data,
      },
    ]
  }
  await datastore.save(entity)
  console.log(`Task ${dataKey} created successfully.`)
  return dataKey
}

export async function del(key: string): Promise<void> {
  const res = await datastore.delete(getKey(key))
  console.log('delete result', res)
}

export async function get(key: string): Promise<any> {
  return await datastore.get(getKey(key))
}
