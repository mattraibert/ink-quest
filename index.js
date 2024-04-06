import express from 'express'
import bodyParser from 'body-parser'
import WordPressDocumentFetch from './WordPressDocumentFetch.js'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PipelineEvaluation } from './pipeline_evaluation.js'
import { makeESVectorStore } from './make_elasticsearch_vector_store.js'
import { tags } from './tags.js'
import { Document } from 'langchain/document'

const app = express()
app.use(bodyParser.json())

let pipeline
const makePipeline = () => {
  if (pipeline) return pipeline
  console.log('Creating new pipeline')
  pipeline = new PipelineEvaluation()
    .withHFEmbeddingModel('Xenova/all-MiniLM-L6-v2')
    .withTransformers('no transformers', [])
    .withVectorStore(makeESVectorStore)
  return pipeline
}

app.get('/embeddings/add/all', async (req, res) => {
  const { page = 1, per_page = 10 } = req.query
  pipeline = makePipeline()
  let docs = tags.map((tag, i) => new Document({ metadata: { id: i }, pageContent: tag }))
  await pipeline.addDocuments(docs)
  res.send({ message: 'All tags embedded' })
})

app.get('/search', async (req, res) => {
  const { q, num = 1, excludeIds = [], dateRange, author } = req.query

  pipeline = makePipeline()

  const results = await pipeline.search(q, num)

  res.send({ message: 'Search results', results })
})

const PORT = 3031
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
