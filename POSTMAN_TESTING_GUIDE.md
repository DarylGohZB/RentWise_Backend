# Postman Testing Guide for RentWise Backend

## Setup

### 1. Import Environment Variables
Create a new environment in Postman with these variables:
- `base_url`: `http://localhost:3000/api`
- `auth_token`: (leave empty for now, will be filled after login)

### 2. Start Your Backend
Make sure your backend is running:
```bash
cd nodejs
npm start
```

## Testing Sequence

### Step 1: Test Basic Connectivity

#### Test Enquiry Endpoint
- **Method**: `GET`
- **URL**: `{{base_url}}/enquiry/test`
- **Expected Response**: `true`

#### Test Listing Endpoint
- **Method**: `GET`
- **URL**: `{{base_url}}/listing/test`
- **Expected Response**: `true`

### Step 2: Authentication (if needed)

#### Login
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "admin@admin.com",
  "password": "password"
}
```
- **Expected Response**: 
```json
{
  "message": "Login successful",
  "token": "your-jwt-token-here",
  "user": {
    "user_id": 1,
    "displayName": "admin",
    "email": "admin@admin.com",
    "userRole": "ADMIN"
  }
}
```
- **Action**: Copy the token and set it in your environment variable `auth_token`

### Step 3: Create a Test Listing

#### Create Listing
- **Method**: `POST`
- **URL**: `{{base_url}}/listing/`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{auth_token}}` (if authentication is enabled)
- **Body** (raw JSON):
```json
{
  "landlord_id": 1,
  "title": "Beautiful 3BR HDB in Orchard",
  "description": "Spacious 3-bedroom HDB with modern amenities, close to MRT and shopping malls.",
  "address": "123 Orchard Road, Singapore 238863",
  "price": 2500.00,
  "property_type": "HDB",
  "bedrooms": 3,
  "bathrooms": 2,
  "area_sqm": 90.5,
  "amenities": "Near MRT, Shopping Mall, Park",
  "images": ["image1.jpg", "image2.jpg"],
  "availability_date": "2024-02-01"
}
```
- **Expected Response**:
```json
{
  "message": "Listing created successfully",
  "listingId": 1
}
```
- **Action**: Note down the `listingId` for the next test

### Step 4: Test Enquiry System

#### Create Enquiry
- **Method**: `POST`
- **URL**: `{{base_url}}/enquiry/`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "listing_id": 1,
  "tenant_name": "John Doe",
  "tenant_email": "john@example.com",
  "message": "Hi! I'm interested in viewing this HDB unit. When would be a good time for a viewing? I'm available on weekends."
}
```
- **Expected Response**:
```json
{
  "message": "Enquiry submitted successfully",
  "enquiryId": 1
}
```

### Step 5: Retrieve Data

#### Get Listing by ID
- **Method**: `GET`
- **URL**: `{{base_url}}/listing/1`
- **Expected Response**: Full listing details with landlord information

#### Get Landlord's Enquiries
- **Method**: `GET`
- **URL**: `{{base_url}}/enquiry/landlord/1`
- **Expected Response**: Array of enquiries for the landlord

#### Search Listings
- **Method**: `POST`
- **URL**: `{{base_url}}/listing/search`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "property_type": "HDB",
  "min_price": 2000,
  "max_price": 3000,
  "min_bedrooms": 2,
  "location": "Orchard"
}
```

## Error Testing

### Test Invalid Property Type
- **Method**: `POST`
- **URL**: `{{base_url}}/listing/`
- **Body**:
```json
{
  "landlord_id": 1,
  "title": "Test Listing",
  "address": "123 Test Street",
  "price": 2000,
  "property_type": "Condo"
}
```
- **Expected Response**: `400 Bad Request` with error message

### Test Missing Required Fields
- **Method**: `POST`
- **URL**: `{{base_url}}/enquiry/`
- **Body**:
```json
{
  "listing_id": 1,
  "tenant_name": "John Doe"
}
```
- **Expected Response**: `400 Bad Request` with validation error

### Test Non-existent Listing
- **Method**: `POST`
- **URL**: `{{base_url}}/enquiry/`
- **Body**:
```json
{
  "listing_id": 999,
  "tenant_name": "John Doe",
  "tenant_email": "john@example.com",
  "message": "Test message"
}
```
- **Expected Response**: `404 Not Found`

## Collection Setup

### Create a Postman Collection
1. Create a new collection called "RentWise Backend"
2. Add all the above requests to the collection
3. Set up environment variables
4. Add tests to verify responses

### Sample Test Scripts

#### For Successful Enquiry Creation
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has enquiryId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.enquiryId).to.exist;
});

pm.test("Response message is correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.eql("Enquiry submitted successfully");
});
```

#### For Successful Listing Creation
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has listingId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.listingId).to.exist;
});

pm.test("Response message is correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.eql("Listing created successfully");
});
```

## Quick Test Checklist

- [ ] Backend server is running
- [ ] Test endpoints return `true`
- [ ] Can create a listing successfully
- [ ] Can create an enquiry for the listing
- [ ] Can retrieve the listing by ID
- [ ] Can get landlord's enquiries
- [ ] Error handling works for invalid data
- [ ] Email notifications are sent (check your email)

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Make sure your backend server is running on port 3000
   - Check if the URL is correct: `http://localhost:3000/api`

2. **404 Not Found**
   - Verify the endpoint URLs are correct
   - Check if the routes are properly set up in your app

3. **500 Internal Server Error**
   - Check your server logs for detailed error messages
   - Verify database connection is working

4. **Email Not Working**
   - Check your Gmail credentials in environment variables
   - Verify Gmail app password is set up correctly

### Database Setup
Make sure your MySQL database is running and the tables are created:
```sql
-- Run this in your MySQL client
USE rentwiseDB;
SHOW TABLES;
-- Should show: users, listings, enquiries
```

## Sample Data for Testing

### Test Listings
```json
{
  "landlord_id": 1,
  "title": "Cozy 2BR HDB in Tampines",
  "description": "Well-maintained 2-bedroom HDB unit near Tampines MRT",
  "address": "456 Tampines Street 42, Singapore 520456",
  "price": 1800.00,
  "property_type": "HDB",
  "bedrooms": 2,
  "bathrooms": 1,
  "area_sqm": 70.0,
  "amenities": "Near MRT, Market, School",
  "availability_date": "2024-03-01"
}
```

### Test Enquiries
```json
{
  "listing_id": 1,
  "tenant_name": "Sarah Lee",
  "tenant_email": "sarah@example.com",
  "message": "Hello! I'm interested in this property. Could you please provide more details about the lease terms and when I can arrange a viewing?"
}
```

This guide should help you thoroughly test your RentWise backend APIs using Postman!
