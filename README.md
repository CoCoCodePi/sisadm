# Sistema de Gestión Empresarial

## Descripción
Sistema de gestión empresarial para la empresa La Perfezione, que permite automatizar y optimizar los procesos de facturación, cuadre de caja, control de inventarios, ventas y cuentas por pagar, con la posibilidad de integrarse con el control bancario.

## Características
1. **Facturación**:
   - Generación y control de facturas electrónicas y manuales.
   - Cálculo automático de impuestos.
   - Registro y auditoría de facturas emitidas.
   - Reportes de facturación.

2. **Cuadre de Caja**:
   - Registro de entradas y salidas de dinero.
   - Conciliación diaria.
   - Reportes de cuadre de caja.

3. **Control de Inventarios**:
   - Registro de productos y servicios.
   - Registro de entradas y salidas de inventario.
   - Alertas de niveles mínimos de stock.
   - Informes de inventario.

4. **Ventas**:
   - Registro y seguimiento de ventas.
   - Control de cuentas por cobrar.
   - Reportes de ventas.

5. **Cuentas por Pagar**:
   - Registro de proveedores y compras.
   - Control de pagos a proveedores.
   - Reportes de cuentas por pagar.

## Instrucciones de Instalación
1. Clonar el repositorio:
   ```sh
   git clone https://github.com/tu-usuario/tu-repositorio.git
   ```
2. Instalar dependencias:
   ```sh
   cd tu-repositorio
   npm install
   ```
3. Configurar las variables de entorno en un archivo `.env`.

4. Iniciar el servidor:
   ```sh
   npm start
   ```

## Endpoints
A continuación se detallan los principales endpoints del sistema:

### Facturación
- **GET** `/api/facturas`
- **POST** `/api/facturas`
- **PUT** `/api/facturas/:id`
- **DELETE** `/api/facturas/:id`

### Cuadre de Caja
- **GET** `/api/cuadre`
- **POST** `/api/cuadre`
- **PUT** `/api/cuadre/:id`
- **DELETE** `/api/cuadre/:id`

### Control de Inventarios
- **GET** `/api/inventario`
- **POST** `/api/inventario`
- **PUT** `/api/inventario/:id`
- **DELETE** `/api/inventario/:id`

### Ventas
- **GET** `/api/ventas`
- **POST** `/api/ventas`
- **PUT** `/api/ventas/:id`
- **DELETE** `/api/ventas/:id`

### Cuentas por Pagar
- **GET** `/api/cuentas`
- **POST** `/api/cuentas`
- **PUT** `/api/cuentas/:id`
- **DELETE** `/api/cuentas/:id`

## Contribuciones
Para contribuir a este proyecto, por favor crea un fork del repositorio y envía un pull request con tus cambios.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT.
