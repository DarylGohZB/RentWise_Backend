CREATE DATABASE loginDB;

USE loginDB;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash CHAR(64) NOT NULL
);

INSERT INTO users (username, password_hash)
VALUES ('Admin', SHA2('SWEAdmin', 256));

SELECT user_id, username
FROM users
WHERE username = 'Admin'
  AND password_hash = SHA2('SWEAdmin', 256);
  
SELECT * FROM users;

