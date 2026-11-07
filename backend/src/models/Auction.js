const mongoose = require('mongoose')
const { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, AUCTION_STATUSES } = require('../constants')

const auctionSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    condition: { type: String, enum: PRODUCT_CONDITIONS, required: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    images: { type: [String], default: [] },
    startingPrice: { type: Number, required: true, min: 1 },
    minIncrement: { type: Number, required: true, min: 1 },
    reservePrice: { type: Number, default: null },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    currentPrice: { type: Number, default: 0 },
    highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bidCount: { type: Number, default: 0 },
    extensionCount: { type: Number, default: 0 },
    status: { type: String, enum: AUCTION_STATUSES, default: 'scheduled', index: true },
  },
  { timestamps: true }
)

auctionSchema.index({ status: 1, endTime: 1 })

module.exports = mongoose.model('Auction', auctionSchema)
