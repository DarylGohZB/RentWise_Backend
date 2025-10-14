# RentWise Backend - Postman Testing Guide

## 🚀 Setup Instructions

### 1. Start Your Backend
```bash
docker compose up -d --build
```

### 2. Verify Backend is Running
- Check logs: `docker compose logs -f nodejs`
- Look for: `[APP] Server listening on port 3000`
- Base URL: `http://localhost:3000`

### 3. Postman Collection Setup
Create a new collection called "RentWise Backend" with base URL: `http://localhost:3000`

---

## 🔐 Authentication Endpoints

### Login (Get Auth Token)
- **Method**: POST
- **URL**: `{{baseURL}}/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "email": "admin@admin.com",
  "password": "password"
}
```
- **Expected Response**: 
```json
{
  "success": true,
  "token": "your_jwt_token_here",
  "user": {
    "user_id": 1,
    "displayName": "admin",
    "email": "admin@admin.com",
    "userRole": "ADMIN"
  }
}
```

### Register New User
- **Method**: POST
- **URL**: `{{baseURL}}/api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "displayName": "Test Landlord",
  "email": "landlord@test.com",
  "password": "password123",
  "userRole": "LANDLORD"
}
```

---

## 🏠 Property Listing Endpoints

### Create New Listing (Triggers Pending Review)
- **Method**: POST
- **URL**: `{{baseURL}}/api/listing/create`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "landlord_id": 1,
  "title": "3-Room HDB Flat in Tampines",
  "description": "Beautiful 3-room HDB flat with modern amenities",
  "address": "123 Tampines Street 11",
  "postal_code": "521123",
  "price": 300,
  "property_type": "HDB",
  "rooms": 3,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "availability_date": "2024-02-01"
}
```
- **Expected Response** (Price < $500 triggers pending review):
```json
{
  "message": "Listing created successfully",
  "listingId": 1,
  "status": "pending_review",
  "reviewStatus": "pending",
  "reviewMessage": "Your property listing is under pending review due to rental price outside normal range (S$500 - S$5000)"
}
```

### Create Normal Price Listing (Auto-Approved)
- **Method**: POST
- **URL**: `{{baseURL}}/api/listing/create`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "landlord_id": 1,
  "title": "4-Room HDB Flat in Jurong",
  "description": "Spacious 4-room HDB flat",
  "address": "456 Jurong West Street 42",
  "postal_code": "640456",
  "price": 1200,
  "property_type": "HDB",
  "rooms": 4,
  "images": ["https://example.com/image3.jpg"],
  "availability_date": "2024-02-15"
}
```

### Get Listing by ID
- **Method**: GET
- **URL**: `{{baseURL}}/api/listing/1`
- **Expected Response**:
```json
{
  "listing_id": 1,
  "landlord_id": 1,
  "title": "3-Room HDB Flat in Tampines",
  "description": "Beautiful 3-room HDB flat with modern amenities",
  "address": "123 Tampines Street 11",
  "postal_code": "521123",
  "price": 300,
  "property_type": "HDB",
  "rooms": 3,
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "availability_date": "2024-02-01",
  "status": "pending_review",
  "review_status": "pending",
  "created_date": "2024-01-15T10:30:00.000Z"
}
```

### Update Listing
- **Method**: PUT
- **URL**: `{{baseURL}}/api/listing/1`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "title": "Updated 3-Room HDB Flat",
  "price": 1500,
  "rooms": 3
}
```

### Search Listings
- **Method**: GET
- **URL**: `{{baseURL}}/api/listing/search`
- **Query Parameters**:
  - `min_price`: 1000
  - `max_price`: 2000
  - `min_rooms`: 2
  - `max_rooms`: 4
  - `property_type`: HDB
  - `location`: Tampines
  - `limit`: 10
  - `offset`: 0

### Get Landlord's Listings
- **Method**: GET
- **URL**: `{{baseURL}}/api/listing/landlord/1`
- **Query Parameters**:
  - `status`: active (or pending_review, rejected)
  - `limit`: 10
  - `offset`: 0

### Delete Listing
- **Method**: DELETE
- **URL**: `{{baseURL}}/api/listing/1`

---

## 👨‍💼 Admin Review Endpoints

### Get Pending Reviews
- **Method**: GET
- **URL**: `{{baseURL}}/api/adminreview/pending`
- **Headers**: `Authorization: Bearer {{token}}`
- **Query Parameters**:
  - `limit`: 10
  - `offset`: 0

### Get Specific Listing for Review
- **Method**: GET
- **URL**: `{{baseURL}}/api/adminreview/review/1`
- **Headers**: `Authorization: Bearer {{token}}`

### Approve Listing
- **Method**: POST
- **URL**: `{{baseURL}}/api/adminreview/approve/1`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "review_notes": "Listing approved - price is reasonable for the area"
}
```

### Reject Listing
- **Method**: POST
- **URL**: `{{baseURL}}/api/adminreview/reject/1`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "review_notes": "Price too low - please provide justification or increase price"
}
```

### Request More Information
- **Method**: POST
- **URL**: `{{baseURL}}/api/adminreview/request-info/1`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "review_notes": "Please provide more details about the property condition and nearby amenities"
}
```

### Get Review Statistics
- **Method**: GET
- **URL**: `{{baseURL}}/api/adminreview/stats`
- **Headers**: `Authorization: Bearer {{token}}`

---

## 🏛️ Government Data Endpoints

### Get Government Data Count
- **Method**: GET
- **URL**: `{{baseURL}}/api/search/gov/count`

### Get Sample Government Data
- **Method**: GET
- **URL**: `{{baseURL}}/api/search/gov/sample`
- **Query Parameters**:
  - `limit`: 5

### Search Government Data
- **Method**: GET
- **URL**: `{{baseURL}}/api/search/gov/search`
- **Query Parameters**:
  - `town`: TAMPINES
  - `flatType`: 4 ROOM
  - `minPrice`: 400000
  - `maxPrice`: 700000
  - `limit`: 20
  - `offset`: 0

### Sync Government Data
- **Method**: POST
- **URL**: `{{baseURL}}/api/apimanagement/gov/sync`

---

## 🧪 Test Scenarios

### Scenario 1: Create Listing with Low Price (Triggers Review)
1. Create listing with `price: 300`
2. Verify response shows `status: "pending_review"`
3. Check admin panel shows pending review

### Scenario 2: Create Listing with High Price (Triggers Review)
1. Create listing with `price: 6000`
2. Verify response shows `status: "pending_review"`
3. Check admin panel shows pending review

### Scenario 3: Create Normal Price Listing (Auto-Approved)
1. Create listing with `price: 1200`
2. Verify response shows `status: "active"`

### Scenario 4: Admin Review Workflow
1. Login as admin
2. Get pending reviews
3. Approve/reject listings
4. Verify status changes

### Scenario 5: Validation Testing
1. Try creating listing without required fields
2. Try invalid email format
3. Try invalid postal code
4. Try more than 5 images
5. Try negative price

---

## 🔧 Postman Environment Variables

Create environment variables in Postman:
- `baseURL`: `http://localhost:3000`
- `token`: (set after login)
- `listingId`: (set after creating listing)
- `landlordId`: `1`

---

## 📝 Common Test Cases

### Validation Errors
```json
// Missing required fields
{
  "landlord_id": 1,
  "title": "Test"
  // Missing: address, postal_code, price, property_type
}

// Invalid email
{
  "email": "invalid-email"
}

// Invalid postal code
{
  "postal_code": "12345"  // Should be 6 digits
}

// Too many images
{
  "images": [
    "url1", "url2", "url3", "url4", "url5", "url6"  // Max 5 allowed
  ]
}

// Negative price
{
  "price": -100
}
```

### Success Cases
```json
// Valid listing
{
  "landlord_id": 1,
  "title": "Test Property",
  "address": "123 Test Street",
  "postal_code": "123456",
  "price": 1200,
  "property_type": "HDB",
  "rooms": 3,
  "images": ["https://example.com/image.jpg"]
}
```

---

## 🚨 Troubleshooting

### Connection Issues
- Ensure Docker containers are running: `docker compose ps`
- Check backend logs: `docker compose logs nodejs`
- Verify port 3000 is accessible

### Authentication Issues
- Use admin credentials: `admin@admin.com` / `password`
- Include `Authorization: Bearer {{token}}` header for protected endpoints

### Database Issues
- Check MySQL is running: `docker compose logs rentwiseDB`
- Verify data exists: Use government data endpoints first

---

## 📊 Expected Response Codes

- **200**: Success
- **201**: Created successfully
- **400**: Validation error / Bad request
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Internal server error

Happy testing! 🎉