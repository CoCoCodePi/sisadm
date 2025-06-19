Enter password: 
-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: cosmetics_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `accion` varchar(50) NOT NULL COMMENT 'create, update, delete',
  `tabla` varchar(50) NOT NULL,
  `registro_id` int NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `datos_previos` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caja_diaria`
--

DROP TABLE IF EXISTS `caja_diaria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caja_diaria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `hora_apertura` timestamp NOT NULL,
  `hora_cierre` timestamp NULL DEFAULT NULL,
  `monto_inicial` decimal(16,4) NOT NULL,
  `monto_final` decimal(16,4) DEFAULT NULL,
  `estado` enum('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  PRIMARY KEY (`id`),
  UNIQUE KEY `fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caja_diaria`
--

LOCK TABLES `caja_diaria` WRITE;
/*!40000 ALTER TABLE `caja_diaria` DISABLE KEYS */;
/*!40000 ALTER TABLE `caja_diaria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (10,'a'),(9,'aaa'),(12,'aaaaaa'),(5,'c'),(3,'Categora Demo'),(4,'Cremas'),(1,'Cuidado Facial'),(6,'d'),(7,'Desodorante'),(11,'sa'),(8,'Talco');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_documento_id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `direccion` text,
  `vendedor_id` int DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `documento` varchar(20) NOT NULL,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_documento` (`tipo_documento_id`,`documento`),
  KEY `vendedor_id` (`vendedor_id`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_tipo_documento` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipo_documentos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,1,'Cliente de Prueba0000','cliente@prueba.com000','12345678900','Calle Falsa 1230000',3,'2025-03-18 18:22:04','3243447','2025-03-26 21:36:49'),(3,2,'Cliente Venezolano','cliente.ven@prueba.com','12345678900','Calle Venezolana 123',3,'2025-03-18 18:25:08','12345678','2025-03-26 21:23:35'),(4,3,'Cliente Extranjero','cliente.ext@prueba.com','12345678900','Calle Extranjera 123',3,'2025-03-18 18:25:14','12345678','2025-03-26 21:24:41'),(8,3,'Cliente Extranjero','extranjero@cliente.com','12345098760','Calle Extranjera 789',3,'2025-03-18 18:45:25','87654321','2025-03-26 21:24:49'),(11,1,'Cliente Jurídico','juridico@cliente.com','12345257890','Calle Jurídica 183',3,'2025-03-24 18:15:48','323456789','2025-03-26 21:24:25'),(12,2,'REYD HARTH','reydarias3894@gmail.com','04124512729','1era transversal Santa Eduvigis\nLos Palos Grandes Miranda',3,'2025-03-26 17:41:26','27571375','2025-03-26 17:41:26'),(13,2,'REYD HARTH','reydarias43894@gmail.com','04124412729','1era transversal Santa Eduvigis\nLos Palos Grandes Miranda',3,'2025-03-26 21:36:27','27574375','2025-03-26 21:36:27'),(14,2,'Jesus Arias Reyd','sdsdsdsd@sdsdsds','11111111111','Sant Aristarku, periwinkle courts FL 6',NULL,'2025-06-17 16:34:20','27571377','2025-06-17 16:34:20'),(15,2,'TEST TES TES ','reydarias3ssdsds894@gmail.com','04124512727','1era transversal Santa Eduvigis\nLos Palos Grandes Miranda',NULL,'2025-06-17 16:35:27','3243447','2025-06-17 16:35:27');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comisiones`
--

DROP TABLE IF EXISTS `comisiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comisiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `monto` decimal(16,4) NOT NULL,
  `porcentaje` decimal(5,2) NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `comisiones_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`),
  CONSTRAINT `comisiones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comisiones`
--

LOCK TABLES `comisiones` WRITE;
/*!40000 ALTER TABLE `comisiones` DISABLE KEYS */;
/*!40000 ALTER TABLE `comisiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_orden` varchar(20) NOT NULL,
  `proveedor_id` int NOT NULL,
  `fecha_orden` date NOT NULL,
  `fecha_esperada` date DEFAULT NULL,
  `fecha_recibido` date DEFAULT NULL,
  `total` decimal(16,4) NOT NULL,
  `moneda` enum('USD','VES') NOT NULL,
  `tasa_cambio` decimal(16,8) NOT NULL,
  `estado` enum('pendiente','recibida','parcial','cancelada') DEFAULT 'pendiente',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_orden` (`codigo_orden`),
  KEY `proveedor_id` (`proveedor_id`),
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,'COMP-1750121780582',7,'2025-06-17',NULL,NULL,860.0000,'USD',102.00000000,'recibida','2025-06-17 00:56:20'),(2,'COMP-1750123150830',13,'2025-06-17',NULL,NULL,250.0000,'USD',102.00000000,'recibida','2025-06-17 01:19:10'),(11,'COMP-1750160885205',14,'2025-06-17',NULL,NULL,88.0000,'USD',102.00000000,'cancelada','2025-06-17 11:48:05'),(12,'COMP-1750167041932',13,'2025-06-17',NULL,NULL,50000.0000,'VES',100.00000000,'cancelada','2025-06-17 13:30:41');
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas_por_cobrar`
--

DROP TABLE IF EXISTS `cuentas_por_cobrar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuentas_por_cobrar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `monto_original` decimal(16,4) NOT NULL COMMENT 'Monto total de la venta en USD',
  `monto_pendiente` decimal(16,4) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `estado` enum('pendiente','pagada','vencida','anulada') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `fk_cpc_venta_cliente` (`venta_id`),
  KEY `fk_cpc_cliente` (`cliente_id`),
  CONSTRAINT `fk_cpc_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpc_venta_cliente` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas_por_cobrar`
--

LOCK TABLES `cuentas_por_cobrar` WRITE;
/*!40000 ALTER TABLE `cuentas_por_cobrar` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuentas_por_cobrar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas_por_pagar`
--

DROP TABLE IF EXISTS `cuentas_por_pagar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuentas_por_pagar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `monto_original` decimal(16,4) NOT NULL,
  `monto_pendiente` decimal(16,4) NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `estado` enum('pendiente','pagada','vencida','anulada','abonada') DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  CONSTRAINT `cuentas_por_pagar_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas_por_pagar`
--

LOCK TABLES `cuentas_por_pagar` WRITE;
/*!40000 ALTER TABLE `cuentas_por_pagar` DISABLE KEYS */;
INSERT INTO `cuentas_por_pagar` VALUES (1,1,860.0000,781.5686,'2025-06-17','abonada'),(2,2,250.0000,0.0027,'2025-06-17','pagada'),(3,11,88.0000,88.0000,'2025-06-21','anulada'),(4,12,500.0000,500.0000,'2025-07-16','anulada');
/*!40000 ALTER TABLE `cuentas_por_pagar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compras`
--

DROP TABLE IF EXISTS `detalle_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_compras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `variante_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `costo_unitario` decimal(16,4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  KEY `variante_id` (`variante_id`),
  CONSTRAINT `detalle_compras_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
INSERT INTO `detalle_compras` VALUES (1,1,4,50,6.0000),(2,1,1,80,7.0000),(3,2,11,50,5.0000),(4,11,1,16,5.5000),(5,12,4,100,5.0000);
/*!40000 ALTER TABLE `detalle_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_metodos_pago`
--

DROP TABLE IF EXISTS `detalle_metodos_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_metodos_pago` (
  `pago_id` int NOT NULL,
  `metodo_pago_id` int NOT NULL,
  `monto` decimal(16,4) NOT NULL,
  `moneda` enum('USD','VES') NOT NULL,
  `tasa_cambio` decimal(16,8) NOT NULL,
  PRIMARY KEY (`pago_id`,`metodo_pago_id`),
  KEY `metodo_pago_id` (`metodo_pago_id`),
  CONSTRAINT `detalle_metodos_pago_ibfk_1` FOREIGN KEY (`pago_id`) REFERENCES `pagos` (`id`),
  CONSTRAINT `detalle_metodos_pago_ibfk_2` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_metodos_pago`
--

LOCK TABLES `detalle_metodos_pago` WRITE;
/*!40000 ALTER TABLE `detalle_metodos_pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_metodos_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_pagos_a_proveedores`
--

DROP TABLE IF EXISTS `detalle_pagos_a_proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pagos_a_proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pago_id` int NOT NULL,
  `metodo_pago_id` int NOT NULL,
  `monto` decimal(16,4) NOT NULL,
  `moneda` enum('USD','VES') NOT NULL,
  `tasa_cambio` decimal(16,8) DEFAULT NULL COMMENT 'Tasa usada si el pago fue en VES',
  `referencia` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_pago` (`pago_id`),
  KEY `fk_detalle_metodo` (`metodo_pago_id`),
  CONSTRAINT `fk_detalle_metodo` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago` (`id`),
  CONSTRAINT `fk_detalle_pago` FOREIGN KEY (`pago_id`) REFERENCES `pagos_a_proveedores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_pagos_a_proveedores`
--

LOCK TABLES `detalle_pagos_a_proveedores` WRITE;
/*!40000 ALTER TABLE `detalle_pagos_a_proveedores` DISABLE KEYS */;
INSERT INTO `detalle_pagos_a_proveedores` VALUES (3,3,2,8000.0000,'VES',102.00000000,'986532'),(4,4,4,8000.0000,'VES',110.00000000,'424242'),(5,5,2,177.2700,'USD',NULL,'4747');
/*!40000 ALTER TABLE `detalle_pagos_a_proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_venta`
--

DROP TABLE IF EXISTS `detalles_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalles_venta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `variante_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(16,4) NOT NULL,
  `moneda` enum('USD','VES') NOT NULL,
  `tasa_cambio` decimal(16,8) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `variante_id` (`variante_id`),
  KEY `idx_variante_id` (`variante_id`),
  KEY `idx_detalle_venta_producto` (`venta_id`,`variante_id`),
  CONSTRAINT `detalles_venta_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cantidad_positiva` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_precio_positivo` CHECK ((`precio_unitario` > 0)),
  CONSTRAINT `detalles_venta_chk_1` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_venta`
--

LOCK TABLES `detalles_venta` WRITE;
/*!40000 ALTER TABLE `detalles_venta` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalles_venta` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_total_venta` AFTER INSERT ON `detalles_venta` FOR EACH ROW BEGIN
    UPDATE ventas v
    SET v.total_pendiente = (
        SELECT SUM(dv.precio_unitario * dv.cantidad / dv.tasa_cambio)
        FROM detalles_venta dv
        WHERE dv.venta_id = NEW.venta_id
    )
    WHERE v.id = NEW.venta_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `devoluciones`
--

DROP TABLE IF EXISTS `devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoluciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `variante_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `motivo` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `variante_id` (`variante_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `devoluciones_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`),
  CONSTRAINT `devoluciones_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devoluciones`
--

LOCK TABLES `devoluciones` WRITE;
/*!40000 ALTER TABLE `devoluciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_factura` varchar(20) NOT NULL,
  `venta_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `fecha_emision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total` decimal(16,4) NOT NULL,
  `impuestos` decimal(16,4) NOT NULL,
  `estado` enum('emitida','pagada','cancelada') DEFAULT 'emitida',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_factura` (`codigo_factura`),
  KEY `venta_id` (`venta_id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`),
  CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_precios`
--

DROP TABLE IF EXISTS `historico_precios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_precios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variante_id` int NOT NULL,
  `precio` decimal(16,4) NOT NULL,
  `moneda` enum('USD','VES') NOT NULL,
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `variante_id` (`variante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_precios`
--

LOCK TABLES `historico_precios` WRITE;
/*!40000 ALTER TABLE `historico_precios` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_precios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_tasas`
--

DROP TABLE IF EXISTS `historico_tasas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_tasas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `tasa_usd` decimal(16,8) NOT NULL,
  `fuente` varchar(50) NOT NULL COMMENT 'BCV, Manual, Sistema',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_tasas`
--

LOCK TABLES `historico_tasas` WRITE;
/*!40000 ALTER TABLE `historico_tasas` DISABLE KEYS */;
INSERT INTO `historico_tasas` VALUES (2,'2025-06-17 00:00:00',102.15700000,'Manual');
/*!40000 ALTER TABLE `historico_tasas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineas_producto`
--

DROP TABLE IF EXISTS `lineas_producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lineas_producto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marca_id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_marca_nombre` (`marca_id`,`nombre`),
  CONSTRAINT `fk_linea_marca` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineas_producto`
--

LOCK TABLES `lineas_producto` WRITE;
/*!40000 ALTER TABLE `lineas_producto` DISABLE KEYS */;
INSERT INTO `lineas_producto` VALUES (10,1,'ggg'),(7,15,'Antitraspirantes'),(9,15,'ggg'),(11,15,'sdsdsd'),(8,16,'Sin Línea'),(12,17,'Pies limpios'),(13,18,'aaa'),(14,19,'aaaaaaaaaa');
/*!40000 ALTER TABLE `lineas_producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes`
--

DROP TABLE IF EXISTS `lotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_lote` varchar(50) NOT NULL,
  `proveedor_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `proveedor_id` (`proveedor_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `lotes_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `lotes_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes`
--

LOCK TABLES `lotes` WRITE;
/*!40000 ALTER TABLE `lotes` DISABLE KEYS */;
INSERT INTO `lotes` VALUES (1,'124578',7,22,NULL),(2,'986532',7,21,NULL),(3,'250',13,25,NULL),(4,'85858',14,21,NULL),(5,'852369',13,22,NULL);
/*!40000 ALTER TABLE `lotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes_inventario`
--

DROP TABLE IF EXISTS `lotes_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lote_id` int NOT NULL,
  `variante_id` int NOT NULL,
  `cantidad` int NOT NULL DEFAULT '0',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `minimo` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`),
  KEY `lote_id` (`lote_id`),
  KEY `variante_id` (`variante_id`),
  CONSTRAINT `lotes_inventario_ibfk_1` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`),
  CONSTRAINT `lotes_inventario_ibfk_2` FOREIGN KEY (`variante_id`) REFERENCES `variantes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes_inventario`
--

LOCK TABLES `lotes_inventario` WRITE;
/*!40000 ALTER TABLE `lotes_inventario` DISABLE KEYS */;
INSERT INTO `lotes_inventario` VALUES (1,1,4,50,'2025-06-17 00:56:20',5),(2,2,1,80,'2025-06-17 00:56:20',5),(3,3,11,50,'2025-06-17 01:19:10',5),(4,4,1,16,'2025-06-17 11:48:05',5),(5,5,4,100,'2025-06-17 13:30:41',5);
/*!40000 ALTER TABLE `lotes_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marca_banners`
--

DROP TABLE IF EXISTS `marca_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marca_banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marca_id` int NOT NULL,
  `tipo` enum('principal','secundario','promocional') DEFAULT 'principal',
  `url_imagen` varchar(512) NOT NULL,
  `orden` int DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `marca_id` (`marca_id`),
  CONSTRAINT `marca_banners_ibfk_1` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marca_banners`
--

LOCK TABLES `marca_banners` WRITE;
/*!40000 ALTER TABLE `marca_banners` DISABLE KEYS */;
/*!40000 ALTER TABLE `marca_banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marcas`
--

DROP TABLE IF EXISTS `marcas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `logo_url` varchar(512) NOT NULL,
  `banner_type` enum('static','gif') DEFAULT 'static',
  `banner_url` varchar(512) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marcas`
--

LOCK TABLES `marcas` WRITE;
/*!40000 ALTER TABLE `marcas` DISABLE KEYS */;
INSERT INTO `marcas` VALUES (1,'L\'Oral Paris','https://example.com/logos/loreal.png','static','https://example.com/banners/loreal-banner.jpg','2025-04-15 22:26:18','2025-04-15 22:26:18'),(2,'Maybelline New York','https://example.com/logos/maybelline.png','gif','https://example.com/banners/maybelline-banner.gif','2025-04-15 22:26:18','2025-04-15 22:26:18'),(3,'Nyx Professional Makeup','https://example.com/logos/nyx.png','static','https://example.com/banners/nyx-banner.jpg','2025-04-15 22:26:18','2025-04-15 22:26:18'),(4,'MAC Cosmetics','https://example.com/logos/mac.png','static','https://example.com/banners/mac-banner.jpg','2025-04-15 22:26:18','2025-04-15 22:26:18'),(5,'Revlon','https://example.com/logos/revlon.png','gif','https://example.com/banners/revlon-banner.gif','2025-04-15 22:26:18','2025-04-15 22:26:18'),(15,'Dioxogen','','static',NULL,'2025-06-16 10:04:39','2025-06-16 10:04:39'),(16,'Sin Marca','','static',NULL,'2025-06-16 10:13:44','2025-06-16 10:13:44'),(17,'Talcosi o si','','static',NULL,'2025-06-16 10:47:35','2025-06-16 10:47:35'),(18,'aaa','','static',NULL,'2025-06-16 17:44:22','2025-06-16 17:44:22'),(19,'aaaaaaaaaa','','static',NULL,'2025-06-16 17:46:08','2025-06-16 17:46:08');
/*!40000 ALTER TABLE `marcas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metodos_pago`
--

DROP TABLE IF EXISTS `metodos_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metodos_pago` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `habilitado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metodos_pago`
--

LOCK TABLES `metodos_pago` WRITE;
/*!40000 ALTER TABLE `metodos_pago` DISABLE KEYS */;
INSERT INTO `metodos_pago` VALUES (1,'Efectivo',1),(2,'Transferencia',1),(3,'Tarjeta de Credito',1),(4,'Pago Movil',1);
/*!40000 ALTER TABLE `metodos_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_caja`
--

DROP TABLE IF EXISTS `movimientos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `concepto` varchar(255) NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `monto` decimal(16,4) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia','mixto') NOT NULL,
  `referencia` varchar(255) DEFAULT NULL,
  `caja_diaria_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_movimientos_caja_caja_diaria` (`caja_diaria_id`),
  CONSTRAINT `fk_movimientos_caja_caja_diaria` FOREIGN KEY (`caja_diaria_id`) REFERENCES `caja_diaria` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_caja`
--

LOCK TABLES `movimientos_caja` WRITE;
/*!40000 ALTER TABLE `movimientos_caja` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variante_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `tipo` enum('entrada','salida','ajuste') DEFAULT NULL,
  `canal_afectado` enum('fisico','online') DEFAULT NULL,
  `canal` enum('fisico','online') DEFAULT NULL,
  `motivo` varchar(255) NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `variante_id` (`variante_id`),
  KEY `idx_movimientos_tipo` (`tipo`,`canal`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Registra el canal que origin el movimiento';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,4,50,'entrada',NULL,NULL,'Compra #1',NULL,'2025-06-17 00:56:20'),(2,1,80,'entrada',NULL,NULL,'Compra #1',NULL,'2025-06-17 00:56:20'),(3,11,50,'entrada',NULL,NULL,'Compra #2',NULL,'2025-06-17 01:19:10'),(4,1,16,'entrada',NULL,NULL,'Compra #11',NULL,'2025-06-17 11:48:05'),(5,4,100,'entrada',NULL,NULL,'Compra #12',NULL,'2025-06-17 13:30:41');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notas_credito`
--

DROP TABLE IF EXISTS `notas_credito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notas_credito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `monto` decimal(16,4) NOT NULL,
  `motivo` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int NOT NULL,
  `devolucion_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `devolucion_id` (`devolucion_id`),
  CONSTRAINT `notas_credito_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`),
  CONSTRAINT `notas_credito_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `notas_credito_ibfk_3` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notas_credito`
--

LOCK TABLES `notas_credito` WRITE;
/*!40000 ALTER TABLE `notas_credito` DISABLE KEYS */;
/*!40000 ALTER TABLE `notas_credito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `moneda_base` enum('USD','VES') NOT NULL DEFAULT 'USD',
  `tasa_base` decimal(16,8) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_a_proveedores`
--

DROP TABLE IF EXISTS `pagos_a_proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_a_proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cuenta_por_pagar_id` int NOT NULL,
  `fecha_pago` date NOT NULL,
  `monto_total_pagado` decimal(16,4) NOT NULL COMMENT 'Suma total del pago en USD',
  `observacion` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pago_cuenta` (`cuenta_por_pagar_id`),
  CONSTRAINT `fk_pago_cuenta` FOREIGN KEY (`cuenta_por_pagar_id`) REFERENCES `cuentas_por_pagar` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_a_proveedores`
--

LOCK TABLES `pagos_a_proveedores` WRITE;
/*!40000 ALTER TABLE `pagos_a_proveedores` DISABLE KEYS */;
INSERT INTO `pagos_a_proveedores` VALUES (3,1,'2025-06-17',78.4314,'pago parcial','2025-06-17 12:47:11'),(4,2,'2025-06-17',72.7273,'pago pacial','2025-06-17 12:48:13'),(5,2,'2025-06-17',177.2700,'zelle','2025-06-17 12:52:59');
/*!40000 ALTER TABLE `pagos_a_proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto_categorias`
--

DROP TABLE IF EXISTS `producto_categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_categorias` (
  `producto_id` int NOT NULL,
  `categoria_id` int NOT NULL,
  PRIMARY KEY (`producto_id`,`categoria_id`),
  KEY `idx_producto_categoria` (`categoria_id`),
  KEY `idx_producto_categorias_producto_id` (`producto_id`),
  CONSTRAINT `producto_categorias_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `producto_categorias_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_categorias`
--

LOCK TABLES `producto_categorias` WRITE;
/*!40000 ALTER TABLE `producto_categorias` DISABLE KEYS */;
INSERT INTO `producto_categorias` VALUES (21,3),(21,4),(22,5),(22,6),(25,9);
/*!40000 ALTER TABLE `producto_categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto_imagenes`
--

DROP TABLE IF EXISTS `producto_imagenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_imagenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `url` varchar(512) NOT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_producto_imagenes_producto_id` (`producto_id`),
  CONSTRAINT `fk_p_imagen_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_imagenes`
--

LOCK TABLES `producto_imagenes` WRITE;
/*!40000 ALTER TABLE `producto_imagenes` DISABLE KEYS */;
/*!40000 ALTER TABLE `producto_imagenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto_proveedores`
--

DROP TABLE IF EXISTS `producto_proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_proveedores` (
  `producto_id` int NOT NULL,
  `proveedor_id` int NOT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`producto_id`,`proveedor_id`),
  KEY `proveedor_id` (`proveedor_id`),
  KEY `idx_producto_proveedores_producto_id` (`producto_id`),
  CONSTRAINT `producto_proveedores_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `producto_proveedores_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_proveedores`
--

LOCK TABLES `producto_proveedores` WRITE;
/*!40000 ALTER TABLE `producto_proveedores` DISABLE KEYS */;
/*!40000 ALTER TABLE `producto_proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `marca_id` int DEFAULT NULL,
  `linea_id` int DEFAULT NULL,
  `categoria_principal_id` int DEFAULT NULL,
  `unidad_medida_base` varchar(50) DEFAULT NULL,
  `unidad_medida` enum('mililitros','gramos','piezas','paquetes','unidades') NOT NULL,
  `codigo_barras` varchar(50) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `marca_id` (`marca_id`),
  KEY `fk_producto_linea` (`linea_id`),
  KEY `fk_producto_categoria_principal` (`categoria_principal_id`),
  FULLTEXT KEY `idx_nombre` (`nombre`),
  CONSTRAINT `fk_producto_categoria_principal` FOREIGN KEY (`categoria_principal_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_producto_linea` FOREIGN KEY (`linea_id`) REFERENCES `lineas_producto` (`id`) ON DELETE SET NULL,
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (21,'Desodorante','Desodorante para usudiario evita olores si sis si',15,7,7,'gramos','mililitros',NULL,'2025-06-16 10:04:39','activo'),(22,'Talco','Talco de uso diario si si ',17,12,8,'gramos','mililitros',NULL,'2025-06-16 10:47:35','activo'),(25,'Desodorante','fssdsdsd',15,7,7,'gramos','mililitros',NULL,'2025-06-17 01:19:10','activo');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_delete_producto` BEFORE DELETE ON `productos` FOR EACH ROW BEGIN
  DELETE FROM producto_categorias WHERE producto_id = OLD.id;
  DELETE FROM producto_proveedores WHERE producto_id = OLD.id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `rif` varchar(20) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `direccion` text,
  `contacto_nombre` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `dias_credito` int DEFAULT '30',
  `cuenta_bancaria` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rif` (`rif`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (5,'Martillo1','J275713755','04124512722','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',2,NULL),(7,'Martillo','J852582250','0412451272','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',3,NULL),(8,'Martillo4','J752582255','04124512725','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',3,NULL),(10,'Martillo3','J111111111','99666281000','Sant Aristarku, periwinkle courts FL 6','test','reydarias3894@gmail.com',2,NULL),(11,'Cemento','J-11111133','99666281011','Sant Aristarku, periwinkle courts FL 6','Luis ','reydarias3894@gmail.com',2,NULL),(12,'Martillo2','J11111112','04124512729','1era transversal Santa Eduvigis','sdsdsdsdsd','reydarias3894@gmail.com',1,NULL),(13,'Juan perez','J-285555455',NULL,NULL,NULL,NULL,30,NULL),(14,'REYD HARTH','J-8585858','04124512729','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',5,'0212dsdsdsdsdd4114');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `stock_disponible`
--

DROP TABLE IF EXISTS `stock_disponible`;
mysqldump: Couldn't execute 'SHOW FIELDS FROM `stock_disponible`': View 'cosmetics_db.stock_disponible' references invalid table(s) or column(s) or function(s) or definer/invoker of view lack rights to use them (1356)
