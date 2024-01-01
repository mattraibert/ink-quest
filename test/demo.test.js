import { expect } from 'chai'
import { describe, it } from 'mocha'

import { makeHNSWLibVectorStore } from '../make_hnswlib_vector_store.js'

describe('makeHNSWLibVectorStore', () => {
  it('does semantic search with multiple documents', async () => {
    const store = makeHNSWLibVectorStore()
    await store.addDocuments([
      { id: '1', pageContent: 'hello world' },
      { id: '2', pageContent: 'goodbye world' },
    ])
    expect(await store.similaritySearch('hello', 1)).to.eql([{ id: '1', pageContent: 'hello world' }])
    expect(await store.similaritySearch('goodbye', 1)).to.eql([{ id: '2', pageContent: 'goodbye world' }])
    expect(await store.similaritySearch('greetings', 1)).to.eql([{ id: '1', pageContent: 'hello world' }])
    expect(await store.similaritySearch('death', 1)).to.eql([{ id: '2', pageContent: 'goodbye world' }])
    expect(await store.similaritySearch('spaghetti', 1)).to.eql([{ id: '2', pageContent: 'goodbye world' }])
    expect(await store.similaritySearch('spaghetti', 1)).to.eql([{ id: '2', pageContent: 'goodbye world' }])
    expect(await store.similaritySearch('soup', 1)).to.eql([{ id: '1', pageContent: 'hello world' }])
    expect(await store.similaritySearch('dessert', 1)).to.eql([{ id: '2', pageContent: 'goodbye world' }])
    expect(await store.similaritySearch('ciao', 1)).to.eql([{ id: '2', pageContent: 'goodbye world' }])
    expect(await store.similaritySearch('genesis', 1)).to.eql([{ id: '1', pageContent: 'hello world' }])
  })

  it('does basic similarity search', async () => {
    const store = makeHNSWLibVectorStore()
    await store.addDocuments([{ id: '1', pageContent: 'hello world' }])
    const result = await store.similaritySearch('hello', 1)
    expect(result).to.eql([{ id: '1', pageContent: 'hello world' }])
  })
})
