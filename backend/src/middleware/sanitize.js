function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize)
  if (value && typeof value === 'object') {
    const clean = {}
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') continue
      clean[key] = sanitize(nested)
    }
    return clean
  }
  return value
}

function sanitizeRequest(req, res, next) {
  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query)
  if (req.params) req.params = sanitize(req.params)
  next()
}

module.exports = sanitizeRequest
