const { ApolloServer, gql } = require('apollo-server')
const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

console.log('connecting to', MONGODB_URI)

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB', error.message)
  })

const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    addAuthor(
      name: String!
      born: Int!
    ): Author
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
      return Book
        .find({})
        .populate('author', {
          name: 1,
          born: 1,
          id: 1
        })
      /*
      let filteredBooks = books
      
      if (args.author) {
        filteredBooks = filteredBooks.filter(b => b.author === args.author)
      }

      if (args.genre) {
        filteredBooks = filteredBooks.filter(b => b.genres.includes(args.genre))
      }

      return filteredBooks
    */
    },
    allAuthors: () => {
      return Author.find({})
    }
  },
  Author: {
    bookCount: (root) => { 
      //return Book.find({ author: root.name }).length
      //return books.filter(b => b.author === root.name).length
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      const book = new Book({ ...args })
      await book.save()
      return book
      /*
      const book = { ...args, id: uuid() }
      books = books.concat(book)

      if (!authors.find(a => a.name === args.author)) {
        const newAuthor = {
          name: args.author,
          id: uuid(),
        }
        authors.push(newAuthor)
      }

      return book
      */
    },
    addAuthor: async (root, args) => {
      const author = new Author({ ...args })
      await author.save()
      return author
    },
    editAuthor: (root, args) => {
      /*
      const author = authors.find(a => a.name === args.name)
      if (!author) {
        return null
      }

      const updatedAuthor = { ...author, born: args.setBornTo }
      authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
      return updatedAuthor
      */
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})