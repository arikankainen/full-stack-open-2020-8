const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('./models/user')
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
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
    books: [Book!]
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
    me: User
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
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
  
  type Subscription {
    bookAdded: Book!
    authorAdded: Author!
  }
`

const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

const resolvers = {
  Query: {
    bookCount: () => {
      console.log('Query.bookCount')
      return Book.collection.countDocuments()
    },
    authorCount: () => {
      console.log('Query.authorCount')
      return Author.collection.countDocuments()
    },
    allBooks: async (root, args) => {
      console.log('Query.allBooks')

      const genre = args.genre
      const author = args.author

      let genreFilter = {}
      let authorFilter = {}

      if (genre) {
        genreFilter = { genres: { $in: [genre] } }
      }

      if (author) {
        const filteredAuthor = await Author.findOne({ name: args.author })
        authorFilter = { author: filteredAuthor.id }
      }
      
      const book = await Book
        .find({$and:[genreFilter, authorFilter]})
        .populate('author')

      return book
    },
    allAuthors: () => {
      console.log('Query.allAuthors')
      return Author.find({}).populate('books')
    },
    me: (root, args, context) => {
      console.log('Query.me')
      return context.currentUser
    },
  },
  Author: {
    bookCount: async (root) => {
      console.log('Author.bookCount (ei haeta tietokannasta)')
      return root.books.length
      /*
      const author = await Author.findOne({ name: root.name })
      return await Book.find({ author: author.id }).countDocuments()
      */
    }
  },
  Mutation: {
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      })
      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
      return user
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new UserInputError('wrong credentials')
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }
      
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      
      let book = new Book({ ...args })
      let newAuthor = undefined
      let existingAuthor = await Author.findOne({ name: args.author })
      
      console.log('existing:', existingAuthor) // *************
      
      if (!existingAuthor) {
        newAuthor = new Author({
          name: args.author,
          books: [ book.id ],
        })
        
        console.log('new:', newAuthor) // *************
        
        book.author = newAuthor.id

        try {
          await newAuthor.save()
          pubsub.publish('AUTHOR_ADDED', { authorAdded: newAuthor })
        } catch (error) {
          throw new UserInputError(error.message, { invalidArgs: args })
        }
      } else {
        book.author = existingAuthor.id
        existingAuthor.books = existingAuthor.books.concat(book.id)

        console.log('existing+books:', existingAuthor) // *************
        
        try {
          await existingAuthor.save()
        } catch (error) {
          throw new UserInputError(error.message, { invalidArgs: args })
        }
      }

      try {
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
      
      const populatedBook = await book.populate('author').execPopulate()
      pubsub.publish('BOOK_ADDED', { bookAdded: populatedBook })
      return populatedBook
    },
    addAuthor: async (root, args) => {
      const author = new Author({ ...args })
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
      pubsub.publish('AUTHOR_ADDED', { authorAdded: author })
      return author
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      
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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
    authorAdded: {
      subscribe: () => pubsub.asyncIterator(['AUTHOR_ADDED'])
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )

      const currentUser = await User
        .findById(decodedToken.id)

      return { currentUser }
    }
  }  
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})