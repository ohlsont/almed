// @flow
import Datastore from '@google-cloud/datastore'

const datastore = Datastore()

export async function add(key: string, data: Object) {
  const taskKey = datastore.key(key)
  const entity = {
    key: taskKey,
    data: [
      {
        name: 'data',
        value: data,
      },
    ]
  }
  await datastore.save(entity)
  console.log(`Task ${taskKey.id} created successfully.`)
  return taskKey
}

export async function get(key: string) {
  const query = datastore.createQuery(key)
  const results = await datastore.runQuery(query)
  const tasks = results[0]

  console.log('Tasks:')
  tasks.forEach((task) => {
    const taskKey = task[datastore.KEY]
    console.log(taskKey.id, task)
  })

  return tasks
}
