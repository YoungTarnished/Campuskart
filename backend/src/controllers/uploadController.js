const asyncHandler = require('../utils/asyncHandler')
const { storeImages, imageStorageMode } = require('../services/uploadService')

const uploadImages = asyncHandler(async (req, res) => {
  const { urls, mode } = await storeImages(req.files)
  res.status(201).json({
    success: true,
    message: mode === 'cloudinary' ? 'Images uploaded' : 'Images stored locally for development',
    data: { urls, storage: mode },
  })
})

const storage = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      storage: imageStorageMode(),
      note: imageStorageMode() === 'local'
        ? 'Cloudinary is not configured. Uploads are saved on this server.'
        : 'Uploads are sent to Cloudinary.',
    },
  })
})

module.exports = { uploadImages, storage }
