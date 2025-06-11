// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan'; // Para logging de peticiones HTTP en desarrollo
import cookieParser from 'cookie-parser'; // Para parsear cookies
import connectDB from './config/db.js'; // Conexión a la base de datos
import { notFound, errorHandler } from './middlewares/errorHandler.js'; // Middlewares de manejo de errores
import compression from 'compression';


// Importar módulos para servir archivos estáticos y rutas
import path from 'path';
import { fileURLToPath } from 'url'; // Necesario para obtener __dirname en ES Modules

// --- Importación de Rutas ---
import authRoutes from './routes/authRoutes.js'; // Rutas de autenticación (registro, login, logout)
import categoryRoutes from './routes/categoryRoutes.js'; // Rutas para categorías
import productRoutes from './routes/productRoutes.js'; // Rutas para productos
import cartRoutes from './routes/cartRoutes.js'; // Rutas para el carrito de compras
import orderRoutes from './routes/orderRoutes.js'; // Rutas para órdenes/pedidos y stats de órdenes
import userRoutes from './routes/userRoutes.js'; // Rutas para gestión de perfiles de usuario y gestión por admin
import uploadRoutes from './routes/uploadRoutes.js'; // <--- Importar rutas de subida
import adminRoutes from './routes/adminRoutes.js';

// TODO: import paymentRoutes from './routes/paymentRoutes.js'; // Rutas para integración de pagos (pospuesto)


// --- Configuración para __dirname y __filename en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- Fin Configuración __dirname ---


// --- CONFIGURACIÓN INICIAL ---
dotenv.config(); // Cargar variables de entorno desde .env
connectDB(); // Conectar a la base de datos MongoDB

const app = express(); // Inicializar la aplicación Express

// --- MIDDLEWARES GENERALES ---
// Estos middlewares se aplican a TODAS las peticiones que lleguen al servidor Express

app.use(compression());

// Configuración de CORS para permitir peticiones desde el frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Permite el origen de tu frontend (ajusta el puerto si es necesario)
    credentials: true, // Necesario para que el frontend envíe y reciba cookies (importante para la autenticación JWT)
}));

// Middleware para parsear cookies adjuntas a las peticiones. Permite acceder a req.cookies.
app.use(cookieParser());

// --- MONTAR LA RUTA DE UPLOAD TEMPRANO ---
// Montar las rutas de subida aquí. El middleware de Multer dentro de uploadRoutes
// procesará 'multipart/form-data' ANTES de que los middlewares de body-parser generales actúen.
app.use('/api/upload', uploadRoutes); // <--- RUTA DE UPLOAD MONTADA AQUÍ

// Middlewares de body-parser generales para JSON y URL-encoded Bodies
// Estos no deberían afectar 'multipart/form-data' procesado por Multer,
// pero se colocan DESPUÉS de la ruta de upload específica por si acaso hay interferencia.
app.use(express.json()); // Para bodies JSON
app.use(express.urlencoded({ extended: true })); // Para bodies URL-encoded

// Middleware para logging de peticiones HTTP en modo desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // TODO: Configurar Morgan para producción
    app.use(morgan('combined')); // <--- Opción 1: Loguear a consola con formato 'combined'
    //app.use(morgan('combined', { stream: accessLogStream })); // <--- Opción 2: Loguear a archivo con stream
}

// --- SERVIR CARPETA DE SUBIDAS ESTÁTICAMENTE ---
// Definir la ruta absoluta al directorio donde Multer guarda los archivos subidos (backend/uploads)
const uploadsFolder = path.join(__dirname, 'uploads'); // Construye la ruta absoluta a la carpeta 'uploads'

// Configurar Express para servir archivos estáticos desde la URL base '/uploads'
// DEBE ir ANTES de las rutas API que podrían referenciar estas URLs.
app.use('/uploads', express.static(uploadsFolder)); // <--- Configura el middleware para servir estáticos


// --- RUTAS DE LA API (resto) ---
// Montar los routers de cada grupo de funcionalidades.
// Estas rutas generales vienen DESPUÉS de la ruta de upload temprana.
app.use('/api/auth', authRoutes); // Rutas de autenticación bajo /api/auth
app.use('/api/categorias', categoryRoutes); // Rutas de categorías bajo /api/categorias
app.use('/api/productos', productRoutes); // Rutas de productos bajo /api/productos
app.use('/api/carrito', cartRoutes); // Rutas del carrito bajo /api/carrito
app.use('/api/ordenes', orderRoutes); // Rutas de órdenes y stats de órdenes bajo /api/ordenes
app.use('/api/usuarios', userRoutes); // Rutas de perfil y gestión de usuarios bajo /api/usuarios
app.use('/api/upload', uploadRoutes);
// TODO: app.use('/api/pagos', paymentRoutes); // Montar rutas de pagos bajo /api/pagos (cuando se retome)

// Montar las rutas específicas de administración
app.use('/api/admin', adminRoutes); // <--- Montar rutas de administración bajo /api/admin

// Ruta de prueba básica para verificar que la API está funcionando
app.get('/api', (req, res) => {
    res.json({ message: 'API E-commerce Funcionando Correctamente!' });
});

// TODO: Podrías tener una ruta /api/admin/stats separada si quieres agrupar todas las estadísticas de admin aquí
// import adminStatsRoutes from './routes/adminStatsRoutes.js';
// app.use('/api/admin/stats', protegerRuta, autorizarRoles('admin'), adminStatsRoutes);


// --- MIDDLEWARES DE MANEJO DE ERRORES ---
// Estos middlewares DEBEN ir al final de la cadena de middlewares y rutas.
app.use(notFound); // Middleware para manejar rutas no encontradas (404 Not Found)
app.use(errorHandler); // Middleware centralizado para manejar todos los demás errores


// --- INICIAR EL SERVIDOR ---
const PORT = process.env.PORT || 4000; // Obtener el puerto desde las variables de entorno o usar 4000 por defecto.

// Iniciar el servidor Express y escuchar en el puerto especificado.
app.listen(PORT, () => {
    console.log(
        `Servidor corriendo en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`
    );
});