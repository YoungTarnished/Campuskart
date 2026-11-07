const Order = require('../models/Order')
const Product = require('../models/Product')
const ApiError = require('../utils/ApiError')
const { notify } = require('./notificationService')
const { addCompletedTransactions, removeCompletedTransactions } = require('./trustService')

async function loadOrder(orderId, user) {
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError('Order not found', 404)
  const party = [String(order.buyer), String(order.seller)].includes(String(user._id)) || user.role === 'admin'
  if (!party) throw new ApiError('Order not found', 404)
  return order
}

/**
 * Reserve the product with one atomic update. A second buyer gets no document
 * back, so two purchase requests cannot both succeed.
 */
async function createPurchase({ productId, buyer }) {
  if (!buyer.isVerified) {
    throw new ApiError('Verify your college email before you can publish listings, offer services, or place bids.', 403)
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId, status: 'available', seller: { $ne: buyer._id } },
    { $set: { status: 'reserved' } },
    { new: true }
  )

  if (!product) {
    const existing = await Product.findById(productId)
    if (!existing || existing.status === 'removed') throw new ApiError('Product not found', 404)
    if (String(existing.seller) === String(buyer._id)) throw new ApiError('You cannot buy your own product', 400)
    throw new ApiError('This product is no longer available', 409)
  }

  try {
    const order = await Order.create({
      kind: 'product',
      product: product._id,
      buyer: buyer._id,
      seller: product.seller,
      amount: product.price,
      status: 'pending',
      payment: { simulated: true, confirmedAt: null },
    })
    await notify({
      user: product.seller,
      type: 'purchase_request',
      title: 'New purchase request',
      body: `${buyer.name} wants to buy ${product.title} for ${product.price}.`,
      link: '/sales',
    })
    return order
  } catch (err) {
    await Product.findOneAndUpdate({ _id: product._id, status: 'reserved' }, { $set: { status: 'available' } })
    throw err
  }
}

async function releaseProduct(productId) {
  if (!productId) return
  await Product.findOneAndUpdate({ _id: productId, status: 'reserved' }, { $set: { status: 'available' } })
}

async function acceptOrder(orderId, user) {
  const order = await loadOrder(orderId, user)
  if (String(order.seller) !== String(user._id)) throw new ApiError('Only the seller can accept this request', 403)
  if (order.status !== 'pending') throw new ApiError('Only a pending request can be accepted', 400)
  order.status = 'accepted'
  await order.save()
  await notify({
    user: order.buyer,
    type: 'purchase_accepted',
    title: 'Purchase request accepted',
    body: 'The seller accepted. Confirm the simulated payment to complete the order.',
    link: '/purchases',
  })
  return order
}

async function rejectOrder(orderId, user) {
  const order = await loadOrder(orderId, user)
  if (String(order.seller) !== String(user._id)) throw new ApiError('Only the seller can reject this request', 403)
  if (order.status !== 'pending') throw new ApiError('Only a pending request can be rejected', 400)
  order.status = 'rejected'
  await order.save()
  await releaseProduct(order.product)
  await notify({
    user: order.buyer,
    type: 'purchase_rejected',
    title: 'Purchase request declined',
    body: 'The seller declined this purchase request.',
    link: '/purchases',
  })
  return order
}

async function cancelOrder(orderId, user) {
  const order = await loadOrder(orderId, user)
  const isBuyer = String(order.buyer) === String(user._id)
  const isSeller = String(order.seller) === String(user._id)
  if (order.status === 'pending' && !isBuyer) throw new ApiError('Only the buyer can cancel a pending request', 403)
  if (order.status === 'accepted' && !isBuyer && !isSeller) throw new ApiError('You cannot cancel this order', 403)
  if (!['pending', 'accepted'].includes(order.status)) {
    throw new ApiError('This order can no longer be cancelled', 400)
  }
  order.status = 'cancelled'
  await order.save()
  await releaseProduct(order.product)
  const other = isBuyer ? order.seller : order.buyer
  await notify({
    user: other,
    type: 'purchase_cancelled',
    title: 'Order cancelled',
    body: 'An order was cancelled before completion.',
    link: isBuyer ? '/sales' : '/purchases',
  })
  return order
}

async function confirmPayment(orderId, user) {
  const order = await loadOrder(orderId, user)
  if (String(order.buyer) !== String(user._id)) throw new ApiError('Only the buyer can confirm payment', 403)
  if (order.status !== 'accepted') throw new ApiError('Payment can be confirmed only after the seller accepts', 400)
  order.status = 'completed'
  order.payment.simulated = true
  order.payment.confirmedAt = new Date()
  if (!order.transactionsCounted) {
    await addCompletedTransactions([order.buyer, order.seller])
    order.transactionsCounted = true
  }
  await order.save()
  if (order.product) {
    await Product.findOneAndUpdate({ _id: order.product, status: 'reserved' }, { $set: { status: 'sold' } })
  }
  await notify({
    user: order.seller,
    type: 'purchase_accepted',
    title: 'Simulated payment confirmed',
    body: 'The buyer confirmed the academic prototype payment. This order is complete.',
    link: '/sales',
  })
  return order
}

async function applyResolution(order, resolution) {
  if (resolution === 'completed') {
    order.status = 'completed'
    if (!order.transactionsCounted) {
      await addCompletedTransactions([order.buyer, order.seller])
      order.transactionsCounted = true
    }
    if (order.product) await Product.findByIdAndUpdate(order.product, { status: 'sold' })
  } else if (resolution === 'cancelled') {
    if (order.transactionsCounted) {
      await removeCompletedTransactions([order.buyer, order.seller])
      order.transactionsCounted = false
    }
    order.status = 'cancelled'
    if (order.product) {
      await Product.findOneAndUpdate(
        { _id: order.product, status: { $in: ['reserved', 'sold'] } },
        { $set: { status: 'available' } }
      )
    }
  }
  await order.save()
}

module.exports = {
  loadOrder,
  createPurchase,
  acceptOrder,
  rejectOrder,
  cancelOrder,
  confirmPayment,
  applyResolution,
}
