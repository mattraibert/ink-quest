import { pipeline } from '@xenova/transformers'

async function pipelineEx() {
  // Create a feature-extraction pipeline
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

  // Compute sentence embeddings
  const sentences = ['This is an example sentence {author: Matt}', 'Each sentence is converted']
  const output = await extractor(sentences, { pooling: 'mean', normalize: true })
  console.log(output)
}
