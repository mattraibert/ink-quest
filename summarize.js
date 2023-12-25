import { pipeline } from '@xenova/transformers'

export async function summarize(text) {
  let generator = await pipeline('summarization', 'ahmedaeb/distilbart-cnn-6-6-optimised')
  let result = await generator(text, { max_new_tokens: 100 })
  return result[0].summary_text
}
