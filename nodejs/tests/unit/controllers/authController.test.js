/**
 * White Box Testing: AuthController - Login Function
 * 
 * Test Cases documented in: Testing.md
 * Section: 2. White Box Testing - I. Login Function
 * 
 * Cyclomatic Complexity: V(G) = 5
 * Branch Coverage Target: 100%
 * Statement Coverage Target: 100%
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

describe('AuthController - Login Function (White Box Testing)', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * TC-WBT-LOGIN-001: Path 1 - Missing Email
   * Decision Path: Start → D1 (NO) → Return 400
   * Branch Coverage: Decision 1 (false branch)
   */
  describe('TC-WBT-LOGIN-001: Missing Email/Password', () => {
    it('should return 400 when email is missing', async () => {
      const req = {
        body: { email: null, password: 'Pass1234' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('email and password required');
    });

    it('should return 400 when password is missing', async () => {
      const req = {
        body: { email: 'user@test.com', password: null }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('email and password required');
    });

    it('should return 400 when both are missing', async () => {
      const req = {
        body: {}
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('email and password required');
    });
  });

  /**
   * TC-WBT-LOGIN-002: Path 2 - Invalid Email Format
   * Decision Path: Start → D1 (YES) → D2 (NO) → Return 400
   * Branch Coverage: Decision 1 (true), Decision 2 (false)
   */
  describe('TC-WBT-LOGIN-002: Invalid Email Format', () => {
    it('should return 400 for invalid email format', async () => {
      const req = {
        body: { email: 'not-an-email', password: 'Pass1234' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('Invalid email format');
    });

    it('should return 400 for email without domain', async () => {
      const req = {
        body: { email: 'user@', password: 'Pass1234' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('Invalid email format');
    });
  });

  /**
   * TC-WBT-LOGIN-003: Path 3 - Invalid Password Format
   * Decision Path: Start → D1 (YES) → D2 (YES) → D3 (NO) → Return 400
   * Branch Coverage: Decision 1 (true), Decision 2 (true), Decision 3 (false)
   */
  describe('TC-WBT-LOGIN-003: Invalid Password Format', () => {
    it('should return 400 when password is too short', async () => {
      const req = {
        body: { email: 'user@test.com', password: 'short' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Invalid password format');
    });

    it('should return 400 when password has no letters', async () => {
      const req = {
        body: { email: 'user@test.com', password: '12345678' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Invalid password format');
    });

    it('should return 400 when password has no numbers', async () => {
      const req = {
        body: { email: 'user@test.com', password: 'abcdefgh' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Invalid password format');
    });

    it('should return 400 when password has special characters', async () => {
      const req = {
        body: { email: 'user@test.com', password: 'Pass@123' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Invalid password format');
    });
  });

  /**
   * TC-WBT-LOGIN-004: Path 4 - Successful Login
   * Decision Path: Start → D1 (YES) → D2 (YES) → D3 (YES) → D4 (YES) → Return 200
   * Branch Coverage: All decisions (true branches)
   */
  describe('TC-WBT-LOGIN-004: Successful Login', () => {
    it('should return 200 with tokens on successful login', async () => {
      const mockServiceResponse = {
        ok: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh_abc123',
        expiresIn: 300,
        user: {
          displayName: 'Test User',
          email: 'user@test.com',
          isDisable: false,
          user_id: 1,
          userRole: 'LANDLORD'
        }
      };

      authService.login.mockResolvedValue(mockServiceResponse);

      const req = {
        body: { email: 'user@test.com', password: 'Pass1234' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(200);
      expect(result.body.message).toBe('Login successful');
      expect(result.body.token).toBe(mockServiceResponse.token);
      expect(result.body.refreshToken).toBe(mockServiceResponse.refreshToken);
      expect(result.body.expiresIn).toBe(mockServiceResponse.expiresIn);
      expect(result.body.user).toEqual(mockServiceResponse.user);
      
      // Verify service was called with correct parameters
      expect(authService.login).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'Pass1234'
      });
    });
  });

  /**
   * TC-WBT-LOGIN-005: Path 5 - Login Failed (Invalid Credentials)
   * Decision Path: Start → D1 (YES) → D2 (YES) → D3 (YES) → D4 (NO) → Return 401
   * Branch Coverage: Decision 4 (false branch)
   */
  describe('TC-WBT-LOGIN-005: Login Failed', () => {
    it('should return 401 when credentials are invalid', async () => {
      authService.login.mockResolvedValue({ ok: false });

      const req = {
        body: { email: 'user@test.com', password: 'WrongPass1' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(401);
      expect(result.body.message).toBe('Invalid email or password');
      
      expect(authService.login).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'WrongPass1'
      });
    });
  });

  /**
   * Additional Edge Cases
   */
  describe('Edge Cases', () => {
    it('should accept password with exactly 8 characters (boundary)', async () => {
      authService.login.mockResolvedValue({ ok: true, token: 'test', refreshToken: 'refresh', expiresIn: 300, user: {} });

      const req = {
        body: { email: 'user@test.com', password: 'Pass1234' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(200);
    });

    it('should handle case-insensitive email domains', async () => {
      authService.login.mockResolvedValue({ ok: true, token: 'test', refreshToken: 'refresh', expiresIn: 300, user: {} });

      const req = {
        body: { email: 'User@TEST.COM', password: 'Pass1234' }
      };

      const result = await authController.login(req);

      expect(result.status).toBe(200);
    });
  });
});

/**
 * Test Coverage Summary:
 * - Total Test Cases: 13
 * - Paths Tested: 5/5 (100%)
 * - Branch Coverage: 100%
 * - Statement Coverage: 100%
 * - Cyclomatic Complexity: 5
 */
