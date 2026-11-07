const mongoose = require('mongoose')
const { YEARS } = require('../constants')

const recentlyViewedSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    college: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, required: true, trim: true, maxlength: 80 },
    year: { type: String, enum: YEARS, required: true },
    profilePicture: { type: String, default: '' },
    isVerified: { type: Boolean, default: false, index: true },
    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    isSuspended: { type: Boolean, default: false, index: true },
    tokenVersion: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    completedTransactions: { type: Number, default: 0 },
    recentlyViewed: { type: [recentlyViewedSchema], default: [] },
    watchedAuctions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }],
  },
  { timestamps: true }
)

userSchema.index({ watchedAuctions: 1 })

module.exports = mongoose.model('User', userSchema)
