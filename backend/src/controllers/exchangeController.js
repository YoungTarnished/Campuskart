const ExchangeProposal = require('../models/ExchangeProposal')
const asyncHandler = require('../utils/asyncHandler')
const { proposeExchange, acceptExchange, rejectExchange, cancelExchange } = require('../services/exchangeService')

const productFields = 'title price images status category condition location isExchangeEligible'
const userFields = 'name college isVerified profilePicture ratingAverage'

const withDetails = (query) => query
  .populate('offeredProduct', productFields)
  .populate('requestedProduct', productFields)
  .populate('proposer', userFields)
  .populate('recipient', userFields)

const list = asyncHandler(async (req, res) => {
  const data = await withDetails(ExchangeProposal.find({
    $or: [{ proposer: req.user._id }, { recipient: req.user._id }],
  }).sort({ createdAt: -1 }))
  res.json({ success: true, data })
})

const create = asyncHandler(async (req, res) => {
  const proposal = await proposeExchange({
    user: req.user,
    offeredProductId: req.body.offeredProductId,
    requestedProductId: req.body.requestedProductId,
    message: req.body.message,
  })
  const data = await withDetails(ExchangeProposal.findById(proposal._id))
  res.status(201).json({ success: true, message: 'Exchange proposal sent', data })
})

const accept = asyncHandler(async (req, res) => {
  await acceptExchange(req.params.id, req.user)
  const data = await withDetails(ExchangeProposal.findById(req.params.id))
  res.json({ success: true, message: 'Exchange completed', data })
})

const reject = asyncHandler(async (req, res) => {
  await rejectExchange(req.params.id, req.user)
  const data = await withDetails(ExchangeProposal.findById(req.params.id))
  res.json({ success: true, message: 'Exchange declined', data })
})

const cancel = asyncHandler(async (req, res) => {
  await cancelExchange(req.params.id, req.user)
  const data = await withDetails(ExchangeProposal.findById(req.params.id))
  res.json({ success: true, message: 'Exchange cancelled', data })
})

module.exports = { list, create, accept, reject, cancel }
