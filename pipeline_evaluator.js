import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { docs, searchQueries } from './test/bf_docs.js'

const partition = (array, isValid) => {
  return array.reduce(
    ({ pass, fail }, elem) => {
      return isValid(elem) ? { pass: [...pass, elem], fail } : { pass, fail: [...fail, elem] }
    },
    { pass: [], fail: [] },
  )
}

export class PipelineEvaluator {
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
    await this.vectorStore.addDocuments(
      await this.transformers.reduce(
        async (docsPromise, transformer) => transformer.transformDocuments(await docsPromise),
        docs,
      ),
    )
  }

  formatResults() {
    const tests = partition(this.results, ({ isMatch }) => isMatch)
    const times = Object.entries(this._executionTimes)
      .map(([name, { value, units }]) => {
        if (units === 'ms') {
          value = (value / 1000.0).toFixed(2)
          units = 's'
        }

        return `${name}: ${value} ${units}`
      })
      .join(', ')

    return `${this.modelName} ${this.pipelineName}: ${tests.pass.length} / ${this.results.length}; ${times}`
  }

  async evaluate(queryTests) {
    this.results = await Promise.all(
      queryTests.map(async ({ query, expectedId }) => {
        const [[doc, score]] = await this.vectorStore.similaritySearchWithScore(query, 1)
        return { query, expectedId, doc, score, isMatch: doc.metadata.id === expectedId }
      }),
    )
  }

  static async run() {
    const models = ['Xenova/all-MiniLM-L6-v2', 'Xenova/msmarco-distilbert-base-v4']
    const pipelines = {
      stripThenSplit: [new HtmlToTextTransformer(), new RecursiveCharacterTextSplitter()],
      splitThenStrip: [RecursiveCharacterTextSplitter.fromLanguage('html'), new HtmlToTextTransformer()],
      stripOnly: [new HtmlToTextTransformer()],
      splitOnly: [RecursiveCharacterTextSplitter.fromLanguage('html')],
      rawDocs: [],
    }
    const results = []

    for (const modelName of models) {
      for (const [key, transformers] of Object.entries(pipelines)) {
        const pipeline = new PipelineEvaluator().withEmbeddingModel(modelName).withTransformers(key, transformers)
        await pipeline.addDocuments(docs)
        await pipeline.evaluate(searchQueries)
        results.push(pipeline.formatResults())
      }
    }
    return results
  }
}
