// backend/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// Middleware para proteger rutas (requiere token válido)
const protegerRuta = asyncHandler(async (req, res, next) => {
    let token;

    // Leer el JWT de la cookie 'jwt'
    token = req.cookies.jwt;

    if (token) {
        try {
            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Obtener el usuario del token (sin la contraseña) y adjuntarlo a req
            // Esto hace que los datos del usuario estén disponibles en las rutas protegidas
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('No autorizado, usuario no encontrado');
            }

            next(); // Continuar al siguiente middleware o controlador
        } catch (error) {
            console.error('Error de token:', error);
            res.status(401); // Unauthorized
            if (error.name === 'TokenExpiredError') {
                throw new Error('No autorizado, el token ha expirado');
            }
            throw new Error('No autorizado, token inválido');
        }
    } else {
        res.status(401); // Unauthorized
        throw new Error('No autorizado, no se encontró token');
    }
});

// Middleware para autorizar roles específicos
// Se usa DESPUÉS de protegerRuta
// Ejemplo: autorizarRoles('admin') o autorizarRoles('admin', 'mayorista')
const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            res.status(401); // Unauthorized
            throw new Error('No autorizado, rol de usuario no disponible');
        }
        if (!rolesPermitidos.includes(req.user.rol)) {
            res.status(403); // Forbidden
            throw new Error(
                `Acceso denegado. El rol '${req.user.rol}' no tiene permiso para acceder a este recurso.`
            );
        }
        next(); // El usuario tiene uno de los roles permitidos
    };
};

export { protegerRuta, autorizarRoles };