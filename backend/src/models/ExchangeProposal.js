const mongoose = require('mongoose')
const { EXCHANGE_STATUSES } = require('../constants')

const exchangeSchema = new mongoose.Schema(
  {
    proposer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offeredProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    requestedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    message: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: EXCHANGE_STATUSES, default: 'pending', index: true },
    transactionsCounted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ExchangeProposal', exchangeSchema)
