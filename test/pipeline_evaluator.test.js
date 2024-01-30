import { describe, it } from 'mocha'
import { PipelineEvaluator } from '../pipeline_evaluator.js'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { docs, searchQueries } from './bf_docs.js'

describe('comparing two BF articles', function () {
  // bf_item_ids: 25148, 25173
  // wp_post_ids: 688, 709
  this.timeout(10 * 60 * 1000)

  it('compares the pipeline configurations', async () => {
    const results = await new PipelineEvaluator()
      .withDocsAndQueries(docs, searchQueries)
      .withModel('Xenova/all-MiniLM-L6-v2')
      .withModel('Xenova/msmarco-distilbert-base-v4')
      .withModel('Supabase/gte-small')
      .withModel('Xenova/multi-qa-distilbert-cos-v1')
      .withModel('Xenova/jina-embeddings-v2-small-en')
      .withModel('Xenova/jina-embeddings-v2-base-en')
      .withPipelines({
        stripThenSplit1000: [
          new HtmlToTextTransformer(),
          new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, keepSeparator: false }),
        ],
        stripThenSplit5000: [
          new HtmlToTextTransformer(),
          new RecursiveCharacterTextSplitter({ chunkSize: 5000, chunkOverlap: 1000, keepSeparator: false }),
        ],
      })
      .run()
    console.log(JSON.stringify(results, null, 2))
  })
})
