// backend/routes/adminRoutes.js
import express from 'express';
import { query } from 'express-validator'; // Importar query para validar params de URL (si es necesario)
import {
    obtenerEstadisticasGenerales,
    obtenerListaProductosStockBajo,
    // TODO: Importar otras funciones de reportes cuando estén implementadas
    // obtenerVentasPorPeriodo,
    // obtenerProductosMasVendidos,
} from '../controllers/statsController.js'; // Importar controladores de estadísticas
import { protegerRuta, autorizarRoles } from '../middlewares/authMiddleware.js'; // Proteger y autorizar
import { handleValidationErrors } from '../middlewares/validationMiddleware.js'; // Manejar validaciones

const router = express.Router();

// Todas las rutas de administración requieren autenticación y el rol 'admin'.
// Podemos aplicar los middlewares a nivel del router.
router.use(protegerRuta);
router.use(autorizarRoles('admin'));


// --- Definición de Rutas de Administración ---

// Ruta para obtener las estadísticas generales del dashboard
router.get('/stats/generales', obtenerEstadisticasGenerales);

// Ruta para obtener la lista detallada de productos con stock bajo
// Incluimos validación para el query param 'limite'
router.get(
    '/stats/stock-bajo',
    query('limite') // Validar el query param llamado 'limite'
        .optional() // Es opcional
        .isInt({ min: 0 }).withMessage('El límite de stock bajo debe ser un número entero no negativo.'),
    handleValidationErrors, // Manejar errores de validación del query param
    obtenerListaProductosStockBajo
);

// TODO: Rutas para otros reportes
// router.get('/stats/ventas-por-periodo', validarQueryDePeriodo, handleValidationErrors, obtenerVentasPorPeriodo);
// router.get('/stats/productos-mas-vendidos', validarQueryDeRango, handleValidationErrors, obtenerProductosMasVendidos);


// TODO: Otras rutas de administración que no sean CRUDs de entidades principales (ej. Gestión de cupones, Configuración de la tienda)
// import couponRoutes from './couponRoutes.js';
// router.use('/cupones', couponRoutes); // Ejemplo: rutas para gestionar cupones

export default router; // Exportar el router