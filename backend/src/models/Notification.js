const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
