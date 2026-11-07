const Auction = require('../models/Auction')
const Bid = require('../models/Bid')
const Order = require('../models/Order')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')
const { notify, getIO } = require('./notificationService')

const EXTENSION_MS = 2 * 60 * 1000

function parseWindow(startTime, endTime) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError('Enter a valid start and end time', 400)
  }
  const duration = end.getTime() - start.getTime()
  if (duration < 60 * 1000) throw new ApiError('An auction must last at least 1 minute', 400)
  if (duration > 30 * 24 * 60 * 60 * 1000) throw new ApiError('An auction cannot run longer than 30 days', 400)
  if (end.getTime() <= Date.now()) throw new ApiError('Auction end time must be in the future', 400)
  return { start, end }
}

function minimumNextBid(auction) {
  if (!auction || auction.bidCount > 0) return Number(auction.currentPrice) + Number(auction.minIncrement)
  return Number(auction.startingPrice)
}

/**
 * Compare-and-swap bid.
 * Two bids can be valid against the same snapshot, but only one update matches
 * bidCount + currentPrice + endTime. The loser retries against the new price.
 * This stays correct on a standalone MongoDB server, where multi-document
 * transactions are unavailable.
 * A bid inside the final two minutes extends endTime by two minutes.
 */
async function placeBid({ auctionId, bidder, amount }) {
  if (!bidder.isVerified) {
    throw new ApiError('Verify your college email before you can publish listings, offer services, or place bids.', 403)
  }
  if (bidder.isSuspended) throw new ApiError('This account is suspended.', 403)

  const numericAmount = Math.round(Number(amount) * 100) / 100
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError('Enter a valid bid amount', 400)
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await Auction.findById(auctionId)
    if (!snapshot) throw new ApiError('Auction not found', 404)
    if (String(snapshot.seller) === String(bidder._id)) {
      throw new ApiError('Sellers cannot bid on their own auctions', 400)
    }
    if (snapshot.status === 'cancelled') throw new ApiError('This auction was cancelled', 400)
    if (['sold', 'unsold', 'closing'].includes(snapshot.status) || snapshot.endTime.getTime() <= Date.now()) {
      throw new ApiError('This auction has ended', 400)
    }
    if (snapshot.startTime.getTime() > Date.now()) {
      throw new ApiError('This auction has not started', 400)
    }

    const required = minimumNextBid(snapshot)
    if (numericAmount < required) {
      throw new ApiError(`Bid must be at least ${required}`, 400)
    }

    let endTime = snapshot.endTime
    let extensionCount = snapshot.extensionCount || 0
    const extended = snapshot.endTime.getTime() - Date.now() <= EXTENSION_MS
    if (extended) {
      endTime = new Date(snapshot.endTime.getTime() + EXTENSION_MS)
      extensionCount += 1
    }

    const updated = await Auction.findOneAndUpdate(
      {
        _id: snapshot._id,
        status: snapshot.status,
        bidCount: snapshot.bidCount,
        currentPrice: snapshot.currentPrice,
        endTime: snapshot.endTime,
        seller: { $ne: bidder._id },
      },
      {
        $set: {
          currentPrice: numericAmount,
          highestBidder: bidder._id,
          endTime,
          extensionCount,
          status: 'active',
        },
        $inc: { bidCount: 1 },
      },
      { new: true }
    )

    if (!updated) continue

    const bid = await Bid.create({ auction: updated._id, bidder: bidder._id, amount: numericAmount })
    await publishBid({ updated, bid, bidder, previous: snapshot })
    return { auction: updated, bid, extended }
  }

  throw new ApiError('Another bid landed first. Review the current price and try again.', 409)
}

async function publishBid({ updated, bid, bidder, previous }) {
  const io = getIO()
  if (io) {
    io.to(`auction:${updated._id}`).emit('bid:update', {
      auctionId: String(updated._id),
      currentPrice: updated.currentPrice,
      bidCount: updated.bidCount,
      endTime: updated.endTime,
      extensionCount: updated.extensionCount,
      minimumNextBid: minimumNextBid(updated),
      highestBidder: { _id: bidder._id, name: bidder.name },
      bid: {
        _id: bid._id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        bidder: { _id: bidder._id, name: bidder.name },
      },
    })
  }

  await notify({
    user: previous.seller,
    type: 'bid',
    title: 'New bid on your auction',
    body: `${bidder.name} bid ${updated.currentPrice} on ${updated.title}.`,
    link: `/auctions/${updated._id}`,
  })

  if (previous.highestBidder && String(previous.highestBidder) !== String(bidder._id)) {
    await notify({
      user: previous.highestBidder,
      type: 'outbid',
      title: 'You were outbid',
      body: `Someone bid ${updated.currentPrice} on ${updated.title}.`,
      link: `/auctions/${updated._id}`,
    })
  }

  const exclude = [bidder._id, previous.seller, previous.highestBidder].filter(Boolean)
  const watchers = await User.find({ watchedAuctions: updated._id, _id: { $nin: exclude } }).select('_id')
  await Promise.all(watchers.map((watcher) => notify({
    user: watcher._id,
    type: 'bid',
    title: 'Watched auction updated',
    body: `${updated.title} is now at ${updated.currentPrice}.`,
    link: `/auctions/${updated._id}`,
  })))
}

async function finalizeAuction(auction) {
  const reserveMet = auction.reservePrice == null || Number(auction.currentPrice) >= Number(auction.reservePrice)
  const hasWinner = auction.bidCount > 0 && auction.highestBidder && reserveMet

  if (hasWinner) {
    auction.status = 'sold'
    auction.winner = auction.highestBidder
    await auction.save()
    const existing = await Order.findOne({ kind: 'auction', auction: auction._id })
    if (!existing) {
      await Order.create({
        kind: 'auction',
        auction: auction._id,
        buyer: auction.highestBidder,
        seller: auction.seller,
        amount: auction.currentPrice,
        status: 'accepted',
        payment: { simulated: true, confirmedAt: null },
      })
    }
    await notify({
      user: auction.highestBidder,
      type: 'auction_won',
      title: 'You won an auction',
      body: `You won ${auction.title} at ${auction.currentPrice}. Confirm the simulated payment to finish.`,
      link: `/auctions/${auction._id}`,
    })
    await notify({
      user: auction.seller,
      type: 'auction_ended',
      title: 'Your auction sold',
      body: `${auction.title} sold at ${auction.currentPrice}.`,
      link: `/auctions/${auction._id}`,
    })
    return auction
  }

  auction.status = 'unsold'
  auction.winner = null
  await auction.save()
  await notify({
    user: auction.seller,
    type: 'auction_ended',
    title: auction.bidCount ? 'Auction ended without a sale' : 'Auction ended unsold',
    body: auction.bidCount
      ? `${auction.title} ended below the reserve price.`
      : `${auction.title} ended with no bids.`,
    link: `/auctions/${auction._id}`,
  })
  if (auction.highestBidder && auction.reservePrice != null && !reserveMet) {
    await notify({
      user: auction.highestBidder,
      type: 'auction_ended',
      title: 'Reserve price was not met',
      body: `${auction.title} closed without a winner.`,
      link: `/auctions/${auction._id}`,
    })
  }
  return auction
}

async function refreshAuctionStates() {
  const now = new Date()
  await Auction.updateMany(
    { status: 'scheduled', startTime: { $lte: now }, endTime: { $gt: now } },
    { $set: { status: 'active' } }
  )

  const due = await Auction.find({
    status: { $in: ['active', 'scheduled'] },
    endTime: { $lte: now },
  }).select('_id')

  for (const item of due) {
    const locked = await Auction.findOneAndUpdate(
      { _id: item._id, status: { $in: ['active', 'scheduled'] }, endTime: { $lte: new Date() } },
      { $set: { status: 'closing' } },
      { new: true }
    )
    if (locked) await finalizeAuction(locked)
  }

  const stuck = await Auction.find({ status: 'closing' })
  for (const auction of stuck) {
    if (auction.endTime.getTime() <= Date.now()) await finalizeAuction(auction)
  }
}

function startAuctionScheduler() {
  const tick = () => {
    refreshAuctionStates().catch((err) => {
      if (process.env.NODE_ENV !== 'test') console.error('Auction scheduler failed', err.message)
    })
  }
  tick()
  return setInterval(tick, 10000)
}

module.exports = {
  EXTENSION_MS,
  parseWindow,
  minimumNextBid,
  placeBid,
  refreshAuctionStates,
  startAuctionScheduler,
}
