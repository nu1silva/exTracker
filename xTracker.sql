-- MySQL dump 10.13  Distrib 5.5.34, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: xTracker
-- ------------------------------------------------------
-- Server version	5.5.33-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `userId` int(10) NOT NULL,
  `status` varchar(15) DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Transportation',1,'ACTIVE'),(4,'Groceries',0,'ACTIVE'),(2,'Entertainment',0,'ACTIVE'),(3,'Bills and Utilities',0,'ACTIVE'),(5,'Documents',2,'ACTIVE'),(6,'Food & Dining',1,'ACTIVE'),(7,'Home',1,'ACTIVE'),(8,'Transportation',2,'ACTIVE'),(9,'tets',1,'ACTIVE');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expenses` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `description` varchar(240) NOT NULL,
  `categoryId` int(10) NOT NULL,
  `amount` double NOT NULL,
  `userId` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`)
) ENGINE=MyISAM AUTO_INCREMENT=41 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (26,'2013-11-22','dsa',3,100,1),(2,'2013-11-21','test1',2,100,0),(3,'2013-11-21','test2',6,321,0),(4,'2013-11-21','test3',4,1000,0),(5,'2013-11-21','sample1',1,10,0),(6,'2013-11-21','sample2',2,13,0),(7,'2013-11-21','sample3',3,33,0),(25,'2013-11-22','tes',1,20,1),(24,'2013-11-21','test3',2,32,1),(23,'2013-11-22','test',1,20,1),(27,'2013-10-16','dda',7,200,1),(28,'2013-11-08','tessssssss',3,150,1),(29,'2013-11-11','tedawdada',4,120,1),(30,'2013-11-23','Ragama-Home',1,100,1),(31,'2013-11-23','Food',6,230,1),(32,'2013-11-24','Susie Breakfast',6,100,1),(33,'2013-12-01','Test1',1,100,1),(34,'2013-12-01','test2',4,200,1),(35,'2013-12-01','test3',2,50,1),(36,'2013-12-01','test4',3,400,1),(37,'2013-12-01','test5',6,250,1),(38,'2013-12-02','sda',2,100,1),(39,'2013-12-07','test',1,105,1),(40,'2013-12-07','Breakfast',6,33,1);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summary_day`
--

DROP TABLE IF EXISTS `summary_day`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `summary_day` (
  `id` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `total` double NOT NULL,
  `userId` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summary_day`
--

LOCK TABLES `summary_day` WRITE;
/*!40000 ALTER TABLE `summary_day` DISABLE KEYS */;
INSERT INTO `summary_day` VALUES ('--_1','0000-00-00',-96,1),('2013-10-16_1','2013-10-16',200,1),('2013-11-08_1','2013-11-08',150,1),('2013-11-11_1','2013-11-11',120,1),('2013-11-21_1','2013-11-21',32,1),('2013-11-22_1','2013-11-22',140,1),('2013-11-23_1','2013-11-23',330,1),('2013-11-24_1','2013-11-24',100,1),('2013-12-01_1','2013-12-01',1000,1),('2013-12-02_1','2013-12-02',100,1),('2013-12-07_1','2013-12-07',138,1);
/*!40000 ALTER TABLE `summary_day` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summary_month`
--

DROP TABLE IF EXISTS `summary_month`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `summary_month` (
  `year` int(10) NOT NULL,
  `month` int(10) NOT NULL,
  `total` double NOT NULL,
  `userId` int(10) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summary_month`
--

LOCK TABLES `summary_month` WRITE;
/*!40000 ALTER TABLE `summary_month` DISABLE KEYS */;
INSERT INTO `summary_month` VALUES (2013,11,872,1),(2013,10,200,1),(2013,1,133,1),(2013,2,1333,1),(2013,3,332,1),(2013,4,552,1),(2013,5,542,1),(2013,12,1238,1);
/*!40000 ALTER TABLE `summary_month` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summary_year`
--

DROP TABLE IF EXISTS `summary_year`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `summary_year` (
  `year` int(10) NOT NULL,
  `total` double NOT NULL,
  `userId` int(10) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summary_year`
--

LOCK TABLES `summary_year` WRITE;
/*!40000 ALTER TABLE `summary_year` DISABLE KEYS */;
INSERT INTO `summary_year` VALUES (2013,2310,1);
/*!40000 ALTER TABLE `summary_year` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_accounts`
--

DROP TABLE IF EXISTS `user_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_accounts` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `username` varchar(15) NOT NULL,
  `password` varchar(200) NOT NULL,
  `fname` varchar(50) NOT NULL,
  `lname` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `user_type` varchar(50) NOT NULL,
  `status` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`,`username`,`email`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_accounts`
--

LOCK TABLES `user_accounts` WRITE;
/*!40000 ALTER TABLE `user_accounts` DISABLE KEYS */;
INSERT INTO `user_accounts` VALUES (1,'admin','21232f297a57a5a743894a0e4a801fc3','Admin','User','nu1silva@gmail.com','PREMIUM','ACTIVE'),(2,'nu1silva','5f4dcc3b5aa765d61d8327deb882cf99','Nuwan','Silva','nuwan@nu1silva.com','PREMIUM','ACTIVE');
/*!40000 ALTER TABLE `user_accounts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2014-05-24  0:57:31
