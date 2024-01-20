import { describe, it } from 'mocha'
import { PipelineEvaluator } from '../pipeline_evaluator.js'

describe('comparing two BF articles', function () {
  // bf_item_ids: 25148, 25173
  // wp_post_ids: 688, 709
  this.timeout(5 * 60 * 1000)

  it('compares the pipeline configurations', async () => {
    const results = await PipelineEvaluator.setup().run()
    console.log(JSON.stringify(results, null, 2))
  })
})
