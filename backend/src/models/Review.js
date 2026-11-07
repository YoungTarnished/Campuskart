const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionType: { type: String, enum: ['order', 'service', 'exchange'], required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
)

reviewSchema.index({ reviewer: 1, transactionType: 1, transactionId: 1 }, { unique: true })

module.exports = mongoose.model('Review', reviewSchema)
