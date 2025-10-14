# CREATE DATABASE rentwiseDB;

# This is for localhost testing without docker. If you run via docker, it will auto create this root user.
CREATE USER IF NOT EXISTS 'rentuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON rentwiseDB.* TO 'rentuser'@'localhost';
FLUSH PRIVILEGES;
#########################################################################

USE rentwiseDB;
# Default Role: Landlord
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  displayName VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash CHAR(64) NOT NULL,
  isDisable BOOLEAN DEFAULT FALSE,
  userRole CHAR(64) NOT NULL DEFAULT 'LANDLORD'
);


# Adding default admin user
INSERT INTO users (displayName, email, passwordHash, userRole)
VALUES ('admin','admin@gmail.com', SHA2('password', 256),'ADMIN');
# default user for testing purposes
# login: admin@gmail.com
# password: password


# Property listings table
CREATE TABLE IF NOT EXISTS listings (
  listing_id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  postal_code VARCHAR(10),
  price DECIMAL(10,2) NOT NULL,
  property_type ENUM('HDB') NOT NULL,
  rooms INT,
  images JSON,
  availability_date DATE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'rented', 'pending_review', 'rejected') DEFAULT 'active',
  review_status ENUM('pending', 'approved', 'rejected', 'needs_info') DEFAULT 'pending',
  review_notes TEXT,
  FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
);

# Enquiries table for property enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  tenant_name VARCHAR(100) NOT NULL,
  tenant_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  enquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

# Checking
SELECT user_id, displayName
FROM users
WHERE displayName = 'Admin'
  AND passwordHash = SHA2('SWEAdmin', 256);
SELECT * FROM users;

# This update is needed else when u try to login, it says invalid credentials for this user...
UPDATE users
SET passwordHash = LOWER(SHA2('SWEAdmin', 256))
WHERE email = 'admin@admin.com';