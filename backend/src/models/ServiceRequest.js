const mongoose = require('mongoose')
const { SERVICE_REQUEST_STATUSES } = require('../constants')

const serviceRequestSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    agreedPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: SERVICE_REQUEST_STATUSES, default: 'pending', index: true },
    transactionsCounted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

serviceRequestSchema.index({ service: 1, requester: 1, status: 1 })

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema)
