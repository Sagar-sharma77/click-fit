-- =========================================================
-- ClickFit — users schema + addUser stored procedure
-- MySQL 5.7+ / 8.x
-- =========================================================

-- Create the database (safe if it exists)
CREATE DATABASE IF NOT EXISTS clickfit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clickfit;

-- ---------- users table ----------
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  userId    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  email     VARCHAR(255)   NOT NULL,
  password  VARCHAR(255)   NOT NULL,          -- store a HASH, never plain text
  type      ENUM('user','admin','trainer') NOT NULL DEFAULT 'user',
  active    TINYINT(1)     NOT NULL DEFAULT 1,
  createdAt TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- stored procedure: addUser ----------
DROP PROCEDURE IF EXISTS addUser;

DELIMITER $$

CREATE PROCEDURE addUser (
  IN  p_email    VARCHAR(255),
  IN  p_password VARCHAR(255),
  IN  p_type     VARCHAR(20),
  IN  p_active   TINYINT,
  OUT p_userId   INT UNSIGNED
)
BEGIN
  -- Validate type; default to 'user' if invalid
  IF p_type NOT IN ('user','admin','trainer') THEN
    SET p_type = 'user';
  END IF;

  -- Default active to 1 if NULL
  IF p_active IS NULL THEN
    SET p_active = 1;
  END IF;

  -- Insert; will fail on duplicate email (good — unique key enforces it)
  INSERT INTO users (email, password, type, active)
  VALUES (p_email, p_password, p_type, p_active);

  SET p_userId = LAST_INSERT_ID();
END$$

DELIMITER ;

-- ---------- example CALL that inserts a new user ----------
CALL addUser(
  'sagar@example.com',
  '$2b$10$abcdefghijklmnopqrstuvEXAMPLEHASHNOTREAL1234567890',
  'user',
  1,
  @newUserId
);

SELECT @newUserId AS insertedUserId;

-- Verify
SELECT userId, email, type, active, createdAt
FROM users
WHERE userId = @newUserId;