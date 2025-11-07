/**
 * Black Box Testing: ListingController
 * 
 * Test Cases documented in: Testing.md & BBT.md
 * Section: Black Box Testing - II. ListingController Tests
 * 
 * Tests cover:
 * - Creating listings with various inputs
 * - Price validation and thresholds
 * - Image validation
 * - Postal code validation
 */

// Mock all external dependencies BEFORE requiring them
jest.mock('../../../services/listingService');
jest.mock('../../../services/mapService');

const listingController = require('../../../controller/listingController');
const listingService = require('../../../services/listingService');
const mapService = require('../../../services/mapService');

describe('ListingController - CreateListing (Black Box Testing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BBT-LIST-001: Valid listing
   * Expected: 201 Created, status active
   */
  test('BBT-LIST-001: Valid listing should return 201', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 42,
      listingStatus: 'active'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 1500,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
    expect(result.body.listingStatus).toBe('active');
  });

  /**
   * BBT-LIST-002: Invalid postal code
   * Expected: 400 Bad Request
   */
  test('BBT-LIST-002: Invalid postal code should return 400', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue(null);

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '999999',
        monthly_rent: 1500,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('postal');
  });

  /**
   * BBT-LIST-003: Price too low
   * Expected: 201 Created, pending_review
   */
  test('BBT-LIST-003: Price too low should return 201 with pending_review', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 43,
      listingStatus: 'pending_review'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 300,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
    expect(result.body.listingStatus).toBe('pending_review');
  });

  /**
   * BBT-LIST-004: Price too high
   * Expected: 201 Created, pending_review
   */
  test('BBT-LIST-004: Price too high should return 201 with pending_review', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 44,
      listingStatus: 'pending_review'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 6000,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
    expect(result.body.listingStatus).toBe('pending_review');
  });

  /**
   * BBT-LIST-005: Normal price
   * Expected: 201 Created, active
   */
  test('BBT-LIST-005: Normal price should return 201 with active status', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 45,
      listingStatus: 'active'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 2000,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
    expect(result.body.listingStatus).toBe('active');
  });

  /**
   * BBT-LIST-006: Boundary low price
   * Expected: 201 Created, active
   */
  test('BBT-LIST-006: Boundary low price ($500) should return 201 active', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 46,
      listingStatus: 'active'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 500,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
    expect(result.body.listingStatus).toBe('active');
  });

  /**
   * BBT-LIST-007: Boundary high price
   * Expected: 201 Created, active
   */
  test('BBT-LIST-007: Boundary high price ($5000) should return 201 active', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 47,
      listingStatus: 'active'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 5000,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
    expect(result.body.listingStatus).toBe('active');
  });

  /**
   * BBT-LIST-008: Max images (5)
   * Expected: 201 Created
   */
  test('BBT-LIST-008: Maximum 5 images should be accepted', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: true,
      status: 201,
      listingId: 48,
      listingStatus: 'active'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 1500,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(201);
  });

  /**
   * BBT-LIST-009: Exceed max images (6)
   * Expected: 400 Bad Request
   */
  test('BBT-LIST-009: More than 5 images should return 400', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Maximum 5 images allowed'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 1500,
        flat_type: 3,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg', 'img6.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('images');
  });

  /**
   * BBT-LIST-010: Invalid room type
   * Expected: 400 Bad Request
   */
  test('BBT-LIST-010: Invalid room type should return 400', async () => {
    mapService.getTownFromPostalCode.mockResolvedValue('Bishan');
    
    listingService.createListing.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid flat_type'
    });

    const req = {
      user: { id: 5 },
      body: {
        postal_code: '123456',
        monthly_rent: 1500,
        flat_type: 7,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      }
    };

    const result = await listingController.createListing(req);

    expect(result.status).toBe(400);
    expect(result.body.message).toContain('flat_type');
  });
});
