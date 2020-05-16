import React, { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import FavoriteBooks from './components/FavoriteBooks'
import NewBook from './components/NewBook'
import Login from './components/Login'
import { useApolloClient, useSubscription } from '@apollo/client'
import { BOOK_ADDED } from './queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  const client = useApolloClient()

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      window.alert(`new book added: ${subscriptionData.data.bookAdded.title}`)
    }
  })

  useEffect(() => {
    const token = localStorage.getItem('library-user-token')
    if (token) {
      setToken(token)
    }
  }, [])

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
    setPage('authors')
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token && <button onClick={() => setPage('add')}>add book</button>}
        {token && <button onClick={() => setPage('favoritebooks')}>recommend</button>}
        {!token && <button onClick={() => setPage('login')}>login</button>}
        {token && <button onClick={logout}>logout</button>}
      </div>

      <Authors
        show={page === 'authors'}
        token={token}
      />

      <Books
        show={page === 'books'}
      />

      <NewBook
        show={page === 'add'}
      />

      <FavoriteBooks
        show={page === 'favoritebooks'}
      />

      <Login
        show={page === 'login'}
        setToken={setToken}
        setPage={setPage}
      />

    </div>
  )
}

export default App