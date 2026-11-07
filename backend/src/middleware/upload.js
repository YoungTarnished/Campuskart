const multer = require('multer')
const ApiError = require('../utils/ApiError')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new ApiError('Only JPG, PNG, and WEBP images are allowed', 400))
      return
    }
    cb(null, true)
  },
})

module.exports = upload
