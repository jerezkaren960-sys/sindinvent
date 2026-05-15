CREATE DATABASE  IF NOT EXISTS `sindinvent` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sindinvent`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: sindinvent
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `control_inventario`
--

DROP TABLE IF EXISTS `control_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `control_inventario` (
  `codigo_inventario` varchar(50) NOT NULL,
  `responsable_id` varchar(10) NOT NULL,
  `fecha_asignada` date NOT NULL,
  `fecha_devolucion` date DEFAULT NULL,
  `estado_equipo` enum('Asignado','Devuelto','En mantenimiento') DEFAULT 'Asignado',
  `observaciones` text,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`codigo_inventario`),
  UNIQUE KEY `responsable_id_UNIQUE` (`responsable_id`),
  CONSTRAINT `control_inventario_ibfk_1` FOREIGN KEY (`codigo_inventario`) REFERENCES `equipos_informaticos` (`codigo_inventario`) ON DELETE CASCADE,
  CONSTRAINT `control_inventario_ibfk_2` FOREIGN KEY (`responsable_id`) REFERENCES `responsables` (`cedula`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `control_inventario`
--

LOCK TABLES `control_inventario` WRITE;
/*!40000 ALTER TABLE `control_inventario` DISABLE KEYS */;
INSERT INTO `control_inventario` VALUES ('Eq-001','1802201697','2026-04-03','2026-04-02','Asignado','equipo asignado','2026-04-20 23:18:28'),('Eq-002','1803977451','2026-04-02','2026-04-19','Asignado','Equipo asignado','2026-04-21 01:31:02'),('Eq-003','1803191160','2026-04-07','2026-04-16','Asignado','Equipo asignado','2026-04-28 14:40:01'),('Eq-004','1804140604','2026-05-01','2026-05-02','Asignado','Equipo asignado','2026-05-07 12:40:04'),('Eq-005','1850533165','2026-04-04','2026-04-10','Asignado','equipo asignado ','2026-04-20 23:51:52'),('Eq-006','1805764238','2026-04-02','2026-04-09','Asignado','Equpo asignado ','2026-04-23 13:01:38'),('Eq-007','1850792092','2026-04-29','2026-05-06','Asignado','Equipo asignado','2026-05-11 01:55:59');
/*!40000 ALTER TABLE `control_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipos_informaticos`
--

DROP TABLE IF EXISTS `equipos_informaticos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos_informaticos` (
  `codigo_inventario` varchar(50) NOT NULL,
  `tipo_inventario` varchar(80) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `estado` enum('Disponible','Asignado','En mantenimiento','Baja') DEFAULT 'Disponible',
  `valor` decimal(12,2) DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`codigo_inventario`),
  UNIQUE KEY `codigo_inventario` (`codigo_inventario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipos_informaticos`
--

LOCK TABLES `equipos_informaticos` WRITE;
/*!40000 ALTER TABLE `equipos_informaticos` DISABLE KEYS */;
INSERT INTO `equipos_informaticos` VALUES ('Eq-001','Monitor','HP','2322','12433','Disponible',345.00,'2026-04-16 04:56:48'),('Eq-002','Monitor','HP','2353','12433','Disponible',456.00,'2026-04-16 12:25:02'),('Eq-003','Impresora','Epson','2454','12344','Disponible',750.00,'2026-04-16 12:59:31'),('Eq-004','Impresora','Epson','29889','1266','Disponible',876.00,'2026-04-20 22:28:06'),('Eq-005','Laptop','Asus','24334','2355','Disponible',1200.00,'2026-04-20 23:51:24'),('Eq-006','Teclado','HP','243','23454','Disponible',24.00,'2026-04-23 13:00:45'),('Eq-007','Laptop','Lenovo','1213','232432','Disponible',1200.00,'2026-04-28 14:36:28');
/*!40000 ALTER TABLE `equipos_informaticos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responsables`
--

DROP TABLE IF EXISTS `responsables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsables` (
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `cedula` varchar(10) NOT NULL,
  `area` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cedula`),
  UNIQUE KEY `cedula_UNIQUE` (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responsables`
--

LOCK TABLES `responsables` WRITE;
/*!40000 ALTER TABLE `responsables` DISABLE KEYS */;
INSERT INTO `responsables` VALUES ('Natasha Bayas','0998912204','1802201697','Laboratorio 2',1,'2026-04-16 12:24:21'),('Pablo Sebastián Muzo Uriarte','0998912204','1803191160','Laboratorio 1',1,'2026-04-16 12:20:11'),('Carolina Maribel Ango Guaman','0962098040','1803977451','Administración',1,'2026-04-16 05:32:54'),('Juan Francisco Yancha Tipantasig','0962098040','1804140604','Laboratorio 3',1,'2026-04-20 22:27:32'),('Camila Nahomi Villafuerte Becerra','0982386959','1805238092','Laboratorio 2',1,'2026-04-16 12:58:54'),('Alexis Solis','0999318827','1805764238','Laboratorio 2',1,'2026-04-23 13:00:15'),('Dana Maite Tisalema Ango ','0996964842','1850533165','Taller Mecánico',1,'2026-04-16 04:56:02'),('Analy Brigitte Ango Guaman','0998869988','1850792092','Administración',1,'2026-04-20 23:50:43'),('Lady Tatiana Tuza Allauca ','0999847113','1850952688','Taller Mecánico',1,'2026-04-16 12:15:17');
/*!40000 ALTER TABLE `responsables` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-12  9:01:41
