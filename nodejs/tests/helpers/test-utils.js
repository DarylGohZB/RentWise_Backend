/**
 * Test Helper Functions
 * 
 * Common utilities used across test files
 */

/**
 * Create a mock Express request object
 */
function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
}

/**
 * Create a mock Express response object
 */
function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create authenticated user mock
 */
function createAuthenticatedUser(role = 'LANDLORD', userId = 1) {
  return {
    user_id: userId,
    email: `user${userId}@test.com`,
    displayName: `Test User ${userId}`,
    userRole: role,
    isDisable: false
  };
}

/**
 * Create mock listing data
 */
function createMockListing(overrides = {}) {
  return {
    listing_id: 1,
    landlord_id: 1,
    address: 'Test Address',
    postal_code: '570123',
    town: 'Bishan',
    room_type: 3,
    price: 1800,
    description: 'Test listing',
    status: 'active',
    images: [],
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Wait for async operations
 */
function wait(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate random email
 */
function randomEmail() {
  return `test${randomString(8)}@example.com`;
}

/**
 * Load test fixtures
 */
function loadFixture(filename) {
  const path = require('path');
  const fs = require('fs');
  const fixturePath = path.join(__dirname, '../fixtures', filename);
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

/**
 * Assert error response format
 */
function expectErrorResponse(result, status, messageContains) {
  expect(result.status).toBe(status);
  expect(result.body).toHaveProperty('message');
  if (messageContains) {
    expect(result.body.message).toContain(messageContains);
  }
}

/**
 * Assert success response format
 */
function expectSuccessResponse(result, status = 200) {
  expect(result.status).toBe(status);
  expect(result.body).toBeDefined();
}

/**
 * Mock database connection
 */
function mockDatabase() {
  return {
    query: jest.fn(),
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
  };
}

/**
 * Mock Redis client
 */
function mockRedis() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn()
  };
}

module.exports = {
  createMockRequest,
  createMockResponse,
  createAuthenticatedUser,
  createMockListing,
  wait,
  randomString,
  randomEmail,
  loadFixture,
  expectErrorResponse,
  expectSuccessResponse,
  mockDatabase,
  mockRedis
};
