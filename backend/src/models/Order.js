const mongoose = require('mongoose')
const { ORDER_STATUSES } = require('../constants')

const orderSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['product', 'auction'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', default: null },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    transactionsCounted: { type: Boolean, default: false },
    payment: {
      simulated: { type: Boolean, default: true },
      confirmedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
)

orderSchema.index({ product: 1, status: 1 })
orderSchema.index({ auction: 1, kind: 1 })

module.exports = mongoose.model('Order', orderSchema)
