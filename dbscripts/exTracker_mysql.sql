CREATE DATABASE IF NOT EXISTS `xtracker` DEFAULT CHARACTER SET utf8mb4;
USE `xtracker`;

DROP TABLE IF EXISTS `user_accounts`;
CREATE TABLE `user_accounts` (
  `id`        INT(10)      NOT NULL AUTO_INCREMENT,
  `username`  VARCHAR(15)  NOT NULL,
  `password`  VARCHAR(255) NOT NULL,
  `fname`     VARCHAR(50)  NOT NULL,
  `lname`     VARCHAR(50)  NOT NULL,
  `email`     VARCHAR(100) NOT NULL,
  `user_type` VARCHAR(50)  NOT NULL,
  `status`    VARCHAR(10)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`       INT(10)     NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(50) NOT NULL,
  `userId`   INT(10)     NOT NULL,
  `status`   VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_category` (`userId`, `category`)
);

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id`          INT(10)       NOT NULL AUTO_INCREMENT,
  `date`        DATE          NOT NULL,
  `description` VARCHAR(240)  NOT NULL,
  `categoryId`  INT(10)       NOT NULL,
  `amount`      DECIMAL(12,2) NOT NULL,
  `userId`      INT(10)       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_date` (`userId`, `date`)
);

-- default login: admin / admin -- change it after first login
INSERT INTO `user_accounts` (`id`, `username`, `password`, `fname`, `lname`, `email`, `user_type`, `status`)
VALUES (1, 'admin', '$2y$10$kswyRZyo68GsafAVFNlMu.WBNVgKfBQhZIsKqEQ5BfHmP4NY.H5P.', 'Admin', 'User',
        'admin@example.com', 'PREMIUM', 'ACTIVE');

INSERT INTO `category` (`category`, `userId`)
VALUES ('Transportation', 1), ('Groceries', 1), ('Entertainment', 1), ('Bills and Utilities', 1),
  ('Food & Dining', 1), ('Home', 1);
