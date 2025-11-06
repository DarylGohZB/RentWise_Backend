/**
 * Jest Configuration for RentWise Backend Testing
 * 
 * This configuration supports:
 * - Unit tests (White Box Testing)
 * - Integration tests (Black Box Testing)
 * - Coverage reporting
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds (based on Testing.md requirements)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'controller/**/*.js',
    'services/**/*.js',
    'model/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],

  // Setup files
  setupFilesAfterEnv: ['./jest.setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', '../'],

  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Transform configuration (if using ES6 modules)
  transform: {},

  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/dataset/',
    '/exports/',
    'app.js'
  ],

  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './tests/reports/html',
        filename: 'test-report.html',
        pageTitle: 'RentWise Backend Test Report',
        expand: true
      }
    ]
  ],

  // Global setup and teardown
  // globalSetup: '<rootDir>/tests/helpers/setup.js',
  // globalTeardown: '<rootDir>/tests/helpers/teardown.js',
};
