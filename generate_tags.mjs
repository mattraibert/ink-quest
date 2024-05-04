import { PipelineEvaluation } from './pipeline_evaluation.js'
import { csvParse } from 'd3-dsv'
import { Document } from 'langchain/document'

import fs from 'fs'
import { tags } from './tags.js'

let pipeline
const makePipeline = () => {
  if (pipeline) return pipeline
  console.log('Creating new pipeline')
  pipeline = new PipelineEvaluation()
    // .withHFEmbeddingModel('Xenova/all-MiniLM-L6-v2')
    .withHFEmbeddingModel('Xenova/msmarco-distilbert-base-v4')
    .withTransformers('no transformers', [])
    .withVectorStore()
  return pipeline
}
pipeline = makePipeline()

let docs = tags.map((tag, i) => {
  const prompt = { description: 'A book about ' + tag }
  return new Document({ metadata: { id: i, tag_text: tag }, pageContent: JSON.stringify(prompt) })
})
await pipeline.addDocuments(docs)
console.log('All tags embedded')

const files = fs.readdirSync('./libib').filter((f) => f.match(/.*\.csv$/))
if (!files.length) {
  console.error('No files found')
  process.exit(1)
}

const lib = fs.readFileSync('./libib/' + files[0], 'utf8')

let parsedCsv = csvParse(lib)
// take only the first five books
const books = parsedCsv.slice(0, 5)

const tagged_books = await Promise.all(
  books.map(async (book) => {
    const query = { title: book.title, description: book.description }

    let good_tags = await pipeline.search(JSON.stringify(query), 10) //.filter(([tag, score]) => score > 0.45) //.map(([tag, score]) => tag.pageContent)
    // return { ...book, tags: good_tags.map(([tag, score]) => "AI: " + tag.metadata.tag_text)}
    return {
      ...query,
      tags: good_tags.map(([tag, score]) => `AI: ${tag.metadata.tag_text} (${Math.floor(score * 100)})`),
    }
  }),
)

console.log(JSON.stringify(tagged_books, null, 2))
