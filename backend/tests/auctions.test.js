const Auction = require('../src/models/Auction')
const Bid = require('../src/models/Bid')
const Order = require('../src/models/Order')
const User = require('../src/models/User')
const { refreshAuctionStates } = require('../src/services/auctionService')
const { app, request, createVerifiedUser, auth } = require('./helpers')

function auctionBody(overrides = {}) {
  const start = new Date(Date.now() - 60 * 1000).toISOString()
  const end = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  return {
    title: 'Campus headphones',
    description: 'Working headphones with a short cable, pickup from the lab foyer.',
    category: 'Electronics',
    condition: 'Good',
    location: 'Lab foyer',
    images: ['/api/placeholder/Audio'],
    startingPrice: 100,
    minIncrement: 10,
    startTime: start,
    endTime: end,
    ...overrides,
  }
}

describe('auctions', () => {
  test('enforces owner, minimum, and expiry rules', async () => {
    const seller = await createVerifiedUser({ email: 'auction-seller@campuskart.edu' })
    const bidder = await createVerifiedUser({ email: 'bidder@campuskart.edu' })
    const created = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody())
    expect(created.status).toBe(201)
    const id = created.body.data._id

    const own = await request(app).post(`/api/auctions/${id}/bids`).set(auth(seller.token)).send({ amount: 100 })
    expect(own.status).toBe(400)
    expect(own.body.message).toMatch(/own auctions/i)

    const first = await request(app).post(`/api/auctions/${id}/bids`).set(auth(bidder.token)).send({ amount: 100 })
    expect(first.status).toBe(201)
    const low = await request(app).post(`/api/auctions/${id}/bids`).set(auth(bidder.token)).send({ amount: 105 })
    expect(low.status).toBe(400)
    expect(low.body.message).toMatch(/at least 110/)

    const cancel = await request(app).patch(`/api/auctions/${id}/cancel`).set(auth(seller.token))
    expect(cancel.status).toBe(400)
    expect(cancel.body.message).toMatch(/after bids/i)
    const remove = await request(app).delete(`/api/auctions/${id}`).set(auth(seller.token))
    expect(remove.status).toBe(400)

    await Auction.findByIdAndUpdate(id, { endTime: new Date(Date.now() - 1000) })
    const late = await request(app).post(`/api/auctions/${id}/bids`).set(auth(bidder.token)).send({ amount: 500 })
    expect(late.status).toBe(400)
    expect(late.body.message).toMatch(/ended/i)
  })

  test('keeps concurrent bids consistent', async () => {
    const seller = await createVerifiedUser({ email: 'race-seller@campuskart.edu' })
    const first = await createVerifiedUser({ email: 'race-a@campuskart.edu' })
    const second = await createVerifiedUser({ email: 'race-b@campuskart.edu' })
    const created = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody())
    const id = created.body.data._id

    const [left, right] = await Promise.all([
      request(app).post(`/api/auctions/${id}/bids`).set(auth(first.token)).send({ amount: 100 }),
      request(app).post(`/api/auctions/${id}/bids`).set(auth(second.token)).send({ amount: 100 }),
    ])
    expect([left.status, right.status].sort()).toEqual([201, 400])
    expect(await Bid.countDocuments({ auction: id })).toBe(1)
    const auction = await Auction.findById(id)
    expect(auction.bidCount).toBe(1)
    expect(auction.currentPrice).toBe(100)
  })

  test('extends the end time when a bid lands in the final two minutes', async () => {
    const seller = await createVerifiedUser({ email: 'snipe-seller@campuskart.edu' })
    const bidder = await createVerifiedUser({ email: 'snipe-bidder@campuskart.edu' })
    const end = new Date(Date.now() + 90 * 1000)
    const created = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody({
      endTime: end.toISOString(),
    }))
    const res = await request(app).post(`/api/auctions/${created.body.data._id}/bids`).set(auth(bidder.token)).send({ amount: 100 })
    expect(res.status).toBe(201)
    expect(res.body.message).toMatch(/2 minutes/i)
    expect(new Date(res.body.data.endTime).getTime()).toBeGreaterThan(end.getTime() + 60 * 1000)
    expect(res.body.data.extensionCount).toBe(1)
  })

  test('closes unsold, reserved, and sold auctions on the server', async () => {
    const seller = await createVerifiedUser({ email: 'close-seller@campuskart.edu' })
    const bidder = await createVerifiedUser({ email: 'close-bidder@campuskart.edu' })
    const empty = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody())
    await Auction.findByIdAndUpdate(empty.body.data._id, { endTime: new Date(Date.now() - 1000) })

    const reserved = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody({
      title: 'Reserved lamp',
      reservePrice: 500,
    }))
    await request(app).post(`/api/auctions/${reserved.body.data._id}/bids`).set(auth(bidder.token)).send({ amount: 100 })
    await Auction.findByIdAndUpdate(reserved.body.data._id, { endTime: new Date(Date.now() - 1000) })

    const selling = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody({ title: 'Sold mug' }))
    await request(app).post(`/api/auctions/${selling.body.data._id}/bids`).set(auth(bidder.token)).send({ amount: 100 })
    await Auction.findByIdAndUpdate(selling.body.data._id, { endTime: new Date(Date.now() - 1000) })

    await refreshAuctionStates()
    expect((await Auction.findById(empty.body.data._id)).status).toBe('unsold')
    expect((await Auction.findById(reserved.body.data._id)).status).toBe('unsold')
    const sold = await Auction.findById(selling.body.data._id)
    expect(sold.status).toBe('sold')
    expect(String(sold.winner)).toBe(String(bidder.user._id))
    const order = await Order.findOne({ auction: sold._id, kind: 'auction' })
    expect(order.status).toBe('accepted')
    expect(order.amount).toBe(100)
  })

  test('a suspended student cannot bid', async () => {
    const seller = await createVerifiedUser({ email: 'susp-seller@campuskart.edu' })
    const bidder = await createVerifiedUser({ email: 'susp-bidder@campuskart.edu' })
    const created = await request(app).post('/api/auctions').set(auth(seller.token)).send(auctionBody())
    await User.findByIdAndUpdate(bidder.user._id, { isSuspended: true })
    const bid = await request(app).post(`/api/auctions/${created.body.data._id}/bids`).set(auth(bidder.token)).send({ amount: 100 })
    expect(bid.status).toBe(403)
    const login = await request(app).post('/api/auth/login').send({ email: bidder.email, password: bidder.password })
    expect(login.status).toBe(403)
  })
})
