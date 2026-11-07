const asyncHandler = require('../utils/asyncHandler')
const { getOrCreateConversation, sendMessage, listConversations, listMessages } = require('../services/chatService')

const list = asyncHandler(async (req, res) => {
  const data = await listConversations(req.user)
  res.json({ success: true, data })
})

const create = asyncHandler(async (req, res) => {
  const data = await getOrCreateConversation({
    user: req.user,
    participantId: req.body.participantId,
    productId: req.body.productId,
  })
  res.status(201).json({ success: true, data })
})

const messages = asyncHandler(async (req, res) => {
  const data = await listMessages(req.params.id, req.user)
  res.json({ success: true, data })
})

const send = asyncHandler(async (req, res) => {
  const data = await sendMessage({ user: req.user, conversationId: req.params.id, body: req.body.body })
  res.status(201).json({ success: true, data })
})

module.exports = { list, create, messages, send }
