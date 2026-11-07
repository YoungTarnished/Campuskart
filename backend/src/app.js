const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const env = require('./config/env')
const routes = require('./routes')
const sanitizeRequest = require('./middleware/sanitize')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const allowedOrigins = [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))
app.use(sanitizeRequest)
if (env.nodeEnv !== 'test') app.use(morgan('dev'))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/', (req, res) => {
  res.json({ success: true, message: 'CampusKart API. See /api/health.' })
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { service: 'campuskart-api', time: new Date().toISOString() } })
})

app.get('/api/placeholder/:label', (req, res) => {
  const label = String(req.params.label).replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 24) || 'CampusKart'
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#e0e7ff"/>
  <text x="400" y="300" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="36" fill="#3730a3">${label}</text>
</svg>`
  res.type('image/svg+xml').send(svg)
})

app.use('/api', routes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' })
})

app.use(errorHandler)

module.exports = app
