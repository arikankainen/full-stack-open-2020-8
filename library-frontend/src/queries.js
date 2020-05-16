import { gql  } from '@apollo/client'

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    id
    title
    author {
      name
      born
      bookCount
    }
    genres
    published
  }
`
export const ALL_AUTHORS = gql`
  query {
    allAuthors  {
      name
      born
      bookCount
    }
  }
`
export const ALL_BOOKS = gql`
  query ($genre: String) {
    allBooks (genre: $genre) {
      title
      author {
        name
        born
        bookCount
      }
      genres
      published
    }
  }
`
export const ME = gql`
  query {
    me {
      username
      favoriteGenre
    }
  }
`
export const CREATE_BOOK = gql`
  mutation createBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!) {
    addBook(
      title: $title,
      author: $author,
      published: $published,
      genres: $genres
    ) {
      title
      author {
        name
        born
        bookCount
      }
      published
      genres
    }
  }
`
export const SET_BIRTHYEAR = gql`
  mutation setBirthyear($name: String!, $setBornTo: Int!) {
    editAuthor(
      name: $name,
      setBornTo: $setBornTo
    ) {
      name
      born
    }
  }
`
export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`
export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`