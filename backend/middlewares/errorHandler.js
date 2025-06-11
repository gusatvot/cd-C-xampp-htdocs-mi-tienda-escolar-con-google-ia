// backend/middlewares/errorHandler.js
const notFound = (req, res, next) => {
    const error = new Error(`No encontrado - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // A veces puedes obtener un error con statusCode 200, lo cambiamos a 500
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Check para errores específicos de Mongoose como ObjectId mal formado (CastError)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Recurso no encontrado (ID mal formado)';
    }

    // Check para errores de validación de Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400;
        // Puedes formatear los mensajes de error de validación si quieres
        // message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Check para errores de duplicados de Mongoose (ej. email único)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `El valor para el campo '${field}' ya existe.`;
    }


    res.status(statusCode).json({
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };