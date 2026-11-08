const request = require('supertest')
const app = require('../src/app')
const Product = require('../src/models/Product')
const { STUDENT_EMAIL_PATTERN } = require('../src/constants')

function iiitaEmail() {
  const prefixes = ['iit', 'iib', 'ice', 'msb']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const tail = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${prefix}202${tail}@iiita.ac.in`
}

async function createVerifiedUser(overrides = {}) {
  const payload = {
    name: 'Asha Menon',
    email: iiitaEmail(),
    password: 'Student@123',
    college: 'Indian Institute of Information Technology Allahabad',
    department: 'Computer Science',
    year: '3',
    ...overrides,
    email: STUDENT_EMAIL_PATTERN.test(String(overrides.email || '').toLowerCase())
      ? String(overrides.email).toLowerCase()
      : iiitaEmail(),
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
  await Product.findByIdAndUpdate(res.body.data._id, { status: 'available' })
  return { ...res.body.data, status: 'available' }
}

module.exports = { app, request, createVerifiedUser, auth, productPayload, createProduct }
