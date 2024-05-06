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

let docs = tags.map((tag, i) => new Document({ metadata: { id: i }, pageContent: tag }))
await pipeline.addDocuments(docs)
console.log('All tags embedded')

const files = fs.readdirSync('./').filter((f) => f.match(/.*library.*\.csv$/))
if (!files.length) {
  console.error('No files found')
  process.exit(1)
}

const lib = fs.readFileSync(files[0], 'utf8')

const books = [csvParse(lib)[0]]

const tagged_books = await Promise.all(
  books.map(async (book) => {
    const { description, title } = book
    const q = JSON.stringify({ title, description })

    console.log(`Searching for ${q}`)
    let good_tags = (await pipeline.search(q, 5)).filter(([tag, score]) => score > 0.45) //.map(([tag, score]) => tag.pageContent)
    return { ...book, tags: good_tags }
  }),
)

console.log(JSON.stringify(tagged_books, null, 2))
