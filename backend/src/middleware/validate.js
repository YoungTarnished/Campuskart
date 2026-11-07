const ApiError = require('../utils/ApiError')

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    })
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(' ')
      return next(new ApiError(message, 400))
    }
    if (parsed.data.body !== undefined) req.body = parsed.data.body
    if (parsed.data.query !== undefined) req.query = parsed.data.query
    if (parsed.data.params !== undefined) req.params = parsed.data.params
    next()
  }
}

module.exports = validate
