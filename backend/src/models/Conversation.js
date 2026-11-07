const mongoose = require('mongoose')

const readSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastReadAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    reads: { type: [readSchema], default: [] },
  },
  { timestamps: true }
)

conversationSchema.index({ participants: 1 })

module.exports = mongoose.model('Conversation', conversationSchema)
