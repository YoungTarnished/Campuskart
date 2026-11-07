const mongoose = require('mongoose')
const { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, PRODUCT_STATUSES } = require('../constants')

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    condition: { type: String, enum: PRODUCT_CONDITIONS, required: true },
    price: { type: Number, required: true, min: 1 },
    suggestedPrice: { type: Number, default: null },
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    isUrgent: { type: Boolean, default: false },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    images: { type: [String], default: [] },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'available', index: true },
    isExchangeEligible: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

productSchema.index({ title: 'text', description: 'text' })
productSchema.index({ status: 1, category: 1, price: 1, createdAt: -1 })
productSchema.index({ status: 1, isUrgent: 1, discountPercent: -1 })

module.exports = mongoose.model('Product', productSchema)
