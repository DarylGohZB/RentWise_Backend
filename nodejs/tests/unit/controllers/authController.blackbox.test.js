/**
 * Black Box Testing: AuthController
 * 
 * Test Cases documented in: Testing.md & BBT.md
 * Section: Black Box Testing - I. AuthController Tests
 * 
 * Tests cover:
 * - Login functionality (14 tests: BBT-AUTH-001 to BBT-AUTH-014)
 * - Registration functionality (5 tests: BBT-AUTH-015 to BBT-AUTH-019)
 */

// Mock all external dependencies BEFORE requiring them
jest.mock('../../../services/authService');
jest.mock('../../../services/MailService', () => ({
  sendEmail: jest.fn()
}));
jest.mock('../../../db/config', () => ({
  getConnection: jest.fn(),
  query: jest.fn()
}));

const authController = require('../../../controller/authController');
const authService = require('../../../services/authService');

describe('AuthController - Login (Black Box Testing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BBT-AUTH-001: Valid credentials
   * Expected: 200 OK, token + refreshToken returned
   */
  test('BBT-AUTH-001: Valid credentials should return 200 with tokens', async () => {
    authService.login.mockResolvedValue({
      ok: true,
      user: { id: 1, email: 'landlord@example.com', role: 'landlord' },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    });

    const req = {
      body: { email: 'landlord@example.com', password: 'LandLord123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(200);
    expect(result.body.token).toBeDefined();
    expect(result.body.refreshToken).toBeDefined();
  });

  /**
   * BBT-AUTH-002: Invalid email format
   * Expected: 400 Bad Request
   */
  test('BBT-AUTH-002: Invalid email format should return 400', async () => {
    const req = {
      body: { email: 'invalid-email', password: 'Password123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('Invalid email');
  });

  /**
   * BBT-AUTH-003: Missing email
   * Expected: 400 Bad Request
   */
  test('BBT-AUTH-003: Missing email should return 400', async () => {
    const req = {
      body: { email: '', password: 'Password123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('required');
  });

  /**
   * BBT-AUTH-004: Missing password
   * Expected: 400 Bad Request
   */
  test('BBT-AUTH-004: Missing password should return 400', async () => {
    const req = {
      body: { email: 'user@example.com', password: '' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('required');
  });

  /**
   * BBT-AUTH-005: Invalid password format (too short)
   * Expected: 400 Bad Request (min 8 chars)
   */
  test('BBT-AUTH-005: Invalid password format should return 400', async () => {
    const req = {
      body: { email: 'user@example.com', password: 'pass' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('8 characters');
  });

  /**
   * BBT-AUTH-006: Wrong password
   * Expected: 401 Unauthorized
   */
  test('BBT-AUTH-006: Wrong password should return 401', async () => {
    authService.login.mockResolvedValue({
      ok: false,
      error: 'Invalid credentials'
    });

    const req = {
      body: { email: 'user@example.com', password: 'WrongPass123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(401);
    expect(result.body.message).toContain('Invalid');
  });

  /**
   * BBT-AUTH-007: Non-existent user
   * Expected: 401 Unauthorized
   */
  test('BBT-AUTH-007: Non-existent user should return 401', async () => {
    authService.login.mockResolvedValue({
      ok: false,
      error: 'User not found'
    });

    const req = {
      body: { email: 'nouser@example.com', password: 'Password123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(401);
  });

  /**
   * BBT-AUTH-008: Special chars in password
   * Expected: 400 Bad Request (alphanumeric only)
   */
  test('BBT-AUTH-008: Special characters in password should return 400', async () => {
    const req = {
      body: { email: 'user@example.com', password: 'Pass@#$%' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('alphanumeric');
  });

  /**
   * BBT-AUTH-009: Exact 8 char password
   * Expected: 200 OK if user exists
   */
  test('BBT-AUTH-009: Exact 8 character password should pass validation', async () => {
    authService.login.mockResolvedValue({
      ok: true,
      user: { id: 1, email: 'user@example.com' },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    });

    const req = {
      body: { email: 'user@example.com', password: 'Pass1234' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(200);
  });

  /**
   * BBT-AUTH-010: SQL injection attempt
   * Expected: 400 Bad Request or 401
   */
  test('BBT-AUTH-010: SQL injection attempt should be handled', async () => {
    const req = {
      body: { email: "user@example.com' OR '1'='1", password: 'Password123' }
    };

    const result = await authController.login(req);

    expect([400, 401]).toContain(result.status);
  });

  /**
   * BBT-AUTH-011: Email with spaces
   * Expected: 400 Bad Request (invalid format)
   */
  test('BBT-AUTH-011: Email with spaces should return 400', async () => {
    const req = {
      body: { email: ' user@example.com ', password: 'Password123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
  });

  /**
   * BBT-AUTH-012: Password only numbers
   * Expected: 400 Bad Request (needs letters)
   */
  test('BBT-AUTH-012: Password with only numbers should return 400', async () => {
    const req = {
      body: { email: 'user@example.com', password: '12345678' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('letters');
  });

  /**
   * BBT-AUTH-013: Password only letters
   * Expected: 400 Bad Request (needs numbers)
   */
  test('BBT-AUTH-013: Password with only letters should return 400', async () => {
    const req = {
      body: { email: 'user@example.com', password: 'abcdefgh' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('numbers');
  });

  /**
   * BBT-AUTH-014: Mixed case email
   * Expected: 200 OK (case-insensitive)
   */
  test('BBT-AUTH-014: Mixed case email should be handled case-insensitively', async () => {
    authService.login.mockResolvedValue({
      ok: true,
      user: { id: 1, email: 'user@example.com' },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    });

    const req = {
      body: { email: 'User@EXAMPLE.COM', password: 'Password123' }
    };

    const result = await authController.login(req);

    expect(result.status).toBe(200);
  });
});

describe('AuthController - Registration (Black Box Testing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BBT-AUTH-015: Valid registration
   * Expected: 202 Accepted, OTP sent
   */
  test('BBT-AUTH-015: Valid registration should return 202', async () => {
    authService.register.mockResolvedValue({
      ok: true,
      status: 202,
      pendingKey: 'mock-pending-key'
    });

    const req = {
      body: { email: 'new@example.com', password: 'NewPass123' }
    };

    const result = await authController.register(req);

    expect(result.status).toBe(202);
    expect(result.body.message).toContain('OTP');
  });

  /**
   * BBT-AUTH-016: Duplicate email
   * Expected: 409 Conflict
   */
  test('BBT-AUTH-016: Duplicate email should return 409', async () => {
    authService.register.mockResolvedValue({
      ok: false,
      status: 409,
      error: 'Email already exists'
    });

    const req = {
      body: { email: 'existing@example.com', password: 'Pass1234' }
    };

    const result = await authController.register(req);

    expect(result.status).toBe(409);
  });

  /**
   * BBT-AUTH-017: Valid OTP confirmation
   * Expected: 200 OK, account created
   */
  test('BBT-AUTH-017: Valid OTP confirmation should return 200', async () => {
    authService.verifyOtp.mockResolvedValue({
      ok: true,
      status: 200,
      userId: 1
    });

    const req = {
      body: { email: 'new@example.com', otp: '123456' }
    };

    const result = await authController.verifyOtp(req);

    expect(result.status).toBe(200);
    expect(result.body.message).toContain('created');
  });

  /**
   * BBT-AUTH-018: Invalid OTP
   * Expected: 401 Unauthorized
   */
  test('BBT-AUTH-018: Invalid OTP should return 401', async () => {
    authService.verifyOtp.mockResolvedValue({
      ok: false,
      status: 401,
      error: 'Invalid OTP'
    });

    const req = {
      body: { email: 'new@example.com', otp: '000000' }
    };

    const result = await authController.verifyOtp(req);

    expect(result.status).toBe(401);
  });

  /**
   * BBT-AUTH-019: Expired OTP
   * Expected: 410 Gone
   */
  test('BBT-AUTH-019: Expired OTP should return 410', async () => {
    authService.verifyOtp.mockResolvedValue({
      ok: false,
      status: 410,
      error: 'OTP expired'
    });

    const req = {
      body: { email: 'new@example.com', otp: '123456' }
    };

    const result = await authController.verifyOtp(req);

    expect(result.status).toBe(410);
  });
});
