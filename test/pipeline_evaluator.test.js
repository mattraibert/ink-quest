import { describe, it } from 'mocha'
import { PipelineEvaluator } from '../pipeline_evaluator.js'
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

describe('comparing two BF articles', function () {
  // bf_item_ids: 25148, 25173
  // wp_post_ids: 688, 709
  this.timeout(10 * 60 * 1000)

  it('compares the pipeline configurations', async () => {
    let htmlSplitter = RecursiveCharacterTextSplitter.fromLanguage('html')
    let htmlStripper = new HtmlToTextTransformer()
    const results = await new PipelineEvaluator()
      .withModel('Xenova/all-MiniLM-L6-v2')
      .withModel('Xenova/msmarco-distilbert-base-v4')
      .withModel('WhereIsAI/UAE-Large-V1')
      // .withModel('intfloat/e5-mistral-7b-instruct')
      .withPipelines({
        stripThenSplit100: [
          htmlStripper,
          new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 20, keepSeparator: false }),
        ],
        stripThenSplit1000: [
          htmlStripper,
          new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, keepSeparator: false }),
        ],
        stripThenSplit2000: [
          htmlStripper,
          new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 400, keepSeparator: false }),
        ],
        stripThenSplit5000: [
          htmlStripper,
          new RecursiveCharacterTextSplitter({ chunkSize: 5000, chunkOverlap: 1000, keepSeparator: false }),
        ],
        stripThenSplit10000: [
          htmlStripper,
          new RecursiveCharacterTextSplitter({ chunkSize: 10000, chunkOverlap: 2000, keepSeparator: false }),
        ],
        splitThenStrip: [htmlSplitter, htmlStripper],
        splitOnly: [htmlSplitter],
        stripOnly: [htmlStripper],
        rawDocs: [],
      })
      .run()
    console.log(JSON.stringify(results, null, 2))
  })
})
