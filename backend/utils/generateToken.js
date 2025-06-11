// backend/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (res, userId, userRol) => {
    const token = jwt.sign({ userId, rol: userRol }, process.env.JWT_SECRET, {
        expiresIn: '30d', // El token expira en 30 días (puedes ajustarlo)
    });

    // Establecer JWT como una cookie HTTP-Only
    // Esto es más seguro que almacenarlo en localStorage en el frontend
    // ya que ayuda a prevenir ataques XSS.
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Usar https en producción
        sameSite: 'strict', // Ayuda a prevenir ataques CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en milisegundos
    });

    return token; // También devolvemos el token por si el frontend quiere usarlo (aunque la cookie es la principal)
};

export default generateToken;