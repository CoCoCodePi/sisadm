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
mysqldump: Error: 'Access denied; you need (at least one of) the PROCESS privilege(s) for this operation' when trying to dump tablespaces

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (3,'Categora Demo'),(4,'Cremas'),(1,'Cuidado Facial');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,1,'Cliente de Prueba0000','cliente@prueba.com000','12345678900','Calle Falsa 1230000',3,'2025-03-18 18:22:04','3243447','2025-03-26 21:36:49'),(3,2,'Cliente Venezolano','cliente.ven@prueba.com','12345678900','Calle Venezolana 123',3,'2025-03-18 18:25:08','12345678','2025-03-26 21:23:35'),(4,3,'Cliente Extranjero','cliente.ext@prueba.com','12345678900','Calle Extranjera 123',3,'2025-03-18 18:25:14','12345678','2025-03-26 21:24:41'),(8,3,'Cliente Extranjero','extranjero@cliente.com','12345098760','Calle Extranjera 789',3,'2025-03-18 18:45:25','87654321','2025-03-26 21:24:49'),(11,1,'Cliente Jur├¡dico','juridico@cliente.com','12345257890','Calle Jur├¡dica 183',3,'2025-03-24 18:15:48','323456789','2025-03-26 21:24:25'),(12,2,'REYD HARTH','reydarias3894@gmail.com','04124512729','1era transversal Santa Eduvigis\nLos Palos Grandes Miranda',3,'2025-03-26 17:41:26','27571375','2025-03-26 17:41:26'),(13,2,'REYD HARTH','reydarias43894@gmail.com','04124412729','1era transversal Santa Eduvigis\nLos Palos Grandes Miranda',3,'2025-03-26 21:36:27','27574375','2025-03-26 21:36:27');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
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
  `estado` enum('pendiente','pagada','vencida') DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  CONSTRAINT `cuentas_por_pagar_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas_por_pagar`
--

LOCK TABLES `cuentas_por_pagar` WRITE;
/*!40000 ALTER TABLE `cuentas_por_pagar` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_tasas`
--

LOCK TABLES `historico_tasas` WRITE;
/*!40000 ALTER TABLE `historico_tasas` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_tasas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variante_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `minimo` int NOT NULL DEFAULT '5',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventario_variante` (`variante_id`),
  CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`variante_id`) REFERENCES `variantes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario`
--

LOCK TABLES `inventario` WRITE;
/*!40000 ALTER TABLE `inventario` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventario` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes`
--

LOCK TABLES `lotes` WRITE;
/*!40000 ALTER TABLE `lotes` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes_inventario`
--

LOCK TABLES `lotes_inventario` WRITE;
/*!40000 ALTER TABLE `lotes_inventario` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marcas`
--

LOCK TABLES `marcas` WRITE;
/*!40000 ALTER TABLE `marcas` DISABLE KEYS */;
INSERT INTO `marcas` VALUES (1,'L\'Oral Paris','https://example.com/logos/loreal.png','static','https://example.com/banners/loreal-banner.jpg','2025-04-15 22:26:18','2025-04-15 22:26:18'),(2,'Maybelline New York','https://example.com/logos/maybelline.png','gif','https://example.com/banners/maybelline-banner.gif','2025-04-15 22:26:18','2025-04-15 22:26:18'),(3,'Nyx Professional Makeup','https://example.com/logos/nyx.png','static','https://example.com/banners/nyx-banner.jpg','2025-04-15 22:26:18','2025-04-15 22:26:18'),(4,'MAC Cosmetics','https://example.com/logos/mac.png','static','https://example.com/banners/mac-banner.jpg','2025-04-15 22:26:18','2025-04-15 22:26:18'),(5,'Revlon','https://example.com/logos/revlon.png','gif','https://example.com/banners/revlon-banner.gif','2025-04-15 22:26:18','2025-04-15 22:26:18');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Registra el canal que origin el movimiento';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
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
-- Table structure for table `precios`
--

DROP TABLE IF EXISTS `precios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `precios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `precio` decimal(12,2) NOT NULL,
  `tipo` enum('costo','venta1','venta2','venta3') NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `precios_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `precios`
--

LOCK TABLES `precios` WRITE;
/*!40000 ALTER TABLE `precios` DISABLE KEYS */;
/*!40000 ALTER TABLE `precios` ENABLE KEYS */;
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
  CONSTRAINT `producto_categorias_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `producto_categorias_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_categorias`
--

LOCK TABLES `producto_categorias` WRITE;
/*!40000 ALTER TABLE `producto_categorias` DISABLE KEYS */;
/*!40000 ALTER TABLE `producto_categorias` ENABLE KEYS */;
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
  PRIMARY KEY (`producto_id`,`proveedor_id`),
  KEY `proveedor_id` (`proveedor_id`),
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
  `unidad_medida_base` varchar(50) DEFAULT NULL,
  `unidad_medida` enum('mililitros','gramos','piezas','paquetes','unidades') NOT NULL,
  `codigo_barras` varchar(50) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `marca_id` (`marca_id`),
  FULLTEXT KEY `idx_nombre` (`nombre`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
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
  UNIQUE KEY `rif` (`rif`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (5,'Martillo','J275713755','0412451272','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',2,NULL),(7,'Martillo','J852582250','0412451272','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',3,NULL),(8,'Martillo','J752582255','0412451272','1era transversal Santa Eduvigis','test','reydarias3894@gmail.com',3,NULL),(10,'Martillo','J111111111','99666281000','Sant Aristarku, periwinkle courts FL 6','test','reydarias3894@gmail.com',2,NULL),(11,'Cemento','J11111133','99666281011','Sant Aristarku, periwinkle courts FL 6','Luis ','reydarias3894@gmail.com',2,NULL),(12,'Martillo','J11111112','04124512729','1era transversal Santa Eduvigis','sdsdsdsdsd','reydarias3894@gmail.com',1,NULL);
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `stock_disponible`
--

DROP TABLE IF EXISTS `stock_disponible`;
/*!50001 DROP VIEW IF EXISTS `stock_disponible`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `stock_disponible` AS SELECT 
 1 AS `variante_id`,
 1 AS `total`,
 1 AS `minimo`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_documentos`
--

DROP TABLE IF EXISTS `tipo_documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(2) NOT NULL COMMENT 'Ej: J, V, E, P',
  `nombre` varchar(50) NOT NULL COMMENT 'Ej: RIF, Cdula, Pasaporte',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_documentos`
--

LOCK TABLES `tipo_documentos` WRITE;
/*!40000 ALTER TABLE `tipo_documentos` DISABLE KEYS */;
INSERT INTO `tipo_documentos` VALUES (1,'J','RIF Jurdico'),(2,'V','Cedula Venezolana'),(3,'E','Cedula Extranjera'),(4,'P','Pasaporte');
/*!40000 ALTER TABLE `tipo_documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidades_medida`
--

DROP TABLE IF EXISTS `unidades_medida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_medida` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `simbolo` varchar(10) NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades_medida`
--

LOCK TABLES `unidades_medida` WRITE;
/*!40000 ALTER TABLE `unidades_medida` DISABLE KEYS */;
INSERT INTO `unidades_medida` VALUES (1,'mililitros','ml','2025-04-15 22:19:11'),(2,'litros','L','2025-04-15 22:19:11'),(3,'gramos','g','2025-04-15 22:19:11'),(4,'kilogramos','kg','2025-04-15 22:19:11'),(5,'unidades','ud','2025-04-15 22:19:11'),(6,'paquetes','pqt','2025-04-15 22:19:11');
/*!40000 ALTER TABLE `unidades_medida` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','operador','vendedor','maestro') NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (3,'maestro@empresa.com','$2a$12$9HcY77z9GdHi5q6U1uNjB.VOGdlJXqT7nzLf18fNZQiICnV1si6Yu','maestro','master',NULL),(4,'maestro2@empresa.com','$2b$10$LDqWBG3ttGnWOf6iVXVHiuW3pAVHrz64LejN2FnrixQFObaJ7k6ge','vendedor','coco',NULL),(6,'maestro3@empresa.com','$2b$10$pN/NVUPUYdQ7VqCiHVzR0e3FNEnoOLegMN8bXPUHvhEA7KFsUNGuy','admin','CoCoPlay #123',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variante_codigos_barras`
--

DROP TABLE IF EXISTS `variante_codigos_barras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variante_codigos_barras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variante_id` int NOT NULL,
  `codigo_barras` varchar(50) NOT NULL,
  `es_generado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `variante_id` (`variante_id`),
  CONSTRAINT `variante_codigos_barras_ibfk_1` FOREIGN KEY (`variante_id`) REFERENCES `variantes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variante_codigos_barras`
--

LOCK TABLES `variante_codigos_barras` WRITE;
/*!40000 ALTER TABLE `variante_codigos_barras` DISABLE KEYS */;
/*!40000 ALTER TABLE `variante_codigos_barras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variantes`
--

DROP TABLE IF EXISTS `variantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `codigo_barras` varchar(50) NOT NULL,
  `atributos` json NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `unidad_medida` varchar(50) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `variantes_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variantes`
--

LOCK TABLES `variantes` WRITE;
/*!40000 ALTER TABLE `variantes` DISABLE KEYS */;
/*!40000 ALTER TABLE `variantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_venta` varchar(20) NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `total_pendiente` decimal(16,4) NOT NULL DEFAULT '0.0000',
  `moneda` enum('USD','VES') NOT NULL,
  `tasa_cambio` decimal(16,8) NOT NULL,
  `tasa_cambio_real` decimal(16,8) NOT NULL,
  `canal` enum('fisico','online') NOT NULL,
  `estado` enum('pendiente','completada','cancelada') DEFAULT 'pendiente',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_venta` (`codigo_venta`),
  KEY `cliente_id` (`cliente_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_cliente_estado` (`cliente_id`,`estado`),
  KEY `idx_ventas_canal` (`canal`),
  KEY `idx_ventas_fecha_cliente` (`creado_en`,`cliente_id`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `ventas_totales`
--

DROP TABLE IF EXISTS `ventas_totales`;
/*!50001 DROP VIEW IF EXISTS `ventas_totales`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `ventas_totales` AS SELECT 
 1 AS `id`,
 1 AS `codigo_venta`,
 1 AS `total_base`,
 1 AS `total_usd`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_inventario_activo`
--

DROP TABLE IF EXISTS `vista_inventario_activo`;
/*!50001 DROP VIEW IF EXISTS `vista_inventario_activo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_inventario_activo` AS SELECT 
 1 AS `producto`,
 1 AS `atributos`,
 1 AS `cantidad`,
 1 AS `lote`,
 1 AS `fecha_vencimiento`,
 1 AS `proveedor`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_inventario_completo`
--

DROP TABLE IF EXISTS `vista_inventario_completo`;
/*!50001 DROP VIEW IF EXISTS `vista_inventario_completo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_inventario_completo` AS SELECT 
 1 AS `producto`,
 1 AS `atributos`,
 1 AS `codigo_barras`,
 1 AS `cantidad`,
 1 AS `minimo`,
 1 AS `lote`,
 1 AS `fecha_vencimiento`,
 1 AS `proveedor`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_inventario_detallado`
--

DROP TABLE IF EXISTS `vista_inventario_detallado`;
/*!50001 DROP VIEW IF EXISTS `vista_inventario_detallado`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_inventario_detallado` AS SELECT 
 1 AS `producto`,
 1 AS `codigo_barras`,
 1 AS `atributos`,
 1 AS `cantidad`,
 1 AS `minimo`,
 1 AS `categorias`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `stock_disponible`
--

/*!50001 DROP VIEW IF EXISTS `stock_disponible`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `stock_disponible` AS select `v`.`id` AS `variante_id`,`i`.`cantidad` AS `total`,`i`.`minimo` AS `minimo` from (`variantes` `v` left join `inventario` `i` on((`v`.`id` = `i`.`variante_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `ventas_totales`
--

/*!50001 DROP VIEW IF EXISTS `ventas_totales`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `ventas_totales` AS select `v`.`id` AS `id`,`v`.`codigo_venta` AS `codigo_venta`,sum((`dv`.`precio_unitario` * `dv`.`cantidad`)) AS `total_base`,sum(((`dv`.`precio_unitario` * `dv`.`cantidad`) / `dv`.`tasa_cambio`)) AS `total_usd` from (`ventas` `v` join `detalles_venta` `dv` on((`v`.`id` = `dv`.`venta_id`))) group by `v`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_inventario_activo`
--

/*!50001 DROP VIEW IF EXISTS `vista_inventario_activo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_inventario_activo` AS select `p`.`nombre` AS `producto`,`v`.`atributos` AS `atributos`,`li`.`cantidad` AS `cantidad`,`l`.`numero_lote` AS `lote`,`l`.`fecha_vencimiento` AS `fecha_vencimiento`,`pr`.`nombre` AS `proveedor` from ((((`lotes_inventario` `li` join `lotes` `l` on((`li`.`lote_id` = `l`.`id`))) join `variantes` `v` on((`li`.`variante_id` = `v`.`id`))) join `productos` `p` on((`v`.`producto_id` = `p`.`id`))) join `proveedores` `pr` on((`l`.`proveedor_id` = `pr`.`id`))) where (`li`.`cantidad` > 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_inventario_completo`
--

/*!50001 DROP VIEW IF EXISTS `vista_inventario_completo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_inventario_completo` AS select `p`.`nombre` AS `producto`,`v`.`atributos` AS `atributos`,`vc`.`codigo_barras` AS `codigo_barras`,`li`.`cantidad` AS `cantidad`,`li`.`minimo` AS `minimo`,`l`.`numero_lote` AS `lote`,`l`.`fecha_vencimiento` AS `fecha_vencimiento`,`pr`.`nombre` AS `proveedor` from (((((`lotes_inventario` `li` join `lotes` `l` on((`li`.`lote_id` = `l`.`id`))) join `variantes` `v` on((`li`.`variante_id` = `v`.`id`))) join `productos` `p` on((`v`.`producto_id` = `p`.`id`))) left join `variante_codigos_barras` `vc` on((`v`.`id` = `vc`.`variante_id`))) join `proveedores` `pr` on((`l`.`proveedor_id` = `pr`.`id`))) where (`li`.`cantidad` > 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_inventario_detallado`
--

/*!50001 DROP VIEW IF EXISTS `vista_inventario_detallado`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_inventario_detallado` AS select `p`.`nombre` AS `producto`,`v`.`codigo_barras` AS `codigo_barras`,`v`.`atributos` AS `atributos`,`i`.`cantidad` AS `cantidad`,`i`.`minimo` AS `minimo`,group_concat(`c`.`nombre` separator ',') AS `categorias` from ((((`inventario` `i` join `variantes` `v` on((`i`.`variante_id` = `v`.`id`))) join `productos` `p` on((`v`.`producto_id` = `p`.`id`))) left join `producto_categorias` `pc` on((`p`.`id` = `pc`.`producto_id`))) left join `categorias` `c` on((`pc`.`categoria_id` = `c`.`id`))) group by `i`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-16  1:15:12
