import { docs, searchQueries } from './test/bf_docs.js'
import { PipelineEvaluation } from './pipeline_evaluation.js'

export class PipelineEvaluator {
  models = []
  pipelines = {}
  docs = docs

  withDocs(docs) {
    this.docs = docs
    return this
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
      await evaluator.addDocuments(this.docs)
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
