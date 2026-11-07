const ExchangeProposal = require('../models/ExchangeProposal')
const Product = require('../models/Product')
const ApiError = require('../utils/ApiError')
const { notify } = require('./notificationService')
const { addCompletedTransactions } = require('./trustService')

async function proposeExchange({ user, offeredProductId, requestedProductId, message }) {
  if (String(offeredProductId) === String(requestedProductId)) {
    throw new ApiError('Choose two different products', 400)
  }
  const offered = await Product.findOne({
    _id: offeredProductId,
    seller: user._id,
    status: 'available',
    isExchangeEligible: true,
  })
  if (!offered) throw new ApiError('Your product must be available and marked exchange-eligible', 400)

  const requested = await Product.findOne({
    _id: requestedProductId,
    status: 'available',
    isExchangeEligible: true,
    seller: { $ne: user._id },
  })
  if (!requested) throw new ApiError('That product is not available for exchange', 409)

  const duplicate = await ExchangeProposal.findOne({
    offeredProduct: offered._id,
    requestedProduct: requested._id,
    status: 'pending',
  })
  if (duplicate) throw new ApiError('You already sent this exchange proposal', 409)

  const proposal = await ExchangeProposal.create({
    proposer: user._id,
    recipient: requested.seller,
    offeredProduct: offered._id,
    requestedProduct: requested._id,
    message: message || '',
  })
  await notify({
    user: requested.seller,
    type: 'exchange_proposal',
    title: 'New exchange proposal',
    body: `${user.name} offered ${offered.title} for ${requested.title}.`,
    link: '/exchanges',
  })
  return proposal
}

async function acceptExchange(proposalId, user) {
  const proposal = await ExchangeProposal.findById(proposalId)
  if (!proposal || proposal.status !== 'pending') throw new ApiError('Exchange proposal not found', 404)
  if (String(proposal.recipient) !== String(user._id)) throw new ApiError('Only the product owner can accept this proposal', 403)

  const offered = await Product.findOneAndUpdate(
    { _id: proposal.offeredProduct, status: 'available', isExchangeEligible: true },
    { $set: { status: 'exchanged' } },
    { new: true }
  )
  const requested = await Product.findOneAndUpdate(
    { _id: proposal.requestedProduct, status: 'available', isExchangeEligible: true },
    { $set: { status: 'exchanged' } },
    { new: true }
  )

  if (!offered || !requested) {
    if (offered) await Product.findByIdAndUpdate(offered._id, { status: 'available' })
    if (requested) await Product.findByIdAndUpdate(requested._id, { status: 'available' })
    throw new ApiError('One of these products is no longer available to exchange', 409)
  }

  proposal.status = 'completed'
  proposal.transactionsCounted = true
  await proposal.save()
  await addCompletedTransactions([proposal.proposer, proposal.recipient])
  await ExchangeProposal.updateMany(
    {
      _id: { $ne: proposal._id },
      status: 'pending',
      $or: [
        { offeredProduct: { $in: [offered._id, requested._id] } },
        { requestedProduct: { $in: [offered._id, requested._id] } },
      ],
    },
    { $set: { status: 'cancelled' } }
  )
  await notify({
    user: proposal.proposer,
    type: 'exchange_updated',
    title: 'Exchange accepted',
    body: 'Your exchange proposal was accepted.',
    link: '/exchanges',
  })
  return proposal
}

async function rejectExchange(proposalId, user) {
  const proposal = await ExchangeProposal.findById(proposalId)
  if (!proposal || proposal.status !== 'pending') throw new ApiError('Exchange proposal not found', 404)
  if (String(proposal.recipient) !== String(user._id)) throw new ApiError('Only the product owner can reject this proposal', 403)
  proposal.status = 'rejected'
  await proposal.save()
  await notify({
    user: proposal.proposer,
    type: 'exchange_updated',
    title: 'Exchange declined',
    body: 'Your exchange proposal was declined.',
    link: '/exchanges',
  })
  return proposal
}

async function cancelExchange(proposalId, user) {
  const proposal = await ExchangeProposal.findById(proposalId)
  if (!proposal || proposal.status !== 'pending') throw new ApiError('Exchange proposal not found', 404)
  if (String(proposal.proposer) !== String(user._id)) throw new ApiError('Only the proposer can cancel this proposal', 403)
  proposal.status = 'cancelled'
  await proposal.save()
  await notify({
    user: proposal.recipient,
    type: 'exchange_updated',
    title: 'Exchange cancelled',
    body: 'An exchange proposal was cancelled.',
    link: '/exchanges',
  })
  return proposal
}

module.exports = { proposeExchange, acceptExchange, rejectExchange, cancelExchange }
