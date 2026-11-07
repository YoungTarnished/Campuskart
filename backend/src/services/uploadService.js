const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')
const ApiError = require('../utils/ApiError')

const uploadDir = path.join(__dirname, '../../uploads')

function imageStorageMode() {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return 'cloudinary'
  }
  return 'local'
}

function detectImage(buffer) {
  if (!buffer || buffer.length < 12) return null
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buffer.subarray(0, 8).equals(png)) return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp'
  return null
}

async function uploadCloudinary(buffer, type) {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  const dataUri = `data:image/${type};base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(dataUri, { folder: 'campuskart' })
  return result.secure_url
}

async function storeImages(files) {
  if (!files || !files.length) throw new ApiError('Choose at least one image', 400)
  if (files.length > 5) throw new ApiError('Upload at most 5 images', 400)
  await fs.mkdir(uploadDir, { recursive: true })
  const mode = imageStorageMode()
  const urls = []

  for (const file of files) {
    const type = detectImage(file.buffer)
    if (!type) throw new ApiError('Invalid image upload. Use a real JPG, PNG, or WEBP file.', 400)
    if (mode === 'cloudinary') {
      urls.push(await uploadCloudinary(file.buffer, type))
    } else {
      const name = `${crypto.randomBytes(16).toString('hex')}.${type === 'jpeg' ? 'jpg' : type}`
      await fs.writeFile(path.join(uploadDir, name), file.buffer)
      urls.push(`/uploads/${name}`)
    }
  }
  return { urls, mode }
}

module.exports = { storeImages, imageStorageMode, detectImage }
