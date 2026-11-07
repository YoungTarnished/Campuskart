const { z } = require('zod')
const {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  SERVICE_CATEGORIES,
  REPORT_REASONS,
  REPORT_TARGETS,
  DISPUTE_REASONS,
  YEARS,
} = require('../constants')
const { isCollegeEmail, isAllowedImageUrl } = require('../utils/helpers')

const passwordMessage = 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.'

const passwordSchema = z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, passwordMessage)

const emptyToUndefined = (value) => (value === '' || value === undefined ? undefined : value)

const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().optional())

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier')

const imageList = z.array(z.string().refine(isAllowedImageUrl, 'Images must be uploaded to CampusKart')).max(5)

const collegeEmail = z.string().trim().toLowerCase().email('Enter a valid email address')
  .refine(isCollegeEmail, 'Use your college email address (.edu, .ac.in, .edu.in, or .ac.uk).')

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: collegeEmail,
    password: passwordSchema,
    college: z.string().trim().min(2, 'College is required').max(120),
    department: z.string().trim().min(2, 'Department is required').max(80),
    year: z.enum(YEARS, { errorMap: () => ({ message: 'Choose a year from 1 to 5' }) }),
  }),
  query: z.any(),
  params: z.any(),
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.any(),
  params: z.any(),
})

const verifySchema = z.object({
  body: z.object({ token: z.string().min(20, 'Verification token is required') }),
  query: z.any(),
  params: z.any(),
})

const forgotSchema = z.object({
  body: z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') }),
  query: z.any(),
  params: z.any(),
})

const resetSchema = z.object({
  body: z.object({
    token: z.string().min(20, 'Reset token is required'),
    password: passwordSchema,
  }),
  query: z.any(),
  params: z.any(),
})

const profileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    college: z.string().trim().min(2).max(120).optional(),
    department: z.string().trim().min(2).max(80).optional(),
    year: z.enum(YEARS).optional(),
    profilePicture: z.string().refine((value) => value === '' || isAllowedImageUrl(value), 'Upload a profile picture first').optional(),
  }),
  query: z.any(),
  params: z.any(),
})

const productBody = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum(PRODUCT_CATEGORIES, { errorMap: () => ({ message: 'Choose a valid category' }) }),
  condition: z.enum(PRODUCT_CONDITIONS, { errorMap: () => ({ message: 'Choose a valid condition' }) }),
  price: z.coerce.number().positive('Price must be greater than 0').max(10000000),
  location: z.string().trim().min(2, 'Campus location is required').max(120),
  images: imageList.min(1, 'Add at least one image'),
  isExchangeEligible: z.boolean().optional(),
  discountPercent: z.coerce.number().min(0).max(90).optional(),
  isUrgent: z.boolean().optional(),
})

const productSchema = z.object({ body: productBody, query: z.any(), params: z.any() })

const productQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: optionalNumber,
    limit: optionalNumber,
    search: z.string().max(80).optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    condition: z.enum(PRODUCT_CONDITIONS).optional(),
    minPrice: optionalNumber,
    maxPrice: optionalNumber,
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
    availability: z.enum(['available', 'reserved', 'sold', 'exchanged']).optional(),
    deals: z.enum(['true', 'false']).optional(),
    seller: objectId.optional(),
  }).passthrough(),
})

const priceSuggestionSchema = z.object({
  body: z.object({
    category: z.enum(PRODUCT_CATEGORIES),
    condition: z.enum(PRODUCT_CONDITIONS),
    title: z.string().trim().max(120).optional(),
    excludeId: objectId.optional(),
  }),
  query: z.any(),
  params: z.any(),
})

const idParams = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: objectId }),
})

const orderCreateSchema = z.object({
  body: z.object({ productId: objectId }),
  query: z.any(),
  params: z.any(),
})

const auctionBody = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(PRODUCT_CATEGORIES),
  condition: z.enum(PRODUCT_CONDITIONS),
  location: z.string().trim().min(2).max(120),
  images: imageList.min(1, 'Add at least one image'),
  startingPrice: z.coerce.number().positive(),
  minIncrement: z.coerce.number().positive('Minimum increment must be greater than 0'),
  reservePrice: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  startTime: z.string().min(4, 'Start time is required'),
  endTime: z.string().min(4, 'End time is required'),
})

const auctionSchema = z.object({ body: auctionBody, query: z.any(), params: z.any() })

const bidSchema = z.object({
  body: z.object({ amount: z.coerce.number().positive('Enter a valid bid amount') }),
  query: z.any(),
  params: z.object({ id: objectId }),
})

const serviceBody = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(SERVICE_CATEGORIES, { errorMap: () => ({ message: 'Choose a valid service category' }) }),
  pricingType: z.enum(['fixed', 'hourly']),
  price: z.coerce.number().min(0),
  estimatedCompletionTime: z.string().trim().min(2).max(80),
  availability: z.string().trim().min(2).max(160),
})

const serviceSchema = z.object({ body: serviceBody, query: z.any(), params: z.any() })

const serviceRequestSchema = z.object({
  body: z.object({ message: z.string().trim().min(5, 'Tell the provider what you need').max(1000) }),
  query: z.any(),
  params: z.object({ id: objectId }),
})

const exchangeSchema = z.object({
  body: z.object({
    offeredProductId: objectId,
    requestedProductId: objectId,
    message: z.string().trim().max(500).optional(),
  }),
  query: z.any(),
  params: z.any(),
})

const conversationSchema = z.object({
  body: z.object({
    participantId: objectId,
    productId: objectId.optional(),
  }),
  query: z.any(),
  params: z.any(),
})

const messageSchema = z.object({
  body: z.object({ body: z.string().trim().min(1, 'Message cannot be empty').max(2000) }),
  query: z.any(),
  params: z.object({ id: objectId }),
})

const reviewSchema = z.object({
  body: z.object({
    transactionType: z.enum(['order', 'service', 'exchange']),
    transactionId: objectId,
    revieweeId: objectId,
    rating: z.coerce.number().int().min(1, 'Rating must be from 1 to 5').max(5),
    feedback: z.string().trim().max(1000).optional(),
  }),
  query: z.any(),
  params: z.any(),
})

const reportSchema = z.object({
  body: z.object({
    targetType: z.enum(REPORT_TARGETS),
    targetId: objectId,
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(1000).optional(),
  }),
  query: z.any(),
  params: z.any(),
})

const disputeSchema = z.object({
  body: z.object({
    transactionType: z.enum(['order', 'service', 'exchange']),
    transactionId: objectId,
    reason: z.enum(DISPUTE_REASONS),
    details: z.string().trim().min(10, 'Describe the dispute').max(1000),
  }),
  query: z.any(),
  params: z.any(),
})

const adminUserSchema = z.object({
  body: z.object({ isSuspended: z.boolean() }),
  query: z.any(),
  params: z.object({ id: objectId }),
})

const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['reviewed', 'dismissed', 'action_taken']),
    adminNotes: z.string().trim().max(1000).optional(),
  }),
  query: z.any(),
  params: z.object({ id: objectId }),
})

const resolveDisputeSchema = z.object({
  body: z.object({
    status: z.enum(['resolved', 'dismissed']),
    resolution: z.enum(['completed', 'cancelled']).optional(),
    adminNotes: z.string().trim().max(1000).optional(),
  }),
  query: z.any(),
  params: z.object({ id: objectId }),
})

module.exports = {
  registerSchema,
  loginSchema,
  verifySchema,
  forgotSchema,
  resetSchema,
  profileSchema,
  productSchema,
  productQuerySchema,
  priceSuggestionSchema,
  idParams,
  orderCreateSchema,
  auctionSchema,
  bidSchema,
  serviceSchema,
  serviceRequestSchema,
  exchangeSchema,
  conversationSchema,
  messageSchema,
  reviewSchema,
  reportSchema,
  disputeSchema,
  adminUserSchema,
  resolveReportSchema,
  resolveDisputeSchema,
}
