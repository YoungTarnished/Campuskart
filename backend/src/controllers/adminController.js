const User = require('../models/User')
const Product = require('../models/Product')
const Auction = require('../models/Auction')
const Service = require('../models/Service')
const Order = require('../models/Order')
const ServiceRequest = require('../models/ServiceRequest')
const Report = require('../models/Report')
const Dispute = require('../models/Dispute')
const Bid = require('../models/Bid')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { presentUser, pageQuery, pageMeta } = require('../utils/helpers')
const { notify, notifyMany } = require('../services/notificationService')
const { resolveDisputeRecord } = require('./reportController')

const stats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [
    users, verifiedUsers, suspendedUsers, products, activeAuctions,
    completedTransactions, serviceRequests, openReports, openDisputes,
    recentUsers, recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isSuspended: true }),
    Product.countDocuments({ status: { $ne: 'removed' } }),
    Auction.countDocuments({ status: 'active' }),
    Order.countDocuments({ status: 'completed' }),
    ServiceRequest.countDocuments(),
    Report.countDocuments({ status: 'open' }),
    Dispute.countDocuments({ status: 'open' }),
    User.countDocuments({ createdAt: { $gte: since } }),
    Order.countDocuments({ createdAt: { $gte: since } }),
  ])
  res.json({
    success: true,
    data: {
      users, verifiedUsers, suspendedUsers, products, activeAuctions,
      completedTransactions, serviceRequests, openReports, openDisputes,
      recentUsers, recentOrders,
    },
  })
})

const users = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query)
  const filter = {}
  if (req.query.status === 'verified') filter.isVerified = true
  if (req.query.status === 'suspended') filter.isSuspended = true
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])
  res.json({
    success: true,
    data: rows.map((user) => presentUser(user, { includePrivate: true })),
    pagination: pageMeta(page, limit, total),
  })
})

const setSuspension = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError('You cannot suspend your own account', 400)
  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError('User not found', 404)
  user.isSuspended = req.body.isSuspended
  if (req.body.isSuspended) user.tokenVersion += 1
  await user.save()
  res.json({
    success: true,
    message: req.body.isSuspended ? 'User suspended' : 'User reinstated',
    data: presentUser(user, { includePrivate: true }),
  })
})

const removeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError('Product not found', 404)
  const orders = await Order.find({ product: product._id, status: { $in: ['pending', 'accepted'] } })
  for (const order of orders) {
    order.status = 'cancelled'
    await order.save()
    await notify({
      user: order.buyer,
      type: 'report_update',
      title: 'Listing removed',
      body: 'An administrator removed a listing tied to your order.',
      link: '/purchases',
    })
  }
  product.status = 'removed'
  await product.save()
  res.json({ success: true, message: 'Listing removed' })
})

const removeService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service) throw new ApiError('Service not found', 404)
  service.status = 'removed'
  await service.save()
  res.json({ success: true, message: 'Service removed' })
})

const removeAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
  if (!auction) throw new ApiError('Auction not found', 404)
  auction.status = 'cancelled'
  await auction.save()
  const bidders = await Bid.find({ auction: auction._id }).distinct('bidder')
  await notifyMany(bidders, {
    type: 'auction_ended',
    title: 'Auction removed',
    body: `${auction.title} was removed by an administrator.`,
    link: '/auctions',
  })
  res.json({ success: true, message: 'Auction removed' })
})

const reports = asyncHandler(async (req, res) => {
  const data = await Report.find().sort({ createdAt: -1 }).limit(100).populate('reporter', 'name email')
  res.json({ success: true, data })
})

const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
  if (!report || report.status !== 'open') throw new ApiError('Open report not found', 404)
  report.status = req.body.status
  report.adminNotes = req.body.adminNotes || ''
  report.resolvedBy = req.user._id
  await report.save()
  if (req.body.status === 'action_taken' && report.targetType === 'product') {
    await Product.findByIdAndUpdate(report.targetId, { status: 'removed' })
  }
  if (req.body.status === 'action_taken' && report.targetType === 'service') {
    await Service.findByIdAndUpdate(report.targetId, { status: 'removed' })
  }
  if (req.body.status === 'action_taken' && report.targetType === 'auction') {
    await Auction.findByIdAndUpdate(report.targetId, { status: 'cancelled' })
  }
  await notify({
    user: report.reporter,
    type: 'report_update',
    title: 'Report reviewed',
    body: `Your report was marked ${req.body.status.replace('_', ' ')}.`,
    link: '/reports',
  })
  res.json({ success: true, message: 'Report updated', data: report })
})

const disputes = asyncHandler(async (req, res) => {
  const data = await Dispute.find().sort({ createdAt: -1 }).limit(100)
    .populate('openedBy', 'name email')
    .populate('against', 'name email')
  res.json({ success: true, data })
})

const resolveDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
  if (!dispute) throw new ApiError('Dispute not found', 404)
  const data = await resolveDisputeRecord(dispute, req.user, req.body)
  res.json({ success: true, message: 'Dispute updated', data })
})

module.exports = {
  stats, users, setSuspension, removeProduct, removeService, removeAuction,
  reports, resolveReport, disputes, resolveDispute,
}
