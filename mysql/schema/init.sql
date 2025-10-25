CREATE DATABASE IF NOT EXISTS rentwiseDB;
USE rentwiseDB;

DROP TABLE IF EXISTS enquiries, listings, users;

# This is for localhost testing without docker. If you run via docker, it will auto create this root user.
CREATE USER IF NOT EXISTS 'rentuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON rentwiseDB.* TO 'rentuser'@'localhost';
FLUSH PRIVILEGES;

USE rentwiseDB;

# Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  displayName VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash CHAR(64) NOT NULL,
  isDisable BOOLEAN DEFAULT FALSE,
  userRole CHAR(64) NOT NULL DEFAULT 'LANDLORD',
  registeredDateTime DATETIME DEFAULT CURRENT_TIMESTAMP
);

# Admin user
INSERT INTO users (displayName, email, passwordHash, userRole)
VALUES ('admin', 'admin@gmail.com', SHA2('password', 256), 'ADMIN');

# Sample landlords
INSERT INTO users (displayName, email, passwordHash, registeredDateTime)
VALUES
('Alice Tan', 'alice@example.com', SHA2('alice123', 256), NOW()), -- today
('Ben Lee', 'ben@example.com', SHA2('ben123', 256), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Cynthia Goh', 'cynthia@example.com', SHA2('cynthia123', 256), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('Daniel Ho', 'daniel@example.com', SHA2('daniel123', 256), DATE_SUB(NOW(), INTERVAL 10 DAY)), -- last week
('Elena Lim', 'elena@example.com', SHA2('elena123', 256), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('Faris Wong', 'faris@example.com', SHA2('faris123', 256), DATE_SUB(NOW(), INTERVAL 21 DAY));

# Listings Table
CREATE TABLE IF NOT EXISTS listings (
  listing_id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  postal_code VARCHAR(10),
  town VARCHAR(100),
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

# Sample listings
INSERT INTO listings (landlord_id, title, description, address, postal_code, town, price, property_type, rooms, images, availability_date, status, review_status)
VALUES
(2, 'Spacious 3-Room Flat in Tampines', 'Nice view near MRT', 'Blk 123 Tampines St 11', '520123', 'TAMPINES', 2400.00, 'HDB', 3, JSON_ARRAY('img1.jpg', 'img2.jpg'), '2025-11-01', 'active', 'approved'),
(2, 'Cosy 2-Room in Bedok', 'Perfect for couples', 'Blk 22 Bedok North Ave 3', '460022', 'BEDOK', 1800.00, 'HDB', 2, JSON_ARRAY('img3.jpg'), '2025-10-25', 'active', 'approved'),
(3, 'Modern 4-Room Jurong', 'Spacious and bright', 'Blk 88 Jurong West St 91', '640088', 'JURONG WEST', 2800.00, 'HDB', 4, JSON_ARRAY('img4.jpg', 'img5.jpg'), '2025-11-15', 'pending_review', 'pending'),
(4, 'Bukit Batok 3-Room', 'Fully furnished, near MRT', 'Blk 45 Bukit Batok East', '659045', 'BUKIT BATOK', 2200.00, 'HDB', 3, JSON_ARRAY('img6.jpg'), '2025-11-10', 'rented', 'approved'),
(5, 'Woodlands Budget Unit', '1-Room HDB for short stays', 'Blk 10 Woodlands Ave 9', '738010', 'WOODLANDS', 1200.00, 'HDB', 1, JSON_ARRAY('img7.jpg'), '2025-10-20', 'inactive', 'rejected'),
(2, 'New Tampines 5-Room', 'Great for families', 'Blk 678 Tampines Ave 5', '520678', 'TAMPINES', 3000.00, 'HDB', 5, JSON_ARRAY('img8.jpg'), '2025-12-01', 'pending_review', 'needs_info'),
(3, 'Clementi 2-Room', 'Convenient and quiet', 'Blk 234 Clementi Ave 3', '120234', 'CLEMENTI', 1900.00, 'HDB', 2, JSON_ARRAY('img9.jpg'), '2025-11-05', 'active', 'approved'),
(6, 'Yishun 4-Room', 'Nice view of the park', 'Blk 456 Yishun Ring Road', '760456', 'YISHUN', 2600.00, 'HDB', 4, JSON_ARRAY('img10.jpg'), '2025-11-12', 'active', 'approved');

# Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  landlord_email VARCHAR(255) NOT NULL,
  property_postal_code VARCHAR(10),
  enquirer_name VARCHAR(255) NOT NULL,
  enquirer_email VARCHAR(255) NOT NULL,
  enquiry_message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('new', 'read', 'replied') DEFAULT 'new',
  FOREIGN KEY (property_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

# Sample enquiries
INSERT INTO enquiries (property_id, landlord_email, property_postal_code, enquirer_name, enquirer_email, enquiry_message, status)
VALUES
(1, 'alice@example.com', '520123', 'John Tan', 'john@example.com', 'Hi! Is this flat still available?', 'new'),
(3, 'cynthia@example.com', '640088', 'Rachel Lee', 'rachel@example.com', 'Can I arrange a viewing?', 'read'),
(4, 'daniel@example.com', '659045', 'Sam Ong', 'sam@example.com', 'Interested in renting next month', 'replied'),
(6, 'alice@example.com', '520678', 'Marcus Teo', 'marcus@example.com', 'Need more info about the area', 'new'),
(7, 'cynthia@example.com', '120234', 'Elaine Koh', 'elaine@example.com', 'Any discount for longer lease?', 'new');

# Final update for admin login test
UPDATE users
SET passwordHash = LOWER(SHA2('SWEAdmin1', 256))
WHERE email = 'admin@gmail.com';

CREATE TABLE IF NOT EXISTS govt_api_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  last_sync_time DATETIME,
  last_key_update_time DATETIME,
  current_status ENUM('operational', 'error') DEFAULT 'operational'
);
INSERT INTO govt_api_status (last_sync_time, last_key_update_time, current_status)
VALUES ('2025-10-22 10:00:00', '2025-10-21 18:30:00', 'operational');

CREATE TABLE scheduled_operations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cron_expression VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT
);

INSERT INTO system_settings (setting_key, setting_value)
VALUES 
('enable_2fa_admin', 'false'),
('session_timeout_minutes', '60')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

CREATE TABLE api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operation VARCHAR(255),
    status VARCHAR(50),
    record_summary VARCHAR(255),
    duration FLOAT,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS gov_house_transactions (
    id VARCHAR(64) PRIMARY KEY,
    rentApprovalDate VARCHAR(16),
    town VARCHAR(64),
    block VARCHAR(32),
    streetName VARCHAR(128),
    flatType VARCHAR(32),
    monthlyRent INT,
    source VARCHAR(64),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);