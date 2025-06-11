// backend/routes/categoryRoutes.js
import express from 'express';
import { body, param } from 'express-validator'; // Importamos 'body' y 'param'
import {
    crearCategoria,
    obtenerCategorias,
    obtenerCategoriaPorIdOSlug,
    actualizarCategoria,
    eliminarCategoria,
} from '../controllers/categoryController.js';
import { protegerRuta, autorizarRoles } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js'; // Nuestro manejador

const router = express.Router();

// --- Reglas de Validación para Categorías ---

const crearOActualizarCategoriaRules = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la categoría es obligatorio.')
        .isString().withMessage('El nombre debe ser texto.')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('descripcion')
        .optional({ checkFalsy: true })
        .trim()
        .isString().withMessage('La descripción debe ser texto.')
        .isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.'),
    body('slug')
        .optional({ checkFalsy: true }) // El slug se puede generar automáticamente, pero si se envía, lo validamos
        .trim()
        .isString().withMessage('El slug debe ser texto.')
        .isSlug().withMessage('El slug contiene caracteres inválidos (solo letras, números, guiones).')
        .toLowerCase(),
    body('imagen')
        .optional({ checkFalsy: true })
        .trim()
        .isURL().withMessage('La imagen debe ser una URL válida.'),
    body('parent_id')
        .optional({ nullable: true, checkFalsy: true }) // Permite null o string vacío para categoría padre
        .if((value) => value !== null && value !== '') // Solo validar si no es null ni vacío
        .isMongoId().withMessage('El ID de la categoría padre (parent_id) debe ser un ID de MongoDB válido.'),
    body('activa')
        .optional()
        .isBoolean().withMessage('El estado "activa" debe ser un valor booleano (true/false).')
];

const mongoIdParamRule = (paramName = 'id') => [ // Helper para validar params que son MongoID
    param(paramName).isMongoId().withMessage(`El parámetro '${paramName}' debe ser un ID de MongoDB válido.`),
];


// --- Definición de Rutas de Categorías ---

// Rutas públicas
router.get('/', obtenerCategorias); // No suele necesitar validación de entrada, quizás paginación en el futuro

router.get(
    '/:identificador',
    // No es estrictamente un MongoID ya que puede ser un slug, la validación se hace en el controlador.
    // Podríamos añadir una validación genérica de string si quisiéramos.
    // param('identificador').isString().notEmpty().withMessage('El identificador es obligatorio.'),
    // handleValidationErrors, // Descomentar si se añade la validación de arriba
    obtenerCategoriaPorIdOSlug
);

// Rutas protegidas para Administradores
router.post(
    '/',
    protegerRuta,
    autorizarRoles('admin'),
    crearOActualizarCategoriaRules, // Usamos las mismas reglas para crear y una parte para actualizar
    handleValidationErrors,
    crearCategoria
);

router.put(
    '/:id',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'), // Validar que el :id del param sea un MongoID
    crearOActualizarCategoriaRules, // Reutilizamos las reglas, el controlador manejará qué campos actualiza
    handleValidationErrors,
    actualizarCategoria
);

router.delete(
    '/:id',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'), // Validar que el :id del param sea un MongoID
    handleValidationErrors,
    eliminarCategoria
);

export default router;