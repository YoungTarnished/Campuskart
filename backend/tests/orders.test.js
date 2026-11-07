const { app, request, createVerifiedUser, auth, createProduct } = require('./helpers')

describe('purchase workflow', () => {
  test('buyer and seller move an order from request to simulated completion', async () => {
    const seller = await createVerifiedUser({ email: 'sell@campuskart.edu' })
    const buyer = await createVerifiedUser({ email: 'buy@campuskart.edu' })
    const product = await createProduct(seller.token, { price: 320 })

    const created = await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: product._id, amount: 1 })
    expect(created.status).toBe(201)
    expect(created.body.data.amount).toBe(320)
    expect(created.body.data.status).toBe('pending')

    const accepted = await request(app).patch(`/api/orders/${created.body.data._id}/accept`).set(auth(seller.token))
    expect(accepted.body.data.status).toBe('accepted')
    const paid = await request(app).patch(`/api/orders/${created.body.data._id}/confirm-payment`).set(auth(buyer.token))
    expect(paid.status).toBe(200)
    expect(paid.body.data.status).toBe('completed')
    expect(paid.body.data.payment.simulated).toBe(true)

    const again = await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: product._id })
    expect(again.status).toBe(409)
  })

  test('blocks buying your own product', async () => {
    const seller = await createVerifiedUser()
    const product = await createProduct(seller.token)
    const res = await request(app).post('/api/orders').set(auth(seller.token)).send({ productId: product._id })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/own product/i)
  })

  test('only one of two simultaneous purchases succeeds', async () => {
    const seller = await createVerifiedUser({ email: 'shop@campuskart.edu' })
    const first = await createVerifiedUser({ email: 'one@campuskart.edu' })
    const second = await createVerifiedUser({ email: 'two@campuskart.edu' })
    const product = await createProduct(seller.token)

    const [a, b] = await Promise.all([
      request(app).post('/api/orders').set(auth(first.token)).send({ productId: product._id }),
      request(app).post('/api/orders').set(auth(second.token)).send({ productId: product._id }),
    ])
    const statuses = [a.status, b.status].sort()
    expect(statuses).toEqual([201, 409])

    const purchasesA = await request(app).get('/api/orders/purchases').set(auth(first.token))
    const purchasesB = await request(app).get('/api/orders/purchases').set(auth(second.token))
    expect(purchasesA.body.data.length + purchasesB.body.data.length).toBe(1)
  })

  test('a student cannot read another student order', async () => {
    const seller = await createVerifiedUser({ email: 'hidden-seller@campuskart.edu' })
    const buyer = await createVerifiedUser({ email: 'hidden-buyer@campuskart.edu' })
    const stranger = await createVerifiedUser({ email: 'stranger@campuskart.edu' })
    const product = await createProduct(seller.token)
    const order = await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: product._id })
    const peek = await request(app).get(`/api/orders/${order.body.data._id}`).set(auth(stranger.token))
    expect(peek.status).toBe(404)
  })
})
