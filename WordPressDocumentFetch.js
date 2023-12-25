import axiosClient from 'axios'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text'

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

  async getArticles(page = 1, per_page = 100) {
    const url = new URL(`${this.wpClientConfig.baseUrl + `/wp-json/wp/v2`}/articles`)
    url.searchParams.append('per_page', per_page)
    url.searchParams.append('page', page)
    console.log(`GET ${url}`)
    try {
      let response = await axiosClient.get(url.href)
      return response.data.map((article) => toDocument(article))
    } catch (e) {
      return []
    }
  }

  async getCleanedArticles(page = 1, per_page = 100) {
    let articles = await this.getArticles(page, per_page)
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('html')
    const stripHTML = new HtmlToTextTransformer()

    let processedArticles = await stripHTML.transformDocuments(await splitter.transformDocuments(articles))
    return processedArticles.filter((d) => d.pageContent && d.pageContent.length !== 0)
  }

  async embedAll(vectorStore) {
    let page = 1
    let articles = await this.getCleanedArticles(page++)

    let idFcn = (d) => {
      const { loc, id } = d.metadata
      const { to, from } = loc.lines
      return `${id}_${from}_${to}`
    }

    while (articles.length > 0) {
      let ids = articles.map(idFcn)
      articles = articles.map((d) => {
        d.metadata.id = idFcn(d)
        return d
      })
      await vectorStore.addDocuments(articles, { ids: ids })
      articles = await this.getCleanedArticles(page++)
    }
  }

  async rmHtml(articles) {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('html', {})
    const stripHTML = new HtmlToTextTransformer()

    return stripHTML.transformDocuments(await splitter.transformDocuments(articles))
  }
}
