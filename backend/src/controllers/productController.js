const Product = require('../models/Product')
const Order = require('../models/Order')
const Wishlist = require('../models/Wishlist')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { pageQuery, pageMeta, escapeRegex, assertOwner } = require('../utils/helpers')
const { SELLER_PUBLIC_FIELDS } = require('../constants')
const { suggestPrice } = require('../services/priceService')
const { recommendFor, recentlyViewed } = require('../services/recommendationService')
const { assertAcademicIntegrity } = require('../services/contentPolicy')

function sortOption(sort) {
  if (sort === 'price_asc') return { price: 1 }
  if (sort === 'price_desc') return { price: -1 }
  return { createdAt: -1 }
}

function buildFilter(query) {
  const filter = { status: { $nin: ['removed', 'pending'] } }
  const and = []
  if (query.availability) filter.status = query.availability
  if (query.category) filter.category = query.category
  if (query.condition) filter.condition = query.condition
  if (query.seller) filter.seller = query.seller
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {}
    if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice)
    if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice)
  }
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i')
    and.push({ $or: [{ title: pattern }, { description: pattern }] })
  }
  if (query.deals === 'true') {
    filter.status = 'available'
    and.push({ $or: [{ discountPercent: { $gte: 10 } }, { isUrgent: true }] })
  }
  if (and.length) filter.$and = and
  return filter
}

async function assertMutable(product) {
  if (['reserved', 'sold', 'exchanged', 'removed'].includes(product.status)) {
    throw new ApiError('Products with an active transaction cannot be edited or deleted', 400)
  }
  const active = await Order.findOne({
    product: product._id,
    status: { $in: ['pending', 'accepted', 'disputed'] },
  })
  if (active) throw new ApiError('This listing has an active transaction and cannot be changed', 400)
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query)
  const filter = buildFilter(req.query)
  const [data, total] = await Promise.all([
    Product.find(filter).sort(sortOption(req.query.sort)).skip(skip).limit(limit).populate('seller', SELLER_PUBLIC_FIELDS),
    Product.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: pageMeta(page, limit, total) })
})

const deals = asyncHandler(async (req, res) => {
  const data = await Product.find({
    status: 'available',
    $or: [{ discountPercent: { $gte: 10 } }, { isUrgent: true }],
  })
    .sort({ discountPercent: -1, createdAt: -1 })
    .limit(8)
    .populate('seller', SELLER_PUBLIC_FIELDS)
  res.json({ success: true, data })
})

const mine = asyncHandler(async (req, res) => {
  const data = await Product.find({ seller: req.user._id, status: { $ne: 'removed' } })
    .sort({ createdAt: -1 })
    .populate('seller', SELLER_PUBLIC_FIELDS)
  res.json({ success: true, data })
})

const recommendations = asyncHandler(async (req, res) => {
  const data = await recommendFor(req.user)
  res.json({ success: true, data })
})

const recent = asyncHandler(async (req, res) => {
  const data = await recentlyViewed(req.user)
  res.json({ success: true, data })
})

const priceSuggestion = asyncHandler(async (req, res) => {
  const data = await suggestPrice(req.body)
  res.json({ success: true, data })
})

const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', SELLER_PUBLIC_FIELDS)
  if (!product || product.status === 'removed') throw new ApiError('Product not found', 404)
  const sellerId = product.seller._id || product.seller
  const canSeePending = req.user && (String(req.user._id) === String(sellerId) || req.user.role === 'admin')
  if (product.status === 'pending' && !canSeePending) throw new ApiError('Product not found', 404)
  if (req.user && String(req.user._id) !== String(sellerId)) {
    await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } })
    await User.updateOne({ _id: req.user._id }, { $pull: { recentlyViewed: { product: product._id } } })
    await User.updateOne(
      { _id: req.user._id },
      { $push: { recentlyViewed: { $each: [{ product: product._id, viewedAt: new Date() }], $position: 0, $slice: 12 } } }
    )
  }
  const wished = req.user ? Boolean(await Wishlist.exists({ user: req.user._id, product: product._id })) : false
  res.json({ success: true, data: { ...product.toObject(), wished } })
})

const create = asyncHandler(async (req, res) => {
  assertAcademicIntegrity(`${req.body.title} ${req.body.description}`)
  const suggestion = await suggestPrice({
    category: req.body.category,
    condition: req.body.condition,
    title: req.body.title,
  })
  const product = await Product.create({
    ...req.body,
    seller: req.user._id,
    suggestedPrice: suggestion.suggestedPrice,
    discountPercent: req.body.discountPercent || 0,
    isUrgent: Boolean(req.body.isUrgent),
    isExchangeEligible: Boolean(req.body.isExchangeEligible),
    status: 'pending',
  })
  const populated = await product.populate('seller', SELLER_PUBLIC_FIELDS)
  res.status(201).json({
    success: true,
    message: 'Listing submitted. An admin must approve this sale or trade before other students can see it.',
    data: populated,
    suggestion,
  })
})

const update = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product || product.status === 'removed') throw new ApiError('Product not found', 404)
  assertOwner(product, req.user)
  await assertMutable(product)
  assertAcademicIntegrity(`${req.body.title} ${req.body.description}`)
  const suggestion = await suggestPrice({
    category: req.body.category,
    condition: req.body.condition,
    title: req.body.title,
    excludeId: product._id,
  })
  Object.assign(product, {
    ...req.body,
    seller: product.seller,
    status: product.status,
    suggestedPrice: suggestion.suggestedPrice,
  })
  await product.save()
  const populated = await product.populate('seller', SELLER_PUBLIC_FIELDS)
  res.json({ success: true, message: 'Listing updated', data: populated, suggestion })
})

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product || product.status === 'removed') throw new ApiError('Product not found', 404)
  assertOwner(product, req.user)
  await assertMutable(product)
  const history = await Order.exists({ product: product._id })
  if (history) {
    product.status = 'removed'
    await product.save()
  } else {
    await product.deleteOne()
  }
  res.json({ success: true, message: 'Listing deleted' })
})

module.exports = {
  list, deals, mine, recommendations, recent, priceSuggestion, getOne, create, update, remove,
}
