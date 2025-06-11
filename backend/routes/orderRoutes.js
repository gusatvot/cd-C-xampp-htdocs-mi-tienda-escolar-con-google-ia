// backend/routes/orderRoutes.js
import express from 'express';
import { body, param, query } from 'express-validator'; // Importar 'body', 'param' y 'query'
import {
    crearOrden,
    obtenerOrdenPorId,
    obtenerMisOrdenes,
    obtenerTodasLasOrdenes,
    actualizarOrdenAPagada,
    actualizarOrdenAEntregada,
    actualizarEstadoOrden,
    // Importar las funciones de estadísticas de órdenes
    obtenerEstadisticasGeneralesOrdenes,
    obtenerProductosStockBajo,
} from '../controllers/orderController.js'; // Asegúrate que se importen desde orderController
import { protegerRuta, autorizarRoles } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js'; // Nuestro manejador

const router = express.Router();

// --- Reglas de Validación ---
const crearOrdenRules = [
    body('direccionEnvio')
        .notEmpty().withMessage('La dirección de envío es obligatoria.')
        .isObject().withMessage('La dirección de envío debe ser un objeto.'),
    body('direccionEnvio.calle').trim().notEmpty().withMessage('La calle es obligatoria en la dirección de envío.'),
    body('direccionEnvio.numero').trim().notEmpty().withMessage('El número es obligatorio en la dirección de envío.'),
    body('direccionEnvio.piso').optional({ checkFalsy: true }).trim().isString().withMessage('El piso debe ser texto.'),
    body('direccionEnvio.depto').optional({ checkFalsy: true }).trim().isString().withMessage('El departamento debe ser texto.'),
    body('direccionEnvio.ciudad').trim().notEmpty().withMessage('La ciudad es obligatoria en la dirección de envío.'),
    body('direccionEnvio.provincia').trim().notEmpty().withMessage('La provincia es obligatoria en la dirección de envío.'),
    body('direccionEnvio.codigoPostal').trim().notEmpty().withMessage('El código postal es obligatorio en la dirección de envío.'),
    body('direccionEnvio.pais')
        .optional({ checkFalsy: true })
        .trim().notEmpty().withMessage('El país no puede estar vacío si se proporciona.')
        .isString().withMessage('El país debe ser texto.'),

    body('metodoPago')
        .trim()
        .notEmpty().withMessage('El método de pago es obligatorio.')
        .isString().withMessage('El método de pago debe ser texto.'),

    body('precioEnvio')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio de envío debe ser un número no negativo.'),
    body('precioImpuestos')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio de impuestos debe ser un número no negativo.'),
];

const mongoIdParamRule = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`El parámetro '${paramName}' debe ser un ID de MongoDB válido.`),
];

const actualizarEstadoOrdenRules = [
    body('nuevoEstado')
        .trim()
        .notEmpty().withMessage('El nuevo estado es obligatorio.')
        .isIn(['pendiente_pago', 'procesando', 'enviado', 'entregado', 'cancelado', 'pago_fallido']) // Añadido 'pago_fallido' si lo usas
        .withMessage('El valor proporcionado para "nuevoEstado" no es válido.'),
];

// Regla para validar el query param 'limite' en la ruta de stock bajo
const obtenerProductosStockBajoRules = [
    query('limite').optional().isInt({ min: 0 }).withMessage('El límite debe ser un número entero no negativo.'),
];


// --- Definición de Rutas de Órdenes ---

// Rutas para usuarios autenticados
router.post(
    '/',
    protegerRuta,
    crearOrdenRules,
    handleValidationErrors,
    crearOrden
);
router.get('/mis-ordenes', protegerRuta, obtenerMisOrdenes); // No necesita validación de entrada específica
router.get(
    '/:id',
    protegerRuta,
    mongoIdParamRule('id'), // Valida que el ID en la URL sea un MongoID
    handleValidationErrors,
    obtenerOrdenPorId
);

// Rutas solo para Administradores
// Listar todas las órdenes
router.get(
    '/', // Esta ruta se diferencia de GET /:id por la ausencia del parámetro :id
    protegerRuta,
    autorizarRoles('admin'),
    obtenerTodasLasOrdenes // No necesita validación de entrada específica (podría tener query params de paginación en el futuro)
);

// Actualizar estado de orden a pagada
router.put(
    '/:id/pagar',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'),
    handleValidationErrors,
    actualizarOrdenAPagada // No necesita validación del body por ahora
);

// Actualizar estado de orden a entregada
router.put(
    '/:id/entregar',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'),
    handleValidationErrors,
    actualizarOrdenAEntregada // No necesita validación del body
);

// Cambiar estado general de la orden (para 'enviado', 'cancelado', 'pago_fallido', etc.)
router.put(
    '/:id/estado',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'), // Valida el ID en la URL
    actualizarEstadoOrdenRules, // Valida el 'nuevoEstado' del body
    handleValidationErrors,
    actualizarEstadoOrden
);


// --- NUEVAS RUTAS DE ESTADÍSTICAS PARA ADMINISTRADORES ---
// Todas requieren que el usuario sea admin

// Obtener estadísticas generales de órdenes (total, por estado, ventas)
router.get(
    '/stats/generales', // <--- RUTA PARA ESTADÍSTICAS GENERALES DE ÓRDENES
    protegerRuta,
    autorizarRoles('admin'),
    obtenerEstadisticasGeneralesOrdenes // Llama a esta función
);

// Obtener productos con stock bajo (basado en un límite)
router.get(
    '/stats/stock-bajo', // <--- RUTA PARA PRODUCTOS CON STOCK BAJO
    protegerRuta,
    autorizarRoles('admin'),
    obtenerProductosStockBajoRules, // Valida el query param limite
    handleValidationErrors,
    obtenerProductosStockBajo // Llama a esta función
);


export default router;