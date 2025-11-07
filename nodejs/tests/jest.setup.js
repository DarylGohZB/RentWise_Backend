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

// In-memory storage for integration tests
const mockUsers = new Map();
const mockSessions = new Map();
const mockOtpStore = new Map();

// Global test data reset
global.clearAllMocks = () => {
  if (global._mockUsers) global._mockUsers.clear();
  mockSessions.clear();
  mockOtpStore.clear();
};

// Mock database connection with functional implementations for integration tests
jest.mock('../db/config', () => {
  const mockUsers = new Map();
  
  const mockExecute = async (query, params = []) => {
    // Check email exists (for registration duplicate check)
    if (query.includes('SELECT 1 FROM users WHERE email')) {
      const email = params[0];
      const exists = mockUsers.has(email);
      return [exists ? [{ 1: 1 }] : [], []];
    }

    // Get user for login (with password hash)
    if (query.includes('SELECT user_id, displayName, email, isDisable, userRole FROM users WHERE email = ? AND passwordHash')) {
      const [email, hash] = params;
      const user = mockUsers.get(email);
      if (user && user.password === hash) {
        return [[{
          user_id: user.user_id,
          displayName: user.displayName || email.split('@')[0],
          email: user.email,
          isDisable: user.isDisable || false,
          userRole: user.role || 'tenant'
        }], []];
      }
      return [[], []];
    }

    // Insert new user (registration)
    if (query.includes('INSERT INTO users')) {
      const [email, hashedPassword, displayName] = params;
      mockUsers.set(email, {
        user_id: mockUsers.size + 1,
        email,
        displayName: displayName || email.split('@')[0],
        password: hashedPassword,
        role: 'tenant',
        isVerified: false,
        isDisable: false,
        createdAt: new Date()
      });
      return [{ insertId: mockUsers.size, affectedRows: 1 }, []];
    }

    // Update user verification status  
    if (query.includes('UPDATE users SET isVerified')) {
      const isVerified = params[0];
      const email = params[1];
      const user = mockUsers.get(email);
      if (user) {
        user.isVerified = isVerified;
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // Insert API log (ignore for tests)
    if (query.includes('INSERT INTO api_logger')) {
      return [{ insertId: 1, affectedRows: 1 }, []];
    }

    // Ensure table queries (CREATE TABLE IF NOT EXISTS, INSERT IGNORE)
    if (query.includes('CREATE TABLE') || query.includes('INSERT IGNORE')) {
      return [{ affectedRows: 0 }, []];
    }

    // Default: return empty result
    return [[], []];
  };
  
  // Expose mockUsers to global for clearAllMocks
  global._mockUsers = mockUsers;

  return {
    execute: mockExecute,
    getConnection: async () => ({
      execute: mockExecute,
      release: () => {},
      ping: () => {}
    }),
    query: async () => [[], []]
  };
});

// Mock Redis client with functional implementations
const mockRedisClient = {
  connect: jest.fn(async () => true),
  disconnect: jest.fn(async () => true),
  quit: jest.fn(async () => true),
  isOpen: true,
  isReady: true,
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),

  // OTP and session operations
  set: jest.fn(async (key, value, options = {}) => {
    const expiry = Date.now() + ((options.EX || 300) * 1000);
    if (key.startsWith('otp:')) {
      mockOtpStore.set(key, { value, expiry });
    } else if (key.startsWith('refresh:')) {
      mockSessions.set(key, { value, expiry });
    }
    return 'OK';
  }),

  get: jest.fn(async (key) => {
    let stored;
    if (key.startsWith('otp:')) {
      stored = mockOtpStore.get(key);
    } else if (key.startsWith('refresh:')) {
      stored = mockSessions.get(key);
    }
    
    if (stored && stored.expiry > Date.now()) {
      return stored.value;
    }
    return null;
  }),

  del: jest.fn(async (key) => {
    if (mockOtpStore.delete(key) || mockSessions.delete(key)) {
      return 1;
    }
    return 0;
  }),

  exists: jest.fn(async (key) => {
    return (mockSessions.has(key) || mockOtpStore.has(key)) ? 1 : 0;
  })
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
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
