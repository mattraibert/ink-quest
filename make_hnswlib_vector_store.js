import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers'
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib'

export const makeHNSWLibVectorStore = (modelName = 'Xenova/msmarco-distilbert-base-v4') => {
  const embedModel = new HuggingFaceTransformersEmbeddings({ modelName })
  return new HNSWLib(embedModel, { space: 'cosine' })
}

export const loadHNSWLibVectorStore = async (directory) => {
  const embedModel = new HuggingFaceTransformersEmbeddings({ modelName: 'Xenova/msmarco-distilbert-base-v4' })
  return await HNSWLib.load(directory, embedModel)
}
