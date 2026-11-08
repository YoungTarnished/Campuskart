const bcrypt = require('bcryptjs')
const User = require('../models/User')
const env = require('../config/env')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { presentUser, isAdminEmail } = require('../utils/helpers')
const { COLLEGE_NAME } = require('../constants')
const { signToken, createRawToken, hashToken, demoLink } = require('../utils/tokens')

async function issueVerification(user) {
  const raw = createRawToken()
  user.verificationToken = hashToken(raw)
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await user.save()
  return raw
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, year } = req.body
  if (isAdminEmail(email)) {
    throw new ApiError('This email is reserved for an administrator. Sign in with the admin account instead of registering.', 403)
  }
  const existing = await User.findOne({ email })
  if (existing) throw new ApiError('An account with this email already exists', 409)

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, env.bcryptRounds),
    college: COLLEGE_NAME,
    department,
    year,
    role: 'student',
  })
  const raw = await issueVerification(user)
  res.status(201).json({
    success: true,
    message: 'Account created. Verify your college email before listing, bidding, or offering services.',
    data: {
      token: signToken(user),
      user: presentUser(user, { includePrivate: true }),
      demoVerification: demoLink('verify', raw),
    },
  })
})

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password')
  const matches = user && await bcrypt.compare(req.body.password, user.password)
  if (!matches) throw new ApiError('Invalid email or password', 401)
  if (user.isSuspended) throw new ApiError('This account is suspended.', 403)
  res.json({
    success: true,
    message: 'Signed in',
    data: { token: signToken(user), user: presentUser(user, { includePrivate: true }) },
  })
})

const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1
  await req.user.save()
  res.json({ success: true, message: 'Signed out' })
})

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: presentUser(req.user, { includePrivate: true }) })
})

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    verificationToken: hashToken(req.body.token),
    verificationTokenExpires: { $gt: new Date() },
  }).select('+verificationToken +verificationTokenExpires')

  if (!user) throw new ApiError('Verification link is invalid or expired', 400)
  user.isVerified = true
  user.verificationToken = undefined
  user.verificationTokenExpires = undefined
  await user.save()
  res.json({
    success: true,
    message: 'College email verified',
    data: { token: signToken(user), user: presentUser(user, { includePrivate: true }) },
  })
})

const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isVerified) throw new ApiError('This email is already verified', 400)
  const raw = await issueVerification(req.user)
  res.json({
    success: true,
    message: 'A new verification link was generated.',
    data: { demoVerification: demoLink('verify', raw) },
  })
})

const forgotPassword = asyncHandler(async (req, res) => {
  const generic = 'If an account exists for that email, a reset link has been generated.'
  const user = await User.findOne({ email: req.body.email })
  if (!user) return res.json({ success: true, message: generic })
  const raw = createRawToken()
  user.resetPasswordToken = hashToken(raw)
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000)
  await user.save()
  res.json({
    success: true,
    message: generic,
    data: { demoReset: demoLink('reset', raw) },
  })
})

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires +password')

  if (!user) throw new ApiError('Reset link is invalid or expired', 400)
  user.password = await bcrypt.hash(req.body.password, env.bcryptRounds)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  user.tokenVersion += 1
  await user.save()
  res.json({ success: true, message: 'Password updated. Sign in with the new password.' })
})

const updateProfile = asyncHandler(async (req, res) => {
  const fields = ['name', 'department', 'year', 'profilePicture']
  for (const field of fields) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field]
  }
  await req.user.save()
  res.json({ success: true, message: 'Profile updated', data: presentUser(req.user, { includePrivate: true }) })
})

module.exports = {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updateProfile,
}
