import axiosClient from 'axios'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'

const toDocument = (article) => {
  return {
    pageContent: article?.content?.rendered || '',
    metadata: {
      id: article.id,
      title: article.title.rendered,
      date: article.date,
      author: article.author,
    },
  }
}

export class WordPressDocumentFetch {
  constructor(wpClientConfig) {
    this.wpClientConfig = wpClientConfig
  }

  async getArticles(page = 1, perPage = 100) {
    const url = new URL(`${this.wpClientConfig.baseUrl + '/wp-json/wp/v2'}/articles`)
    url.searchParams.append('per_page', perPage)
    url.searchParams.append('page', page)
    console.log(`GET ${url}`)
    try {
      const response = await axiosClient.get(url.href)
      return response.data.map((article) => toDocument(article))
    } catch (e) {
      return []
    }
  }

  async getCleanedArticles(page = 1, perPage = 100) {
    const articles = await this.getArticles(page, perPage)
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('html')
    const stripHTML = new HtmlToTextTransformer()

    const processedArticles = await stripHTML.transformDocuments(await splitter.transformDocuments(articles))
    return processedArticles.filter((d) => d.pageContent && d.pageContent.length !== 0)
  }

  async embedAll(vectorStore) {
    let page = 1
    let articles = await this.getCleanedArticles(page++)

    const idFcn = (d) => {
      const { loc, id } = d.metadata
      const { to, from } = loc.lines
      return `${id}_${from}_${to}`
    }

    while (articles.length > 0) {
      const ids = articles.map(idFcn)
      articles = articles.map((d) => {
        d.metadata.id = idFcn(d)
        return d
      })
      await vectorStore.addDocuments(articles, { ids })
      articles = await this.getCleanedArticles(page++)
    }
  }

  async rmHtml(articles) {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('html', {})
    const stripHTML = new HtmlToTextTransformer()

    return stripHTML.transformDocuments(await splitter.transformDocuments(articles))
  }
}
