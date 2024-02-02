import { describe, it } from 'mocha'
import { WordPressDocumentFetch } from '../WordPressDocumentFetch.js'

const uniqueRandomIntegers = ({ n, min = 0, max }) => {
  if (max - min + 1 < n) {
    // return the whole range
    return new Set(Object.keys(new Array(max - min + 1)).map((i) => i + min))
  }

  const uniqueIntegers = new Set()
  while (uniqueIntegers.size < n) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
    uniqueIntegers.add(randomNumber)
  }

  return uniqueIntegers
}

describe('comparing two BF articles', function () {
  it('pulls documents from wordpress', async () => {
    let articles = await new WordPressDocumentFetch({ baseUrl: 'http://localhost:8080' }).getArticles(1, 100)
    const withAuthors = articles.filter((d) => true || d.metadata.author)
    const rands = uniqueRandomIntegers({ n: 6, max: withAuthors.length - 1 })

    const sample = Array.from(rands).map((i) => withAuthors[i])
    let data = JSON.stringify(sample, null, 2)
    console.log(data)
    console.log(`data length: ${data.length}`)
  })
})
