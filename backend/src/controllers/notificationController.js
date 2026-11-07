const Notification = require('../models/Notification')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { pageQuery, pageMeta } = require('../utils/helpers')

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query)
  const filter = { user: req.user._id }
  if (req.query.unread === 'true') filter.read = false
  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ])
  res.json({ success: true, data, unreadCount, pagination: pageMeta(page, limit, total) })
})

const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false })
  res.json({ success: true, data: { count } })
})

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  )
  if (!notification) throw new ApiError('Notification not found', 404)
  res.json({ success: true, data: notification })
})

const markAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
  res.json({ success: true, message: 'All notifications marked read' })
})

module.exports = { list, unreadCount, markRead, markAll }
