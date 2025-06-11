Plan Detallado para el Backend - E-commerce Mayorista de Artículos Escolares
FASE 1: FUNDAMENTOS (Crítico - 1-2 días)
Paso 1.1: Configuración Inicial del Proyecto (Como ya lo hicimos)
npm init -y, instalar dependencias (express, mongoose, dotenv, bcryptjs, jsonwebtoken, cors, morgan, etc.).
Estructura de carpetas (config, controllers, middlewares, models, routes, utils).
Paso 1.2: Archivos Base y Conexión (Como ya lo hicimos)
server.js, .env (con MONGO_URI de Atlas), config/db.js.
utils/asyncHandler.js: Wrapper para manejo de errores en funciones async.
middlewares/errorHandler.js: Middleware centralizado para manejo de errores.
Paso 1.3: Definición de Modelos de Datos Clave (Mongoose Schemas)
models/User.js:
Campos: nombre, apellido, email, password, rol (enum: ['cliente', 'mayorista', 'admin']), razonSocial (opcional), cuit (opcional), direccionesEnvio (Array de subdocumentos o ref), telefono (opcional), aprobadoMayorista (Boolean, default: false), activo (Boolean, default: true).
Métodos: matchPassword. Hooks: pre('save') para hashear password.
models/Product.js:
Campos: nombre, descripcion, sku (único), marca, categoria_id (ref: 'Category'), subcategoria_id (ref: 'Category', opcional), precioBase, preciosMayorista (Array: {cantidadMinima, precio}), stock, imagenes (Array de Strings), destacado, activo, unidadVenta, peso, dimensiones.
models/Category.js:
Campos: nombre, slug (único), descripcion (opcional), imagen (opcional), parent_id (ref: 'Category', para subcategorías), activa.
models/Order.js: (Lo definiremos más adelante, pero tenerlo en mente)
models/Cart.js: (Considerar si se persiste en BD o solo en sesión/localStorage inicialmente)
Validaciones, relaciones, timestamps en todos los modelos.
Paso 1.4: Testing Básico de Conexión y Servidor
Verificar conexión a MongoDB Atlas.
Asegurar que el servidor Express arranque.
Ruta GET /api funcional.
FASE 2: FUNCIONALIDADES CORE DE E-COMMERCE (Esencial - 3-4 días)
Paso 2.1: Autenticación y Gestión de Usuarios
controllers/authController.js, routes/authRoutes.js:
Registro (POST /api/auth/registrar): Para clientes. Administradores pueden crear otros roles o promover.
Login (POST /api/auth/login): Generar JWT con userId y rol.
Obtener Perfil (GET /api/usuarios/perfil): Usuario autenticado.
Actualizar Perfil (PUT /api/usuarios/perfil): Usuario autenticado.
(Opcional) Solicitud de cuenta mayorista y aprobación por admin.
middlewares/authMiddleware.js: protegerRuta, autorizarRoles.
Paso 2.2: CRUD Completo de Productos (Panel Admin)
controllers/productController.js, routes/productRoutes.js:
Crear Producto (POST /api/productos - Admin).
Obtener Todos los Productos (GET /api/productos - Público, con filtros y paginación).
Filtros: por categoría, subcategoría, marca, rango de precios, destacados.
Búsqueda: por nombre, SKU, descripción.
Ordenamiento: por precio, nombre, más nuevos.
Obtener Producto por ID/Slug (GET /api/productos/:id - Público).
Actualizar Producto (PUT /api/productos/:id - Admin).
Eliminar Producto (DELETE /api/productos/:id - Admin).
Manejo de imágenes (subida a Cloudinary/S3 o similar, guardar URLs).
Paso 2.3: CRUD de Categorías (Panel Admin)
controllers/categoryController.js, routes/categoryRoutes.js:
Crear Categoría (POST /api/categorias - Admin).
Obtener Todas las Categorías (GET /api/categorias - Público, anidadas si hay subcategorías).
Obtener Categoría por ID/Slug (GET /api/categorias/:id - Público).
Actualizar Categoría (PUT /api/categorias/:id - Admin).
Eliminar Categoría (DELETE /api/categorias/:id - Admin).
FASE 3: SISTEMA DE CARRITO Y PROCESAMIENTO DE ÓRDENES (Crítico - 3-5 días)
Paso 3.1: Funcionalidad del Carrito de Compras
controllers/cartController.js, routes/cartRoutes.js:
Obtener Carrito (GET /api/carrito - Usuario autenticado).
Añadir Item al Carrito (POST /api/carrito/items - Usuario autenticado): productId, cantidad.
Validar stock.
Aplicar precio mayorista si corresponde según rol y cantidad.
Actualizar Cantidad de Item (PUT /api/carrito/items/:itemId - Usuario autenticado).
Eliminar Item del Carrito (DELETE /api/carrito/items/:itemId - Usuario autenticado).
Vaciar Carrito (DELETE /api/carrito - Usuario autenticado).
models/Cart.js (si se persiste en BD): usuario_id, items (Array: {producto_id, nombre, cantidad, precioUnitario, imagen}).
Cálculo de subtotal, impuestos (si aplica), total.
Paso 3.2: Flujo Completo de Pedidos (Órdenes)
models/Order.js:
Campos: usuario_id, itemsPedido (Array: copia de items del carrito), direccionEnvio (copia de la dirección), metodoPago, resultadoPago (info de pasarela), precioItems, precioEnvio, precioImpuestos, precioTotal, estadoPedido (enum: ['pendiente_pago', 'procesando', 'enviado', 'entregado', 'cancelado']), pagadoEn, entregadoEn.
controllers/orderController.js, routes/orderRoutes.js:
Crear Orden (POST /api/ordenes - Usuario autenticado): Desde el carrito.
Validar stock al momento de crear la orden.
Reducir stock de productos.
Vaciar carrito del usuario.
Obtener Orden por ID (GET /api/ordenes/:id - Usuario autenticado dueño o Admin).
Obtener Mis Órdenes (GET /api/ordenes/mis-ordenes - Usuario autenticado).
Actualizar Orden a Pagada (PUT /api/ordenes/:id/pagar - Después de confirmación de pago).
Actualizar Orden a Enviada/Entregada (PUT /api/ordenes/:id/estado - Admin).
Paso 3.3: Integración de Pagos Básica
Elegir pasarela (Mercado Pago es común en AR).
Endpoint para crear preferencia de pago (POST /api/pagos/crear-preferencia - devuelve URL de pago).
Webhook para recibir notificaciones de Mercado Pago (POST /api/pagos/webhook).
Validar notificación.
Actualizar estado de la orden a pagada.
Enviar email de confirmación de pago.
FASE 4: GESTIÓN DE INVENTARIO Y PRECIOS (Importante - 2-3 días)
Paso 4.1: Sistema de Inventario
Actualización automática de stock al crear orden y al cancelar/devolver (si se implementa).
Endpoints para que el Admin actualice stock manualmente (PUT /api/productos/:id/stock).
(Opcional) Alertas de stock bajo para el Admin.
Paso 4.2: Lógica de Precios Diferenciados
Asegurar que al obtener productos y al añadir al carrito, se aplique el precioBase para 'cliente' y los preciosMayorista (según cantidad) para rol 'mayorista' (aprobado).
(Opcional) Implementar cupones de descuento.
models/Coupon.js: codigo, tipoDescuento (fijo o porcentaje), valor, fechaExpiracion, usosMaximos, usosActuales.
Endpoints para aplicar/validar cupón en el carrito.
FASE 5: COMUNICACIONES Y NOTIFICACIONES (Importante - 1-2 días)
Paso 5.1: Sistema de Emails (Nodemailer)
Configurar servicio de email.
Templates: Bienvenida, Confirmación de Pedido, Confirmación de Pago, Pedido Enviado, Recuperación de Contraseña.
Notificaciones a administradores (ej. nueva orden, stock bajo).
Paso 5.2: Sistema de Notificaciones (Opcional para MVP)
Notificaciones internas en el panel de admin.
Log de actividades importantes.
FASE 6: PANEL DE ADMINISTRACIÓN (Endpoints para Frontend Admin) (Importante - 2-3 días)
Paso 6.1: Gestión Completa desde el Panel
CRUD de Productos (ya cubierto).
CRUD de Categorías (ya cubierto).
Gestión de Usuarios (GET /api/usuarios - Admin, PUT /api/usuarios/:id/rol - Admin, PUT /api/usuarios/:id/aprobar-mayorista - Admin).
Gestión de Órdenes (GET /api/ordenes - Admin, con filtros por estado, fecha, usuario; PUT /api/ordenes/:id/estado - Admin para cambiar estado a enviado, entregado, cancelado).
Paso 6.2: Dashboard y Reportes Básicos (Endpoints)
GET /api/admin/stats: Ventas totales, número de órdenes, nuevos clientes, etc.
GET /api/admin/reportes/ventas-por-periodo
GET /api/admin/reportes/productos-mas-vendidos
GET /api/admin/reportes/stock-critico
FASE 7: VALIDACIONES ROBUSTAS Y SEGURIDAD (Crítico - Continuo, pero enfocar 1-2 días)
Paso 7.1: Validaciones de Entrada
Usar express-validator para todas las rutas que reciben datos.
Sanitización de datos (prevenir XSS).
Validaciones de negocio (ej. precios no negativos, stock no negativo, CUIT válido si se requiere).
Paso 7.2: Seguridad General
helmet para headers de seguridad.
express-rate-limit para prevenir fuerza bruta.
CORS configurado correctamente.
Revisión de lógica de autorización (roles).
Protección contra inyecciones NoSQL (Mongoose ayuda, pero la sanitización es buena práctica).
FASE 8: INTEGRACIONES EXTERNAS (Opcional / Post-MVP - 2-3 días)
Paso 8.1: Cálculo de Envíos (Si no es precio fijo)
Integración con API de Correo Argentino, OCA, Andreani, etc., para calcular costos dinámicos basados en peso/dimensiones/destino.
Paso 8.2: Facturación (Complejo, usualmente Post-MVP)
Integración con sistema de facturación electrónica (AFIP).
FASE 9: OPTIMIZACIÓN, TESTING Y DEPLOY (Esencial - 2-3 días)
Paso 9.1: Performance
Optimización de consultas a BD (índices, proyecciones).
Caching para datos frecuentemente accedidos (Redis o node-cache).
Compresión de respuestas (compression middleware).
Paso 9.2: Testing
Unitario (Jest/Mocha): Funciones críticas, utils.
Integración (Supertest): Flujos de API (auth, CRUDs, proceso de orden).
Testing manual completo.
Paso 9.3: Preparación para Producción y Deploy
Documentación de API (Postman, Swagger/OpenAPI).
Variables de entorno para producción.
Scripts de deployment (PM2, Docker).
Configurar plataforma de hosting (Heroku, Vercel, AWS, DigitalOcean, etc.).
Este plan es más extenso porque un e-commerce tiene muchas más partes móviles.
Mi sugerencia es enfocarse primero en tener funcionales las Fases 1, 2, y las partes esenciales de la Fase 3 (crear orden y marcar como pagada manualmente por admin). Eso te daría un MVP (Producto Mínimo Viable).
Ahora sí, ¿este plan se ajusta mejor a la idea de un e-commerce mayorista de artículos escolares?
Si es así, podemos proceder a eliminar los modelos User.js y Materia.js actuales de tu carpeta backend/models y empezar a crear los nuevos que te propuse en la Fase 1 de este nuevo plan.
ADMIN
{
    "email": "test10@example.com", // El email que acabas de registrar
    "password": "password123"      // La contraseña que usaste (o la que se haya guardado)
}

cliente mayorista
{
    "nombre": "gusatvot",
    "apellido": "tetto",
    "email": "gusatvot@gmail.com",
    "password": "Esmigol.27" // Este campo es importante para el registro
}
cliente
{
    "email": "cliente@example.com",
    "password": "cliente123"
}

{
    "nombre": "Cuaderno Rayado x48 Hojas ABC",
    "descripcion": "Cuaderno tapa flexible, rayado, 48 hojas.",
    "sku": "CUAD-ABC-R48",
    "marca": "ABC",
    "categoria": "683fab8fa87478f786df421f", // Reemplaza con un ID real
    "precioBase": 150.75,
    "stock": 200,
    "imagenes": ["url1.jpg", "url2.jpg"],
    "unidadVenta": "unidad"
}
contraseña de aplicaciones
xdxk qfgb qtns qzfz

crear usuario
{
    "nombre": "gusatvot",
    "apellido": "tetto",
    "email": "gusatvot@gmail.com",
    "password": "Esmigol.27" // Este campo es importante para el registro
}

prueba error email invalido
{
    "nombre": "gusatvot",
    "apellido": "tetto",
    "email": "noesunemail",
    "password": "Esmigol.27" // Este campo es importante para el registro
}

Pasos para Agregar Ítems al Carrito de un Usuario (usando Postman):
Asegúrate de estar Logueado como el Usuario cuyo Carrito Quieres Modificar:
Ve a la pestaña donde haces el Login (CORREO / POST a http://localhost:4000/api/auth/login).
Ingresa las credenciales del usuario (cliente o mayorista) cuyo carrito quieres llenar.
Haz clic en "Enviar".
Verifica que obtuviste 200 OK. Este paso es crucial. Postman ahora tiene la cookie jwt de este usuario y la enviará automáticamente en las siguientes peticiones al mismo dominio (localhost:4000), lo que te mantendrá autenticado para las rutas del carrito.
Obtén el _id de un Producto que Quieras Agregar:
Si no recuerdas los IDs de tus productos, abre una nueva pestaña en Postman o usa una existente.
Haz una petición CONSEGUIR (GET) a http://localhost:4000/api/productos.
Haz clic en "Enviar".
En la respuesta 200 OK, verás un array productos. Busca el producto que quieres agregar (por su nombre, SKU, etc.) y copia su campo _id.
Obtén o Crea el Carrito del Usuario (Haz este paso si es la PRIMERA VEZ que agregas algo con este usuario, o si recibes el error "Carrito no encontrado..."):
Método: CONSEGUIR (GET)
URL: http://localhost:4000/api/carrito
Cuerpo: none
Acción: Haz clic en "Enviar".
Respuesta Esperada: 200 OK. Si el usuario no tenía carrito, el backend creará uno vacío y te lo devolverá. Si ya tenía uno, te devolverá el carrito existente. Este paso asegura que el documento del carrito exista en la base de datos para este usuario antes de intentar añadirle ítems.
Haz la Petición para Agregar el Ítem al Carrito:
Abre una nueva pestaña en Postman o usa una existente.
Método HTTP: CORREO (POST)
URL: http://localhost:4000/api/carrito/items
Pestaña "Cuerpo" (Body):
Haz clic en la pestaña "Cuerpo".
Selecciona la opción raw (o "crudo").
A la derecha de raw, en el desplegable de tipo, selecciona JSON.
En el área de texto grande, pega el siguiente JSON. ¡Recuerda reemplazar "ID_DEL_PRODUCTO_A_AGREGAR" con el _id real del producto que copiaste en el paso 2!
{
    "productoId": "ID_DEL_PRODUCTO_A_AGREGAR",
    "cantidad": 1 // O la cantidad que quieras agregar (ej. 2, 5, etc.)
}
Use code with caution.
Json
Ejemplo:
{
    "productoId": "65c1b1d1f2b3c4e5d6f7a8b9", // Reemplaza con tu ID real de producto
    "cantidad": 3
}
Use code with caution.
Json
Enviar la Petición: Haz clic en el botón "Send".
Respuesta Esperada:
Status Code: 200 OK.
Body de la Respuesta (JSON): Recibirás el objeto del carrito de ese usuario, ahora mostrando el ítem que acabas de agregar, con los detalles del producto populados. Si ya había ítems o agregaste el mismo producto, verás la lista actualizada.
Para Agregar Más Ítems (después de haber agregado el primero):

{
    "usuario": "68417f96182c224eb4017f31",
    "itemsPedido": [
        {
            "nombre": "Lapices de Colores x24",
            "cantidad": 1,
            "precio": 300,
            "producto": "68411578053901dbd34b1a91"
        },
        {
            "nombre": "Sacapuntas Metálico Doble",
            "cantidad": 10,
            "precio": 120,
            "producto": "683fc82847d0ac6386dfa2ef"
        }
    ],
    "direccionEnvio": {
        "calle": "Dirección de Prueba",
        "numero": "123",
        "ciudad": "Ciudad Ficticia",
        "provincia": "Provincia Ejemplo",
        "codigoPostal": "1234",
        "pais": "Argentina"
    },
    "metodoPago": "Tarjeta de Crédito",
    "precioItems": 1500,
    "precioImpuestos": 0,
    "precioEnvio": 0,
    "precioTotal": 1500,
    "estadoPedido": "pendiente_pago",
    "estaPagado": false,
    "estaEntregado": false,
    "_id": "6847baddbadaa6794da08cab",
    "createdAt": "2025-06-10T04:55:57.832Z",
    "updatedAt": "2025-06-10T04:55:57.832Z",
    "__v": 0
}

Hemos cubierto casi todos los bloques funcionales importantes que definimos al principio:
✅ Fase 1: Fundamentos (Configuración, Conexión, Modelos Base)
✅ Fase 2: Funcionalidades Core (Autenticación, Perfil, Recuperación Contraseña, CRUDs Productos/Categorías)
✅ Fase 3: Carrito y Órdenes (Carrito Persistente, Flujo Completo de Órdenes) - Falta Integración de Pagos (Paso 3.3 - pospuesto)
✅ Fase 5: Comunicaciones (Emails de Bienvenida y de Órdenes)
✅ Fase 6: Panel Admin (Endpoints de Gestión de Usuarios, Endpoints para Estadísticas Básicas - ya las incluiste en orderController.js, solo faltaría una ruta específica si no la quieres en /api/ordenes/stats)
✅ Fase 7: Validaciones Robustas (express-validator en rutas clave)
Opciones para Finalizar o Pulir (los últimos pasos hacia la preparación para el deploy):
Retomar Integración de Pagos (Fase 3.3): Sigue siendo la funcionalidad grande que falta para el ciclo de compra.
Terminar Endpoints del Panel de Admin/Estadísticas (Fase 6.2): Si las estadísticas están en orderController.js, podrías crear una ruta específica como /api/admin/stats e importar esas funciones allí si quieres separarlas lógicamente.
Implementar Subida de Imágenes para Productos (Fase 2.2 / Fase 7): Si quieres que los administradores puedan subir imágenes de productos en lugar de solo pegar URLs. Esto es un poco más complejo porque requiere manejar archivos.
Refinar Validaciones: Revisar a detalle todas las rutas y asegurarse de que las validaciones cubran todos los casos posibles (ej. formatos de datos, rangos numéricos, etc.).
Implementar la Gestión de Direcciones de Envío como CRUD separado (si no quedó completamente cubierta por el PUT /perfil): Aunque el PUT /perfil permite actualizar las direcciones si se envían, tener endpoints POST/PUT/:id/DELETE específicos para direcciones es más estándar para que el usuario gestione múltiples direcciones (agregar nuevas, eliminar, marcar principal).
Fase 8: Optimización y Pulido: Implementar caching, compresión de respuestas, logging estructurado.
Fase 9: Testing y Deploy: Escribir tests unitarios/de integración, preparar el entorno para producción, escribir documentación básica de API.