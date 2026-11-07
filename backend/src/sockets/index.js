const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User')
const Conversation = require('../models/Conversation')
const { setIO } = require('../services/notificationService')
const { sendMessage } = require('../services/chatService')

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'] },
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next()
    try {
      const decoded = jwt.verify(token, env.jwtSecret)
      const user = await User.findById(decoded.id)
      if (!user || user.tokenVersion !== decoded.tokenVersion || user.isSuspended) {
        return next(new Error('Unauthorized'))
      }
      socket.user = user
      return next()
    } catch (err) {
      return next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    if (socket.user) socket.join(`user:${socket.user._id}`)

    socket.on('auction:join', (auctionId) => {
      if (typeof auctionId === 'string' && /^[a-f\d]{24}$/i.test(auctionId)) {
        socket.join(`auction:${auctionId}`)
      }
    })

    socket.on('conversation:join', async (conversationId) => {
      if (!socket.user || typeof conversationId !== 'string') return
      const conversation = await Conversation.findById(conversationId)
      if (!conversation) return
      const allowed = conversation.participants.some((id) => String(id) === String(socket.user._id))
      if (!allowed) return
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('message:send', async (payload = {}, ack) => {
      try {
        if (!socket.user) throw new Error('Sign in to send messages')
        const message = await sendMessage({
          user: socket.user,
          conversationId: payload.conversationId,
          body: payload.body,
        })
        if (typeof ack === 'function') ack({ ok: true, data: message })
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, message: err.message || 'Message failed' })
      }
    })
  })

  setIO(io)
  return io
}

module.exports = { initSocket }
