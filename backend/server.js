// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Asegúrate de que esté importado
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
// import paymentRoutes from './routes/paymentRoutes.js';

// --- Configuración para __dirname y __filename en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURACIÓN INICIAL ---
dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARES GENERALES ---
app.use(compression());

// --- Configuración de CORS más explícita y robusta ---
const allowedOrigins = [
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:5173', 
    'http://localhost:3000'
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
            console.warn(`CORS: Origen bloqueado -> ${origin}`); // Loguear origen bloqueado
            callback(new Error(`El origen '${origin}' no está permitido por CORS.`));
        }
    },
    credentials: true, // Para permitir cookies y cabeceras de autorización
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'], // Métodos permitidos
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Cabeceras permitidas en la petición
    exposedHeaders: ['Content-Length', 'X-Request-Id'], // Cabeceras que el frontend puede leer en la respuesta (si es necesario)
    preflightContinue: false, // Importante: 'false' para que cors maneje OPTIONS y no pasen a tus rutas
    optionsSuccessStatus: 204 // Estándar para preflight requests exitosas (204 No Content)
}));

// Manejar explícitamente peticiones OPTIONS globalmente ANTES de otras rutas.
// Esto es a veces necesario como un "seguro" si el middleware cors general no las captura todas.
// Debe ir DESPUÉS del app.use(cors(...)) principal.
app.options('*', (req, res) => {
    // El middleware cors ya debería haber configurado las cabeceras necesarias.
    // Simplemente respondemos con 204 (No Content) para las OPTIONS.
    console.log(`BACKEND: Petición OPTIONS recibida para: ${req.originalUrl} desde ${req.headers.origin}`);
    res.sendStatus(204); 
});
// --- Fin Configuración CORS ---


app.use(cookieParser()); // Para parsear cookies

// --- MONTAR LA RUTA DE UPLOAD TEMPRANO ---
// Multer dentro de uploadRoutes procesará 'multipart/form-data'
app.use('/api/upload', uploadRoutes); 

// Middlewares de body-parser generales para JSON y URL-encoded Bodies
// Deben ir ANTES de las rutas que los necesitan, pero DESPUÉS de CORS.
app.use(express.json()); // Para bodies JSON
app.use(express.urlencoded({ extended: true })); // Para bodies URL-encoded

// Middleware para logging de peticiones HTTP
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// --- SERVIR CARPETA DE SUBIDAS ESTÁTICAMENTE ---
const uploadsFolder = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsFolder));


// --- RUTAS DE LA API (resto) ---
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/carrito', cartRoutes);
app.use('/api/ordenes', orderRoutes);
app.use('/api/usuarios', userRoutes);
// app.use('/api/pagos', paymentRoutes); // Descomentar cuando implementes pagos
app.use('/api/admin', adminRoutes);

// Ruta de prueba básica
app.get('/api', (req, res) => {
    res.json({ message: 'API E-commerce Funcionando Correctamente!' });
});

// --- MIDDLEWARES DE MANEJO DE ERRORES ---
// Deben ir al final
app.use(notFound);
app.use(errorHandler);

// --- INICIAR EL SERVIDOR ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(
        `Servidor corriendo en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`
    );
});