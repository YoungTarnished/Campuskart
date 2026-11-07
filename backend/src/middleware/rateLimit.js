const rateLimit = require('express-rate-limit')

const skipTests = () => process.env.NODE_ENV === 'test'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTests,
  message: { success: false, message: 'Too many authentication attempts. Try again in a few minutes.' },
})

const bidLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTests,
  message: { success: false, message: 'Too many bids. Wait a moment and try again.' },
})

module.exports = { authLimiter, bidLimiter }
