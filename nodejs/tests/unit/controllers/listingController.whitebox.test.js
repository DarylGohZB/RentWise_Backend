/**
 * White Box Testing: ListingController - FilterListings Function
 * 
 * Test Cases documented in: Testing.md & WBT.md
 * Section: White Box Testing - IV. FilterListings Function
 * 
 * Function: filterListings (Lines 448-507 in listingController.js)
 * Cyclomatic Complexity: V(G) = 5
 * 
 * Decision Points:
 * 1. roomType invalid? (nested: provided && (NaN || < 1 || > 6))
 * 2. minPrice < 0? (nested: provided && < 0)
 * 3. maxPrice < 0? (nested: provided && < 0)
 * 4. minPrice > maxPrice?
 * 
 * Test Coverage:
 * - Path Coverage: 13/5 paths (including boundary variations)
 * - Branch Coverage: 100%
 * - Statement Coverage: 100%
 * - Boundary Coverage: 100%
 */

// Mock dependencies BEFORE requiring the controller
jest.mock('../../../services/listingService');

const listingController = require('../../../controller/listingController');
const listingService = require('../../../services/listingService');

describe('ListingController - FilterListings (White Box Testing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC-WBT-FILTER-001: Path 1 - No Filters
   * Expected Path: Start → All validations pass (no params) → Service call → Return 200
   * Branch Coverage: All validations skip (no params provided)
   */
  describe('TC-WBT-FILTER-001: No Filters', () => {
    it('should return all listings when no filters provided', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 3, price: 1500 },
        { listing_id: 2, town: 'Jurong', room_type: 4, price: 2000 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = { query: {} };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: null,
        town: null,
        minPrice: null,
        maxPrice: null
      });
    });
  });

  /**
   * TC-WBT-FILTER-002: Path 2 - Valid RoomType Only
   * Expected Path: Start → Validate roomType (valid) → Service call → Return 200
   * Branch Coverage: D1 (roomType valid)
   */
  describe('TC-WBT-FILTER-002: Valid RoomType Only', () => {
    it('should filter by valid room type', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 3, price: 1500 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = { query: { roomType: '3' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: 3,
        town: null,
        minPrice: null,
        maxPrice: null
      });
    });
  });

  /**
   * TC-WBT-FILTER-003: Path 3 - Valid Price Range
   * Expected Path: Start → Validate prices (valid) → Range check (valid) → Service → Return 200
   * Branch Coverage: D2 (minPrice valid), D3 (maxPrice valid), D4 (range valid)
   */
  describe('TC-WBT-FILTER-003: Valid Price Range', () => {
    it('should filter by valid price range', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 3, price: 1500 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = { query: { minPrice: '1000', maxPrice: '2000' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: null,
        town: null,
        minPrice: 1000,
        maxPrice: 2000
      });
    });
  });

  /**
   * TC-WBT-FILTER-004: Path 4 - Invalid RoomType
   * Expected Path: Start → Validate roomType (roomType > 6) → Return 400
   * Branch Coverage: D1 (roomType invalid)
   */
  describe('TC-WBT-FILTER-004: Invalid RoomType', () => {
    it('should reject room type greater than 6', async () => {
      const req = { query: { roomType: '7' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('roomType must be a number between 1 and 6');
      expect(listingService.filterListings).not.toHaveBeenCalled();
    });
  });

  /**
   * TC-WBT-FILTER-005: Path 4b - RoomType is NaN
   * Expected Path: Start → Validate roomType (isNaN) → Return 400
   * Branch Coverage: D1 (roomType NaN)
   */
  describe('TC-WBT-FILTER-005: RoomType is NaN', () => {
    it('should reject non-numeric room type', async () => {
      const req = { query: { roomType: 'abc' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('roomType must be a number between 1 and 6');
      expect(listingService.filterListings).not.toHaveBeenCalled();
    });
  });

  /**
   * TC-WBT-FILTER-006: Path 5 - Negative MinPrice
   * Expected Path: Start → Validate minPrice (< 0) → Return 400
   * Branch Coverage: D2 (minPrice negative)
   */
  describe('TC-WBT-FILTER-006: Negative MinPrice', () => {
    it('should reject negative minimum price', async () => {
      const req = { query: { minPrice: '-100' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('minPrice must be a positive number');
      expect(listingService.filterListings).not.toHaveBeenCalled();
    });
  });

  /**
   * TC-WBT-FILTER-007: Path 5b - Negative MaxPrice
   * Expected Path: Start → Validate maxPrice (< 0) → Return 400
   * Branch Coverage: D3 (maxPrice negative)
   */
  describe('TC-WBT-FILTER-007: Negative MaxPrice', () => {
    it('should reject negative maximum price', async () => {
      const req = { query: { maxPrice: '-500' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('maxPrice must be a positive number');
      expect(listingService.filterListings).not.toHaveBeenCalled();
    });
  });

  /**
   * TC-WBT-FILTER-008: Path 6 - Invalid Price Range
   * Expected Path: Start → Validate prices → Range check (min > max) → Return 400
   * Branch Coverage: D4 (invalid range)
   */
  describe('TC-WBT-FILTER-008: Invalid Price Range', () => {
    it('should reject when minPrice > maxPrice', async () => {
      const req = { query: { minPrice: '3000', maxPrice: '1000' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('minPrice cannot be greater than maxPrice');
      expect(listingService.filterListings).not.toHaveBeenCalled();
    });
  });

  /**
   * TC-WBT-FILTER-009: Path 7 - All Valid Filters
   * Expected Path: Start → All validations pass → Service call with all filters → Return 200
   * Branch Coverage: All decisions (valid branches)
   */
  describe('TC-WBT-FILTER-009: All Valid Filters', () => {
    it('should apply all filters when all are valid', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 3, price: 1800 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = {
        query: {
          roomType: '3',
          town: 'Bishan',
          minPrice: '1500',
          maxPrice: '2500'
        }
      };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: 3,
        town: 'Bishan',
        minPrice: 1500,
        maxPrice: 2500
      });
    });
  });

  /**
   * TC-WBT-FILTER-010: Path 8 - Exception Handling
   * Expected Path: Start → Validations pass → Service call → Exception → Catch → Return 500
   * Branch Coverage: Exception path
   */
  describe('TC-WBT-FILTER-010: Exception Handling', () => {
    it('should handle service errors gracefully', async () => {
      listingService.filterListings.mockRejectedValue(new Error('Database error'));

      const req = { query: { roomType: '3' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(500);
      expect(result.body.message).toBe('Internal server error');
    });
  });

  /**
   * TC-WBT-FILTER-011: Boundary - RoomType = 1
   * Expected Path: Start → Validate roomType (valid, boundary) → Service → Return 200
   * Branch Coverage: D1 (boundary lower)
   */
  describe('TC-WBT-FILTER-011: Boundary - RoomType = 1', () => {
    it('should accept room type 1 (lower boundary)', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 1, price: 800 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = { query: { roomType: '1' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: 1,
        town: null,
        minPrice: null,
        maxPrice: null
      });
    });
  });

  /**
   * TC-WBT-FILTER-012: Boundary - RoomType = 6
   * Expected Path: Start → Validate roomType (valid, boundary) → Service → Return 200
   * Branch Coverage: D1 (boundary upper)
   */
  describe('TC-WBT-FILTER-012: Boundary - RoomType = 6', () => {
    it('should accept room type 6 (upper boundary)', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 6, price: 3500 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = { query: { roomType: '6' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: 6,
        town: null,
        minPrice: null,
        maxPrice: null
      });
    });
  });

  /**
   * TC-WBT-FILTER-013: Boundary - MinPrice = 0
   * Expected Path: Start → Validate minPrice (valid, boundary) → Service → Return 200
   * Branch Coverage: D2 (boundary zero)
   */
  describe('TC-WBT-FILTER-013: Boundary - MinPrice = 0', () => {
    it('should accept minimum price of 0 (boundary)', async () => {
      const mockListings = [
        { listing_id: 1, town: 'Bishan', room_type: 3, price: 500 }
      ];

      listingService.filterListings.mockResolvedValue(mockListings);

      const req = { query: { minPrice: '0' } };
      const result = await listingController.filterListings(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(mockListings);
      expect(listingService.filterListings).toHaveBeenCalledWith({
        roomType: null,
        town: null,
        minPrice: 0,
        maxPrice: null
      });
    });
  });
});
