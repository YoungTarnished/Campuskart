const { app, request, createVerifiedUser, auth, createProduct, productPayload } = require('./helpers')
const User = require('../src/models/User')

describe('products', () => {
  test('creates, searches, filters, sorts, and blocks edits by someone else', async () => {
    const owner = await createVerifiedUser({ email: 'owner@campuskart.edu' })
    const other = await createVerifiedUser({ email: 'other@campuskart.edu' })
    await createProduct(owner.token, { title: 'Algorithms textbook', price: 500, category: 'Books' })
    await createProduct(owner.token, { title: 'Hostel kettle', price: 250, category: 'Hostel Essentials', condition: 'Fair' })

    const searched = await request(app).get('/api/products').query({ search: 'Algorithms' })
    expect(searched.status).toBe(200)
    expect(searched.body.data).toHaveLength(1)

    const filtered = await request(app).get('/api/products').query({ category: 'Books', sort: 'price_asc' })
    expect(filtered.body.data.every((item) => item.category === 'Books')).toBe(true)

    const prices = await request(app).get('/api/products').query({ sort: 'price_asc' })
    const values = prices.body.data.map((item) => item.price)
    expect(values).toEqual([...values].sort((a, b) => a - b))

    const listing = prices.body.data[0]
    const forbidden = await request(app).put(`/api/products/${listing._id}`).set(auth(other.token)).send({
      title: 'Stolen listing title',
      description: 'This edit should never be saved to the original listing.',
      category: listing.category,
      condition: listing.condition,
      price: 1,
      location: listing.location,
      images: listing.images,
    })
    expect(forbidden.status).toBe(403)

    const updated = await request(app).put(`/api/products/${listing._id}`).set(auth(owner.token)).send({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      price: listing.price + 10,
      location: listing.location,
      images: listing.images,
    })
    expect(updated.status).toBe(200)
    expect(updated.body.data.price).toBe(listing.price + 10)
  })

  test('rejects missing fields and a fake image upload', async () => {
    const owner = await createVerifiedUser()
    const missing = await request(app).post('/api/products').set(auth(owner.token)).send({ title: 'No' })
    expect(missing.status).toBe(400)

    const upload = await request(app)
      .post('/api/uploads')
      .set(auth(owner.token))
      .attach('images', Buffer.from('not an image'), 'notes.txt')
    expect(upload.status).toBe(400)

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    const ok = await request(app)
      .post('/api/uploads')
      .set(auth(owner.token))
      .attach('images', png, { filename: 'dot.png', contentType: 'image/png' })
    expect(ok.status).toBe(201)
    expect(ok.body.data.storage).toBe('local')
    expect(ok.body.data.urls[0]).toMatch(/^\/uploads\//)
  })

  test('cannot edit a product once a purchase is active', async () => {
    const seller = await createVerifiedUser({ email: 'seller@campuskart.edu' })
    const buyer = await createVerifiedUser({ email: 'buyer@campuskart.edu' })
    const product = await createProduct(seller.token)
    const order = await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: product._id })
    expect(order.status).toBe(201)
    const edit = await request(app).put(`/api/products/${product._id}`).set(auth(seller.token)).send({
      title: product.title,
      description: product.description,
      category: product.category,
      condition: product.condition,
      price: 999,
      location: product.location,
      images: product.images,
    })
    expect(edit.status).toBe(400)
  })

  test('a new sale or trade stays hidden until an admin approves or removes it', async () => {
    const seller = await createVerifiedUser()
    const buyer = await createVerifiedUser()
    const adminUser = await createVerifiedUser()
    await User.findByIdAndUpdate(adminUser.user._id, { role: 'admin' })

    const created = await request(app).post('/api/products').set(auth(seller.token)).send(productPayload({ title: 'Cycle for trade' }))
    expect(created.status).toBe(201)
    expect(created.body.data.status).toBe('pending')

    const hidden = await request(app).get('/api/products').query({ search: 'Cycle for trade' })
    expect(hidden.body.data).toHaveLength(0)
    const stranger = await request(app).get(`/api/products/${created.body.data._id}`).set(auth(buyer.token))
    expect(stranger.status).toBe(404)
    const purchase = await request(app).post('/api/orders').set(auth(buyer.token)).send({ productId: created.body.data._id })
    expect(purchase.status).toBe(409)

    const denied = await request(app).patch(`/api/admin/products/${created.body.data._id}/approve`).set(auth(seller.token))
    expect(denied.status).toBe(403)
    const approved = await request(app).patch(`/api/admin/products/${created.body.data._id}/approve`).set(auth(adminUser.token))
    expect(approved.status).toBe(200)
    expect(approved.body.data.status).toBe('available')

    const visible = await request(app).get('/api/products').query({ search: 'Cycle for trade' })
    expect(visible.body.data).toHaveLength(1)

    const removed = await request(app).patch(`/api/admin/products/${created.body.data._id}/remove`).set(auth(adminUser.token))
    expect(removed.status).toBe(200)
    const gone = await request(app).get('/api/products').query({ search: 'Cycle for trade' })
    expect(gone.body.data).toHaveLength(0)
  })
})
