import { pipeline } from '@xenova/transformers'

export async function summarize(text) {
  const generator = await pipeline('summarization', 'ahmedaeb/distilbart-cnn-6-6-optimised')
  const result = await generator(text, { max_new_tokens: 100 })
  return result[0].summary_text
}
