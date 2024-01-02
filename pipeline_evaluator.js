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
    return this
  }

  async evaluate(queryTests) {
    const results = await Promise.all(
      queryTests.map(async ({ query, expectedId }) => {
        const [[doc, score]] = await this.vectorStore.similaritySearchWithScore(query, 1)
        return { query, expectedId, doc, score, isMatch: doc.metadata.id === expectedId }
      }),
    )

    const { pass } = partition(results, ({ isMatch }) => isMatch)
    return {
      name: `${this.modelName}-${this.pipelineName}`,
      matchRatio: `${pass.length} / ${queryTests.length}`,
      // results,
      // failedQueries: fail.map(({ query }) => query),
    }
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
        const pipeline = await new PipelineEvaluator()
          .withEmbeddingModel(modelName)
          .withTransformers(key, transformers)
          .addDocuments(docs)
        results.push(await pipeline.evaluate(searchQueries))
      }
    }
    return results
  }
}
