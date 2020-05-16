import React, { useState, useEffect } from 'react'
import { ALL_BOOKS } from '../queries'
import { useQuery, useLazyQuery } from '@apollo/client'

const Books = (props) => {
  const [filteredBooks, setFilteredBooks] = useState([])
  const [genreFilter, setGenreFilter] = useState(null)
  const [genres, setGenres] = useState([])
  
  const resultAllBooks = useQuery(ALL_BOOKS)
  const [getFilteredBooks, resultFilteredBooks] = useLazyQuery(ALL_BOOKS, {
    variables: { genre: genreFilter}
  })

  useEffect(() => {
    if (resultAllBooks.data) {
      const allBooks = resultAllBooks.data.allBooks
      setGenres(Array.from(new Set(allBooks.map(book => book.genres).flat(1))))
    }
  }, [resultAllBooks.data]) // eslint-disable-line

  useEffect(() => {
    setFilteredBooks([])
    getFilteredBooks()
  }, [genreFilter]) // eslint-disable-line

  useEffect(() => {
    if (resultFilteredBooks.data) {
      setFilteredBooks(resultFilteredBooks.data.allBooks)
    }
  }, [resultFilteredBooks.data]) // eslint-disable-line

  if (!props.show) {
    return null
  }

  if (resultAllBooks.loading || resultFilteredBooks.loading) {
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
          {filteredBooks.map(a =>
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