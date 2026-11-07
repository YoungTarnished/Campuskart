const mongoose = require('mongoose')
const { SERVICE_CATEGORIES } = require('../constants')

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true, index: true },
    pricingType: { type: String, enum: ['fixed', 'hourly'], required: true },
    price: { type: Number, required: true, min: 0 },
    estimatedCompletionTime: { type: String, required: true, trim: true, maxlength: 80 },
    availability: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: ['active', 'paused', 'removed'], default: 'active', index: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Service', serviceSchema)
