// backend/routes/productRoutes.js
import express from 'express';
import { body, param, query } from 'express-validator'; // Importar 'body', 'param' y 'query'
import {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto,
} from '../controllers/productController.js';
import { protegerRuta, autorizarRoles } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// --- Reglas de Validación para Productos ---

const crearOActualizarProductoRules = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del producto es obligatorio.')
        .isString().withMessage('El nombre debe ser texto.')
        .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres.'),
    body('descripcion')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria.')
        .isString().withMessage('La descripción debe ser texto.')
        .isLength({ max: 1000 }).withMessage('La descripción no puede exceder los 1000 caracteres.'),
    body('sku')
        .trim()
        .notEmpty().withMessage('El SKU es obligatorio.')
        .isString().withMessage('El SKU debe ser texto.')
        .isUppercase().withMessage('El SKU debe estar en mayúsculas.') // Opcional, para un formato específico
        .isLength({ min: 3, max: 20 }).withMessage('El SKU debe tener entre 3 y 20 caracteres.'),
    body('marca')
        .optional({ checkFalsy: true })
        .trim()
        .isString().withMessage('La marca debe ser texto.')
        .isLength({ max: 100 }).withMessage('La marca no puede exceder los 100 caracteres.'),
    body('categoria')
        .notEmpty().withMessage('La categoría es obligatoria.')
        .isMongoId().withMessage('La categoría debe ser un ID de MongoDB válido.'),
    body('precioBase')
        .notEmpty().withMessage('El precio base es obligatorio.')
        .isFloat({ min: 0 }).withMessage('El precio base debe ser un número válido y no negativo.'),
    body('preciosMayorista')
        .isArray().withMessage('Los precios mayoristas deben ser un array.')
        .optional(), // Opcional, si no se envía
    body('preciosMayorista.*.cantidadMinima')
        .isInt({ min: 1 }).withMessage('La cantidad mínima debe ser un número entero mayor a 0.')
        .optional() ,// El validado opcional dentro del array (si se envían precios mayoristas)
    body('preciosMayorista.*.precio')
        .isFloat({ min: 0 }).withMessage('El precio mayorista debe ser un número válido y no negativo.')
        .optional(), // El validado opcional dentro del array
    body('stock')
        .notEmpty().withMessage('El stock es obligatorio.')
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.'),
    body('imagenes')
        .isArray().withMessage('Las imágenes deben ser un array de URLs.')
        .optional(), // Opcional
    body('imagenes.*')
        .isURL().withMessage('Cada imagen debe ser una URL válida.')
        .optional(), // Cada imagen dentro del array
    body('unidadVenta')
        .optional({ checkFalsy: true })
        .trim()
        .isString().withMessage('La unidad de venta debe ser texto.')
        .isIn(['unidad', 'caja', 'docena', 'blister', 'pack']).withMessage('La unidad de venta no es válida (ej: unidad, caja, docena).'), // Opcional: para limitar las opciones.
    body('peso')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso debe ser un número no negativo.'),
    body('dimensiones')
        .optional()
        .isObject().withMessage('Las dimensiones deben ser un objeto.') ,// Opcional, si se envía, tiene que ser un objeto
    body('dimensiones.largo')
        .optional()
        .isFloat({min:0}).withMessage('El largo debe ser un número no negativo.'),
    body('dimensiones.ancho')
        .optional()
        .isFloat({min:0}).withMessage('El ancho debe ser un número no negativo.'),
    body('dimensiones.alto')
        .optional()
        .isFloat({min:0}).withMessage('El alto debe ser un número no negativo.'),
    body('destacado')
        .optional()
        .isBoolean().withMessage('El campo destacado debe ser un booleano (true/false).')
        ,
    body('activo')
        .optional()
        .isBoolean().withMessage('El campo activo debe ser un booleano (true/false).')
];

const obtenerProductosQueryRules = [ // Para GET /api/productos, con validación de query params
    query('keyword').optional().isString().withMessage('La palabra clave debe ser texto.'),
    query('categoria').optional().isMongoId().withMessage('La categoría debe ser un ID de MongoDB válido.'),
    query('pageNumber').optional().isInt({min:1}).withMessage('El número de página debe ser un entero positivo.'),
    query('pageSize').optional().isInt({min:1, max: 100}).withMessage('El tamaño de página debe ser un entero positivo (máximo 100).'),
];

const mongoIdParamRule = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`El parámetro '${paramName}' debe ser un ID de MongoDB válido.`),
];

// --- Definición de Rutas ---

router.get('/', obtenerProductosQueryRules, handleValidationErrors, obtenerProductos); // GET con query params
router.get('/:id', obtenerProductoPorId); // No necesita validación (el id se valida en el controlador)

// Rutas protegidas para Administradores
router.post('/', protegerRuta, autorizarRoles('admin'), crearOActualizarProductoRules, handleValidationErrors, crearProducto);
router.put('/:id', protegerRuta, autorizarRoles('admin'),  mongoIdParamRule('id'), crearOActualizarProductoRules, handleValidationErrors, actualizarProducto);
router.delete('/:id', protegerRuta, autorizarRoles('admin'), mongoIdParamRule('id'), eliminarProducto);

export default router;