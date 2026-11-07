const Product = require('../models/Product')
const Order = require('../models/Order')

const CONDITION_FACTOR = {
  New: 1.25,
  'Like New': 1.1,
  Good: 1,
  Fair: 0.8,
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (!sorted.length) return 0
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function tokens(title) {
  return new Set(
    String(title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3)
  )
}

/**
 * Transparent price suggestion:
 * 1. Take active and reserved listings in the same category.
 * 2. If at least two of those share a title word (4+ letters) with this title, use only those.
 * 3. Add completed sale amounts from the same category.
 * 4. Suggested price = round(median * condition factor). Factors: New 1.25, Like New 1.1, Good 1, Fair 0.8.
 */
async function suggestPrice({ category, condition, title, excludeId }) {
  const productQuery = { category, status: { $in: ['available', 'reserved'] } }
  if (excludeId) productQuery._id = { $ne: excludeId }
  const listings = await Product.find(productQuery).select('title price')

  const wanted = tokens(title)
  let active = listings
  if (wanted.size) {
    const similar = listings.filter((product) =>
      [...tokens(product.title)].some((token) => wanted.has(token))
    )
    if (similar.length >= 2) active = similar
  }

  const soldOrders = await Order.find({ status: 'completed', kind: 'product' }).populate('product', 'category')
  const sold = soldOrders
    .filter((order) => order.product && order.product.category === category)
    .map((order) => order.amount)

  const samples = [...active.map((product) => product.price), ...sold]
  if (!samples.length) {
    return {
      suggestedPrice: null,
      sampleSize: 0,
      activeSampleSize: 0,
      soldSampleSize: 0,
      conditionFactor: CONDITION_FACTOR[condition] || 1,
      explanation: 'Not enough similar listings or completed sales in this category yet. Choose a price from the item condition and what you would pay on campus.',
    }
  }

  const mid = median(samples)
  const factor = CONDITION_FACTOR[condition] || 1
  const suggestedPrice = Math.max(1, Math.round(mid * factor))
  const sorted = [...samples].sort((a, b) => a - b)

  return {
    suggestedPrice,
    sampleSize: samples.length,
    activeSampleSize: active.length,
    soldSampleSize: sold.length,
    medianComparable: Math.round(mid),
    conditionFactor: factor,
    low: sorted[0],
    high: sorted[sorted.length - 1],
    explanation: `Median of ${samples.length} comparable campus price${samples.length === 1 ? '' : 's'} (active listings and completed sales) is ${Math.round(mid)}. ${condition} uses a factor of ${factor}, so the suggested price is ${suggestedPrice}.`,
  }
}

module.exports = { suggestPrice, CONDITION_FACTOR }
