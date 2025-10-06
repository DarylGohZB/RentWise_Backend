CREATE DATABASE rentwiseDB;

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
VALUES ('admin','admin@admin.com', SHA2('password', 256),'ADMIN');
# default user for testing purposes
# login: admin@admin.com
# password: password


# Checking
SELECT user_id, displayName
FROM users
WHERE displayName = 'Admin'
  AND passwordHash = SHA2('SWEAdmin', 256);
SELECT * FROM users;

