import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { docs, searchQueries } from './test/bf_docs.js'
import { PipelineEvaluation } from './pipeline_evaluation.js'

export class PipelineEvaluator {
  models = []
  pipelines = {}

  static setup() {
    return (
      new PipelineEvaluator()
        .withModel('Xenova/all-MiniLM-L6-v2')
        // .withModel('Xenova/msmarco-distilbert-base-v4')
        // .withModel('WhereIsAI/UAE-Large-V1')
        // .withModel('intfloat/e5-mistral-7b-instruct')
        .withPipelines({
          stripThenSplit100: [
            new HtmlToTextTransformer(),
            new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 20, keepSeparator: false }),
          ],
          stripThenSplit1000: [
            new HtmlToTextTransformer(),
            new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, keepSeparator: false }),
          ],
          stripThenSplit2000: [
            new HtmlToTextTransformer(),
            new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 400, keepSeparator: false }),
          ],
          stripThenSplit5000: [
            new HtmlToTextTransformer(),
            new RecursiveCharacterTextSplitter({ chunkSize: 5000, chunkOverlap: 1000, keepSeparator: false }),
          ],
          stripThenSplit10000: [
            new HtmlToTextTransformer(),
            new RecursiveCharacterTextSplitter({ chunkSize: 10000, chunkOverlap: 2000, keepSeparator: false }),
          ],
          splitThenStrip: [RecursiveCharacterTextSplitter.fromLanguage('html'), new HtmlToTextTransformer()],
          splitOnly: [RecursiveCharacterTextSplitter.fromLanguage('html')],
          stripOnly: [new HtmlToTextTransformer()],
          rawDocs: [],
        })
    )
  }

  async run() {
    const evaluators = this.models.flatMap((modelName) => {
      return Object.entries(this.pipelines).map(([pipelineName, transformers]) => {
        return new PipelineEvaluation().withEmbeddingModel(modelName).withTransformers(pipelineName, transformers)
      })
    })

    const results = []
    // using a for loop so that only one evaluator runs at a time
    for (const evaluator of evaluators) {
      await evaluator.addDocuments(docs)
      await evaluator.evaluate(searchQueries)
      results.push(evaluator.formatResults())
    }

    return results
  }

  withModel(modelName) {
    this.models.push(modelName)
    return this
  }

  withPipeline(pipelineName, transformers) {
    this.pipelines[pipelineName] = transformers
    return this
  }

  withPipelines(pipelines) {
    this.pipelines = { ...this.pipelines, ...pipelines }
    return this
  }
}
