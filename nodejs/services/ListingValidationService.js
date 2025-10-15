/**
 * Listing Validation Service
 * Handles validation for property listings according to RentWise requirements
 */

class ListingValidationService {
  
  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {object} - Validation result
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required and must be a string' };
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Email must be in valid format (e.g., abc@domain.com)' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate rental price
   * @param {number} price - Rental price to validate
   * @returns {object} - Validation result
   */
  static validatePrice(price) {
    if (price === undefined || price === null) {
      return { isValid: false, error: 'Rental price is required' };
    }
    
    const numPrice = Number(price);
    if (isNaN(numPrice)) {
      return { isValid: false, error: 'Rental price must be a valid number' };
    }
    
    if (numPrice < 0) {
      return { isValid: false, error: 'Rental price must be a non-negative integer' };
    }
    
    if (!Number.isInteger(numPrice)) {
      return { isValid: false, error: 'Rental price must be an integer (no decimal places)' };
    }
    
    return { isValid: true, price: numPrice };
  }

  /**
   * Validate images array
   * @param {Array|string} images - Images to validate
   * @returns {object} - Validation result
   */
  static validateImages(images) {
    if (!images) {
      return { isValid: true, images: [] }; // Images are optional
    }
    
    let imageArray = [];
    
    // Handle string input (comma-separated)
    if (typeof images === 'string') {
      imageArray = images.split(',').map(url => url.trim()).filter(url => url.length > 0);
    } else if (Array.isArray(images)) {
      imageArray = images.filter(url => url && url.trim().length > 0);
    } else {
      return { isValid: false, error: 'Images must be an array or comma-separated string' };
    }
    
    // Check maximum 5 images
    if (imageArray.length > 5) {
      return { isValid: false, error: 'Failed to update listing. You cannot have more than 5 images.' };
    }
    
    // Validate each image URL
    for (const imageUrl of imageArray) {
      if (!this.isValidImageUrl(imageUrl)) {
        return { isValid: false, error: `Invalid image URL: ${imageUrl}` };
      }
    }
    
    return { isValid: true, images: imageArray };
  }

  /**
   * Check if URL is a valid image URL
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  static isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Allow relative paths starting with /uploads/
    if (url.startsWith('/uploads/')) {
      return true;
    }
    
    // Basic URL validation for full URLs
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Validate postal code (Singapore format)
   * @param {string} postalCode - Postal code to validate
   * @returns {object} - Validation result
   */
  static validatePostalCode(postalCode) {
    if (!postalCode) {
      return { isValid: false, error: 'Postal code is required' };
    }
    
    if (typeof postalCode !== 'string') {
      return { isValid: false, error: 'Postal code must be a string' };
    }
    
    // Singapore postal code format: 6 digits
    const postalCodeRegex = /^\d{6}$/;
    if (!postalCodeRegex.test(postalCode)) {
      return { isValid: false, error: 'Postal code must be 6 digits (Singapore format)' };
    }
    
    return { isValid: true, postalCode: postalCode.trim() };
  }

  /**
   * Determine if listing needs pending review
   * @param {number} price - Rental price
   * @returns {object} - Review status result
   */
  static determineReviewStatus(price) {
    const numPrice = Number(price);
    
    if (numPrice < 500 || numPrice > 5000) {
      return {
        needsReview: true,
        status: 'pending_review',
        reviewStatus: 'pending',
        message: 'Your property listing is under pending review due to rental price outside normal range (S$500 - S$5000)'
      };
    }
    
    return {
      needsReview: false,
      status: 'active',
      reviewStatus: 'approved',
      message: 'Your property listing has been approved and is now active'
    };
  }

  /**
   * Validate complete listing data (for creation)
   * @param {object} listingData - Complete listing data
   * @returns {object} - Validation result
   */
  static validateListingData(listingData) {
    const errors = [];
    const validatedData = {};

    // Validate required fields
    const requiredFields = ['title', 'address', 'postal_code', 'price', 'property_type'];
    for (const field of requiredFields) {
      if (!listingData[field]) {
        errors.push(`${field} is required`);
      }
    }

    // Validate email if provided
    if (listingData.email) {
      const emailValidation = this.validateEmail(listingData.email);
      if (!emailValidation.isValid) {
        errors.push(emailValidation.error);
      } else {
        validatedData.email = listingData.email;
      }
    }

    // Validate price
    const priceValidation = this.validatePrice(listingData.price);
    if (!priceValidation.isValid) {
      errors.push(priceValidation.error);
    } else {
      validatedData.price = priceValidation.price;
    }

    // Validate images
    const imageValidation = this.validateImages(listingData.images);
    if (!imageValidation.isValid) {
      errors.push(imageValidation.error);
    } else {
      validatedData.images = imageValidation.images;
    }

    // Validate postal code
    const postalValidation = this.validatePostalCode(listingData.postal_code);
    if (!postalValidation.isValid) {
      errors.push(postalValidation.error);
    } else {
      validatedData.postal_code = postalValidation.postalCode;
    }

    // Determine review status
    if (priceValidation.isValid) {
      const reviewStatus = this.determineReviewStatus(priceValidation.price);
      validatedData.status = reviewStatus.status;
      validatedData.review_status = reviewStatus.reviewStatus;
      validatedData.review_message = reviewStatus.message;
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData
    };
  }

  /**
   * Validate listing data for updates (only validate provided fields)
   * @param {object} updateData - Partial listing data for update
   * @returns {object} - Validation result
   */
  static validateListingUpdate(updateData) {
    const errors = [];
    const validatedData = {};

    console.log('[VALIDATION] validateListingUpdate called with:', updateData);

    // Validate email if provided
    if (updateData.email) {
      const emailValidation = this.validateEmail(updateData.email);
      if (!emailValidation.isValid) {
        errors.push(emailValidation.error);
      } else {
        validatedData.email = updateData.email;
      }
    }

    // Validate price if provided
    if (updateData.price !== undefined) {
      const priceValidation = this.validatePrice(updateData.price);
      if (!priceValidation.isValid) {
        errors.push(priceValidation.error);
      } else {
        validatedData.price = priceValidation.validatedPrice;
      }
    }

    // Validate images if provided
    if (updateData.images !== undefined) {
      const imagesValidation = this.validateImages(updateData.images);
      if (!imagesValidation.isValid) {
        errors.push(imagesValidation.error);
      } else {
        validatedData.images = imagesValidation.images;
      }
    }

    // Validate postal code if provided
    if (updateData.postal_code) {
      const postalValidation = this.validatePostalCode(updateData.postal_code);
      if (!postalValidation.isValid) {
        errors.push(postalValidation.error);
      } else {
        validatedData.postal_code = updateData.postal_code;
      }
    }

    // Add other fields that don't need special validation
    const simpleFields = ['title', 'description', 'address', 'property_type', 'rooms', 'availability_date', 'status', 'review_status'];
    for (const field of simpleFields) {
      if (updateData[field] !== undefined) {
        validatedData[field] = updateData[field];
      }
    }

    console.log('[VALIDATION] validateListingUpdate result:', {
      isValid: errors.length === 0,
      errors,
      validatedData
    });

    return {
      isValid: errors.length === 0,
      errors,
      validatedData
    };
  }
}

module.exports = ListingValidationService;
