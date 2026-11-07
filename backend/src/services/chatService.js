const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const User = require('../models/User')
const Product = require('../models/Product')
const ApiError = require('../utils/ApiError')
const { notify, getIO } = require('./notificationService')
const { presentUser } = require('../utils/helpers')

const participantFields = 'name college department year profilePicture isVerified ratingAverage ratingCount completedTransactions'

async function getOrCreateConversation({ user, participantId, productId }) {
  if (String(user._id) === String(participantId)) throw new ApiError('You cannot message yourself', 400)
  const other = await User.findById(participantId)
  if (!other || other.isSuspended) throw new ApiError('Student not found', 404)
  if (productId) {
    const product = await Product.findById(productId)
    if (!product || product.status === 'removed') throw new ApiError('Product not found', 404)
  }

  const query = {
    participants: { $all: [user._id, other._id], $size: 2 },
    product: productId || null,
  }
  let conversation = await Conversation.findOne(query)
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [user._id, other._id],
      product: productId || null,
      reads: [{ user: user._id, lastReadAt: new Date() }],
      lastMessageAt: new Date(),
    })
  }
  return Conversation.findById(conversation._id)
    .populate('participants', participantFields)
    .populate('product', 'title price images status')
}

function assertParticipant(conversation, user) {
  if (!conversation) throw new ApiError('Conversation not found', 404)
  const allowed = conversation.participants.some((person) => String(person._id || person) === String(user._id))
  if (!allowed) throw new ApiError('Conversation not found', 404)
}

async function markRead(conversation, userId) {
  const hasRead = conversation.reads.some((entry) => String(entry.user) === String(userId))
  if (hasRead) {
    await Conversation.updateOne(
      { _id: conversation._id, 'reads.user': userId },
      { $set: { 'reads.$.lastReadAt': new Date() } }
    )
  } else {
    await Conversation.updateOne(
      { _id: conversation._id },
      { $push: { reads: { user: userId, lastReadAt: new Date() } } }
    )
  }
}

async function sendMessage({ user, conversationId, body }) {
  const text = String(body || '').trim()
  if (!text) throw new ApiError('Message cannot be empty', 400)
  if (text.length > 2000) throw new ApiError('Message is too long', 400)

  const conversation = await Conversation.findById(conversationId)
  assertParticipant(conversation, user)

  const message = await Message.create({ conversation: conversation._id, sender: user._id, body: text })
  conversation.lastMessage = text.slice(0, 200)
  conversation.lastMessageAt = message.createdAt
  await conversation.save()
  await markRead(conversation, user._id)

  const populated = await message.populate('sender', 'name profilePicture')
  const io = getIO()
  if (io) io.to(`conversation:${conversation._id}`).emit('message:new', populated)

  const recipients = conversation.participants.filter((id) => String(id) !== String(user._id))
  await Promise.all(recipients.map((recipient) => notify({
    user: recipient,
    type: 'message',
    title: 'New message',
    body: `${user.name}: ${text.slice(0, 80)}`,
    link: `/messages/${conversation._id}`,
  })))

  return populated
}

async function listConversations(user) {
  const conversations = await Conversation.find({ participants: user._id })
    .sort({ lastMessageAt: -1 })
    .populate('participants', participantFields)
    .populate('product', 'title price images status')

  const result = []
  for (const conversation of conversations) {
    const lastRead = conversation.reads.find((entry) => String(entry.user) === String(user._id))?.lastReadAt || new Date(0)
    const unread = await Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: user._id },
      createdAt: { $gt: lastRead },
    })
    result.push({ ...conversation.toObject(), unread, me: presentUser(user) })
  }
  return result
}

async function listMessages(conversationId, user) {
  const conversation = await Conversation.findById(conversationId)
    .populate('participants', participantFields)
    .populate('product', 'title price images status')
  assertParticipant(conversation, user)
  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('sender', 'name profilePicture')
  await markRead(conversation, user._id)

  const fresh = await Conversation.findById(conversation._id)
  const other = conversation.participants.find((person) => String(person._id) !== String(user._id))
  const otherRead = fresh.reads.find((entry) => String(entry.user) === String(other?._id))?.lastReadAt

  return {
    conversation,
    messages: messages.reverse().map((message) => {
      const plain = message.toObject()
      plain.read = String(message.sender._id || message.sender) === String(user._id)
        ? Boolean(otherRead && otherRead >= message.createdAt)
        : true
      return plain
    }),
  }
}

module.exports = { getOrCreateConversation, sendMessage, listConversations, listMessages, assertParticipant }
