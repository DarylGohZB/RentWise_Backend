/**
 * Black Box Testing: EnquiryController
 * 
 * Test Cases documented in: Testing.md & BBT.md
 * Section: Black Box Testing - IV. EnquiryController Tests
 * 
 * Tests cover:
 * - Creating enquiries
 * - Input validation
 * - Error handling
 */

// Mock all external dependencies BEFORE requiring them
jest.mock('../../../services/enquiryService');

const enquiryController = require('../../../controller/enquiryController');
const enquiryService = require('../../../services/enquiryService');

describe('EnquiryController - Enquiry Functions (Black Box Testing)', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * BBT-ENQ-001: Valid enquiry
   * Input: name='John Doe', email='john@example.com', message='Interested', listingId=1
   * Expected: 201 Created
   */
  describe('BBT-ENQ-001: Valid Enquiry', () => {
    it('should create enquiry successfully with valid data', async () => {
      enquiryService.createEnquiry.mockResolvedValue({
        ok: true,
        status: 201,
        enquiryId: 1
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Interested in this property',
          listingId: 1
        }
      };

      const result = await enquiryController.createEnquiry(req);

      expect(result.status).toBe(201);
      expect(result.body.message).toBe('Enquiry sent successfully');
      expect(result.body.enquiryId).toBe(1);
      expect(enquiryService.createEnquiry).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Interested in this property',
        listingId: 1
      });
    });
  });

  /**
   * BBT-ENQ-002: Missing name
   * Input: email='john@example.com', message='Interested', listingId=1, name missing
   * Expected: 400/500 Error
   */
  describe('BBT-ENQ-002: Missing Name', () => {
    it('should reject enquiry with missing name', async () => {
      enquiryService.createEnquiry.mockResolvedValue({
        ok: false,
        status: 400,
        error: 'Name is required'
      });

      const req = {
        body: {
          email: 'john@example.com',
          message: 'Interested in this property',
          listingId: 1
        }
      };

      const result = await enquiryController.createEnquiry(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Name is required');
    });
  });

  /**
   * BBT-ENQ-003: Invalid email
   * Input: name='John Doe', email='invalid-email', message='Interested', listingId=1
   * Expected: 400 Bad Request
   */
  describe('BBT-ENQ-003: Invalid Email', () => {
    it('should reject enquiry with invalid email format', async () => {
      enquiryService.createEnquiry.mockResolvedValue({
        ok: false,
        status: 400,
        error: 'Invalid email format'
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'invalid-email',
          message: 'Interested in this property',
          listingId: 1
        }
      };

      const result = await enquiryController.createEnquiry(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Invalid email');
    });
  });

  /**
   * BBT-ENQ-004: Non-existent listing
   * Input: name='John Doe', email='john@example.com', message='Interested', listingId=99999
   * Expected: 404 Not Found
   */
  describe('BBT-ENQ-004: Non-existent Listing', () => {
    it('should reject enquiry for non-existent listing', async () => {
      enquiryService.createEnquiry.mockResolvedValue({
        ok: false,
        status: 404,
        error: 'Listing not found'
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Interested in this property',
          listingId: 99999
        }
      };

      const result = await enquiryController.createEnquiry(req);

      expect(result.status).toBe(404);
      expect(result.body.message).toContain('Listing not found');
    });
  });

  /**
   * BBT-ENQ-005: Empty message
   * Input: name='John Doe', email='john@example.com', message='', listingId=1
   * Expected: 400/500 Error
   */
  describe('BBT-ENQ-005: Empty Message', () => {
    it('should reject enquiry with empty message', async () => {
      enquiryService.createEnquiry.mockResolvedValue({
        ok: false,
        status: 400,
        error: 'Message is required'
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          message: '',
          listingId: 1
        }
      };

      const result = await enquiryController.createEnquiry(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toContain('Message is required');
    });
  });
});
