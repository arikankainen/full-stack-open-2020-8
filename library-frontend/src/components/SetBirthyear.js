import React, { useState } from 'react'
import { SET_BIRTHYEAR, ALL_AUTHORS, ALL_BOOKS } from '../queries'
import { useMutation } from '@apollo/client'

const SetBirthyear = () => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [setBirthyear] = useMutation(SET_BIRTHYEAR, {
    refetchQueries: [ { query: ALL_AUTHORS }, { query: ALL_BOOKS } ]
  })

  const submit = async (event) => {
    event.preventDefault()

    setBirthyear({
      variables: {
        name,
        setBornTo: Number(born)
      }
    })

    setName('')
    setBorn('')
  }

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          name
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </div>
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  )
}

export default SetBirthyear