const jwt = require('jsonwebtoken')
const { app, request, createVerifiedUser, auth } = require('./helpers')

describe('authentication', () => {
  const valid = {
    name: 'Asha Menon',
    email: 'asha@campuskart.edu',
    password: 'Student@123',
    college: 'National Institute of Technology',
    department: 'Computer Science',
    year: '3',
  }

  test('rejects missing fields, weak passwords, and non-college email', async () => {
    const missing = await request(app).post('/api/auth/register').send({ email: 'a@campuskart.edu' })
    expect(missing.status).toBe(400)

    const weak = await request(app).post('/api/auth/register').send({ ...valid, password: 'password' })
    expect(weak.status).toBe(400)
    expect(weak.body.message).toMatch(/uppercase/i)

    const gmail = await request(app).post('/api/auth/register').send({ ...valid, email: 'asha@gmail.com' })
    expect(gmail.status).toBe(400)
    expect(gmail.body.message).toMatch(/college email/i)
  })

  test('registers, verifies with the demo token, logs in, and ignores a client role', async () => {
    const registered = await request(app).post('/api/auth/register').send({ ...valid, role: 'admin', isVerified: true })
    expect(registered.status).toBe(201)
    expect(registered.body.data.user.role).toBe('student')
    expect(registered.body.data.user.isVerified).toBe(false)
    expect(registered.body.data.user.password).toBeUndefined()
    expect(registered.body.data.demoVerification.label).toMatch(/LOCAL DEMO ONLY/)

    const verified = await request(app).post('/api/auth/verify-email').send({
      token: registered.body.data.demoVerification.token,
    })
    expect(verified.status).toBe(200)
    expect(verified.body.data.user.isVerified).toBe(true)

    const login = await request(app).post('/api/auth/login').send({ email: valid.email, password: valid.password })
    expect(login.status).toBe(200)
    const me = await request(app).get('/api/auth/me').set(auth(login.body.data.token))
    expect(me.body.data.email).toBe(valid.email)
  })

  test('logout and expired tokens are rejected', async () => {
    const student = await createVerifiedUser()
    const loggedOut = await request(app).post('/api/auth/logout').set(auth(student.token))
    expect(loggedOut.status).toBe(200)
    const me = await request(app).get('/api/auth/me').set(auth(student.token))
    expect(me.status).toBe(401)

    const expired = jwt.sign({ id: student.user._id, tokenVersion: 1 }, process.env.JWT_SECRET, { expiresIn: -10 })
    const rejected = await request(app).get('/api/auth/me').set(auth(expired))
    expect(rejected.status).toBe(401)
    expect(rejected.body.message).toMatch(/expired/i)
  })

  test('forgot and reset password invalidates the old session', async () => {
    const student = await createVerifiedUser({ email: 'reset@campuskart.edu' })
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@campuskart.edu' })
    expect(forgot.status).toBe(200)
    expect(forgot.body.data.demoReset.label).toMatch(/LOCAL DEMO ONLY/)

    const reset = await request(app).post('/api/auth/reset-password').send({
      token: forgot.body.data.demoReset.token,
      password: 'NewPass@123',
    })
    expect(reset.status).toBe(200)
    const oldSession = await request(app).get('/api/auth/me').set(auth(student.token))
    expect(oldSession.status).toBe(401)
    const login = await request(app).post('/api/auth/login').send({ email: 'reset@campuskart.edu', password: 'NewPass@123' })
    expect(login.status).toBe(200)
  })

  test('unverified students cannot publish a product', async () => {
    const registered = await request(app).post('/api/auth/register').send(valid)
    const res = await request(app).post('/api/products').set(auth(registered.body.data.token)).send({
      title: 'Calculator',
      description: 'A working scientific calculator for lab sessions.',
      category: 'Stationery',
      condition: 'Good',
      price: 200,
      location: 'Library',
      images: ['/api/placeholder/Calc'],
    })
    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/verify/i)
  })
})
