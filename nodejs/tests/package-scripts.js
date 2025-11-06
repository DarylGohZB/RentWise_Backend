/**
 * Package.json scripts for testing
 * 
 * Add these scripts to your package.json file
 */

module.exports = {
  scripts: {
    // Run all tests
    "test": "jest --config tests/jest.config.js",
    
    // Run tests with coverage
    "test:coverage": "jest --config tests/jest.config.js --coverage",
    
    // Run tests in watch mode
    "test:watch": "jest --config tests/jest.config.js --watch",
    
    // Run only unit tests
    "test:unit": "jest --config tests/jest.config.js tests/unit",
    
    // Run only integration tests
    "test:integration": "jest --config tests/jest.config.js tests/integration",
    
    // Run tests with verbose output
    "test:verbose": "jest --config tests/jest.config.js --verbose",
    
    // Run specific test file
    "test:file": "jest --config tests/jest.config.js",
    
    // Generate coverage report only
    "test:coverage-report": "jest --config tests/jest.config.js --coverage --coverageReporters=html",
    
    // Clear jest cache
    "test:clear": "jest --clearCache"
  },
  
  // Development dependencies needed for testing
  devDependencies: {
    "jest": "^29.7.0",
    "jest-html-reporters": "^3.1.4",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.8"
  }
};

/**
 * INSTALLATION INSTRUCTIONS:
 * 
 * 1. Copy the scripts section to your package.json
 * 2. Install dependencies:
 *    npm install --save-dev jest jest-html-reporters supertest
 * 
 * 3. Run tests:
 *    npm test                  # Run all tests
 *    npm run test:coverage     # Run with coverage
 *    npm run test:watch        # Watch mode
 *    npm run test:unit         # Unit tests only
 */
