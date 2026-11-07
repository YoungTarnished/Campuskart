const Auction = require('../models/Auction')
const Bid = require('../models/Bid')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { pageQuery, pageMeta, escapeRegex, assertOwner } = require('../utils/helpers')
const { SELLER_PUBLIC_FIELDS } = require('../constants')
const { assertAcademicIntegrity } = require('../services/contentPolicy')
const { parseWindow, minimumNextBid, placeBid } = require('../services/auctionService')

function present(auction, extras = {}) {
  const plain = auction.toObject()
  plain.minimumNextBid = minimumNextBid(auction)
  return { ...plain, ...extras }
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query)
  const filter = { status: { $in: ['scheduled', 'active', 'sold', 'unsold'] } }
  if (req.query.status) filter.status = req.query.status
  if (req.query.category) filter.category = req.query.category
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search), 'i')
    filter.$or = [{ title: pattern }, { description: pattern }]
  }
  const [rows, total] = await Promise.all([
    Auction.find(filter).sort({ endTime: 1 }).skip(skip).limit(limit).populate('seller', SELLER_PUBLIC_FIELDS),
    Auction.countDocuments(filter),
  ])
  res.json({
    success: true,
    data: rows.map((auction) => present(auction)),
    pagination: pageMeta(page, limit, total),
    serverTime: new Date().toISOString(),
  })
})

const mine = asyncHandler(async (req, res) => {
  const selling = await Auction.find({ seller: req.user._id }).sort({ createdAt: -1 }).populate('seller', SELLER_PUBLIC_FIELDS)
  const bids = await Bid.find({ bidder: req.user._id }).select('auction')
  const bidIds = [...new Set(bids.map((bid) => String(bid.auction)))]
  const bidding = await Auction.find({ _id: { $in: bidIds } }).sort({ endTime: -1 }).populate('seller', SELLER_PUBLIC_FIELDS)
  const watching = await Auction.find({ _id: { $in: req.user.watchedAuctions } }).sort({ endTime: 1 }).populate('seller', SELLER_PUBLIC_FIELDS)
  res.json({
    success: true,
    data: {
      selling: selling.map((auction) => present(auction)),
      bidding: bidding.map((auction) => present(auction, {
        result: auction.status === 'sold' && String(auction.winner) === String(req.user._id)
          ? 'won'
          : ['sold', 'unsold'].includes(auction.status) ? 'lost' : 'open',
      })),
      watching: watching.map((auction) => present(auction)),
    },
  })
})

const getOne = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate('seller', SELLER_PUBLIC_FIELDS)
    .populate('highestBidder', 'name')
    .populate('winner', 'name')
  if (!auction) throw new ApiError('Auction not found', 404)
  const sellerId = String(auction.seller._id || auction.seller)
  const canSeeCancelled = req.user && (String(req.user._id) === sellerId || req.user.role === 'admin')
  if (auction.status === 'cancelled' && !canSeeCancelled) throw new ApiError('Auction not found', 404)
  const bids = await Bid.find({ auction: auction._id }).sort({ createdAt: -1 }).limit(30).populate('bidder', 'name')
  const isWatching = req.user ? req.user.watchedAuctions.some((id) => String(id) === String(auction._id)) : false
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    data: present(auction, { bids, isWatching }),
  })
})

const create = asyncHandler(async (req, res) => {
  assertAcademicIntegrity(`${req.body.title} ${req.body.description}`)
  const { start, end } = parseWindow(req.body.startTime, req.body.endTime)
  if (req.body.reservePrice && Number(req.body.reservePrice) < Number(req.body.startingPrice)) {
    throw new ApiError('Reserve price must be at least the starting price', 400)
  }
  const auction = await Auction.create({
    ...req.body,
    seller: req.user._id,
    startTime: start,
    endTime: end,
    reservePrice: req.body.reservePrice || null,
    currentPrice: 0,
    status: start.getTime() <= Date.now() ? 'active' : 'scheduled',
  })
  const populated = await auction.populate('seller', SELLER_PUBLIC_FIELDS)
  res.status(201).json({ success: true, message: 'Auction created', data: present(populated) })
})

const update = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
  if (!auction) throw new ApiError('Auction not found', 404)
  assertOwner(auction, req.user)
  if (auction.bidCount > 0) throw new ApiError('Auctions cannot be edited after bidding begins', 400)
  if (!['scheduled', 'active'].includes(auction.status)) throw new ApiError('This auction can no longer be edited', 400)
  assertAcademicIntegrity(`${req.body.title} ${req.body.description}`)
  const { start, end } = parseWindow(req.body.startTime, req.body.endTime)
  if (req.body.reservePrice && Number(req.body.reservePrice) < Number(req.body.startingPrice)) {
    throw new ApiError('Reserve price must be at least the starting price', 400)
  }
  Object.assign(auction, {
    ...req.body,
    seller: auction.seller,
    startTime: start,
    endTime: end,
    reservePrice: req.body.reservePrice || null,
    status: start.getTime() <= Date.now() ? 'active' : 'scheduled',
    bidCount: auction.bidCount,
    currentPrice: auction.currentPrice,
  })
  await auction.save()
  res.json({ success: true, message: 'Auction updated', data: present(auction) })
})

const cancel = asyncHandler(async (req, res) => {
  const auction = await Auction.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id, bidCount: 0, status: { $in: ['scheduled', 'active'] } },
    { $set: { status: 'cancelled' } },
    { new: true }
  )
  if (!auction) {
    const existing = await Auction.findById(req.params.id)
    if (!existing) throw new ApiError('Auction not found', 404)
    assertOwner(existing, req.user)
    if (existing.bidCount > 0) throw new ApiError('Sellers cannot cancel an auction after bids have been placed', 400)
    throw new ApiError('This auction can no longer be cancelled', 400)
  }
  res.json({ success: true, message: 'Auction cancelled', data: present(auction) })
})

const remove = asyncHandler(async (req, res) => {
  const existing = await Auction.findById(req.params.id)
  if (!existing) throw new ApiError('Auction not found', 404)
  assertOwner(existing, req.user)
  if (existing.bidCount > 0) throw new ApiError('Auctions cannot be deleted after bidding begins', 400)
  await existing.deleteOne()
  res.json({ success: true, message: 'Auction deleted' })
})

const bid = asyncHandler(async (req, res) => {
  const result = await placeBid({ auctionId: req.params.id, bidder: req.user, amount: req.body.amount })
  const auction = await result.auction.populate('seller', SELLER_PUBLIC_FIELDS)
  res.status(201).json({
    success: true,
    message: result.extended ? 'Bid placed. Anti-sniping extended the auction by 2 minutes.' : 'Bid placed',
    data: present(auction, { bid: result.bid }),
  })
})

const watch = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
  if (!auction) throw new ApiError('Auction not found', 404)
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { watchedAuctions: auction._id } })
  res.json({ success: true, message: 'Auction saved to your watchlist' })
})

const unwatch = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { watchedAuctions: req.params.id } })
  res.json({ success: true, message: 'Removed from watchlist' })
})

module.exports = { list, mine, getOne, create, update, cancel, remove, bid, watch, unwatch }
