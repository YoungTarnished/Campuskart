const multer = require('multer')
const ApiError = require('../utils/ApiError')

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  let status = err.statusCode || 500
  let message = err.message || 'Something went wrong'

  if (err.name === 'CastError') {
    status = 400
    message = 'Invalid identifier'
  } else if (err.name === 'ValidationError') {
    status = 400
    message = Object.values(err.errors).map((item) => item.message).join(' ')
  } else if (err.code === 11000) {
    status = 409
    if (err.keyPattern && err.keyPattern.email) message = 'An account with this email already exists'
    else if (err.keyPattern && err.keyPattern.reviewer) message = 'You already reviewed this transaction'
    else if (err.keyPattern && err.keyPattern.user && err.keyPattern.product) message = 'This product is already on your wishlist'
    else message = 'That record already exists'
  } else if (err instanceof multer.MulterError) {
    status = 400
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Each image must be 5MB or smaller'
      : 'Upload at most 5 images'
  } else if (!(err instanceof ApiError) && status === 500) {
    if (process.env.NODE_ENV !== 'test') console.error(err)
    message = 'Something went wrong'
  }

  res.status(status).json({ success: false, message })
}

module.exports = errorHandler
