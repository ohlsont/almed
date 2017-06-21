// @flow
export function makeChunks<T>(arr: Array<T>, chunkSize: number, splice?: number): Array<Array<T>> {
  return (splice ? arr.splice(0, splice) : arr).reduce((ar, it, i) => {
    const ix = Math.floor(i / chunkSize)

    if(!ar[ix]) {
      ar[ix] = []
    }

    ar[ix].push(it)

    return ar
  }, [])
}
