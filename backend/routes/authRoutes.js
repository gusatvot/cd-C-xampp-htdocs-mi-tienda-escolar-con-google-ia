// backend/routes/authRoutes.js
import express from 'express';
import { body, param } from 'express-validator'; // Importar 'body' y 'param' para validaciones
import {
    registrarUsuario,
    loginUsuario,
    logoutUsuario,
    // Importar las nuevas funciones de reseteo de password
    solicitarReseteoPassword,
    resetearPassword,
    // TODO: Importar controladores para verificacion de email
    // verificarEmail,
    // reenviarVerificacionEmail,
} from '../controllers/authController.js'; // Importar todos los controladores de autenticación
import { handleValidationErrors } from '../middlewares/validationMiddleware.js'; // Importar manejador de validaciones
// import { protegerRuta } from '../middlewares/authMiddleware.js'; // No se usa directamente aquí para estas rutas básicas de auth

const router = express.Router();

// --- Reglas de Validación ---

// Reglas para el endpoint de Registro
const registroValidationRules = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isString().withMessage('El nombre debe ser una cadena de texto.'),
    body('apellido')
        .trim()
        .notEmpty().withMessage('El apellido es obligatorio.')
        .isString().withMessage('El apellido debe ser una cadena de texto.'),
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('Por favor, introduce un formato de email válido.')
        .normalizeEmail(), // Estandariza el email (ej. minúsculas)
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    // Opcionales (si los envías, se validan; si no, se ignoran gracias a 'optional')
    body('telefono')
        .optional({ checkFalsy: true }) // checkFalsy: true trata "", 0, false, null, undefined como ausente
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
        .matches(/^\d{2}-\d{8}-\d{1}$/).withMessage('CUIT inválido. Formato esperado: XX-XXXXXXXX-X (con guiones).')
        // Si quieres permitir CUIT sin guiones y validarlo, la regex sería más compleja
        // o podrías tener una función de sanitización antes de la validación.
];

// Reglas para el endpoint de Login
const loginValidationRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('Por favor, introduce un formato de email válido.')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.'),
];


// --- NUEVAS Reglas de Validación para RESESTEO DE CONTRASEÑA ---

// Reglas para solicitar reseteo de password (solo validar el email en el body)
const solicitarReseteoValidationRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio para solicitar el reseteo.')
        .isEmail().withMessage('Por favor, introduce un formato de email válido.')
        .normalizeEmail(),
];

// Reglas para resetear password (recibe token en param y nueva password en body)
const resetearPasswordValidationRules = [
    param('token') // Validar el parámetro 'token' en la URL
        .notEmpty().withMessage('El token de reseteo es obligatorio en la URL.')
        // No validamos si es MongoID aquí, ya que es un token aleatorio hexadecimal
        .isString().withMessage('El token debe ser una cadena de texto válida.'), // Opcional: Podrías añadir más validación de formato si sabes cómo genera crypto el token (ej. longitud esperada)
    body('password') // Este es el campo de la NUEVA contraseña en el body
        .notEmpty().withMessage('La nueva contraseña es obligatoria.')
        .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),
     // TODO: Opcional: Validar campo de confirmación de password si se añade en el frontend
     // body('passwordConfirm').custom((value, { req }) => {
     //     if (value !== req.body.password) {
     //         throw new Error('Las contraseñas no coinciden');
     //     }
     //     return true; // Indica éxito en la validación custom
     // }).withMessage('Las contraseñas no coinciden'),
];


// --- Definición de Rutas ---

router.post(
    '/registrar',
    registroValidationRules,  // 1. Ejecutar reglas de validación
    handleValidationErrors,   // 2. Manejar errores de validación (si los hay)
    registrarUsuario          // 3. Si no hay errores, ejecutar el controlador
);

router.post(
    '/login',
    loginValidationRules,
    handleValidationErrors,
    loginUsuario
);

router.post('/logout', logoutUsuario); // Logout no suele necesitar validación del body

// --- NUEVAS RUTAS PARA RESESTEO DE CONTRASEÑA ---

// Ruta para solicitar el email de reseteo
// El frontend llamará a esta ruta cuando el usuario haga clic en "¿Olvidaste tu contraseña?"
router.post(
    '/solicitar-reseteo-password',
    solicitarReseteoValidationRules, // Valida el email del body
    handleValidationErrors,
    solicitarReseteoPassword
);

// Ruta para resetear la contraseña usando el token
// El frontend llamará a esta ruta (probablemente con método PUT)
// El usuario llegará a una URL tipo /resetpassword?token=XYZ en el frontend,
// y el frontend tomará el token de la URL y lo enviará en el param de esta petición PUT.
router.put(
    '/resetear-password/:token', // El token va en el parámetro de la URL
    resetearPasswordValidationRules, // Valida el token del param y la nueva password del body
    handleValidationErrors,
    resetearPassword
);

// TODO: Rutas para verificación de email
// router.get('/verificar-email/:tokenVerificacion', verificarEmail);
// router.post('/reenviar-verificacion', protegerRuta, reenviarVerificacionEmail);


export default router;