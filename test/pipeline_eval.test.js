import { expect } from 'chai'
import { docs, searchQueries } from './bf_docs.js'
import { makeHNSWLibVectorStore } from '../make_hnswlib_vector_store.js'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text'

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

describe('comparing two BF articles', function () {
  // bf_item_ids: 25148, 25173
  // wp_post_ids: 688, 709
  this.timeout(10 * 1000)

  let modelNames = ['Xenova/all-MiniLM-L6-v2', 'Xenova/msmarco-distilbert-base-v4']
  modelNames.forEach((modelName) =>
    describe(modelName, () => {
      it('should match at least 99% of these things (strip html then split)', async () => {
        const store = makeHNSWLibVectorStore(modelName)
        let documents = docs
        documents = await new HtmlToTextTransformer().transformDocuments(documents)
        documents = await new RecursiveCharacterTextSplitter().transformDocuments(documents)

        await store.addDocuments(documents)
        const { failedQueries, matchRatio } = await evaluate(store, searchQueries)

        expect(matchRatio).to.be.at.least(99 / 100)
        console.log(failedQueries)
      })

      it('should match at least 99% of these things (strip html only)', async () => {
        const store = makeHNSWLibVectorStore(modelName)
        let documents = docs
        documents = await new HtmlToTextTransformer().transformDocuments(documents)

        await store.addDocuments(documents)
        const { failedQueries, matchRatio } = await evaluate(store, searchQueries)

        expect(matchRatio).to.be.at.least(99 / 100)
        console.log(failedQueries)
      })

      it('should match at least 99% of these things (split then strip html)', async () => {
        const store = makeHNSWLibVectorStore(modelName)
        let documents = docs
        documents = await RecursiveCharacterTextSplitter.fromLanguage('html', {}).transformDocuments(documents)
        documents = await new HtmlToTextTransformer().transformDocuments(documents)

        await store.addDocuments(documents)
        const { failedQueries, matchRatio } = await evaluate(store, searchQueries)

        expect(matchRatio).to.be.at.least(99 / 100)
        console.log(failedQueries)
      })

      it('should match at least 99% of these things (split only)', async () => {
        const store = makeHNSWLibVectorStore(modelName)
        let documents = docs
        documents = RecursiveCharacterTextSplitter.fromLanguage('html', {}).transformDocuments(docs)

        await store.addDocuments(docs)
        const { failedQueries, matchRatio } = await evaluate(store, searchQueries)

        expect(matchRatio).to.be.at.least(99 / 100)
        console.log(failedQueries)
      })

      it('should match at least 99% of these things (raw docs)', async () => {
        const store = makeHNSWLibVectorStore(modelName)

        await store.addDocuments(docs)
        const { failedQueries, matchRatio } = await evaluate(store, searchQueries)

        expect(matchRatio).to.be.at.least(99 / 100)
        console.log(failedQueries)
      })
    }),
  )
})
