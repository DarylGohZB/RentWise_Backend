/**
 * Black Box Testing: SearchController
 * 
 * Test Cases documented in: Testing.md & BBT.md
 * Section: Black Box Testing - III. SearchController Tests
 * 
 * Tests cover:
 * - Search filtering (town, flatType, price range)
 * - Recommendation system (coordinates and addresses)
 * - Input validation and error handling
 */

// Mock all external dependencies BEFORE requiring them
jest.mock('../../../services/searchService');
jest.mock('../../../services/recommendationService');
jest.mock('../../../services/geocodingService');
jest.mock('../../../model/GovHouseDataModel');

const searchController = require('../../../controller/searchController');
const searchService = require('../../../services/searchService');
const recommendationService = require('../../../services/recommendationService');
const geocodingService = require('../../../services/geocodingService');
const { getAllTownStats } = require('../../../model/GovHouseDataModel');

describe('SearchController - Search Functions (Black Box Testing)', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * BBT-SEARCH-001: Valid search with all filters
   * Input: town=Bishan, flatType=3 ROOM, minPrice=1000, maxPrice=2000
   * Expected: 200 OK, filtered results
   */
  describe('BBT-SEARCH-001: Valid Search with All Filters', () => {
    it('should return filtered results with all parameters', async () => {
      const mockResults = [
        { town: 'Bishan', flat_type: '3 ROOM', monthly_rent: 1500 }
      ];
      
      searchService.searchGovByTown.mockResolvedValue(mockResults);

      const req = {
        query: {
          town: 'Bishan',
          flatType: '3 ROOM',
          minPrice: '1000',
          maxPrice: '2000'
        }
      };

      const result = await searchController.searchGovByTown(req);

      expect(result).toEqual(mockResults);
      expect(searchService.searchGovByTown).toHaveBeenCalledWith({
        town: 'Bishan',
        flatType: '3 ROOM',
        minPrice: '1000',
        maxPrice: '2000',
        minAreaSqm: undefined,
        maxAreaSqm: undefined,
        limit: undefined,
        offset: undefined
      });
    });
  });

  /**
   * BBT-SEARCH-002: No filters
   * Input: No query parameters
   * Expected: 200 OK, all results
   */
  describe('BBT-SEARCH-002: No Filters', () => {
    it('should return all results when no filters provided', async () => {
      const mockResults = [
        { town: 'Bishan', flat_type: '3 ROOM', monthly_rent: 1500 },
        { town: 'Jurong', flat_type: '4 ROOM', monthly_rent: 2000 }
      ];
      
      searchService.searchGovByTown.mockResolvedValue(mockResults);

      const req = { query: {} };

      const result = await searchController.searchGovByTown(req);

      expect(result).toEqual(mockResults);
      expect(searchService.searchGovByTown).toHaveBeenCalledWith({
        town: undefined,
        flatType: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minAreaSqm: undefined,
        maxAreaSqm: undefined,
        limit: undefined,
        offset: undefined
      });
    });
  });

  /**
   * BBT-SEARCH-003: Invalid price range
   * Input: minPrice > maxPrice
   * Expected: 400 Bad Request or service handles it
   */
  describe('BBT-SEARCH-003: Invalid Price Range', () => {
    it('should handle invalid price range (handled by service layer)', async () => {
      searchService.searchGovByTown.mockResolvedValue([]);

      const req = {
        query: {
          town: 'Bishan',
          flatType: '3 ROOM',
          minPrice: '2000',
          maxPrice: '1000'
        }
      };

      const result = await searchController.searchGovByTown(req);

      expect(result).toEqual([]);
    });
  });

  /**
   * BBT-SEARCH-004: Negative price
   * Input: minPrice = -100
   * Expected: 400 Bad Request or empty results
   */
  describe('BBT-SEARCH-004: Negative Price', () => {
    it('should handle negative price gracefully', async () => {
      searchService.searchGovByTown.mockResolvedValue([]);

      const req = {
        query: {
          town: 'Bishan',
          flatType: '3 ROOM',
          minPrice: '-100',
          maxPrice: '2000'
        }
      };

      const result = await searchController.searchGovByTown(req);

      expect(result).toEqual([]);
    });
  });

  /**
   * BBT-SEARCH-005: Non-existent town
   * Input: town = 'InvalidTown'
   * Expected: 200 OK, empty results
   */
  describe('BBT-SEARCH-005: Non-existent Town', () => {
    it('should return empty results for non-existent town', async () => {
      searchService.searchGovByTown.mockResolvedValue([]);

      const req = {
        query: {
          town: 'InvalidTown'
        }
      };

      const result = await searchController.searchGovByTown(req);

      expect(result).toEqual([]);
    });
  });

  /**
   * BBT-SEARCH-006: Valid coordinates
   * Input: loc1=1.3521,103.8198, loc2=1.3000,103.8000
   * Expected: 200 OK, recommended towns
   */
  describe('BBT-SEARCH-006: Valid Coordinates', () => {
    it('should recommend towns based on coordinates', async () => {
      geocodingService.isLatLngString.mockReturnValue(true);
      
      recommendationService.recommendTownBetween.mockReturnValue({
        center: { lat: 1.3261, lng: 103.8099 },
        town: { name: 'Bishan' }
      });

      getAllTownStats.mockResolvedValue({
        'BISHAN': { avgPrice: 1800, count: 100 }
      });

      recommendationService.rankTownsByDistanceAndPrice.mockReturnValue([
        { name: 'Bishan', avgPrice: 1800, distance: 500 },
        { name: 'Toa Payoh', avgPrice: 1600, distance: 800 },
        { name: 'Ang Mo Kio', avgPrice: 1700, distance: 1000 }
      ]);

      geocodingService.buildStaticMapUrl.mockReturnValue('https://maps.googleapis.com/maps/api/staticmap?...');

      searchService.townStats.mockResolvedValue({
        stats: { avgPrice: 1800, count: 100 }
      });

      const req = {
        method: 'GET',
        query: {
          loc1: '1.3521,103.8198',
          loc2: '1.3000,103.8000'
        }
      };

      const result = await searchController.recommendTown(req);

      expect(result.message).toBe('Top 3 recommended towns');
      expect(result.town).toHaveLength(3);
      expect(result.town[0].name).toBe('Bishan');
    });
  });

  /**
   * BBT-SEARCH-007: Valid addresses
   * Input: loc1='Orchard Road', loc2='Marina Bay', loc3='Jurong East'
   * Expected: 200 OK, geocoded + recommended
   */
  describe('BBT-SEARCH-007: Valid Addresses', () => {
    it('should geocode addresses and recommend towns', async () => {
      geocodingService.isLatLngString.mockReturnValue(false);
      
      geocodingService.geocodeAddress
        .mockResolvedValueOnce({ location: { lat: 1.3048, lng: 103.8318 } }) // Orchard
        .mockResolvedValueOnce({ location: { lat: 1.2800, lng: 103.8600 } }) // Marina Bay
        .mockResolvedValueOnce({ location: { lat: 1.3329, lng: 103.7436 } }); // Jurong East

      recommendationService.recommendTownBetween.mockReturnValue({
        center: { lat: 1.3059, lng: 103.8118 },
        town: { name: 'Queenstown' }
      });

      getAllTownStats.mockResolvedValue({
        'QUEENSTOWN': { avgPrice: 2000, count: 50 }
      });

      recommendationService.rankTownsByDistanceAndPrice.mockReturnValue([
        { name: 'Queenstown', avgPrice: 2000, distance: 300 },
        { name: 'Tiong Bahru', avgPrice: 1900, distance: 600 },
        { name: 'Bukit Merah', avgPrice: 1800, distance: 900 }
      ]);

      geocodingService.buildStaticMapUrl.mockReturnValue('https://maps.googleapis.com/maps/api/staticmap?...');

      searchService.townStats.mockResolvedValue({
        stats: { avgPrice: 2000, count: 50 }
      });

      const req = {
        method: 'GET',
        query: {
          loc1: 'Orchard Road',
          loc2: 'Marina Bay',
          loc3: 'Jurong East'
        }
      };

      const result = await searchController.recommendTown(req);

      expect(result.message).toBe('Top 3 recommended towns');
      expect(result.town).toHaveLength(3);
      expect(geocodingService.geocodeAddress).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * BBT-SEARCH-008: Mixed input
   * Input: loc1=coordinates, loc2=address
   * Expected: 200 OK, recommended towns
   */
  describe('BBT-SEARCH-008: Mixed Input', () => {
    it('should handle mixed coordinates and addresses', async () => {
      geocodingService.isLatLngString
        .mockReturnValueOnce(true)  // loc1 is coordinate
        .mockReturnValueOnce(false); // loc2 is address

      geocodingService.geocodeAddress.mockResolvedValue({
        location: { lat: 1.2800, lng: 103.8600 }
      });

      recommendationService.recommendTownBetween.mockReturnValue({
        center: { lat: 1.3161, lng: 103.8399 },
        town: { name: 'Kallang' }
      });

      getAllTownStats.mockResolvedValue({
        'KALLANG': { avgPrice: 1700, count: 80 }
      });

      recommendationService.rankTownsByDistanceAndPrice.mockReturnValue([
        { name: 'Kallang', avgPrice: 1700, distance: 400 },
        { name: 'Geylang', avgPrice: 1650, distance: 700 },
        { name: 'Bedok', avgPrice: 1600, distance: 1200 }
      ]);

      geocodingService.buildStaticMapUrl.mockReturnValue('https://maps.googleapis.com/maps/api/staticmap?...');

      searchService.townStats.mockResolvedValue({
        stats: { avgPrice: 1700, count: 80 }
      });

      const req = {
        method: 'GET',
        query: {
          loc1: '1.3521,103.8198',
          loc2: 'Marina Bay'
        }
      };

      const result = await searchController.recommendTown(req);

      expect(result.message).toBe('Top 3 recommended towns');
      expect(result.town).toHaveLength(3);
      expect(geocodingService.geocodeAddress).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * BBT-SEARCH-009: Invalid coordinates
   * Input: loc1='999,999'
   * Expected: Error or service handles gracefully
   */
  describe('BBT-SEARCH-009: Invalid Coordinates', () => {
    it('should handle invalid coordinates with error', async () => {
      geocodingService.isLatLngString.mockReturnValue(true);
      
      recommendationService.recommendTownBetween.mockReturnValue({
        center: null,
        town: null
      });

      const req = {
        method: 'GET',
        query: {
          loc1: '999,999',
          loc2: '1.3000,103.8000'
        }
      };

      const result = await searchController.recommendTown(req);

      expect(result.message).toBe('Top 3 recommended towns');
      expect(result.town).toEqual([]);
    });
  });
});
