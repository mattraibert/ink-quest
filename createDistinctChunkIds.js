export const createDistinctChunkIds = (articleIds) => {
  const generators = {}

  return articleIds.map((id) => {
    if (!generators[id]) {
      generators[id] = (() => {
        let count = 1
        return () => count++
      })()
    }
    return `${id}_${generators[id]()}`
  })
}
