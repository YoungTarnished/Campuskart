const jwt = require('jsonwebtoken')
const User = require('../models/User')
const env = require('../config/env')
const ApiError = require('../utils/ApiError')

// Authorization always uses the database user. The token only proves identity
// and session version, so a client cannot supply its own role or verification flag.
async function attachUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new ApiError('Sign in to continue', 401)

  let decoded
  try {
    decoded = jwt.verify(token, env.jwtSecret)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError('Your session has expired. Please sign in again.', 401)
    }
    throw new ApiError('Invalid session. Please sign in again.', 401)
  }

  const user = await User.findById(decoded.id)
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw new ApiError('Your session is no longer valid. Please sign in again.', 401)
  }
  if (user.isSuspended) {
    throw new ApiError('This account is suspended.', 403)
  }
  req.user = user
}

function protect(req, res, next) {
  attachUser(req).then(() => next()).catch(next)
}

function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next()
  attachUser(req).then(() => next()).catch(next)
}

function requireVerified(req, res, next) {
  if (!req.user.isVerified) {
    return next(new ApiError('Verify your college email before you can publish listings, place bids, or start a transaction.', 403))
  }
  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to do that', 403))
    }
    next()
  }
}

module.exports = { protect, optionalAuth, requireVerified, requireRole }
