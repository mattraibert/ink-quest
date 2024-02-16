import { Client } from '@elastic/elasticsearch'
import { ElasticVectorSearch } from 'langchain/vectorstores/elasticsearch'

export function makeESVectorStore(model) {
  const config = {
    node: process.env.ELASTIC_URL ?? 'http://127.0.0.1:9200',
  }
  if (process.env.ELASTIC_API_KEY) {
    config.auth = {
      apiKey: process.env.ELASTIC_API_KEY,
    }
  } else if (process.env.ELASTIC_USERNAME && process.env.ELASTIC_PASSWORD) {
    config.auth = {
      username: process.env.ELASTIC_USERNAME,
      password: process.env.ELASTIC_PASSWORD,
    }
  }
  const clientArgs = {
    client: new Client(config),
    indexName: process.env.ELASTIC_INDEX ?? 'test_vectorstore',
  }

  return new ElasticVectorSearch(model, clientArgs)
}
