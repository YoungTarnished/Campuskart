const http = require('http')
const mongoose = require('mongoose')
const env = require('./config/env')
const { connectDB } = require('./config/db')
const app = require('./app')
const { initSocket } = require('./sockets')
const { startAuctionScheduler, refreshAuctionStates } = require('./services/auctionService')
const { imageStorageMode } = require('./services/uploadService')

if (env.isProduction && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required in production')
  process.exit(1)
}

async function start() {
  await connectDB()
  await refreshAuctionStates()
  const server = http.createServer(app)
  initSocket(server)
  const timer = startAuctionScheduler()

  server.listen(env.port, () => {
    const storage = imageStorageMode()
    console.log(`CampusKart API listening on http://localhost:${env.port}`)
    console.log(`Image storage: ${storage}${storage === 'local' ? ' (Cloudinary env vars are empty, using backend/uploads)' : ''}`)
    if (env.demoVerification) {
      console.log('Demo verification is ON. Verification and reset links are returned by the API instead of email.')
    }
  })

  async function shutdown() {
    clearInterval(timer)
    server.close()
    await mongoose.disconnect()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((err) => {
  console.error('Failed to start CampusKart API.', err.message)
  console.error('Start MongoDB first, for example: docker compose up -d')
  process.exit(1)
})
