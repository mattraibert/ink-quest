import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'

export const makeHNSWLibVectorStore = (modelName = 'Xenova/msmarco-distilbert-base-v4') => {
  let embedModel = new HuggingFaceTransformersEmbeddings({ modelName })
  return new HNSWLib(embedModel, { space: 'cosine' })
}

export const loadHNSWLibVectorStore = async (directory) => {
  let embedModel = new HuggingFaceTransformersEmbeddings({ modelName: 'Xenova/msmarco-distilbert-base-v4' })
  return await HNSWLib.load(directory, embedModel)
}
