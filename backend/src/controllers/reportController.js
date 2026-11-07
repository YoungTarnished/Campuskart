const Report = require('../models/Report')
const Dispute = require('../models/Dispute')
const Product = require('../models/Product')
const Auction = require('../models/Auction')
const Service = require('../models/Service')
const User = require('../models/User')
const Order = require('../models/Order')
const ServiceRequest = require('../models/ServiceRequest')
const ExchangeProposal = require('../models/ExchangeProposal')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { notify, notifyMany } = require('../services/notificationService')
const { applyResolution } = require('../services/orderService')
const { addCompletedTransactions, removeCompletedTransactions } = require('../services/trustService')

async function targetExists(targetType, targetId) {
  if (targetType === 'product') return Product.findById(targetId)
  if (targetType === 'auction') return Auction.findById(targetId)
  if (targetType === 'service') return Service.findById(targetId)
  return User.findById(targetId)
}

const createReport = asyncHandler(async (req, res) => {
  const target = await targetExists(req.body.targetType, req.body.targetId)
  if (!target) throw new ApiError('The reported item was not found', 404)
  const duplicate = await Report.findOne({
    reporter: req.user._id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    status: 'open',
  })
  if (duplicate) throw new ApiError('You already reported this', 409)
  const report = await Report.create({ ...req.body, reporter: req.user._id })
  const admins = await User.find({ role: 'admin', isSuspended: false }).select('_id')
  await notifyMany(admins.map((admin) => admin._id), {
    type: 'report_update',
    title: 'New report',
    body: `${req.user.name} reported a ${req.body.targetType}.`,
    link: '/admin',
  })
  res.status(201).json({ success: true, message: 'Report submitted', data: report })
})

const myReports = asyncHandler(async (req, res) => {
  const data = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 })
  res.json({ success: true, data })
})

async function loadTransaction(type, id) {
  if (type === 'order') return Order.findById(id)
  if (type === 'service') return ServiceRequest.findById(id)
  return ExchangeProposal.findById(id)
}

function partyIds(type, doc) {
  if (type === 'order') return [String(doc.buyer), String(doc.seller)]
  if (type === 'service') return [String(doc.requester), String(doc.provider)]
  return [String(doc.proposer), String(doc.recipient)]
}

const createDispute = asyncHandler(async (req, res) => {
  const doc = await loadTransaction(req.body.transactionType, req.body.transactionId)
  if (!doc) throw new ApiError('Transaction not found', 404)
  const parties = partyIds(req.body.transactionType, doc)
  if (!parties.includes(String(req.user._id))) throw new ApiError('Transaction not found', 404)
  const allowed = req.body.transactionType === 'exchange'
    ? ['completed', 'disputed']
    : ['accepted', 'completed', 'disputed']
  if (!allowed.includes(doc.status) || doc.status === 'disputed') {
    throw new ApiError('Only an active or completed transaction can be disputed', 400)
  }
  const open = await Dispute.findOne({
    transactionType: req.body.transactionType,
    transactionId: req.body.transactionId,
    status: 'open',
  })
  if (open) throw new ApiError('This transaction already has an open dispute', 409)

  const against = parties.find((id) => id !== String(req.user._id))
  const previousStatus = doc.status
  doc.status = 'disputed'
  await doc.save()
  const dispute = await Dispute.create({
    openedBy: req.user._id,
    against,
    previousStatus,
    transactionType: req.body.transactionType,
    transactionId: req.body.transactionId,
    reason: req.body.reason,
    details: req.body.details,
  })
  await notify({
    user: against,
    type: 'dispute_update',
    title: 'A dispute was opened',
    body: req.body.details.slice(0, 140),
    link: '/reports',
  })
  const admins = await User.find({ role: 'admin', isSuspended: false }).select('_id')
  await notifyMany(admins.map((admin) => admin._id), {
    type: 'dispute_update',
    title: 'New dispute',
    body: `${req.user.name} opened a dispute.`,
    link: '/admin',
  })
  res.status(201).json({ success: true, message: 'Dispute opened', data: dispute })
})

const myDisputes = asyncHandler(async (req, res) => {
  const data = await Dispute.find({
    $or: [{ openedBy: req.user._id }, { against: req.user._id }],
  }).sort({ createdAt: -1 })
  res.json({ success: true, data })
})

async function resolveDisputeRecord(dispute, admin, body) {
  if (dispute.status !== 'open') throw new ApiError('This dispute is already closed', 400)
  const doc = await loadTransaction(dispute.transactionType, dispute.transactionId)
  if (body.status === 'dismissed') {
    if (doc && doc.status === 'disputed') {
      doc.status = dispute.previousStatus || 'accepted'
      await doc.save()
    }
  } else if (body.resolution === 'completed' || body.resolution === 'cancelled') {
    if (dispute.transactionType === 'order' && doc) {
      await applyResolution(doc, body.resolution)
    } else if (doc) {
      if (body.resolution === 'completed') {
        doc.status = 'completed'
        if (!doc.transactionsCounted) {
          const ids = partyIds(dispute.transactionType, doc)
          await addCompletedTransactions(ids)
          doc.transactionsCounted = true
        }
      } else {
        if (doc.transactionsCounted) {
          await removeCompletedTransactions(partyIds(dispute.transactionType, doc))
          doc.transactionsCounted = false
        }
        doc.status = 'cancelled'
        if (dispute.transactionType === 'exchange') {
          await Product.updateMany(
            { _id: { $in: [doc.offeredProduct, doc.requestedProduct] }, status: 'exchanged' },
            { status: 'available' }
          )
        }
      }
      await doc.save()
    }
  } else {
    throw new ApiError('Choose a resolution of completed or cancelled', 400)
  }

  dispute.status = body.status
  dispute.resolution = body.resolution || ''
  dispute.adminNotes = body.adminNotes || ''
  dispute.resolvedBy = admin._id
  await dispute.save()
  await notify({
    user: dispute.openedBy,
    type: 'dispute_update',
    title: 'Dispute updated',
    body: `An admin marked your dispute ${body.status}.`,
    link: '/reports',
  })
  await notify({
    user: dispute.against,
    type: 'dispute_update',
    title: 'Dispute updated',
    body: `An admin marked a dispute ${body.status}.`,
    link: '/reports',
  })
  return dispute
}

module.exports = { createReport, myReports, createDispute, myDisputes, resolveDisputeRecord }
