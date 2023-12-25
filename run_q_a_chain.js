import { OpenAI } from 'langchain/llms/openai'
import { VectorDBQAChain } from 'langchain/chains'

async function runQAChain(vectorStore) {
  /* Use as part of a chain (currently no metadata filters) for LLM query */
  const model = new OpenAI()
  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 1,
    returnSourceDocuments: true,
  })
  const response = await chain.call({ query: 'What is Elasticsearch?' })

  console.log(JSON.stringify(response, null, 2))
  /*
    {
      "text": " Elasticsearch is a distributed, RESTful search engine optimized for speed and relevance on production-scale workloads.",
      "sourceDocuments": [
        {
          "pageContent": "Elasticsearch a distributed, RESTful search engine optimized for speed and relevance on production-scale workloads.",
          "metadata": {
            "baz": "qux"
          }
        }
      ]
    }
    */
}
