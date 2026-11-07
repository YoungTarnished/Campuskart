const mongoose = require('mongoose')
const { DISPUTE_REASONS, DISPUTE_STATUSES } = require('../constants')

const disputeSchema = new mongoose.Schema(
  {
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionType: { type: String, enum: ['order', 'service', 'exchange'], required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    previousStatus: { type: String, default: '' },
    reason: { type: String, enum: DISPUTE_REASONS, required: true },
    details: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: DISPUTE_STATUSES, default: 'open', index: true },
    resolution: { type: String, enum: ['completed', 'cancelled', ''], default: '' },
    adminNotes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

disputeSchema.index({ transactionType: 1, transactionId: 1, status: 1 })

module.exports = mongoose.model('Dispute', disputeSchema)
