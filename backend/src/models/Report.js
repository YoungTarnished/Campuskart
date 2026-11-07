const mongoose = require('mongoose')
const { REPORT_REASONS, REPORT_STATUSES, REPORT_TARGETS } = require('../constants')

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: REPORT_TARGETS, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: REPORT_STATUSES, default: 'open', index: true },
    adminNotes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Report', reportSchema)
