const { ApolloServer, gql, UserInputError } = require('apollo-server')
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
    allBooks: async (root, args) => {
      const genre = args.genre

      const book = await Book
        .find({ genres: { $in: [genre] } })
        .populate('author', {
          name: 1,
          born: 1,
          id: 1
        })

      return book
    },
    allAuthors: () => {
      return Author.find({})
    }
  },
  Author: {
    bookCount: async (root) => {
      const author = await Author.findOne({ name: root.name })
      return await Book.find({ author: author.id }).countDocuments()
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      const author = await Author.findOne({ name: args.author })

      let newAuthor = undefined
      if (!author) {
        newAuthor = new Author({ name: args.author })
        try {
          await newAuthor.save()
        } catch (error) {
          throw new UserInputError(error.message, { invalidArgs: args })
        }
      }

      const bookObject = newAuthor
        ? { ...args, author: newAuthor.id }
        : { ...args, author: author.id }

      const book = new Book(bookObject)

      try {
      await book.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
      
      return book
    },
    addAuthor: async (root, args) => {
      const author = new Author({ ...args })
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
      return author
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      author.born = args.setBornTo
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
      return author
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