const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const env = require('../config/env')

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), tokenVersion: user.tokenVersion },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  )
}

function createRawToken() {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function demoLink(kind, rawToken) {
  if (!env.demoVerification) return undefined
  const path = kind === 'reset' ? `/reset-password?token=${rawToken}` : `/verify-email?token=${rawToken}`
  return {
    label: 'LOCAL DEMO ONLY. This link is not emailed. Use it only on a development machine.',
    token: rawToken,
    path,
  }
}

module.exports = { signToken, createRawToken, hashToken, demoLink }
