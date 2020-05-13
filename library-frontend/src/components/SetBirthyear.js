import React, { useState, useEffect } from 'react'
import Select from 'react-select';
import { SET_BIRTHYEAR, ALL_AUTHORS, ALL_BOOKS } from '../queries'
import { useMutation } from '@apollo/client'

const SetBirthyear = ({ authors }) => {
  const [name, setName] = useState({})
  const [born, setBorn] = useState('')
  const [options, setOptions] = useState({})

  const [setBirthyear] = useMutation(SET_BIRTHYEAR, {
    refetchQueries: [ { query: ALL_AUTHORS }, { query: ALL_BOOKS } ]
  })

  useEffect(() => {
    const options = authors.map(author => {
      return { value: author.name, label: author.name }
    })
    setOptions(options)
  }, [authors])

  const submit = async (event) => {
    event.preventDefault()

    setBirthyear({
      variables: {
        name: name.value,
        setBornTo: Number(born)
      }
    })

    setName({})
    setBorn('')
  }

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          <Select
            value={name}
            onChange={opt => setName(opt)}
            options={options}
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