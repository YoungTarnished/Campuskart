const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const isProduction = process.env.NODE_ENV === 'production'

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuskart',
  jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'campuskart-local-dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Demo tokens are returned by the API only outside production, unless explicitly forced off.
  demoVerification: !isProduction && process.env.DEMO_VERIFICATION !== 'false',
  bcryptRounds: process.env.NODE_ENV === 'test' ? 4 : 12,
}

module.exports = env
