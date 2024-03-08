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
  return (
    <main>
      <input type="text" placeholder="Search" />
      <button
        onClick={async () => {
          const res = await fetch('/api/search?q=%22what%20is%20a%20propaganda%20book?%22&num=10')

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
              <h3>{result.metadata.title}</h3>
              <p>{result.pageContent}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
