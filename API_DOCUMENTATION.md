# RentWise Backend API Documentation

## Overview
This document describes the REST API endpoints for the RentWise backend system, focusing on the simplified enquiry and listing management features.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Enquiry Management

### Create Enquiry
**POST** `/enquiry/`

Creates a new property enquiry from a potential tenant. Users click on a property listing and submit their enquiry with just their name, email, and message.

**Request Body:**
```json
{
  "listing_id": 123,
  "tenant_name": "John Doe",
  "tenant_email": "john@example.com",
  "message": "I'm interested in viewing this property. When would be a good time?"
}
```

**Response:**
```json
{
  "message": "Enquiry submitted successfully",
  "enquiryId": 456
}
```

### Get Landlord's Enquiries
**GET** `/enquiry/landlord/:landlordId`

Retrieves all enquiries for a specific landlord from their property listings.

**Response:**
```json
[
  {
    "enquiry_id": 456,
    "listing_id": 123,
    "tenant_name": "John Doe",
    "tenant_email": "john@example.com",
    "message": "I'm interested in viewing this property...",
    "enquiry_date": "2024-01-15T10:30:00Z",
    "listing_title": "Beautiful 3BR HDB in Orchard",
    "listing_address": "123 Orchard Road, Singapore"
  }
]
```

## Listing Management

### Create Listing
**POST** `/listing/`

Creates a new property listing.

**Request Body:**
```json
{
  "landlord_id": 1,
  "title": "Beautiful 3BR Condo in Orchard",
  "description": "Spacious 3-bedroom condo with modern amenities...",
  "address": "123 Orchard Road, Singapore 238863",
  "price": 4500.00,
  "property_type": "HDB",
  "bedrooms": 3,
  "bathrooms": 2,
  "area_sqm": 120.5,
  "amenities": "Swimming pool, Gym, 24/7 Security",
  "images": ["image1.jpg", "image2.jpg"],
  "availability_date": "2024-02-01"
}
```

**Response:**
```json
{
  "message": "Listing created successfully",
  "listingId": 123
}
```

### Get Listing by ID
**GET** `/listing/:listingId`

Retrieves a specific listing by its ID.

**Response:**
```json
{
  "listing_id": 123,
  "landlord_id": 1,
  "title": "Beautiful 3BR Condo in Orchard",
  "description": "Spacious 3-bedroom condo...",
  "address": "123 Orchard Road, Singapore 238863",
  "price": 4500.00,
  "property_type": "HDB",
  "bedrooms": 3,
  "bathrooms": 2,
  "area_sqm": 120.5,
  "amenities": "Swimming pool, Gym, 24/7 Security",
  "images": ["image1.jpg", "image2.jpg"],
  "availability_date": "2024-02-01",
  "created_date": "2024-01-15T10:30:00Z",
  "updated_date": "2024-01-15T10:30:00Z",
  "status": "active",
  "landlord_name": "Jane Smith",
  "landlord_email": "jane@example.com"
}
```

### Get Landlord's Listings
**GET** `/listing/landlord/:landlordId`

Retrieves all listings for a specific landlord.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `inactive`, `rented`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

### Search Listings
**POST** `/listing/search`

Searches for listings with various filters.

**Request Body:**
```json
{
  "property_type": "HDB",
  "min_price": 3000,
  "max_price": 5000,
  "min_bedrooms": 2,
  "max_bedrooms": 4,
  "location": "Orchard",
  "availability_date": "2024-02-01"
}
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

### Update Listing
**PUT** `/listing/:listingId`

Updates a listing.

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 4800.00,
  "status": "rented"
}
```

### Delete Listing
**DELETE** `/listing/:listingId`

Deletes a listing.

### Get Listing Statistics
**GET** `/listing/stats/:landlordId`

Gets statistics for a landlord's listings.

**Response:**
```json
{
  "total": 10,
  "active": 7,
  "inactive": 2,
  "rented": 1
}
```

## Database Schema

### Enquiries Table
```sql
CREATE TABLE enquiries (
  enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  tenant_name VARCHAR(100) NOT NULL,
  tenant_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  enquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);
```

### Listings Table
```sql
CREATE TABLE listings (
  listing_id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  property_type ENUM('HDB') NOT NULL,
  bedrooms INT,
  bathrooms INT,
  area_sqm DECIMAL(8,2),
  amenities TEXT,
  images JSON,
  availability_date DATE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'rented') DEFAULT 'active',
  FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

## Email Notifications

The system automatically sends email notifications when:

1. **New Enquiry**: When a tenant submits an enquiry, the landlord receives an email notification with:
   - Property details
   - Tenant information
   - Enquiry message
   - Enquiry ID for reference

2. **Enquiry Response**: When a landlord responds to an enquiry, the tenant receives an email with:
   - Property details
   - Landlord's response
   - Contact information

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a message field:
```json
{
  "message": "Error description"
}
```

## Testing

You can test the endpoints using tools like:
- Postman
- curl
- Thunder Client (VS Code extension)

Example curl command to create an enquiry:
```bash
curl -X POST http://localhost:3000/api/enquiry/ \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 123,
    "tenant_name": "John Doe",
    "tenant_email": "john@example.com",
    "message": "I am interested in this property"
  }'
```

## Next Steps

With the backend enquiry and listing system now complete, you can:

1. **Test the APIs** using the provided endpoints
2. **Integrate with frontend** when it's ready
3. **Add authentication middleware** to protect routes
4. **Implement additional features** like:
   - File upload for property images
   - Advanced search with geolocation
   - Push notifications
   - Analytics and reporting
   - Admin dashboard features
