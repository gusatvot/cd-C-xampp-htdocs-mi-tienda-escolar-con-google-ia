// backend/routes/userRoutes.js
import express from 'express';
import { body, param } from 'express-validator'; // Importar body y param para validación de entrada
import {
    obtenerPerfilUsuario,
    actualizarPerfilUsuario,
    // TODO: Importar cambiarPasswordUsuario cuando esté implementado
    // cambiarPasswordUsuario,

    // Importar controladores para la gestión de direcciones
    obtenerDireccionesEnvio,
    agregarDireccionEnvio,
    actualizarDireccionEnvio,
    eliminarDireccionEnvio,

    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuarioPorAdmin,
    eliminarUsuario, // Esta función desactiva
    // TODO: Importar controladores de estadísticas de usuarios cuando estén implementados
    // obtenerEstadisticasUsuarios,
} from '../controllers/userController.js';
import { protegerRuta, autorizarRoles } from '../middlewares/authMiddleware.js'; // Middlewares de autenticación y autorización
import { handleValidationErrors } from '../middlewares/validationMiddleware.js'; // Middleware para manejar errores de validación

const router = express.Router(); // Crear un nuevo router de Express

// --- Reglas de Validación ---

// Reglas para los campos directos del perfil del usuario al actualizar (PUT /perfil)
// Estos campos son opcionales en la actualización. Si se envían, se validan.
const actualizarPerfilRules = [
    body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío si se actualiza.')
                  .isString().withMessage('El nombre debe ser texto.'),
    body('apellido').optional().trim().notEmpty().withMessage('El apellido no puede estar vacío si se actualiza.')
                    .isString().withMessage('El apellido debe ser texto.'),
    body('email').optional().trim().isEmail().withMessage('Por favor, introduce un email válido.')
                 .normalizeEmail(),
    // La contraseña se cambia en un endpoint separado (/perfil/password) por seguridad.
    // Si incluyes validación de password aquí, aplícala solo si el campo está presente:
    body('password').optional().isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),

    body('telefono')
        .optional({ checkFalsy: true }) // Valida solo si el campo existe y no es "", 0, false, null, undefined
        .trim()
        .isString().withMessage('El teléfono debe ser una cadena de texto.')
        .isLength({ min: 7, max: 15 }).withMessage('El teléfono debe tener entre 7 y 15 caracteres.'), // Ajusta según necesidad
    body('razonSocial')
        .optional({ checkFalsy: true })
        .trim()
        .isString().withMessage('La razón social debe ser una cadena de texto.'),
    body('cuit')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\d{2}-\d{8}-\d{1}$/).withMessage('CUIT inválido. Formato esperado: XX-XXXXXXXX-X (con guiones).'),
    // Las direcciones de envío se validan en sus propias rutas POST/PUT/DELETE /perfil/direcciones
];

// Reglas para los datos de una dirección de envío al AGREGAR (POST)
// Los campos obligatorios (calle, numero, ciudad, provincia, codigoPostal)
// se validarán como notEmpty().
const agregarDireccionRules = [
    body('calle').trim().notEmpty().withMessage('La calle es obligatoria.'),
    body('numero').trim().notEmpty().withMessage('El número de calle es obligatorio.'),
    body('piso').optional({ checkFalsy: true }).trim().isString().withMessage('El piso debe ser texto.'),
    body('depto').optional({ checkFalsy: true }).trim().isString().withMessage('El departamento debe ser texto.'),
    body('ciudad').trim().notEmpty().withMessage('La ciudad es obligatoria.'),
    body('provincia').trim().notEmpty().withMessage('La provincia es obligatoria.'),
    body('codigoPostal').trim().notEmpty().withMessage('El código postal es obligatorio.'),
    body('pais').optional({ checkFalsy: true }).trim().isString().withMessage('El país debe ser texto.'),
    body('esPrincipal').optional().isBoolean().withMessage('El campo esPrincipal debe ser booleano.'),
    // TODO: Validar otros campos si los añadiste al schema de direccionSchema
];

// Reglas para los datos de una dirección de envío al ACTUALIZAR (PUT)
// TODOS los campos son opcionales. Si se envían, se validan.
const actualizarDireccionRules = [
    body('calle').optional().trim().notEmpty().withMessage('La calle no puede estar vacía si se actualiza.').isString().withMessage('La calle debe ser texto.'),
    body('numero').optional().trim().notEmpty().withMessage('El número de calle no puede estar vacío si se actualiza.').isString().withMessage('El número debe ser texto.'),
    body('piso').optional({ checkFalsy: true }).trim().isString().withMessage('El piso debe ser texto.'),
    body('depto').optional({ checkFalsy: true }).trim().isString().withMessage('El departamento debe ser texto.'),
    body('ciudad').optional().trim().notEmpty().withMessage('La ciudad no puede estar vacía si se actualiza.').isString().withMessage('La ciudad debe ser texto.'),
    body('provincia').optional().trim().notEmpty().withMessage('La provincia no puede estar vacía si se actualiza.').isString().withMessage('La provincia debe ser texto.'),
    body('codigoPostal').optional().trim().notEmpty().withMessage('El código postal no puede estar vacío si se actualiza.').isString().withMessage('El código postal debe ser texto.'),
    body('pais').optional({ checkFalsy: true }).trim().isString().withMessage('El país debe ser texto.'),
    body('esPrincipal').optional().isBoolean({ strict: true }).withMessage('El campo esPrincipal debe ser un valor booleano (true/false).'),
    // TODO: Validar otros campos si los añadiste al schema de direccionSchema
];


// Reglas para los campos de usuario que un Admin puede actualizar (PUT /:id)
// Estos campos son opcionales en la actualización. Si se envían, se validan.
const actualizarUsuarioAdminRules = [
    body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío si se proporciona.').isString(),
    body('apellido').optional().trim().notEmpty().withMessage('El apellido no puede estar vacío si se proporciona.').isString(),
    body('email').optional().trim().isEmail().withMessage('El formato del email es inválido.').normalizeEmail(),
    body('rol').optional().isIn(['cliente', 'mayorista', 'admin']).withMessage('El rol proporcionado no es válido.'), // Valida que el rol esté en el enum
    body('aprobadoMayorista').optional().isBoolean().withMessage('El campo "aprobadoMayorista" debe ser un valor booleano (true/false).'),
    body('activo').optional().isBoolean().withMessage('El campo "activo" debe ser un valor booleano (true/false).'),
    // Un admin no actualiza password ni direcciones de otros usuarios desde aquí.
];

// Helper para validar que un parámetro de ruta es un ID de MongoDB válido
const mongoIdParamRule = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`El parámetro '${paramName}' debe ser un ID de MongoDB válido.`),
];


// --- Definición de Rutas ---

// Rutas para el perfil del usuario autenticado
router.get('/perfil', protegerRuta, obtenerPerfilUsuario); // Obtener los datos del propio perfil
router.put(
    '/perfil',
    protegerRuta,
    actualizarPerfilRules, // Validar los campos directos del perfil que se pueden actualizar
    handleValidationErrors, // Manejar errores de validación
    actualizarPerfilUsuario // Ejecutar controlador si no hay errores
);
// TODO: Ruta para cambiar la contraseña del usuario logueado (separada por seguridad)
// router.put('/perfil/password', protegerRuta, /* validar password actual y nueva */, handleValidationErrors, cambiarPasswordUsuario);


// Rutas para la gestión de DIRECCIONES DE ENVÍO del usuario logueado
// Todas estas rutas requieren autenticación del usuario (`protegerRuta`)
router.get('/perfil/direcciones', protegerRuta, obtenerDireccionesEnvio); // Obtener todas las direcciones del usuario

router.post(
    '/perfil/direcciones',
    protegerRuta,
    agregarDireccionRules, // <--- Validar el cuerpo con las reglas para AGREGAR
    handleValidationErrors,
    agregarDireccionEnvio // Agregar una nueva dirección
);

router.put(
    '/perfil/direcciones/:direccionId',
    protegerRuta,
    mongoIdParamRule('direccionId'), // Validar el ID de la dirección en la URL
    actualizarDireccionRules, // <--- Validar el cuerpo con las reglas para ACTUALIZAR
    handleValidationErrors,
    actualizarDireccionEnvio // Actualizar una dirección específica
);

router.delete(
    '/perfil/direcciones/:direccionId',
    protegerRuta,
    mongoIdParamRule('direccionId'), // Validar el ID de la dirección en la URL
    handleValidationErrors, // Manejar errores de validación (solo del param)
    eliminarDireccionEnvio // Eliminar una dirección específica
);


// Rutas solo para Administradores para gestionar usuarios
// Requieren autenticación (`protegerRuta`) y autorización (`autorizarRoles('admin')`)
router.get(
    '/', // Esta ruta se diferencia de GET /:id por la ausencia del parámetro :id
    protegerRuta,
    autorizarRoles('admin'),
    obtenerUsuarios // Listar todos los usuarios (sin validación de entrada, puede tener query params en el futuro)
);

// TODO: Ruta para obtener estadísticas generales de usuarios (podría ir aquí o en /api/admin/stats)
// router.get('/stats/generales', protegerRuta, autorizarRoles('admin'), obtenerEstadisticasUsuarios);


router.get(
    '/:id',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'), // Validar el ID del usuario en la URL
    handleValidationErrors,
    obtenerUsuarioPorId // Obtener un usuario por ID
);
router.put(
    '/:id',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'), // Validar el ID del usuario en la URL
    actualizarUsuarioAdminRules, // Validar los campos del body que un admin puede actualizar
    handleValidationErrors,
    actualizarUsuarioPorAdmin // Actualizar un usuario (rol, activo, etc.)
);
router.delete(
    '/:id',
    protegerRuta,
    autorizarRoles('admin'),
    mongoIdParamRule('id'), // Validar el ID del usuario en la URL
    handleValidationErrors, // Manejar errores de validación (solo del param)
    eliminarUsuario // "Eliminar" (desactivar) un usuario
);


export default router; // Exportar el router para usarlo en server.js