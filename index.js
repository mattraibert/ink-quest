import express from 'express'
import bodyParser from 'body-parser'
import WordPressDocumentFetch from './WordPressDocumentFetch.js'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PipelineEvaluation } from './pipeline_evaluation.js'
// Assuming a simple in-memory structure for articles
let articles = [] // { id, title, content, embedding }
let embeddingsIndex = {} // To quickly check if an article is embedded

const app = express()
app.use(bodyParser.json())

let pipeline
const makePipeline = () => {
  pipeline ||= new PipelineEvaluation()
    .withEmbeddingModel('Xenova/all-MiniLM-L6-v2')
    .withTransformers('stripThenSplit1000', [
      new HtmlToTextTransformer(),
      new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, keepSeparator: false }),
    ])
  return pipeline
}

// Endpoint to add a new article and immediately embed it
app.post('/embeddings/add/:articleId', async (req, res) => {
  const articleId = req.params.articleId
  const article = new WordPressDocumentFetch({ baseUrl: 'http://localhost:8080' }).getArticle(articleId)
  pipeline = makePipeline()
  pipeline.addDocuments([article])

  res.status(201).send({ message: 'Article added and embedded', articleId })
})

// Search endpoint
app.get('/search', (req, res) => {
  const { q, num = 10, excludeIds = [], dateRange, author } = req.query

  const results = pipeline.search(q)

  res.send({ message: 'Search results', results })
})
