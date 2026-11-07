const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const User = require('../models/User')
const Product = require('../models/Product')
const Auction = require('../models/Auction')
const Order = require('../models/Order')
const Service = require('../models/Service')
const ServiceRequest = require('../models/ServiceRequest')
const Review = require('../models/Review')
const Wishlist = require('../models/Wishlist')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Notification = require('../models/Notification')
const { recalculateRating } = require('../services/trustService')

const password = 'Student@123'

async function user(doc) {
  return User.create({
    ...doc,
    password: await bcrypt.hash(doc.role === 'admin' ? 'Admin@123' : password, 12),
    isVerified: doc.isVerified !== false,
  })
}

async function seed() {
  await connectDB()
  await mongoose.connection.dropDatabase()

  const admin = await user({
    name: 'Campus Admin',
    email: 'admin@campuskart.edu',
    role: 'admin',
    college: 'CampusKart',
    department: 'Student Affairs',
    year: '4',
  })
  const aisha = await user({
    name: 'Aisha Rahman',
    email: 'aisha@campuskart.edu',
    college: 'National Institute of Technology',
    department: 'Computer Science',
    year: '3',
  })
  const rohan = await user({
    name: 'Rohan Iyer',
    email: 'rohan@campuskart.edu',
    college: 'National Institute of Technology',
    department: 'Electronics',
    year: '2',
  })
  const meera = await user({
    name: 'Meera Shah',
    email: 'meera@campuskart.edu',
    college: 'National Institute of Technology',
    department: 'Design',
    year: '4',
  })
  await user({
    name: 'Kabir Sen',
    email: 'kabir@campuskart.edu',
    college: 'National Institute of Technology',
    department: 'Mechanical',
    year: '1',
    isVerified: false,
  })

  const textbook = await Product.create({
    seller: aisha._id,
    title: 'Data Structures Textbook',
    description: 'Clean second-year textbook with a few pencil notes in the margins. All chapters are intact.',
    category: 'Books',
    condition: 'Good',
    price: 450,
    suggestedPrice: 480,
    discountPercent: 20,
    location: 'Hostel B lobby',
    images: ['/api/placeholder/Books'],
    isExchangeEligible: true,
    status: 'available',
  })
  const lamp = await Product.create({
    seller: rohan._id,
    title: 'Study lamp',
    description: 'Warm LED hostel lamp, works on USB, urgent sale before the semester break.',
    category: 'Hostel Essentials',
    condition: 'Like New',
    price: 300,
    discountPercent: 0,
    isUrgent: true,
    location: 'Hostel C room 214',
    images: ['/api/placeholder/Hostel'],
    isExchangeEligible: true,
  })
  await Product.create({
    seller: meera._id,
    title: 'Cycle for campus commute',
    description: 'Single-speed cycle with a new lock. Pickup near the main gate cycle stand.',
    category: 'Cycles',
    condition: 'Good',
    price: 2800,
    discountPercent: 15,
    location: 'Main gate cycle stand',
    images: ['/api/placeholder/Cycles'],
    isExchangeEligible: false,
  })
  const soldBook = await Product.create({
    seller: aisha._id,
    title: 'Discrete Mathematics Notes',
    description: 'Printed notes from last semester. Sold so the trust score has a completed deal behind it.',
    category: 'Books',
    condition: 'Good',
    price: 150,
    location: 'Library steps',
    images: ['/api/placeholder/Notes'],
    status: 'sold',
  })

  const order = await Order.create({
    kind: 'product',
    product: soldBook._id,
    buyer: rohan._id,
    seller: aisha._id,
    amount: 150,
    status: 'completed',
    transactionsCounted: true,
    payment: { simulated: true, confirmedAt: new Date() },
  })
  await Review.create({
    reviewer: rohan._id,
    reviewee: aisha._id,
    transactionType: 'order',
    transactionId: order._id,
    rating: 5,
    feedback: 'Notes matched the description and pickup was easy.',
  })
  await recalculateRating(aisha._id)
  await User.updateMany({ _id: { $in: [aisha._id, rohan._id] } }, { $inc: { completedTransactions: 1 } })

  await Wishlist.create({ user: meera._id, product: textbook._id })

  const now = Date.now()
  await Auction.create({
    seller: rohan._id,
    title: 'Wireless earbuds',
    description: 'Used for one semester. Case and both buds work. Campus pickup only.',
    category: 'Electronics',
    condition: 'Good',
    location: 'Electronics lab foyer',
    images: ['/api/placeholder/Electronics'],
    startingPrice: 700,
    minIncrement: 50,
    reservePrice: 900,
    startTime: new Date(now - 60 * 60 * 1000),
    endTime: new Date(now + 2 * 24 * 60 * 60 * 1000),
    status: 'active',
  })
  await Auction.create({
    seller: aisha._id,
    title: 'Scientific calculator',
    description: 'Exam-approved calculator. Bidding ends soon so you can try the live countdown.',
    category: 'Stationery',
    condition: 'Like New',
    location: 'Academic block entrance',
    images: ['/api/placeholder/Calculator'],
    startingPrice: 200,
    minIncrement: 20,
    startTime: new Date(now - 10 * 60 * 1000),
    endTime: new Date(now + 30 * 60 * 1000),
    status: 'active',
  })

  const tutoring = await Service.create({
    provider: meera._id,
    title: 'Pointers and recursion tutoring',
    description: 'One-hour explanations and practice problems for C programming. I teach the idea, I do not write graded assignments.',
    category: 'Programming tutoring',
    pricingType: 'hourly',
    price: 250,
    estimatedCompletionTime: '1 hour',
    availability: 'Weekdays after 6pm',
  })
  await ServiceRequest.create({
    service: tutoring._id,
    requester: rohan._id,
    provider: meera._id,
    message: 'Can we review recursion with a few practice traces this week?',
    agreedPrice: 250,
    status: 'pending',
  })

  const conversation = await Conversation.create({
    participants: [rohan._id, aisha._id],
    product: textbook._id,
    lastMessage: 'Is the book still available this evening?',
    lastMessageAt: new Date(),
    reads: [{ user: aisha._id, lastReadAt: new Date(now - 60 * 1000) }],
  })
  await Message.create({
    conversation: conversation._id,
    sender: rohan._id,
    body: 'Is the book still available this evening?',
  })
  await Notification.create({
    user: aisha._id,
    type: 'message',
    title: 'New message',
    body: 'Rohan Iyer: Is the book still available this evening?',
    link: `/messages/${conversation._id}`,
  })

  console.log('Seeded CampusKart.')
  console.log('Admin   admin@campuskart.edu  / Admin@123')
  console.log(`Students aisha, rohan, meera @campuskart.edu / ${password}`)
  console.log('Unverified student kabir@campuskart.edu / ' + password)
  console.log('Demo ids:', { admin: admin._id.toString(), textbook: textbook._id.toString(), lamp: lamp._id.toString() })
  await mongoose.disconnect()
}

seed().catch(async (err) => {
  console.error(err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
