CREATE DATABASE `xtracker`;
USE `xtracker`;

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`       INT(10)     NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(50) NOT NULL,
  `userId`   INT(10)     NOT NULL,
  `status`   VARCHAR(15)          DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id`          INT(10)      NOT NULL AUTO_INCREMENT,
  `date`        DATE         NOT NULL,
  `description` VARCHAR(240) NOT NULL,
  `categoryId`  INT(10)      NOT NULL,
  `amount`      DOUBLE       NOT NULL,
  `userId`      INT(10)      NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`)
);

DROP TABLE IF EXISTS `summary_day`;
CREATE TABLE `summary_day` (
  `id`     VARCHAR(20) NOT NULL,
  `date`   DATE        NOT NULL,
  `total`  DOUBLE      NOT NULL,
  `userId` INT(10)     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id` (`id`)
);

DROP TABLE IF EXISTS `summary_month`;
CREATE TABLE `summary_month` (
  `year`   INT(10) NOT NULL,
  `month`  INT(10) NOT NULL,
  `total`  DOUBLE  NOT NULL,
  `userId` INT(10) DEFAULT NULL
);

DROP TABLE IF EXISTS `summary_year`;
CREATE TABLE `summary_year` (
  `year`   INT(10) NOT NULL,
  `total`  DOUBLE  NOT NULL,
  `userId` INT(10) DEFAULT NULL
);

DROP TABLE IF EXISTS `user_accounts`;
CREATE TABLE `user_accounts` (
  `id`        INT(10)      NOT NULL AUTO_INCREMENT,
  `username`  VARCHAR(15)  NOT NULL,
  `password`  VARCHAR(200) NOT NULL,
  `fname`     VARCHAR(50)  NOT NULL,
  `lname`     VARCHAR(50)  NOT NULL,
  `email`     VARCHAR(100) NOT NULL,
  `user_type` VARCHAR(50)  NOT NULL,
  `status`    VARCHAR(10)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`, `username`, `email`)
);

INSERT INTO `user_accounts`
VALUES (1, 'admin', '21232f297a57a5a743894a0e4a801fc3', 'Admin', 'User', 'admin@nu1silva.com', 'PREMIUM', 'ACTIVE');

INSERT INTO `category`
VALUES (1, 'Transportation', 1, 'ACTIVE'), (4, 'Groceries', 0, 'ACTIVE'), (2, 'Entertainment', 0, 'ACTIVE'),
  (3, 'Bills and Utilities', 0, 'ACTIVE'), (5, 'Documents', 2, 'ACTIVE'), (6, 'Food & Dining', 1, 'ACTIVE'),
  (7, 'Home', 1, 'ACTIVE'), (8, 'Transportation', 2, 'ACTIVE'), (9, 'tets', 1, 'ACTIVE');
