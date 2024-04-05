'use client'
import { useState } from 'react'

type result = [
  {
    pageContent: string
    metadata: {
      id: number
      title: string
      date: string
      loc: {
        lines: {
          from: number
          to: number
        }
      }
    }
  },
  number,
]
export default function Home() {
  // search result state
  const [searchResults, setSearchResults] = useState<result[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <main>
      <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <button
        onClick={async () => {
          const url = new URL(`http://localhost:3000/api/search`)
          url.searchParams.set('q', searchQuery)
          url.searchParams.set('num', '100')
          const res = await fetch(url.toString())

          const data = await res.json()

          console.log(data)
          setSearchResults(data.results)
        }}
      >
        Search
      </button>
      <div>
        <h2>Results</h2>
        <ul>
          {searchResults.map(([result, score], i) => (
            <li key={i}>
              <h3>
                [{result.metadata.id}] {result.metadata.title} ({score})
              </h3>
              <p>{result.pageContent}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
