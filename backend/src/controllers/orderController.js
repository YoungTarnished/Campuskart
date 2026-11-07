const Order = require('../models/Order')
const asyncHandler = require('../utils/asyncHandler')
const {
  loadOrder, createPurchase, acceptOrder, rejectOrder, cancelOrder, confirmPayment,
} = require('../services/orderService')

const populate = [
  { path: 'product', select: 'title price images status category location' },
  { path: 'auction', select: 'title currentPrice images status' },
  { path: 'buyer', select: 'name profilePicture isVerified ratingAverage college' },
  { path: 'seller', select: 'name profilePicture isVerified ratingAverage college' },
]

const create = asyncHandler(async (req, res) => {
  const order = await createPurchase({ productId: req.body.productId, buyer: req.user })
  const populated = await order.populate(populate)
  res.status(201).json({
    success: true,
    message: 'Purchase request sent. Payment is simulated for this academic prototype.',
    data: populated,
  })
})

const purchases = asyncHandler(async (req, res) => {
  const data = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 }).populate(populate)
  res.json({ success: true, data })
})

const sales = asyncHandler(async (req, res) => {
  const data = await Order.find({ seller: req.user._id }).sort({ createdAt: -1 }).populate(populate)
  res.json({ success: true, data })
})

const getOne = asyncHandler(async (req, res) => {
  const order = await loadOrder(req.params.id, req.user)
  res.json({ success: true, data: await order.populate(populate) })
})

const accept = asyncHandler(async (req, res) => {
  const order = await acceptOrder(req.params.id, req.user)
  res.json({ success: true, message: 'Request accepted', data: await order.populate(populate) })
})

const reject = asyncHandler(async (req, res) => {
  const order = await rejectOrder(req.params.id, req.user)
  res.json({ success: true, message: 'Request rejected', data: await order.populate(populate) })
})

const cancel = asyncHandler(async (req, res) => {
  const order = await cancelOrder(req.params.id, req.user)
  res.json({ success: true, message: 'Order cancelled', data: await order.populate(populate) })
})

const confirm = asyncHandler(async (req, res) => {
  const order = await confirmPayment(req.params.id, req.user)
  res.json({
    success: true,
    message: 'Simulated payment confirmed. No real money was transferred.',
    data: await order.populate(populate),
  })
})

module.exports = { create, purchases, sales, getOne, accept, reject, cancel, confirm }
