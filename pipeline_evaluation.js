import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers'
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib'
import { createDistinctChunkIds } from './createDistinctChunkIds.js'
import { OpenAI } from '@langchain/openai'

const partition = (array, isValid) => {
  return array.reduce(
    ({ pass, fail }, elem) => {
      return isValid(elem) ? { pass: [...pass, elem], fail } : { pass, fail: [...fail, elem] }
    },
    { pass: [], fail: [] },
  )
}

const hnswLibFactory = (model) => new HNSWLib(model, { space: 'cosine' })

export class PipelineEvaluation {
  _executionTimes = {}

  constructor() {
    this.addDocuments = this.measureExecutionTime(this.addDocuments)
    this.evaluate = this.measureExecutionTime(this.evaluate)
  }

  measureExecutionTime(fn) {
    return async (...args) => {
      const start = performance.now()
      const result = await fn.apply(this, args)
      const end = performance.now()

      this._executionTimes[fn.name] = { value: end - start, units: 'ms' }
      return result
    }
  }

  withOAIEmbeddingModel(modelName) {
    this.modelName = modelName
    this.model = new OpenAI({ modelName })
    return this
  }

  withHFEmbeddingModel(modelName) {
    this.modelName = modelName
    this.model = new HuggingFaceTransformersEmbeddings({ modelName })
    return this
  }

  withVectorStore(makeVectorStore = hnswLibFactory) {
    this.vectorStore = makeVectorStore(this.model)
    return this
  }

  withTransformers(pipelineName, transformers) {
    this.pipelineName = pipelineName
    this.transformers = transformers
    return this
  }

  async addDocuments(docs) {
    const transformedDocs = await this.transformers.reduce(
      async (docsPromise, transformer) => transformer.transformDocuments(await docsPromise),
      docs,
    )
    console.log(`Adding ${transformedDocs.length} documents to ${this.modelName} ${this.pipelineName}`)
    const ids = { ids: createDistinctChunkIds(transformedDocs.map((doc) => doc.metadata.id)) }

    console.log(`Deleting ${JSON.stringify(ids, null, 2)}`)
    await this.vectorStore.delete(ids)
    return this.vectorStore.addDocuments(transformedDocs, ids)
  }

  search(query, k = 1) {
    return this.vectorStore.similaritySearchWithScore(query, k)
  }

  formatResults() {
    const times = Object.entries(this._executionTimes)
      .map(([name, { value, units }]) => {
        if (units === 'ms') {
          value = (value / 1000.0).toFixed(2)
          units = 's'
        }

        return `${name}: ${value} ${units}`
      })
      .join(', ')

    const tests = partition(this.results, ({ isMatch }) => isMatch)
    return `${this.modelName} ${this.pipelineName}: ${tests.pass.length} / ${this.results.length}; ${times}`
  }

  formatJSON() {
    const tests = partition(this.results, ({ isMatch }) => isMatch)
    return {
      modelName: this.modelName,
      pipelineName: this.pipelineName,
      results: this.results,
      // tests: {
      //   pass: tests.pass,
      //   fail: tests.fail,
      // },
      passCount: tests.pass.length,
      failCount: tests.fail.length,
      // executionTimes: this._executionTimes,
      addDocumentsTime: this._executionTimes.addDocuments.value,
      evaluateTime: this._executionTimes.evaluate.value,
    }
  }

  async evaluate(queryTests) {
    this.results = await Promise.all(
      queryTests.map(async ({ query, expectedId }) => {
        const [[doc, score]] = await this.vectorStore.similaritySearchWithScore(query, 1)
        return { query, expectedId, doc, score, isMatch: doc.metadata.id === expectedId }
      }),
    )
  }
}
