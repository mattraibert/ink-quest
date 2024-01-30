import { expect } from 'chai'
import { describe, it } from 'mocha'

import { makeHNSWLibVectorStore } from '../make_hnswlib_vector_store.js'
import { PipelineEvaluator } from '../pipeline_evaluator.js'
import { docs, searchQueries } from './bf_docs.js'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
//     const results = await new PipelineEvaluator()
//       .withDocsAndQueries(docs, searchQueries)
//       .withModel('Xenova/all-MiniLM-L6-v2')
//       .withModel('Xenova/msmarco-distilbert-base-v4')
//       .withModel('Supabase/gte-small')
//       .withModel('Xenova/multi-qa-distilbert-cos-v1')
//       .withModel('Xenova/jina-embeddings-v2-small-en')
//       .withModel('Xenova/jina-embeddings-v2-base-en')
//       .withPipelines({
//         stripThenSplit1000: [
//           new HtmlToTextTransformer(),
//           new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, keepSeparator: false }),
//         ],
//         stripThenSplit5000: [
//           new HtmlToTextTransformer(),
//           new RecursiveCharacterTextSplitter({ chunkSize: 5000, chunkOverlap: 1000, keepSeparator: false }),
//         ],
//       })
//       .run()
//     console.log(JSON.stringify(results, null, 2))
describe('makeHNSWLibVectorStore', function () {
  this.timeout(10 * 60 * 1000)

  it('does semantic search with multiple documents', async () => {
    const results = await new PipelineEvaluator()
      .withDocsAndQueries(
        [
          { id: '1', pageContent: 'hello world', metadata: { id: '1' } },
          { id: '2', pageContent: 'goodbye world', metadata: { id: '2' } },
        ],
        [
          { query: 'hello', expectedId: '1' },
          { query: 'goodbye', expectedId: '2' },
          { query: 'greetings', expectedId: '1' },
          { query: 'death', expectedId: '2' },
          { query: 'spaghetti', expectedId: '2' },
          { query: 'soup', expectedId: '1' },
          { query: 'dessert', expectedId: '2' },
          { query: 'ciao', expectedId: '2' },
          { query: 'genesis', expectedId: '1' },
        ],
      )
      .withModel('Xenova/all-MiniLM-L6-v2')
      .withModel('Xenova/msmarco-distilbert-base-v4')
      .withModel('Supabase/gte-small')
      .withModel('Xenova/multi-qa-distilbert-cos-v1')
      .withModel('Xenova/jina-embeddings-v2-small-en')
      .withModel('Xenova/jina-embeddings-v2-base-en')
      .withPipelines({
        stripThenSplit1000: [
          new HtmlToTextTransformer(),
          new RecursiveCharacterTextSplitter({ chunkSize: 10, chunkOverlap: 2, keepSeparator: false }),
        ],
        stripThenSplit5000: [
          new HtmlToTextTransformer(),
          new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 20, keepSeparator: false }),
        ],
      })
      .run()
    console.log(JSON.stringify(results, null, 2))
  })

  it('does basic similarity search', async () => {
    const store = makeHNSWLibVectorStore()
    await store.addDocuments([{ id: '1', pageContent: 'hello world' }])
    const result = await store.similaritySearch('hello', 1)
    expect(result).to.eql([{ id: '1', pageContent: 'hello world' }])
  })
})
