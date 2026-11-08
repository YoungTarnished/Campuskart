const ApiError = require('./ApiError')
const { ADMIN_EMAILS, STUDENT_EMAIL_PATTERN } = require('../constants')

function pageQuery(query) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12))
  return { page, limit, skip: (page - 1) * limit }
}

function pageMeta(page, limit, total) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit) || 1) }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isStudentEmail(email) {
  return STUDENT_EMAIL_PATTERN.test(normalizeEmail(email))
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(normalizeEmail(email))
}

function isCollegeEmail(email) {
  return isStudentEmail(email) || isAdminEmail(email)
}

function presentUser(user, { includePrivate = false } = {}) {
  if (!user) return null
  const profile = {
    _id: user._id,
    name: user.name,
    role: user.role,
    college: user.college,
    department: user.department,
    year: user.year,
    profilePicture: user.profilePicture || '',
    isVerified: user.isVerified,
    ratingAverage: user.ratingAverage || 0,
    ratingCount: user.ratingCount || 0,
    completedTransactions: user.completedTransactions || 0,
    createdAt: user.createdAt,
  }
  if (includePrivate) {
    profile.email = user.email
    profile.isSuspended = user.isSuspended
  }
  return profile
}

function assertOwner(document, user, field = 'seller') {
  const owner = document[field]
  const ownerId = owner && owner._id ? owner._id : owner
  if (!ownerId || String(ownerId) !== String(user._id)) {
    throw new ApiError('You can only change your own records', 403)
  }
}

function isAllowedImageUrl(url) {
  if (typeof url !== 'string' || !url) return false
  if (url.startsWith('/uploads/')) return true
  if (url.startsWith('/api/placeholder/')) return true
  if (process.env.CLOUDINARY_CLOUD_NAME && url.startsWith('https://res.cloudinary.com/')) return true
  return false
}

module.exports = {
  pageQuery,
  pageMeta,
  escapeRegex,
  roundMoney,
  isCollegeEmail,
  isStudentEmail,
  isAdminEmail,
  presentUser,
  assertOwner,
  isAllowedImageUrl,
}
