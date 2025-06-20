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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();
const app = express();

app.use(compression());

// --- Configuración de CORS ---
const allowedOrigins = [
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:5173',
    'http://localhost:3000'
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS: Origen bloqueado -> ${origin}`);
            callback(new Error(`El origen '${origin}' no está permitido por CORS.`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'], // ASEGURARSE QUE OPTIONS ESTÉ AQUÍ
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    preflightContinue: false, // Muy importante: cors maneja OPTIONS y no las pasa.
    optionsSuccessStatus: 204 // Estándar para preflight requests exitosas.
};

// Aplicar el middleware CORS principal a TODAS las rutas.
// ESTE MIDDLEWARE DEBERÍA MANEJAR LAS PETICIONES OPTIONS (PREFLIGHT).
app.use(cors(corsOptions));
// --- Fin Configuración CORS ---


app.use(cookieParser());

// Multer dentro de uploadRoutes procesará 'multipart/form-data'
app.use('/api/upload', uploadRoutes); 

// Middlewares de body-parser generales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan para logging HTTP
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Servir carpeta de subidas
const uploadsFolder = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsFolder));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/carrito', cartRoutes);
app.use('/api/ordenes', orderRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
    res.json({ message: 'API E-commerce Funcionando Correctamente!' });
});

// Middlewares de manejo de errores (al final)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(
        `Servidor corriendo en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`
    );
});