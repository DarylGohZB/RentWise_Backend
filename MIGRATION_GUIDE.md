# Migration Guide - Database and Environment Updates

## Important: Breaking Changes

This update includes several important fixes that require manual steps for existing users.

## Required Steps for Existing Users

### 1. Stop All Containers
```bash
docker-compose down
```

### 2. Update Environment Variables
Add these missing variables to your `.env` file:
```env
# Gmail SMTP (for sending OTPs)
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-app-password
```

### 3. Database Migration

**For Fresh Installation (New Users):**
- **No action needed** - tables will be created automatically
- Just run `docker-compose up --build -d`

**For Existing Users (If you have an old database):**
```bash
# Remove existing database data to force fresh schema creation
rm -rf mysql/data/*
# Start containers (will automatically create all tables from init.sql)
docker-compose up --build -d
```

**Note**: The init script only runs when creating a fresh database. If you have existing data you want to keep, you'll need to manually create the missing tables using the commands in the troubleshooting section below.

### 4. Restart Application
```bash
docker-compose up --build -d
```

## Testing

After migration, test these endpoints:
1. `GET http://localhost:3000/api/listing/test` - Should return `true`
2. `GET http://localhost:3000/api/enquiry/test` - Should return `true`
3. Create a listing using POST to `/api/listing/`
4. Create an enquiry using POST to `/api/enquiry/`

## Troubleshooting

**Issue**: "Cannot find module 'cors'"
**Solution**: Rebuild containers with `docker-compose up --build -d`

**Issue**: "GMAIL_USER and GMAIL_PASS must be set"
**Solution**: Add Gmail credentials to `.env` file

**Issue**: "Table 'listings' doesn't exist"
**Solution**: 
- For fresh install: Run `rm -rf mysql/data/*` then `docker-compose up --build -d`
- To preserve data: Run manual table creation:
```bash
docker exec rentwise-mysql mysql -u rentuser -ppassword rentwiseDB -e "
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  displayName VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash CHAR(64) NOT NULL,
  isDisable BOOLEAN DEFAULT FALSE,
  userRole CHAR(64) NOT NULL DEFAULT 'LANDLORD'
);

CREATE TABLE IF NOT EXISTS listings (
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

CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  tenant_name VARCHAR(100) NOT NULL,
  tenant_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  enquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

INSERT IGNORE INTO users (displayName, email, passwordHash, userRole) 
VALUES ('admin','admin@admin.com', SHA2('password', 256),'ADMIN');
"
```
