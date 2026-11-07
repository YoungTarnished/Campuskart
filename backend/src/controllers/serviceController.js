const Service = require('../models/Service')
const ServiceRequest = require('../models/ServiceRequest')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { pageQuery, pageMeta, escapeRegex, assertOwner } = require('../utils/helpers')
const { SELLER_PUBLIC_FIELDS } = require('../constants')
const { assertAcademicIntegrity } = require('../services/contentPolicy')
const { notify } = require('../services/notificationService')
const { addCompletedTransactions } = require('../services/trustService')

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query)
  const filter = { status: 'active' }
  if (req.query.category) filter.category = req.query.category
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search), 'i')
    filter.$or = [{ title: pattern }, { description: pattern }]
  }
  const [data, total] = await Promise.all([
    Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('provider', SELLER_PUBLIC_FIELDS),
    Service.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) })
})

const mine = asyncHandler(async (req, res) => {
  const data = await Service.find({ provider: req.user._id, status: { $ne: 'removed' } })
    .sort({ createdAt: -1 })
    .populate('provider', SELLER_PUBLIC_FIELDS)
  res.json({ success: true, data })
})

const getOne = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('provider', SELLER_PUBLIC_FIELDS)
  if (!service || service.status === 'removed') throw new ApiError('Service not found', 404)
  res.json({ success: true, data: service })
})

const create = asyncHandler(async (req, res) => {
  assertAcademicIntegrity(`${req.body.title} ${req.body.description}`)
  const service = await Service.create({ ...req.body, provider: req.user._id })
  res.status(201).json({ success: true, message: 'Service published', data: await service.populate('provider', SELLER_PUBLIC_FIELDS) })
})

const update = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service || service.status === 'removed') throw new ApiError('Service not found', 404)
  assertOwner(service, req.user, 'provider')
  assertAcademicIntegrity(`${req.body.title} ${req.body.description}`)
  Object.assign(service, { ...req.body, provider: service.provider, status: service.status })
  await service.save()
  res.json({ success: true, message: 'Service updated', data: await service.populate('provider', SELLER_PUBLIC_FIELDS) })
})

const remove = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service || service.status === 'removed') throw new ApiError('Service not found', 404)
  assertOwner(service, req.user, 'provider')
  const active = await ServiceRequest.findOne({ service: service._id, status: { $in: ['pending', 'accepted', 'disputed'] } })
  if (active) throw new ApiError('This service has an open request and cannot be deleted', 400)
  service.status = 'removed'
  await service.save()
  res.json({ success: true, message: 'Service removed' })
})

const requestService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service || service.status !== 'active') throw new ApiError('Service not found', 404)
  if (String(service.provider) === String(req.user._id)) throw new ApiError('You cannot request your own service', 400)
  assertAcademicIntegrity(req.body.message)
  const duplicate = await ServiceRequest.findOne({
    service: service._id,
    requester: req.user._id,
    status: { $in: ['pending', 'accepted'] },
  })
  if (duplicate) throw new ApiError('You already have an open request for this service', 409)

  const request = await ServiceRequest.create({
    service: service._id,
    requester: req.user._id,
    provider: service.provider,
    message: req.body.message,
    agreedPrice: service.price,
  })
  await notify({
    user: service.provider,
    type: 'service_request',
    title: 'New service request',
    body: `${req.user.name} requested ${service.title}.`,
    link: '/services/requests',
  })
  res.status(201).json({ success: true, message: 'Request sent', data: request })
})

async function loadRequest(id, user) {
  const request = await ServiceRequest.findById(id).populate('service', 'title category price pricingType')
  if (!request) throw new ApiError('Request not found', 404)
  const party = [String(request.requester), String(request.provider)].includes(String(user._id))
  if (!party && user.role !== 'admin') throw new ApiError('Request not found', 404)
  return request
}

const incoming = asyncHandler(async (req, res) => {
  const data = await ServiceRequest.find({ provider: req.user._id })
    .sort({ createdAt: -1 })
    .populate('service', 'title category price')
    .populate('requester', 'name college isVerified profilePicture')
  res.json({ success: true, data })
})

const outgoing = asyncHandler(async (req, res) => {
  const data = await ServiceRequest.find({ requester: req.user._id })
    .sort({ createdAt: -1 })
    .populate('service', 'title category price')
    .populate('provider', 'name college isVerified profilePicture')
  res.json({ success: true, data })
})

const acceptRequest = asyncHandler(async (req, res) => {
  const request = await loadRequest(req.params.id, req.user)
  if (String(request.provider) !== String(req.user._id)) throw new ApiError('Only the provider can accept this request', 403)
  if (request.status !== 'pending') throw new ApiError('Only a pending request can be accepted', 400)
  request.status = 'accepted'
  await request.save()
  await notify({
    user: request.requester,
    type: 'service_accepted',
    title: 'Service request accepted',
    body: 'The provider accepted your request.',
    link: '/services/requests',
  })
  res.json({ success: true, message: 'Request accepted', data: request })
})

const rejectRequest = asyncHandler(async (req, res) => {
  const request = await loadRequest(req.params.id, req.user)
  if (String(request.provider) !== String(req.user._id)) throw new ApiError('Only the provider can reject this request', 403)
  if (request.status !== 'pending') throw new ApiError('Only a pending request can be rejected', 400)
  request.status = 'rejected'
  await request.save()
  await notify({
    user: request.requester,
    type: 'service_rejected',
    title: 'Service request declined',
    body: 'The provider declined your request.',
    link: '/services/requests',
  })
  res.json({ success: true, message: 'Request declined', data: request })
})

const cancelRequest = asyncHandler(async (req, res) => {
  const request = await loadRequest(req.params.id, req.user)
  if (String(request.requester) !== String(req.user._id)) {
    throw new ApiError('Only the student who opened the request can cancel it', 403)
  }
  if (!['pending', 'accepted'].includes(request.status)) throw new ApiError('This request can no longer be cancelled', 400)
  request.status = 'cancelled'
  await request.save()
  await notify({
    user: request.provider,
    type: 'service_rejected',
    title: 'Service request cancelled',
    body: 'The requester cancelled this service request.',
    link: '/services/requests',
  })
  res.json({ success: true, message: 'Request cancelled', data: request })
})

const completeRequest = asyncHandler(async (req, res) => {
  const request = await loadRequest(req.params.id, req.user)
  const party = [String(request.requester), String(request.provider)].includes(String(req.user._id))
  if (!party) throw new ApiError('Request not found', 404)
  if (request.status !== 'accepted') throw new ApiError('Only an accepted request can be completed', 400)
  request.status = 'completed'
  if (!request.transactionsCounted) {
    await addCompletedTransactions([request.requester, request.provider])
    request.transactionsCounted = true
  }
  await request.save()
  const other = String(request.requester) === String(req.user._id) ? request.provider : request.requester
  await notify({
    user: other,
    type: 'service_accepted',
    title: 'Service marked complete',
    body: 'A service request was marked complete. You can leave a review.',
    link: '/services/requests',
  })
  res.json({ success: true, message: 'Service marked complete', data: request })
})

module.exports = {
  list, mine, getOne, create, update, remove, requestService,
  incoming, outgoing, acceptRequest, rejectRequest, cancelRequest, completeRequest,
}
