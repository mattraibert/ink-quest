import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers'
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib'

const partition = (array, isValid) => {
  return array.reduce(
    ({ pass, fail }, elem) => {
      return isValid(elem) ? { pass: [...pass, elem], fail } : { pass, fail: [...fail, elem] }
    },
    { pass: [], fail: [] },
  )
}

export class PipelineEvaluation {
  _executionTimes = {}

  constructor(props) {
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

  withEmbeddingModel(modelName) {
    this.modelName = modelName
    const model = new HuggingFaceTransformersEmbeddings({ modelName })
    this.vectorStore = new HNSWLib(model, { space: 'cosine' })
    return this
  }

  withTransformers(pipelineName, transformers) {
    this.pipelineName = pipelineName
    this.transformers = transformers
    return this
  }

  async addDocuments(docs) {
    let documents = await this.transformers.reduce(
      async (docsPromise, transformer) => transformer.transformDocuments(await docsPromise),
      docs,
    )
    console.log(`Adding ${documents.length} documents to ${this.modelName} ${this.pipelineName}`)
    await this.vectorStore.addDocuments(documents)
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
