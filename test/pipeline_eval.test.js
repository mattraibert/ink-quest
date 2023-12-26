import { expect } from 'chai'
import { docs, searchQueries } from './bf_docs.js'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers'

const partition = (array, isValid) => {
  return array.reduce(
    ({ pass, fail }, elem) => {
      return isValid(elem) ? { pass: [...pass, elem], fail } : { pass, fail: [...fail, elem] }
    },
    { pass: [], fail: [] },
  )
}

const evaluate = async (store, queryTests) => {
  const results = await Promise.all(
    queryTests.map(async ({ query, expectedId }) => {
      const [[doc, score]] = await store.similaritySearchWithScore(query, 1)
      return { doc, score, isMatch: doc.metadata.id === expectedId }
    }),
  )

  let { pass, fail } = partition(results, ({ isMatch }) => isMatch)
  return { results, matchRatio: pass.length / queryTests.length, failedQueries: fail.map(({ query }) => query) }
}

class PipelineEvaluator {
  withEmbeddingModel(modelName) {
    let model = new HuggingFaceTransformersEmbeddings({ modelName })
    this.vectorStore = new HNSWLib(model, { space: 'cosine' })
    return this
  }

  withTransformers(transformers) {
    this.transformers = transformers
    return this
  }

  async addDocuments(docs) {
    await this.vectorStore.addDocuments(
      await this.transformers.reduce(
        async (docsPromise, transformer) => transformer.transformDocuments(await docsPromise),
        docs,
      ),
    )
    return this
  }

  async evaluate(queryTests) {
    const results = await Promise.all(
      queryTests.map(async ({ query, expectedId }) => {
        const [[doc, score]] = await this.vectorStore.similaritySearchWithScore(query, 1)
        return { query, expectedId, doc, score, isMatch: doc.metadata.id === expectedId }
      }),
    )

    let { pass, fail } = partition(results, ({ isMatch }) => isMatch)
    return { results, matchRatio: pass.length / queryTests.length, failedQueries: fail.map(({ query }) => query) }
  }
}

describe('comparing two BF articles', function () {
  // bf_item_ids: 25148, 25173
  // wp_post_ids: 688, 709
  this.timeout(10 * 1000)

  let modelNames = ['Xenova/all-MiniLM-L6-v2', 'Xenova/msmarco-distilbert-base-v4']
  const pipelines = {
    stripThenSplit: [new HtmlToTextTransformer(), new RecursiveCharacterTextSplitter()],
    splitThenStrip: [RecursiveCharacterTextSplitter.fromLanguage('html'), new HtmlToTextTransformer()],
    stripOnly: [new HtmlToTextTransformer()],
    splitOnly: [RecursiveCharacterTextSplitter.fromLanguage('html')],
    rawDocs: [],
  }
  modelNames.forEach((modelName) =>
    describe(modelName, () => {
      Object.entries(pipelines).forEach(([key, transformers]) => {
        it(`should match at least 99% of these things (${key})`, async () => {
          const pipeline = await new PipelineEvaluator()
            .withEmbeddingModel(modelName)
            .withTransformers(transformers)
            .addDocuments(docs)
          const result = await pipeline.evaluate(searchQueries)

          expect(result.matchRatio).to.be.at.least(90 / 100)
          expect(result.failedQueries).to.eql([])
        })
      })
    }),
  )
})
