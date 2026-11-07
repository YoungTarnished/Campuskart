const mongoose = require('mongoose')
const User = require('../models/User')
const Review = require('../models/Review')

async function addCompletedTransactions(userIds) {
  await User.updateMany({ _id: { $in: userIds } }, { $inc: { completedTransactions: 1 } })
}

async function removeCompletedTransactions(userIds) {
  await User.updateMany(
    { _id: { $in: userIds }, completedTransactions: { $gt: 0 } },
    { $inc: { completedTransactions: -1 } }
  )
}

async function recalculateRating(userId) {
  const rows = await Review.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await User.findByIdAndUpdate(userId, {
    ratingAverage: rows[0] ? Math.round(rows[0].avg * 10) / 10 : 0,
    ratingCount: rows[0] ? rows[0].count : 0,
  })
}

module.exports = { addCompletedTransactions, removeCompletedTransactions, recalculateRating }
