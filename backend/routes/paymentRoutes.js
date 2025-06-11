// backend/routes/paymentRoutes.js
import express from 'express';
import { body } from 'express-validator';
import {
    crearPreferenciaDePago,
    webhookMercadoPago,
} from '../controllers/paymentController.js';
import { protegerRuta } from '../middlewares/authMiddleware.js'; // Para proteger la creación de preferencia
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// --- Reglas de Validación ---
const crearPreferenciaRules = [
    body('orderId')
        .notEmpty().withMessage('El ID de la orden (orderId) es obligatorio.')
        .isMongoId().withMessage('El ID de la orden debe ser un ID de MongoDB válido.'),
];

// --- Definición de Rutas ---

// Endpoint para que el frontend solicite la creación de la preferencia de pago
// Requiere que el usuario esté logueado
router.post(
    '/crear-preferencia',
    protegerRuta, // Requiere usuario logueado
    crearPreferenciaRules, // Valida el body (solo orderId)
    handleValidationErrors,
    crearPreferenciaDePago
);

// Endpoint para recibir notificaciones de Webhook de Mercado Pago
// NOTA: Este endpoint DEBE ser PÚBLICO y NO DEBE requerir autenticación JWT
// Mercado Pago no envía cookies JWT.
router.post('/webhook/mercadopago', webhookMercadoPago);


export default router;