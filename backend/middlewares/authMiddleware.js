// backend/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// Middleware para proteger rutas (requiere token válido)
const protegerRuta = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Buscar el token en el header Authorization (Formato esperado: Bearer TOKEN)
    // El frontend que usa localStorage lo enviará aquí.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Extraer el token del string 'Bearer TOKEN'
        token = req.headers.authorization.split(' ')[1];
        console.log('Middleware Auth: Token encontrado en header Authorization.'); // Log para depurar
    }
    // 2. Si no se encontró en el header, buscar en la cookie 'jwt' (Método original / fallback)
    // Esto es útil si aún usas o necesitas la cookie en otros flujos.
    else if (req.cookies && req.cookies.jwt) {
         token = req.cookies.jwt;
         console.log('Middleware Auth: Token encontrado en cookie JWT.'); // Log para depurar
    } else {
         console.log('Middleware Auth: No se encontró token en header ni cookie.'); // Log si no hay token
    }


    if (token) { // Si se encontró algún token en alguna de las ubicaciones
        try {
            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
             console.log('Middleware Auth: Token verificado. Decoded:', decoded); // Log para depurar

            // Obtener el usuario del payload del token (sin la contraseña) y adjuntarlo a req (req.user)
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                res.status(401); // Unauthorized
                throw new Error('No autorizado, usuario no encontrado'); // Usuario no existe en DB para este token
            }

            next(); // Token válido y usuario encontrado, continuar al siguiente middleware o controlador

        } catch (error) { // Si la verificación del token falla (inválido, expirado, etc.)
            console.error('Middleware Auth: Error verificando token:', error.message);
            res.status(401); // Unauthorized
            if (error.name === 'TokenExpiredError') {
                throw new Error('No autorizado, el token ha expirado');
            }
            // Si el token es inválido por otra razón (firma incorrecta, formato, etc.)
            throw new Error('No autorizado, token inválido');
        }
    } else { // Si no se encontró ningún token en header ni cookie
        res.status(401); // Unauthorized
        throw new Error('No autorizado, no se encontró token'); // No se encontró token en header ni cookie
    }
});

// Middleware para autorizar roles específicos
// Se usa DESPUÉS de protegerRuta. Ejemplo: autorizarRoles('admin', 'mayorista')
const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        // req.user debería estar disponible aquí si protegerRuta se ejecutó antes y tuvo éxito
        if (!req.user || !req.user.rol) {
            res.status(403); // Forbidden
            throw new Error('No autorizado, rol de usuario no disponible');
        }
        // Verificar si el rol del usuario está en la lista de roles permitidos
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