/**
 * Jest Setup File
 * 
 * This file runs before all tests and sets up the testing environment
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '5m';
process.env.GMAIL_USER = 'test@example.com';
process.env.GMAIL_PASS = 'test_password';

// Mock database connection to prevent real DB connections during tests
jest.mock('../db/config', () => ({
  getConnection: jest.fn().mockResolvedValue({
    execute: jest.fn(),
    query: jest.fn(),
    release: jest.fn()
  }),
  query: jest.fn()
}));

// Mock Redis connection
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }))
}));

// Mock console methods to reduce noise in test output (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set up custom matchers (optional)
expect.extend({
  toBeValidToken(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid token`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid token`,
        pass: false,
      };
    }
  },
});

// Global test timeout
jest.setTimeout(10000);

// Mock timers
// jest.useFakeTimers();

console.log('🧪 Jest setup complete - Running RentWise Backend Tests');
