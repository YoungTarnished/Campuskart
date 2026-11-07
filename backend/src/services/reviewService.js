const Review = require('../models/Review')
const Order = require('../models/Order')
const ServiceRequest = require('../models/ServiceRequest')
const ExchangeProposal = require('../models/ExchangeProposal')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')
const { recalculateRating } = require('./trustService')

function partiesOf(left, right) {
  return [String(left), String(right)]
}

async function assertEligible({ reviewer, revieweeId, transactionType, transactionId }) {
  if (String(reviewer._id) === String(revieweeId)) throw new ApiError('You cannot review yourself', 400)
  const reviewee = await User.findById(revieweeId)
  if (!reviewee) throw new ApiError('Student not found', 404)

  let parties = []
  if (transactionType === 'order') {
    const order = await Order.findById(transactionId)
    if (!order || order.status !== 'completed') {
      throw new ApiError('You can review only after the transaction is completed', 400)
    }
    parties = partiesOf(order.buyer, order.seller)
  } else if (transactionType === 'service') {
    const request = await ServiceRequest.findById(transactionId)
    if (!request || request.status !== 'completed') {
      throw new ApiError('You can review only after the transaction is completed', 400)
    }
    parties = partiesOf(request.requester, request.provider)
  } else if (transactionType === 'exchange') {
    const proposal = await ExchangeProposal.findById(transactionId)
    if (!proposal || proposal.status !== 'completed') {
      throw new ApiError('You can review only after the transaction is completed', 400)
    }
    parties = partiesOf(proposal.proposer, proposal.recipient)
  } else {
    throw new ApiError('Unknown transaction type', 400)
  }

  if (!parties.includes(String(reviewer._id)) || !parties.includes(String(revieweeId))) {
    throw new ApiError('You can review only the other person in this transaction', 403)
  }

  const existing = await Review.findOne({ reviewer: reviewer._id, transactionType, transactionId })
  if (existing) throw new ApiError('You already reviewed this transaction', 409)
}

async function createReview({ reviewer, revieweeId, transactionType, transactionId, rating, feedback }) {
  await assertEligible({ reviewer, revieweeId, transactionType, transactionId })
  const review = await Review.create({
    reviewer: reviewer._id,
    reviewee: revieweeId,
    transactionType,
    transactionId,
    rating: Number(rating),
    feedback: feedback || '',
  })
  await recalculateRating(revieweeId)
  return review
}

module.exports = { createReview }
