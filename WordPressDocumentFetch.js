import axiosClient from 'axios'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text'

const loggingGet = async (url, config, logResult = true) => {
  console.log(`GET ${url}`)
  let result = await axiosClient.get(url, config)
  if (logResult) console.log(`GOT ${JSON.stringify(result.data, null, 2)}`)
  return result
}

export class WordPressDocumentFetch {
  constructor(wpClientConfig = {}) {
    this.wpClientConfig = wpClientConfig
  }

  get basicAuth() {
    const { wpApiKey, wpApiUser } = this.wpClientConfig
    const authorization = Buffer.from(`${wpApiUser}:${wpApiKey}`).toString('base64')
    return {
      headers: {
        Authorization: `Basic ${authorization}`,
      },
      withCredentials: false,
    }
  }

  async getArticles(page = 1, perPage = 100) {
    let baseUrl = this.wpClientConfig.baseUrl
    const url = new URL(`${baseUrl}/wp-json/wp/v2/articles`)
    url.searchParams.append('per_page', perPage)
    url.searchParams.append('page', page)
    url.searchParams.append('_embed', true)
    try {
      const response = await loggingGet(url.href, null, false)
      return Promise.all(response.data.map((wpArticle) => this.prepareDocument(wpArticle)))
    } catch (e) {
      return []
    }
  }

  async getArticle(articleId) {
    let baseUrl = this.wpClientConfig.baseUrl
    const url = new URL(`${baseUrl}/wp-json/wp/v2/articles/${articleId}`)
    let articleJson = await loggingGet(url.href) //, this.basicAuth)
    return this.prepareDocument(articleJson.data)
  }

  async prepareDocument(wpArticle) {
    let baseUrl = this.wpClientConfig.baseUrl

    // const authors = await loggingGet(`${baseUrl}/wp-json/coauthors/v1/authors/${wpArticle.id}`, this.basicAuth)
    return {
      pageContent: wpArticle?.content?.rendered || '',
      metadata: {
        id: wpArticle.id,
        title: wpArticle.title.rendered,
        date: wpArticle.date,
        // author: authors.data[0]?.displayName,
      },
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

export default WordPressDocumentFetch
