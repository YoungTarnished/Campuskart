module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  clearMocks: true,
}
