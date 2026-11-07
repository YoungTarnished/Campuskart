const User = require('../models/User')
const Product = require('../models/Product')
const Wishlist = require('../models/Wishlist')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Notification = require('../models/Notification')
const Order = require('../models/Order')
const Auction = require('../models/Auction')
const ExchangeProposal = require('../models/ExchangeProposal')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { presentUser } = require('../utils/helpers')
const { SELLER_PUBLIC_FIELDS } = require('../constants')

const publicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user || user.isSuspended) throw new ApiError('Student not found', 404)
  const listings = await Product.find({ seller: user._id, status: { $ne: 'removed' } })
    .sort({ createdAt: -1 })
    .limit(12)
  res.json({ success: true, data: { user: presentUser(user), listings } })
})

const wishlist = asyncHandler(async (req, res) => {
  const rows = await Wishlist.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'product', populate: { path: 'seller', select: SELLER_PUBLIC_FIELDS } })
  res.json({ success: true, data: rows.filter((row) => row.product && row.product.status !== 'removed') })
})

const addWish = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId)
  if (!product || product.status === 'removed') throw new ApiError('Product not found', 404)
  await Wishlist.updateOne(
    { user: req.user._id, product: product._id },
    { $setOnInsert: { user: req.user._id, product: product._id } },
    { upsert: true }
  )
  res.status(201).json({ success: true, message: 'Saved to wishlist' })
})

const removeWish = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({ user: req.user._id, product: req.params.productId })
  res.json({ success: true, message: 'Removed from wishlist' })
})

const dashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const [myListings, purchases, sales, auctions, wishlistCount, exchanges, unreadNotifications, conversations] = await Promise.all([
    Product.countDocuments({ seller: userId, status: { $ne: 'removed' } }),
    Order.countDocuments({ buyer: userId }),
    Order.countDocuments({ seller: userId }),
    Auction.countDocuments({ seller: userId, status: { $in: ['scheduled', 'active'] } }),
    Wishlist.countDocuments({ user: userId }),
    ExchangeProposal.countDocuments({ status: 'pending', $or: [{ proposer: userId }, { recipient: userId }] }),
    Notification.countDocuments({ user: userId, read: false }),
    Conversation.find({ participants: userId }).select('reads'),
  ])

  let unreadMessages = 0
  for (const conversation of conversations) {
    const lastRead = conversation.reads.find((entry) => String(entry.user) === String(userId))?.lastReadAt || new Date(0)
    unreadMessages += await Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: userId },
      createdAt: { $gt: lastRead },
    })
  }

  res.json({
    success: true,
    data: { myListings, purchases, sales, auctions, wishlistCount, exchanges, unreadNotifications, unreadMessages },
  })
})

module.exports = { publicProfile, wishlist, addWish, removeWish, dashboard }
