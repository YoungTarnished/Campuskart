const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongo

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

afterEach(async () => {
  const collections = await mongoose.connection.db.collections()
  for (const collection of collections) {
    await collection.deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})
