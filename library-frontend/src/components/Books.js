import React, { useState, useEffect } from 'react'
import { ALL_BOOKS } from '../queries'
import { useQuery } from '@apollo/client'

const Books = (props) => {
  const [books, setBooks] = useState([])
  const [genreFilter, setGenreFilter] = useState(null)
  const [genres, setGenres] = useState([])
  
  const result = useQuery(ALL_BOOKS)

  useEffect(() => {
    if (result.data) {
      const allBooks = result.data.allBooks
      setBooks(allBooks)
      setGenres(Array.from(new Set(allBooks.map(book => book.genres).flat(1))))
    }
  }, [result.data]) // eslint-disable-line

  const filteredBooks = () => {
    const filtered = genreFilter
      ? books.filter(book => book.genres.includes(genreFilter))
      : books
    return filtered
  }

  if (!props.show) {
    return null
  }

  if (result.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>books</h2>
      {genreFilter && <div>in genre <strong>{genreFilter}</strong></div>}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {filteredBooks().map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      {genres.map(genre =>
        <button key={genre} onClick={() => setGenreFilter(genre)}>{genre}</button>
      )}
      <button onClick={() => setGenreFilter(null)}>all genres</button>
    </div>
  )
}

export default Books