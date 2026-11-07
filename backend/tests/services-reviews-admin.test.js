const User = require('../src/models/User')
const { app, request, createVerifiedUser, auth, createProduct } = require('./helpers')

function servicePayload(overrides = {}) {
  return {
    title: 'Pointers and recursion tutoring',
    description: 'One-hour explanations and practice traces. I teach the idea and do not submit coursework.',
    category: 'Programming tutoring',
    pricingType: 'hourly',
    price: 200,
    estimatedCompletionTime: '1 hour',
    availability: 'Weekdays after 6pm',
    ...overrides,
  }
}

describe('services, reviews, and admin', () => {
  test('service requests follow accept and complete rules and reject graded-work offers', async () => {
    const provider = await createVerifiedUser({ email: 'tutor@campuskart.edu' })
    const student = await createVerifiedUser({ email: 'learner@campuskart.edu' })
    const blocked = await request(app).post('/api/services').set(auth(provider.token)).send(servicePayload({
      description: 'I will complete your graded assignment and final exam for you.',
    }))
    expect(blocked.status).toBe(400)
    expect(blocked.body.message).toMatch(/graded/i)

    const created = await request(app).post('/api/services').set(auth(provider.token)).send(servicePayload())
    expect(created.status).toBe(201)
    const id = created.body.data._id
    const first = await request(app).post(`/api/services/${id}/requests`).set(auth(student.token)).send({
      message: 'Please explain recursion with a few traces.',
    })
    expect(first.status).toBe(201)
    const duplicate = await request(app).post(`/api/services/${id}/requests`).set(auth(student.token)).send({
      message: 'Sending the same request again.',
    })
    expect(duplicate.status).toBe(409)

    const accepted = await request(app).patch(`/api/services/requests/${first.body.data._id}/accept`).set(auth(provider.token))
    expect(accepted.body.data.status).toBe('accepted')
    const early = await request(app).post('/api/reviews').set(auth(student.token)).send({
      transactionType: 'service',
      transactionId: first.body.data._id,
      revieweeId: provider.user._id,
      rating: 5,
    })
    expect(early.status).toBe(400)

    const done = await request(app).patch(`/api/services/requests/${first.body.data._id}/complete`).set(auth(provider.token))
    expect(done.body.data.status).toBe('completed')
    const review = await request(app).post('/api/reviews').set(auth(student.token)).send({
      transactionType: 'service',
      transactionId: first.body.data._id,
      revieweeId: provider.user._id,
      rating: 5,
      feedback: 'Clear explanation.',
    })
    expect(review.status).toBe(201)
    const again = await request(app).post('/api/reviews').set(auth(student.token)).send({
      transactionType: 'service',
      transactionId: first.body.data._id,
      revieweeId: provider.user._id,
      rating: 4,
    })
    expect(again.status).toBe(409)
    const self = await request(app).post('/api/reviews').set(auth(student.token)).send({
      transactionType: 'service',
      transactionId: first.body.data._id,
      revieweeId: student.user._id,
      rating: 5,
    })
    expect(self.status).toBe(400)
  })

  test('order reviews are allowed once for each participant after completion', async () => {
    const seller = await createVerifiedUser({ email: 'rev-seller@campuskart.edu' })
    const buyer = await createVerifiedUser({ email: 'rev-buyer@campuskart.edu' })
    const product = await createProduct(seller.token)
    const order = await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: product._id })
    const tooSoon = await request(app).post('/api/reviews').set(auth(buyer.token)).send({
      transactionType: 'order',
      transactionId: order.body.data._id,
      revieweeId: seller.user._id,
      rating: 5,
    })
    expect(tooSoon.status).toBe(400)
    await request(app).patch(`/api/orders/${order.body.data._id}/accept`).set(auth(seller.token))
    await request(app).patch(`/api/orders/${order.body.data._id}/confirm-payment`).set(auth(buyer.token))
    const byBuyer = await request(app).post('/api/reviews').set(auth(buyer.token)).send({
      transactionType: 'order',
      transactionId: order.body.data._id,
      revieweeId: seller.user._id,
      rating: 4,
      feedback: 'Fair price.',
    })
    const bySeller = await request(app).post('/api/reviews').set(auth(seller.token)).send({
      transactionType: 'order',
      transactionId: order.body.data._id,
      revieweeId: buyer.user._id,
      rating: 5,
    })
    expect(byBuyer.status).toBe(201)
    expect(bySeller.status).toBe(201)
    const profile = await request(app).get(`/api/users/${seller.user._id}`)
    expect(profile.body.data.user.ratingCount).toBe(1)
    expect(profile.body.data.user.email).toBeUndefined()
  })

  test('admin routes are protected and can suspend a user and remove a listing', async () => {
    const student = await createVerifiedUser({ email: 'plain@campuskart.edu' })
    const adminUser = await createVerifiedUser({ email: 'root@campuskart.edu' })
    await User.findByIdAndUpdate(adminUser.user._id, { role: 'admin' })
    const denied = await request(app).get('/api/admin/stats').set(auth(student.token))
    expect(denied.status).toBe(403)
    const stats = await request(app).get('/api/admin/stats').set(auth(adminUser.token))
    expect(stats.status).toBe(200)
    expect(stats.body.data.users).toBeGreaterThan(0)

    const product = await createProduct(student.token, { title: 'Reported kettle' })
    const report = await request(app).post('/api/reports').set(auth(adminUser.token)).send({
      targetType: 'product',
      targetId: product._id,
      reason: 'Inappropriate content',
      details: 'Listing text is not allowed.',
    })
    expect(report.status).toBe(201)
    const removed = await request(app).patch(`/api/admin/products/${product._id}/remove`).set(auth(adminUser.token))
    expect(removed.status).toBe(200)
    const hidden = await request(app).get(`/api/products/${product._id}`)
    expect(hidden.status).toBe(404)

    const suspended = await request(app).patch(`/api/admin/users/${student.user._id}`).set(auth(adminUser.token)).send({ isSuspended: true })
    expect(suspended.status).toBe(200)
    const login = await request(app).post('/api/auth/login').send({ email: student.email, password: student.password })
    expect(login.status).toBe(403)
  })

  test('exchange of a sold product is rejected', async () => {
    const owner = await createVerifiedUser({ email: 'ex-a@campuskart.edu' })
    const other = await createVerifiedUser({ email: 'ex-b@campuskart.edu' })
    const buyer = await createVerifiedUser({ email: 'ex-c@campuskart.edu' })
    const offered = await createProduct(owner.token, { title: 'Blue kettle' })
    const requested = await createProduct(other.token, { title: 'Green kettle' })
    await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: requested._id })
    const proposal = await request(app).post('/api/exchanges').set(auth(owner.token)).send({
      offeredProductId: offered._id,
      requestedProductId: requested._id,
      message: 'Swap kettles?',
    })
    expect(proposal.status).toBe(409)
  })
})
