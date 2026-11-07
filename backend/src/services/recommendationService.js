const Product = require('../models/Product')
const Wishlist = require('../models/Wishlist')
const { SELLER_PUBLIC_FIELDS } = require('../constants')

async function recommendFor(user) {
  const scores = new Map()
  const viewedIds = (user.recentlyViewed || []).map((entry) => entry.product)
  const viewed = await Product.find({ _id: { $in: viewedIds } }).select('category')
  for (const product of viewed) scores.set(product.category, (scores.get(product.category) || 0) + 2)

  const wishes = await Wishlist.find({ user: user._id }).populate('product', 'category')
  for (const wish of wishes) {
    if (!wish.product) continue
    scores.set(wish.product.category, (scores.get(wish.product.category) || 0) + 3)
  }

  const categories = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category)
  const base = { status: 'available', seller: { $ne: user._id } }
  let products = []
  let reason = 'Newest listings on campus'

  if (categories.length) {
    products = await Product.find({ ...base, category: { $in: categories.slice(0, 3) }, _id: { $nin: viewedIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('seller', SELLER_PUBLIC_FIELDS)
    reason = 'Based on categories you viewed and saved'
  }

  if (products.length < 4) {
    const more = await Product.find({
      ...base,
      _id: { $nin: [...viewedIds, ...products.map((product) => product._id)] },
    })
      .sort({ createdAt: -1 })
      .limit(8 - products.length)
      .populate('seller', SELLER_PUBLIC_FIELDS)
    products = products.concat(more)
  }

  return { products, reason, categories }
}

async function recentlyViewed(user) {
  const ids = (user.recentlyViewed || []).map((entry) => String(entry.product))
  const products = await Product.find({ _id: { $in: ids }, status: { $ne: 'removed' } })
    .populate('seller', SELLER_PUBLIC_FIELDS)
  products.sort((a, b) => ids.indexOf(String(a._id)) - ids.indexOf(String(b._id)))
  return products
}

module.exports = { recommendFor, recentlyViewed }
