const Notification = require('../models/Notification')

let io = null

function setIO(instance) {
  io = instance
}

function getIO() {
  return io
}

async function notify({ user, type, title, body, link = '', meta = {} }) {
  if (!user) return null
  const doc = await Notification.create({ user, type, title, body, link, meta })
  if (io) {
    io.to(`user:${user.toString()}`).emit('notification', {
      _id: doc._id,
      type: doc.type,
      title: doc.title,
      body: doc.body,
      link: doc.link,
      read: doc.read,
      createdAt: doc.createdAt,
    })
  }
  return doc
}

async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))]
  await Promise.all(unique.map((id) => notify({ ...payload, user: id })))
}

module.exports = { notify, notifyMany, setIO, getIO }
