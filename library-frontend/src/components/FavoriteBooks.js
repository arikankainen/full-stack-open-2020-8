import React, { useState, useEffect } from 'react'
import { ALL_BOOKS, ME } from '../queries'
import { useQuery } from '@apollo/client'

const Books = (props) => {
  const [books, setBooks] = useState([])
  const [genreFilter, setGenreFilter] = useState(null)
  const resultAllBooks = useQuery(ALL_BOOKS)
  const resultUser = useQuery(ME, {
    //pollInterval: 2000
  })

  useEffect(() => {
    if (resultAllBooks.data) {
      const allBooks = resultAllBooks.data.allBooks
      setBooks(allBooks)
    }
  }, [resultAllBooks.data])

  useEffect(() => {
    if (resultUser.data && resultUser.data.me) {
      setGenreFilter(resultUser.data.me.favoriteGenre)
    }
  }, [resultUser])

  const filteredBooks = () => {
    const filtered = genreFilter
      ? books.filter(book => book.genres.includes(genreFilter))
      : books
    return filtered
  }

  if (!props.show) {
    return null
  }

  if (resultAllBooks.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>recommendations</h2>
      <div>books in your favorite genre <strong>{genreFilter}</strong></div>
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
    </div>
  )
}

export default Books