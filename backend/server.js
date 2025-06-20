// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Importación de Rutas ---
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js'; // Descomentar cuando esté listo

// --- Configuración para __dirname y __filename en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURACIÓN INICIAL ---
dotenv.config(); // Cargar variables de entorno desde .env
connectDB(); // Conectar a la base de datos MongoDB

const app = express(); // Inicializar la aplicación Express

// --- MIDDLEWARES GENERALES ---
app.use(compression()); // Comprimir respuestas

// --- Configuración de CORS más explícita y robusta ---
const allowedOrigins = [
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:5173', // Común para Vite en desarrollo
    'http://localhost:3000'  // Común para Create React App en desarrollo
];

// Añadir la URL del frontend de producción si está definida en .env
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin 'origin' (como Postman, apps móviles, curl) o si el origen está en la lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS: Origen bloqueado -> ${origin}`); // Loguear origen bloqueado para depuración
            callback(new Error(`El origen '${origin}' no está permitido por CORS.`));
        }
    },
    credentials: true, // Para permitir cookies y cabeceras de autorización
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'], // Métodos HTTP permitidos
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Cabeceras permitidas en la petición
    preflightContinue: false, // Importante: 'false' para que el middleware cors maneje las peticiones OPTIONS y no pasen a tus rutas
    optionsSuccessStatus: 204 // Estándar para preflight requests exitosas (responde con 204 No Content)
}));
// --- Fin Configuración CORS ---


// Middleware para parsear cookies adjuntas a las peticiones. Permite acceder a req.cookies.
app.use(cookieParser());

// --- MONTAR LA RUTA DE UPLOAD TEMPRANO ---
// El middleware de Multer dentro de uploadRoutes procesará 'multipart/form-data' ANTES de los body-parser generales.
app.use('/api/upload', uploadRoutes); 

// Middlewares de body-parser generales para JSON y URL-encoded Bodies
// Estos deben ir ANTES de las rutas que los necesitan (excepto las de upload), pero DESPUÉS de CORS.
app.use(express.json()); // Para parsear bodies JSON
app.use(express.urlencoded({ extended: true })); // Para parsear bodies URL-encoded

// Middleware para logging de peticiones HTTP
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Formato 'dev' para desarrollo (conciso y coloreado)
} else {
    app.use(morgan('combined')); // Formato 'combined' para producción (estándar Apache)
}

// --- SERVIR CARPETA DE SUBIDAS ESTÁTICAMENTE ---
// Definir la ruta absoluta al directorio donde Multer guarda los archivos subidos (backend/uploads)
const uploadsFolder = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsFolder)); // Servir archivos desde la URL base '/uploads'


// --- RUTAS DE LA API (resto) ---
// Montar los routers de cada grupo de funcionalidades.
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/carrito', cartRoutes);
app.use('/api/ordenes', orderRoutes);
app.use('/api/usuarios', userRoutes);
// app.use('/api/pagos', paymentRoutes); // Descomentar cuando implementes la lógica de pagos
app.use('/api/admin', adminRoutes);

// Ruta de prueba básica para verificar que la API está funcionando
app.get('/api', (req, res) => {
    res.json({ message: 'API E-commerce Funcionando Correctamente!' });
});

// --- MIDDLEWARES DE MANEJO DE ERRORES ---
// Estos middlewares DEBEN ir al final de la cadena de middlewares y rutas.
app.use(notFound); // Middleware para manejar rutas no encontradas (404 Not Found)
app.use(errorHandler); // Middleware centralizado para manejar todos los demás errores

// --- INICIAR EL SERVIDOR ---
const PORT = process.env.PORT || 4000; // Obtener el puerto desde las variables de entorno o usar 4000 por defecto.

app.listen(PORT, () => {
    console.log(
        `Servidor corriendo en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`
    );
});