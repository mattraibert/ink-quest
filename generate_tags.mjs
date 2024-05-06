import { PipelineEvaluation } from './pipeline_evaluation.js'
import { csvParse } from 'd3-dsv'
import { Document } from 'langchain/document'
import fs from 'fs'
import nextEnv from '@next/env'

import { tags as tagList } from './tags.js'
import { makeESVectorStore } from './make_elasticsearch_vector_store.js'

const projectDir = process.cwd()
nextEnv.loadEnvConfig(projectDir)

class BookTagger {
  constructor() {
    this.pipeline = new PipelineEvaluation()
      .withOAIEmbeddingModel('text-embedding-3-large')
      // .withHFEmbeddingModel('Xenova/msmarco-distilbert-base-v4')
      // .withHFEmbeddingModel('mixedbread-ai/mxbai-embed-large-v1)
      // .withHFEmbeddingModel('Xenova/all-MiniLM-L6-v2')
      .withTransformers('no transformers', [])
      .withVectorStore(makeESVectorStore)
  }

  listFiles() {
    return fs.readdirSync('./libib').filter((f) => f.match(/.*\.csv$/))
  }

  async embedTags(tags) {
    let docs = tags.map(
      (tag, i) =>
        new Document({
          metadata: { id: i, tag_text: tag },
          pageContent: JSON.stringify({ description: 'A book about ' + tag }),
        }),
    )
    await this.pipeline.addDocuments(docs)
  }

  async tagBook(book) {
    const query = { title: book.title, description: book.description }
    const tags = await this.pipeline.search(JSON.stringify(query), 10)

    const formattedTags = tags.map(([tag, score]) => `AI: ${tag.metadata.tag_text} (${Math.floor(score * 100)})`)
    return {
      ...query,
      tags: formattedTags,
    }
  }

  async tagBooks(books) {
    return await Promise.all(books.map((book) => this.tagBook(book)))
  }
}
const tagger = new BookTagger()

await tagger.embedTags(tagList)
console.log('All tags embedded')
const files = tagger.listFiles()
if (!files.length) {
  console.error('No files found')
  process.exit(1)
}

const lib = fs.readFileSync('./libib/' + files[0], 'utf8')

let parsedCsv = csvParse(lib)
// take only the first five books
const books = parsedCsv //.slice(0, 5)

const taggedBooks = await tagger.tagBooks(books)
console.log(JSON.stringify(taggedBooks, null, 2))
