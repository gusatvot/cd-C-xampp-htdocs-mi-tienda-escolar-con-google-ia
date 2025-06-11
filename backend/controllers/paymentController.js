// backend/controllers/paymentController.js
// Antes importabas así (y no funcionaba configure):
// import * as mercadopago from 'mercadopago';

// Ahora importamos la clase de configuración y los recursos necesarios
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'; // <--- CAMBIO AQUÍ

import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Mercado Pago creando una instancia de MercadoPagoConfig
// TODO: Usar credenciales de producción en entorno de producción
const client = new MercadoPagoConfig({ // <--- CAMBIO AQUÍ: Crear instancia
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_TEST, // O el token de producción
});

// Ahora, para crear preferencias o buscar pagos, usaremos esta instancia 'client'
// Por ejemplo:
// const preference = new Preference(client);
// const payment = new Payment(client);


// @desc    Crear una preferencia de pago en Mercado Pago para una orden
// @route   POST /api/pagos/crear-preferencia
// @access  Private
const crearPreferenciaDePago = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        res.status(400);
        throw new Error('Se requiere el ID de la orden (orderId)');
    }

    const orden = await Order.findById(orderId).populate('itemsPedido.producto');
    if (!orden) {
        res.status(404);
        throw new Error('Orden no encontrada');
    }

    if (orden.estaPagado) {
        res.status(400);
        throw new Error('Esta orden ya ha sido pagada');
    }

     // Verificar que el usuario logueado sea el dueño de la orden o sea admin
    if (orden.usuario.toString() !== req.user._id.toString() && req.user.rol !== 'admin') {
        res.status(403);
        throw new Error('No autorizado para procesar el pago de esta orden');
    }

    // Mapear los ítems de la orden al formato que espera Mercado Pago
    const itemsParaMP = orden.itemsPedido.map((item) => ({
        id: item.producto ? item.producto._id.toString() : item._id.toString(), // Usar ID del producto o del item si producto no está populado
        title: item.nombre,
        description: item.producto && item.producto.descripcion ? item.producto.descripcion.substring(0, 250) : item.nombre, // Descripción corta
        quantity: Number(item.cantidad),
        unit_price: Number(item.precio),
        currency_id: 'ARS', // Moneda (Ajusta según tu país)
        picture_url: item.imagen, // Opcional: URL de la imagen del producto
        // category_id: 'articulos_escolares', // Opcional: categoría general
    }));

    const preferenceBody = { // Este es el body que se envía a la API de preferencias
        items: itemsParaMP,
        payer: { // Información del pagador
            name: req.user.nombre,
            surname: req.user.apellido,
            email: req.user.email,
            // TODO: Añadir más datos del pagador si están disponibles en el User o la Orden
            // ...
        },
        back_urls: { // URLs a las que se redirigirá al usuario después del pago
            success: `${process.env.FRONTEND_URL}/orden/${orden._id}?pago=exitoso`,
            failure: `${process.env.FRONTEND_URL}/orden/${orden._id}?pago=fallido`,
            pending: `${process.env.FRONTEND_URL}/orden/${orden._id}?pago=pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook/mercadopago`,
        external_reference: orden._id.toString(),
        // statement_descriptor: "MI TIENDA",
        binary_mode: true,
    };

    try {
        // Ahora creamos una instancia de Preference usando el 'client' y luego llamamos a 'create'
        const preference = new Preference(client); // <--- USAR LA INSTANCIA 'client'
        const respuestaMP = await preference.create({ body: preferenceBody }); // <--- PASAR EL BODY ASÍ

        console.log('Preferencia de Mercado Pago creada:', respuestaMP.body);

        res.json({
            preferenceId: respuestaMP.body.id,
            init_point: respuestaMP.body.init_point,
            sandbox_init_point: respuestaMP.body.sandbox_init_point,
        });

    } catch (error) {
        console.error('Error al crear preferencia de Mercado Pago:', error.message);
        console.error('Detalles del error de MP:', error.cause);
        const errorMessage = error.message || 'Error desconocido al crear preferencia de pago en Mercado Pago';
        const errorStatus = error.status || 500;
        res.status(errorStatus);
        throw new Error(`Error en pasarela de pago: ${errorMessage}`);
    }
});


// @desc    Recibir notificaciones de webhook de Mercado Pago
// @route   POST /api/pagos/webhook/mercadopago
// @access  Public
const webhookMercadoPago = asyncHandler(async (req, res) => {
    const paymentQuery = req.query;
    const paymentBody = req.body;

    console.log('Webhook MercadoPago RECIBIDO');
    console.log('  Query:', paymentQuery);
    console.log('  Body:', paymentBody);

    try {
        if (paymentQuery.type === 'payment' || (paymentBody.type === 'payment' && paymentBody.action === 'payment.updated')) {
             const paymentId = paymentQuery.id || paymentBody.data?.id;

             if (!paymentId) {
                 console.log('Webhook MP: No se encontró paymentId.');
                 return res.status(200).send('OK - No paymentId');
             }

             console.log(`Webhook MP: Procesando notificación de pago con ID: ${paymentId}`);

             try {
                 // Ahora usamos la instancia de Payment asociada al 'client'
                 const paymentInstance = new Payment(client); // <--- USAR LA INSTANCIA 'client'
                 const payment = await paymentInstance.get({ id: Number(paymentId) }); // <--- USAR EL MÉTODO 'get' Y PASAR ID ASÍ

                 if (!payment || !payment.body) {
                     console.log(`Webhook MP: No se pudo obtener información del pago ${paymentId} desde MP.`);
                     return res.status(200).send('OK - Payment not found in MP API');
                 }

                 console.log('Webhook MP: Información del pago obtenida de MP API:', payment.body);

                 const externalReference = payment.body.external_reference;
                 const statusPagoMP = payment.body.status;
                 const transactionAmount = payment.body.transaction_amount;

                 const orden = await Order.findById(externalReference);

                 if (orden) {
                     if (statusPagoMP === 'approved' && !orden.estaPagado) {
                         // TODO: Opcional - Verificar que transactionAmount === orden.precioTotal

                         orden.estaPagado = true;
                         orden.pagadoEn = new Date(payment.body.date_approved || Date.now());
                         orden.estadoPedido = 'procesando';
                         orden.resultadoPago = {
                             id: payment.body.id.toString(),
                             status: statusPagoMP,
                             update_time: payment.body.date_last_updated || new Date().toISOString(),
                             email_address: payment.body.payer?.email,
                         };
                         await orden.save();
                         console.log(`Webhook MP: Orden ${orden._id} actualizada a pagada (status: ${statusPagoMP}).`);

                         // TODO: Enviar email de confirmación de pago al usuario
                         // ...

                     } else {
                         console.log(`Webhook MP: Pago con ID ${paymentId} para orden ${externalReference} tiene estado "${statusPagoMP}".`);
                         // Opcional: Lógica para 'rejected', 'cancelled', 'pending'
                         // ...
                     }
                 } else {
                     console.log(`Webhook MP: Orden con external_reference ${externalReference} no encontrada en la BD.`);
                 }

             } catch (apiError) {
                 console.error('Error al consultar pago a la API de MP desde el webhook:', apiError);
                 // ...
             }

        } else if (paymentQuery.type === 'test_notification') {
             console.log('Webhook MP: Recibida notificación de PRUEBA.');
        } else {
             console.log(`Webhook MP: Recibida notificación de tipo desconocido: ${paymentQuery.type || paymentBody.type}`);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('Error general en webhook de Mercado Pago:', error);
        res.status(500).send('Error procesando webhook');
    }
});


export { crearPreferenciaDePago, webhookMercadoPago };