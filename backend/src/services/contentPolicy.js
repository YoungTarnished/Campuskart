const ApiError = require('../utils/ApiError')

// Reject offers to do graded work for someone else. Tutoring and study help stay allowed.
const PROHIBITED = [
  /do my (assignment|homework|exam|paper|quiz|test)/i,
  /write my (assignment|essay|exam|paper|homework)/i,
  /take my (exam|quiz|test)/i,
  /exam impersonat/i,
  /complete\b.{0,48}\b(assignment|homework|exam|quiz|paper)/i,
  /write\b.{0,48}\b(assignment|essay|exam)\b.{0,24}\bfor you/i,
  /(assignment|homework|exam|quiz)\b.{0,40}\bfor you/i,
  /submit\b.{0,40}\b(assignment|exam|homework)\b.{0,24}\bfor you/i,
]

function assertAcademicIntegrity(text) {
  const value = String(text || '')
  if (PROHIBITED.some((pattern) => pattern.test(value))) {
    throw new ApiError(
      'CampusKart cannot be used to complete graded assignments or exams for another student. Tutoring, explanations, and original study resources are allowed.',
      400
    )
  }
}

module.exports = { assertAcademicIntegrity }
