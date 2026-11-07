const request = require('supertest')
const app = require('../src/app')

async function createVerifiedUser(overrides = {}) {
  const unique = `${Date.now()}${Math.random().toString(16).slice(2)}`
  const payload = {
    name: 'Asha Menon',
    email: `student${unique}@campuskart.edu`,
    password: 'Student@123',
    college: 'National Institute of Technology',
    department: 'Computer Science',
    year: '3',
    ...overrides,
  }
  const registered = await request(app).post('/api/auth/register').send(payload)
  if (registered.status !== 201) {
    throw new Error(`register failed ${registered.status} ${JSON.stringify(registered.body)}`)
  }
  const verified = await request(app).post('/api/auth/verify-email').send({
    token: registered.body.data.demoVerification.token,
  })
  return {
    ...payload,
    token: verified.body.data.token,
    user: verified.body.data.user,
  }
}

function auth(token) {
  return { Authorization: `Bearer ${token}` }
}

function productPayload(overrides = {}) {
  return {
    title: 'Data Structures Textbook',
    description: 'Used textbook for second year, all chapters intact and readable.',
    category: 'Books',
    condition: 'Good',
    price: 450,
    location: 'Hostel B lobby',
    images: ['/api/placeholder/Books'],
    isExchangeEligible: true,
    ...overrides,
  }
}

async function createProduct(token, overrides = {}) {
  const res = await request(app).post('/api/products').set(auth(token)).send(productPayload(overrides))
  if (res.status !== 201) throw new Error(`product failed ${res.status} ${JSON.stringify(res.body)}`)
  return res.body.data
}

module.exports = { app, request, createVerifiedUser, auth, productPayload, createProduct }
