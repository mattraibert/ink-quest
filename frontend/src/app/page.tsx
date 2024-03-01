'use client'
// http://localhost:3031/search?q=%22what%20is%20a%20propaganda%20book?%22&num=5
// {"message":"Search results","results":[[{"pageContent":"of Mad Libs. And throughout, there are multiple, telling references to the power\nof marginalia to, “under certain conditions, . . . rewrite the text.”\nParticipation reads like an effort to create those very conditions. “I could\nlist the ambient and direct forces acting on each of us in this story, these\nstories,” E teases, “or I could let you list them yourself, in the margins of\nthis or of one of the books in your own stack.”","metadata":{"id":12018,"title":"The Groups","date":"2022-11-29T16:00:00","loc":{"lines":{"from":115,"to":120}}}},0.4481209],[{"pageContent":"If all that I have said above is about the subtle transformation of knowledge\ninto art, then another favorite book of mine from 2022 is the memoir STAY TRUE\nby Hua Hsu. Debates on Asian American identity, music, and culture are unpacked\nin a language so limpid and pure that thought becomes pure feeling. —AMITAVA\nKUMAR\n\nI’VE BEEN ASKED to read pretty much every book on work that has come out in the\nlast few years, and many of them are very good. But for this end-of-year wrap-up\nI’ve chosen a book that is not about work, except in the way that it is a book\nabout capitalism; and, as Brett Scott writes, the true lifeblood of that system\nis not money but people carrying out labor.","metadata":{"id":12005,"title":"The Lit Parade","date":"2022-11-29T16:00:00","loc":{"lines":{"from":62,"to":72}}}},0.4468373],[{"pageContent":"devoting all his hours to undisturbed work in his darkened room with artificial\nillumination, so that none of those intricate arabesques might escape him.” And\nthere is something feverish and exultant in the novel’s final leap into\nabstraction, when the narrator finally understands what he must make and how: a\nbook like an optician’s magnifying glass that offers its readers “the means of\nreading within themselves,” the expression, in fiction, of a new kind of\npsychology that chronicles individual peculiarities and generates, from all the\nsmoke and the noise, universal laws of human character.","metadata":{"id":12030,"title":"Ruminations in an Emergency","date":"2022-11-29T16:00:00","loc":{"lines":{"from":248,"to":255}}}},0.43698868],[{"pageContent":"This volume supplements a selection of the artists’ own writings—a barrage of\ntravelogues, anecdotes, and vignettes on topazes, lunar calendars, mermaids, and\nthe peril of papaya skins on lazy stomachs—with contributions from curators\nPhilippe Vergne and Anthony Huberman, who each take a fittingly elegiac tone for\nthe collaborative practice, which has come to an end after nearly two decades.\nAs the artists themselves write, “Whenever you decide to abolish the unspoken\npact between film and reality, the image moves away from coherence and stops\nclaiming to be man’s view of reality; it begins to travel down other roads.” Let\nthis book be the travel guide through that parallel world. —K. S.","metadata":{"id":12007,"title":"Artful Volumes","date":"2022-11-29T16:00:00","loc":{"lines":{"from":55,"to":63}}}},0.4343955],[{"pageContent":"But I’m getting ahead of myself—to borrow a trick from the novel itself, which\nis studded with direct, often apologetic, address to the reader: “You wanted a\nstory and I’m sorry, it’s difficult, things are not proceeding along linear\nlines.” In addition to writing poetry and fiction, Moschovakis works as a\ntranslator from French (her translation of David Diop’s At Night All Blood Is\nBlack won the 2021 International Booker Prize), and she has a professed\nindifference to the concept of genre. Unsurprisingly, then, Participation makes\nuse of a host of literary devices not typically associated with fiction: lists,\ncitation, erasure, enjambment, to name a few. Characters suddenly and\npermanently drop out of view, only for their disappearance to be regretfully\nnoted by the narrator. Such meta techniques are of course not new—E herself\nmentions the “small poems” that “interrupt” Eve Kosofsky Sedgwick’s A Dialogue\non Love, “as if not to let us get too comfortable (in the flow of the","metadata":{"id":12018,"title":"The Groups","date":"2022-11-29T16:00:00","loc":{"lines":{"from":44,"to":56}}}},0.43431705]]}
import { useState } from 'react'

type result = {
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
}

export default function Home() {
  // search result state
  const [searchResults, setSearchResults] = useState<result[]>([])
  return (
    <main>
      <input type="text" placeholder="Search" />
      <button
        onClick={async () => {
          const res = await fetch('http://localhost:3031/search?q=%22what%20is%20a%20propaganda%20book?%22&num=5')
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
          {searchResults.map((result) => (
            <li key={result.metadata.id}>
              <h3>{result.metadata.title}</h3>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
