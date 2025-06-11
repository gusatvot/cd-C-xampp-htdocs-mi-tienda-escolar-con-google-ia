//backend/middlewares/validationMiddleware.js
import { validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         // Puedes formatear los errores como quieras
         // Aquí devolvemos el primer error encontrado para simplificar,
         // o podrías devolverlos todos.
        return res.status(400).json({
            message: 'Error de validación',
            errors: errors.array().map(err => ({
                param: err.param, // En versiones más nuevas de express-validator, podría ser err.path
                msg: err.msg,
                value: err.value
            }))
             // Alternativa: devolver solo el primer mensaje de error
             // message: errors.array()[0].msg
        });
    }
     next(); // Si no hay errores, continuar al siguiente middleware/controlador
};

export { handleValidationErrors };