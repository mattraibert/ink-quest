import express from 'express'
import bodyParser from 'body-parser'
import WordPressDocumentFetch from './WordPressDocumentFetch.js'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PipelineEvaluation } from './pipeline_evaluation.js'
import { makeESVectorStore } from './make_elasticsearch_vector_store.js'

const app = express()
app.use(bodyParser.json())

let pipeline
const makePipeline = () => {
  if (pipeline) return pipeline
  console.log('Creating new pipeline')
  pipeline = new PipelineEvaluation()
    .withHFEmbeddingModel('Xenova/all-MiniLM-L6-v2')
    .withTransformers('stripThenSplit1000', [
      new HtmlToTextTransformer(),
      new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200, keepSeparator: false }),
    ])
    .withVectorStore(makeESVectorStore)
  return pipeline
}

app.get('/embeddings/add/all', async (req, res) => {
  const { page = 1, per_page = 10 } = req.query
  const articles = await new WordPressDocumentFetch({ baseUrl: 'http://localhost:8080' }).getArticles(page, per_page)
  pipeline = makePipeline()
  await pipeline.addDocuments(articles)
  const articleIds = articles.map((article) => article.metadata.id)
  res.send({ message: 'All articles embedded', articleIds })
})

app.get('/embeddings/add/:articleId', async (req, res) => {
  const articleId = req.params.articleId
  if (isNaN(articleId)) {
    res.status(400).send({ message: 'Invalid article id', articleId })
    return
  }
  const article = await new WordPressDocumentFetch({ baseUrl: 'http://localhost:8080' }).getArticle(articleId)
  pipeline = makePipeline()

  const embeddedIds = await pipeline.addDocuments([article])

  res.status(201).send({ message: 'Article added and embedded', embeddedIds })
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
