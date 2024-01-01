import { makeHNSWLibVectorStore } from './make_hnswlib_vector_store.js'
import { WordPressDocumentFetch } from './WordPressDocumentFetch.js'
import { summarize } from './summarize.js'

export async function run() {
  const vectorStore = makeHNSWLibVectorStore()

  await vectorStore.deleteIfExists()
  const fetcher = new WordPressDocumentFetch({ baseUrl: 'http://localhost:8080' })
  await fetcher.embedAll(vectorStore)

  await vectorStore.addDocuments([
    { id: '1', pageContent: 'hello world' },
    { id: '2', pageContent: 'goodbye world' },
  ])

  const results = await vectorStore.similaritySearch('goodbye', 12)
  console.log(JSON.stringify(results, null, 2))
  const md = await Promise.all(
    results.map(async ({ metadata, pageContent }) => {
      const summary = await summarize(pageContent)
      return { summary, metadata }
    }),
  )
  console.log(JSON.stringify(md, null, 2))
}

await run()
