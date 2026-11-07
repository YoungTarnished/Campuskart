const Review = require('../models/Review')
const asyncHandler = require('../utils/asyncHandler')
const { createReview } = require('../services/reviewService')

const create = asyncHandler(async (req, res) => {
  const review = await createReview({
    reviewer: req.user,
    revieweeId: req.body.revieweeId,
    transactionType: req.body.transactionType,
    transactionId: req.body.transactionId,
    rating: req.body.rating,
    feedback: req.body.feedback,
  })
  const data = await review.populate('reviewer', 'name profilePicture')
  res.status(201).json({ success: true, message: 'Review published', data })
})

const forUser = asyncHandler(async (req, res) => {
  const data = await Review.find({ reviewee: req.params.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('reviewer', 'name profilePicture college')
  res.json({ success: true, data })
})

module.exports = { create, forUser }
