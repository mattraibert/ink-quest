import { Document } from 'langchain/document'

export function getDocs() {
  return [
    new Document({
      metadata: { id: 1, foo: 'bar' },
      pageContent: 'Elasticsearch is a powerful vector db',
    }),
    new Document({
      metadata: { id: 2, foo: 'bar' },
      pageContent: 'the quick brown fox jumped over the lazy dog',
    }),
    new Document({
      metadata: { id: 3, baz: 'qux' },
      pageContent: 'lorem ipsum dolor sit amet',
    }),
    new Document({
      metadata: { id: 4, baz: 'qux' },
      pageContent:
        'Elasticsearch a distributed, RESTful search engine optimized for speed and relevance on production-scale workloads.',
    }),
  ]
}
