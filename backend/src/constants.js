const PRODUCT_CATEGORIES = [
  'Books',
  'Electronics',
  'Stationery',
  'Furniture',
  'Cycles',
  'Clothing',
  'Sports Equipment',
  'Hostel Essentials',
  'Other',
]

const PRODUCT_CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

const SERVICE_CATEGORIES = [
  'Programming tutoring',
  'Doubt solving',
  'Graphic design',
  'Video editing',
  'PPT and presentation design',
  'Notes and study material preparation',
  'Web development',
  'Photography',
]

const PRODUCT_STATUSES = ['available', 'reserved', 'sold', 'removed', 'exchanged']
const ORDER_STATUSES = ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'disputed']
const AUCTION_STATUSES = ['scheduled', 'active', 'closing', 'sold', 'unsold', 'cancelled']
const SERVICE_REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'disputed']
const EXCHANGE_STATUSES = ['pending', 'rejected', 'cancelled', 'completed', 'disputed']
const REPORT_STATUSES = ['open', 'reviewed', 'dismissed', 'action_taken']
const DISPUTE_STATUSES = ['open', 'resolved', 'dismissed']

const REPORT_REASONS = [
  'Scam or fraud',
  'Prohibited academic work',
  'Inappropriate content',
  'Misleading listing',
  'Harassment',
  'Other',
]

const DISPUTE_REASONS = [
  'Item not as described',
  'Not responding',
  'Payment disagreement',
  'Exchange disagreement',
  'Other',
]

const REPORT_TARGETS = ['product', 'auction', 'service', 'user']
const YEARS = ['1', '2', '3', '4', '5']

const SELLER_PUBLIC_FIELDS = 'name college department year profilePicture isVerified ratingAverage ratingCount completedTransactions'

module.exports = {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  SERVICE_CATEGORIES,
  PRODUCT_STATUSES,
  ORDER_STATUSES,
  AUCTION_STATUSES,
  SERVICE_REQUEST_STATUSES,
  EXCHANGE_STATUSES,
  REPORT_STATUSES,
  DISPUTE_STATUSES,
  REPORT_REASONS,
  DISPUTE_REASONS,
  REPORT_TARGETS,
  YEARS,
  SELLER_PUBLIC_FIELDS,
}
