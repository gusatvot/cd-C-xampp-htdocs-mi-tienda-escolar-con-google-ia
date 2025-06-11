// backend/controllers/orderController.js
import asyncHandler from '../utils/asyncHandler.js'; // Importa el wrapper para manejo de errores asíncronos
import Order from '../models/Order.js'; // Importa el modelo de Orden
import Cart from '../models/Cart.js'; // Importa el modelo de Carrito (para obtener ítems y vaciar)
import Product from '../models/Product.js'; // Importa el modelo de Producto (para actualizar stock y obtener detalles)
import dotenv from 'dotenv'; // Para cargar variables de entorno
import sendEmail from '../utils/emailSender.js'; // Importa la utilidad para enviar emails
import User from '../models/User.js'; // Importa el modelo de Usuario (para obtener datos para emails)

dotenv.config(); // Carga las variables de entorno desde .env

// TODO: Importar componentes necesarios del SDK de Mercado Pago si se decide integrar aquí
// import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
// TODO: Inicializar el cliente de Mercado Pago aquí si se integran pagos en este controlador
// const client = new MercadoPagoConfig({ access_token: process.env.MERCADOPAGO_ACCESS_TOKEN_TEST });


// --- Funciones Helper ---

// TODO: Si la lógica compleja de cálculo de precios (base vs mayorista) se necesita en otros controladores,
// podría sacarse a una utilidad en utils o un servicio. Por ahora, está en cartController.js


// --- FUNCIONES DE GESTIÓN DE ÓRDENES ---

// @desc    Crear nueva orden a partir del carrito del usuario logueado
// @route   POST /api/ordenes
// @access  Private (solo usuarios autenticados)
const crearOrden = asyncHandler(async (req, res) => {
    // Datos recibidos en el body, validados por express-validator en la ruta
    const { direccionEnvio, metodoPago, precioEnvio = 0, precioImpuestos = 0 } = req.body;

    // 1. Obtener el carrito del usuario logueado (req.user._id lo provee protegerRuta)
    // Populamos los detalles del producto para validar stock y tener su info
    const carrito = await Cart.findOne({ usuario: req.user._id }).populate('items.producto');

    // Verificar si el carrito existe y tiene ítems
    if (!carrito || carrito.items.length === 0) {
        res.status(400); // Bad Request
        throw new Error('No hay ítems en el carrito para crear una orden');
    }

    // 2. Validar stock y preparar la lista de ítems para la orden (copiando datos esenciales)
    const itemsPedido = [];
    let precioItemsTotal = 0; // Calcular subtotal de ítems

    for (const itemCarrito of carrito.items) {
        // Es crucial volver a buscar el producto en DB para validar stock en el momento exacto de la orden
        const productoEnDB = await Product.findById(itemCarrito.producto._id);

        if (!productoEnDB) {
            // Si el producto ya no existe en el catálogo, no podemos crear la orden
            res.status(404); // Not Found
            throw new Error(`Producto con ID ${itemCarrito.producto._id} no encontrado en el catálogo.`);
        }

        if (productoEnDB.stock < itemCarrito.cantidad) {
            // Si el stock es insuficiente para la cantidad solicitada
            res.status(400); // Bad Request
            throw new Error(`Stock insuficiente para el producto: ${productoEnDB.nombre}. Solicitado: ${itemCarrito.cantidad}, Disponible: ${productoEnDB.stock}`);
        }

        // Copiar los datos relevantes del item del carrito/producto al objeto de item de orden
        itemsPedido.push({
            nombre: itemCarrito.nombre, // Nombre del item en el momento de agregarlo al carrito
            cantidad: itemCarrito.cantidad,
            imagen: itemCarrito.imagen, // Imagen del item en el momento de agregarlo al carrito
            precio: itemCarrito.precio, // Precio unitario del item en el momento de agregarlo al carrito (ya con lógica mayorista)
            producto: productoEnDB._id, // Referencia al _id del producto original
            // TODO: Copiar más campos del producto si son relevantes para la orden (ej: sku)
            // sku: productoEnDB.sku,
        });

        precioItemsTotal += itemCarrito.precio * itemCarrito.cantidad; // Sumar al total de ítems
    }

    // 3. Calcular precio total final de la orden
    // Asegurarse de que los precios opcionales sean números
    const precioEnvioNum = Number(precioEnvio);
    const precioImpuestosNum = Number(precioImpuestos);

    const precioTotalOrden = precioItemsTotal + precioEnvioNum + precioImpuestosNum;

    // 4. Crear el documento de la orden en la base de datos
    const orden = new Order({
        usuario: req.user._id, // El usuario logueado es el creador de la orden
        itemsPedido, // La lista de ítems preparada
        direccionEnvio, // El objeto de dirección del body (ya validado)
        metodoPago, // El método de pago del body (ya validado)
        precioItems: precioItemsTotal,
        precioImpuestos: precioImpuestosNum,
        precioEnvio: precioEnvioNum,
        precioTotal: precioTotalOrden,
        // estadoPedido, estaPagado, estaEntregado usarán sus valores por defecto ('pendiente_pago', false, false)
    });

    const ordenCreada = await orden.save(); // Guardar la nueva orden en la DB

    // 5. Actualizar stock de productos: Reducir el stock de cada producto comprado
    for (const item of ordenCreada.itemsPedido) {
        // Buscamos el producto de nuevo (aunque ya lo hicimos antes) o podríamos usar el productoEnDB si lo guardamos
        const producto = await Product.findById(item.producto);
        if (producto) {
            producto.stock -= item.cantidad; // Reducir la cantidad comprada
            await producto.save(); // Guardar la actualización de stock
        }
        // TODO: Manejar caso si un producto fue eliminado justo después de la validación de stock y antes de esta reducción. Es un caso raro.
    }

    // 6. Vaciar el carrito del usuario una vez que la orden ha sido creada exitosamente
    carrito.items = []; // Establecer el array de ítems a vacío
    await carrito.save(); // Guardar el carrito vacío

    // 7. Enviar email de confirmación de orden creada
    try {
        // Para enviar el email, necesitamos los datos del usuario (email, nombre)
        // La ordenCreada solo tiene el ID del usuario. Lo buscamos.
        const usuario = await User.findById(ordenCreada.usuario).select('nombre email');
        if(usuario){
            const emailSubject = `Confirmación de tu pedido #${ordenCreada._id} en Mi Tienda Escolar`;
            // TODO: Mejorar el cuerpo del email. Incluir lista de ítems del pedido. Usar plantilla HTML.
            const emailMessage = `Hola ${usuario.nombre},\n\n¡Gracias por tu pedido! Tu pedido #${ordenCreada._id} ha sido recibido y está pendiente de pago.\n\nEl total de tu pedido es: $${ordenCreada.precioTotal.toFixed(2)}\nMétodo de pago: ${ordenCreada.metodoPago}\nDirección de envío: ${ordenCreada.direccionEnvio.calle} ${ordenCreada.direccionEnvio.numero}, ${ordenCreada.direccionEnvio.ciudad}, ${ordenCreada.direccionEnvio.provincia}\n\nPuedes ver los detalles de tu pedido aquí: [URL a tu frontend para ver orden, usando ordenCreada._id]\n\nTe notificaremos cuando el pago sea confirmado y tu pedido sea enviado.\n\nSaludos,\nEl equipo de Mi Tienda Escolar`;

            await sendEmail({
                email: usuario.email, // Destinatario
                subject: emailSubject, // Asunto
                message: emailMessage, // Cuerpo (texto plano)
                // TODO: Añadir html: '<h1>...</h1>' si usas plantilla HTML
            });
            console.log(`Email de confirmación de orden creada enviado a ${usuario.email} para orden ${ordenCreada._id}`);
        } else {
             // Si no encontramos al usuario (muy raro), logueamos el error
             console.error(`Usuario ${ordenCreada.usuario} no encontrado para enviar email de confirmación de orden ${ordenCreada._id}`);
        }

    } catch (emailError) {
        // Si falla el envío de email, no hacer fallar la creación de la orden. Solo loguear el error.
        console.error(`Error al enviar email de confirmación de orden ${ordenCreada._id}:`, emailError);
        // TODO: Considerar un sistema de logging de errores de emails o reintentos en producción.
    }
    // ----------------------------------------------------------

    // 8. Responder al cliente con la orden creada
    res.status(201).json(ordenCreada); // 201 Created
});


// @desc    Obtener orden por ID (para usuario dueño o admin)
// @route   GET /api/ordenes/:id
// @access  Private
const obtenerOrdenPorId = asyncHandler(async (req, res) => {
    // El ID de la orden es validado por express-validator en la ruta
    const orden = await Order.findById(req.params.id)
        .populate('usuario', 'nombre email') // Popular datos básicos del usuario que hizo la orden
        .populate('itemsPedido.producto', 'nombre sku'); // Popular nombre y sku del producto en cada item del pedido

    if (orden) {
        // Verificar si el usuario logueado es el dueño de la orden O es un administrador
        if (orden.usuario._id.toString() === req.user._id.toString() || req.user.rol === 'admin') {
            res.json(orden); // Devolver la orden
        } else {
            res.status(403); // Forbidden - No tiene permisos para ver esta orden
            throw new Error('No autorizado para ver esta orden');
        }
    } else {
        res.status(404); // Not Found
        throw new Error('Orden no encontrada');
    }
});

// @desc    Obtener todas las órdenes del usuario logueado
// @route   GET /api/ordenes/mis-ordenes
// @access  Private
const obtenerMisOrdenes = asyncHandler(async (req, res) => {
    // El usuario logueado es req.user._id (establecido por protegerRuta)
    // Buscar todas las órdenes de este usuario y ordenarlas por fecha de creación descendente
    const ordenes = await Order.find({ usuario: req.user._id }).sort({ createdAt: -1 });
    res.json(ordenes); // Devolver la lista de órdenes
});

// --- FUNCIONES DE GESTIÓN DE ÓRDENES (SOLO PARA ADMINISTRADORES) ---

// @desc    Obtener todas las órdenes del sistema (Admin)
// @route   GET /api/ordenes
// @access  Private/Admin
const obtenerTodasLasOrdenes = asyncHandler(async (req, res) => {
    // Podemos añadir paginación, filtros (por estado, usuario, fecha), y ordenamiento aquí en el futuro
    const ordenes = await Order.find({})
        .populate('usuario', 'id nombre email') // Popular datos básicos del usuario para el listado
        .sort({ createdAt: -1 }); // Ordenar por fecha descendente (más recientes primero)
    res.json(ordenes); // Devolver la lista de todas las órdenes
});


// @desc    Actualizar orden a pagada (Admin o mediante webhook de pago)
// @route   PUT /api/ordenes/:id/pagar
// @access  Private/Admin (o ruta especial para webhook de Mercado Pago si no se procesa en webhookMercadoPago)
// NOTA: Si usas webhook, la actualización real debería ocurrir principalmente en el webhook,
// esta ruta Admin es para marcarlas manualmente si es necesario o para reintentos.
const actualizarOrdenAPagada = asyncHandler(async (req, res) => {
    // El ID de la orden es validado por express-validator en la ruta
    const orden = await Order.findById(req.params.id);

    if (orden) {
        if (orden.estaPagado) {
            res.status(400); // Bad Request - La orden ya está pagada
            throw new Error('La orden ya ha sido pagada');
        }

        // Actualizar el estado de pago y la fecha
        orden.estaPagado = true;
        orden.pagadoEn = Date.now();
        // Si el estado actual es pendiente_pago, cambiarlo a procesando.
        // Si ya está en otro estado (ej. cancelado, pago_fallido), no lo cambiamos automáticamente.
        if (orden.estadoPedido === 'pendiente_pago') {
             orden.estadoPedido = 'procesando';
        }

        // TODO: Si se recibe información de pago (ej. desde un webhook o body de petición), guardarla en orden.resultadoPago
        // orden.resultadoPago = { id: '...', status: 'approved', update_time: new Date().toISOString(), email_address: '...' };

        const ordenActualizada = await orden.save(); // Guardar los cambios

        // TODO: Enviar email de confirmación de pago al usuario
         try {
            const usuario = await User.findById(ordenActualizada.usuario).select('nombre email');
            if(usuario){
                const emailSubject = `¡Pago confirmado para tu pedido #${ordenActualizada._id} en Mi Tienda Escolar!`;
                // TODO: Mejorar cuerpo del email.
                const emailMessage = `Hola ${usuario.nombre},\n\n¡Tu pago para el pedido #${ordenActualizada._id} ha sido confirmado exitosamente!\n\nTu pedido ahora está siendo procesado y preparado para el envío.\n\nSaludos,\nEl equipo de Mi Tienda Escolar`;

                await sendEmail({ email: usuario.email, subject: emailSubject, message: emailMessage });
                console.log(`Email de confirmación de pago enviado a ${usuario.email} para orden ${ordenActualizada._id}`);
            } else { console.error(`Usuario ${ordenActualizada.usuario} no encontrado para enviar email de confirmación de pago ${ordenActualizada._id}`); }
        } catch (emailError) { console.error(`Error al enviar email de confirmación de pago ${ordenActualizada._id}:`, emailError); }
        // ---------------------------------------------------

        res.json(ordenActualizada); // Devolver la orden actualizada
    } else {
        res.status(404); // Not Found
        throw new Error('Orden no encontrada');
    }
});

// @desc    Actualizar orden a entregada (Admin)
// @route   PUT /api/ordenes/:id/entregar
// @access  Private/Admin
const actualizarOrdenAEntregada = asyncHandler(async (req, res) => {
    // El ID de la orden es validado por express-validator en la ruta
    const orden = await Order.findById(req.params.id);

    if (orden) {
        // Verificar si ya está pagada (usualmente una orden se entrega solo si está pagada)
        if (!orden.estaPagado) {
            res.status(400); // Bad Request
            throw new Error('La orden no puede marcarse como entregada si no ha sido pagada');
        }
        // Verificar si ya estaba marcada como entregada
        if (orden.estaEntregado) {
            res.status(400); // Bad Request
            throw new Error('La orden ya ha sido marcada como entregada');
        }

        // Actualizar el estado de entrega y la fecha
        orden.estaEntregado = true;
        orden.entregadoEn = Date.now();
         // Si el estado actual no es ya "entregado", cambiarlo
        if (orden.estadoPedido !== 'entregado') {
             orden.estadoPedido = 'entregado';
        }

        const ordenActualizada = await orden.save(); // Guardar los cambios

        // TODO: Enviar email de notificación de entrega al usuario
         try {
            const usuario = await User.findById(ordenActualizada.usuario).select('nombre email');
            if(usuario){
                const emailSubject = `¡Tu pedido #${ordenActualizada._id} ha sido entregado en Mi Tienda Escolar!`;
                 // TODO: Mejorar cuerpo del email.
                const emailMessage = `Hola ${usuario.nombre},\n\n¡Tu pedido #${ordenActualizada._id} ha sido marcado como entregado!\n\nEsperamos que disfrutes tus productos.\n\nSaludos,\nEl equipo de Mi Tienda Escolar`;

                await sendEmail({ email: usuario.email, subject: emailSubject, message: emailMessage });
                console.log(`Email de notificación de entrega enviado a ${usuario.email} para orden ${ordenActualizada._id}`);
            } else { console.error(`Usuario ${ordenActualizada.usuario} no encontrado para enviar email de notificación de entrega ${ordenActualizada._id}`); }
        } catch (emailError) { console.error(`Error al enviar email de notificación de entrega ${ordenActualizada._id}:`, emailError); }
        // -----------------------------------------------------

        res.json(ordenActualizada); // Devolver la orden actualizada
    } else {
        res.status(404); // Not Found
        throw new Error('Orden no encontrada');
    }
});

// @desc    Actualizar estado de la orden (Admin) - Para otros estados como 'enviado', 'cancelado', 'pago_fallido'
// @route   PUT /api/ordenes/:id/estado
// @access  Private/Admin
const actualizarEstadoOrden = asyncHandler(async (req, res) => {
    // ID en param y nuevoEstado en body son validados por express-validator en la ruta
    const { nuevoEstado } = req.body;
    const orden = await Order.findById(req.params.id);

    // express-validator ya verifica si el estado es uno de los valores válidos del enum.

    if (orden) {
         const estadoAnterior = orden.estadoPedido; // Guardamos el estado anterior para lógica condicional

        // Lógica para reintegro de stock si se cancela desde un estado post-pago
        // Esto solo debería ocurrir si el estado anterior no era 'pendiente_pago' y el nuevo estado es 'cancelado'
        if (nuevoEstado === 'cancelado' && estadoAnterior !== 'pendiente_pago') {
             // Reintegrar stock
             for (const item of orden.itemsPedido) {
                 const producto = await Product.findById(item.producto);
                 if (producto) {
                     producto.stock += item.cantidad; // Sumar la cantidad de vuelta al stock
                     await producto.save(); // Guardar la actualización del stock
                     console.log(`Stock reintegrado para producto ${item.nombre}: +${item.cantidad}. Nuevo stock: ${producto.stock}`);
                 } else {
                     // Loguear una advertencia si el producto ya no existe al intentar reintegrar stock
                     console.warn(`Producto ${item.producto} no encontrado al reintegrar stock para orden ${orden._id}.`);
                 }
             }
             // Al cancelar, marcamos como no pagada y no entregada lógicamente
             orden.estaPagado = false;
             orden.estaEntregado = false;
        }

        // Actualizar el estado principal de la orden
        orden.estadoPedido = nuevoEstado;


        // Lógica adicional para asegurar consistencia de banderas estaPagado/estaEntregado (opcional, pero buena práctica)
        if (nuevoEstado === 'entregado') {
            orden.estaEntregado = true;
            orden.entregadoEn = orden.entregadoEn || Date.now(); // Registrar fecha si no estaba ya registrada
            // Una orden entregada debe estar pagada
             if (!orden.estaPagado) {
                 orden.estaPagado = true;
                 orden.pagadoEn = orden.pagadoEn || Date.now();
             }
        } else if (nuevoEstado === 'cancelado' || nuevoEstado === 'pago_fallido') {
             orden.estaPagado = false;
             orden.estaEntregado = false;
        } else if (nuevoEstado === 'procesando' && !orden.estaPagado) {
             // Si un admin marca manualmente a procesando y no estaba pagada, asumimos que sí lo está
             orden.estaPagado = true;
             orden.pagadoEn = orden.pagadoEn || Date.now();
        }


        const ordenActualizada = await orden.save(); // Guardar los cambios

        // TODO: Enviar email de notificación de cambio de estado (más genérico o específico según el estado)
        // Esta lógica puede volverse compleja para manejar todos los estados.
        // Puedes enviar un email genérico o solo para algunos estados clave (ej. 'enviado', 'cancelado').
         try {
            const usuario = await User.findById(ordenActualizada.usuario).select('nombre email');
            if(usuario){
                let emailSubject = `Actualización del estado de tu pedido #${ordenActualizada._id}`;
                let emailMessage = `Hola ${usuario.nombre},\n\nEl estado de tu pedido #${ordenActualizada._id} ha cambiado a: ${ordenActualizada.estadoPedido}\n\nSaludos,\nEl equipo de Mi Tienda Escolar`;
                // TODO: Personalizar el cuerpo del email según el nuevo estado si es necesario
                // if(ordenActualizada.estadoPedido === 'enviado') emailMessage = 'Tu pedido ha sido enviado y está en camino...';
                // else if(ordenActualizada.estadoPedido === 'cancelado') emailMessage = 'Tu pedido ha sido cancelado según tu solicitud o por un problema con el pago...';

                await sendEmail({ email: usuario.email, subject: emailSubject, message: emailMessage });
                console.log(`Email de cambio de estado (${ordenActualizada.estadoPedido}) enviado a ${usuario.email} para orden ${ordenActualizada._id}`);
            } else { console.error(`Usuario ${ordenActualizada.usuario} no encontrado para enviar email de cambio de estado ${ordenActualizada._id}`); }
        } catch (emailError) { console.error(`Error al enviar email de cambio de estado ${ordenActualizada._id}:`, emailError); }
        // -----------------------------------------------------


        res.json(ordenActualizada); // Devolver la orden actualizada
    } else {
        res.status(404); // Not Found
        throw new Error('Orden no encontrada');
    }
});


// --- FUNCIONES DE ESTADÍSTICAS (SOLO PARA ADMINISTRADORES) ---
// NOTA: Estas funciones están agrupadas en este controlador,
// pero lógicamente obtenerProductosStockBajo podría ir en productController.js

// @desc    Obtener estadísticas generales de órdenes (total, por estado, ventas)
// @route   GET /api/ordenes/stats/generales
// @access  Private/Admin
const obtenerEstadisticasGeneralesOrdenes = asyncHandler(async (req, res) => {
    // Conteo total de órdenes
    const totalOrdenes = await Order.countDocuments();

    // Conteo de órdenes por estado usando Aggregation Pipeline
    const conteoPorEstado = await Order.aggregate([
        {
            $group: { // Agrupar documentos por el valor del campo 'estadoPedido'
                _id: '$estadoPedido', // El valor del campo 'estadoPedido' se convierte en el _id del grupo
                total: { $sum: 1 } // Contar cuántos documentos hay en cada grupo
            }
        },
         {
            $project: { // Proyectar la salida para renombrar _id a 'estado'
                _id: 0, // Excluir el _id por defecto de la agregación
                estado: '$_id', // Renombrar el _id del grupo a 'estado'
                total: 1 // Incluir el campo total
            }
        }
    ]);

    // Total de ventas (sumar precioTotal solo de órdenes pagadas)
    const ventasTotales = await Order.aggregate([
        { $match: { estaPagado: true } }, // $match filtra los documentos (solo pagadas)
        {
            $group: { // Agrupar todos los documentos restantes en un solo grupo
                _id: null, // Usar null como _id agrupa todo en un solo documento de salida
                totalVentas: { $sum: '$precioTotal' } // Sumar el valor del campo precioTotal
            }
        },
         {
            $project: { // Proyectar la salida para excluir el _id nulo
                _id: 0,
                totalVentas: 1
            }
        }
    ]);

     // TODO: Añadir reportes de ventas por período (ej. último mes) - Requiere manejo de fechas (ej. con Moment.js)
     // Necesitarías filtrar por fecha de pago (`pagadoEn`) y agrupar por día/mes/año.
     // const inicioPeriodo = moment().subtract(X, 'unidad').startOf('dia').toDate();
     // const ventasPorPeriodo = await Order.aggregate([
     //     { $match: { estaPagado: true, pagadoEn: { $gte: inicioPeriodo } } },
     //     { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$pagadoEn" } }, dailyTotal: { $sum: "$precioTotal" } } }, // Agrupar por día
     //     { $sort: { _id: 1 } } // Ordenar por fecha
     // ]);


    res.json({
        totalOrdenes, // Total general
        conteoPorEstado, // Conteo por cada estado
        ventasTotales: ventasTotales.length > 0 ? ventasTotales[0].totalVentas : 0 // Suma total de ventas (0 si no hay ventas pagadas)
        // TODO: Añadir ventasPorPeriodo u otros reportes aquí
    });
});

// @desc    Obtener productos con stock bajo (Admin)
// @route   GET /api/ordenes/stats/stock-bajo
// @access  Private/Admin
// NOTA: Esta función lógicamente podría ir en productController.js,
// pero la incluimos aquí por ahora para agrupar las estadísticas.
const obtenerProductosStockBajo = asyncHandler(async (req, res) => {
    // El query param 'limite' es validado por express-validator en la ruta.
    // Usamos 10 por defecto si el query param no se envía, es inválido o negativo.
    const limiteStockBajo = Number(req.query.limite) || 10;
    const limiteFinal = limiteStockBajo < 0 ? 0 : limiteStockBajo; // Asegurar que el límite no sea negativo

    const productos = await Product.find({ stock: { $lte: limiteFinal } }) // Buscar productos donde stock es Menor o Igual al límite
        .select('nombre sku stock') // Devolver solo los campos relevantes: nombre, sku, stock
        .sort({ stock: 1 }); // Ordenar por stock de menor a mayor (los de menor stock primero)

    res.json(productos); // Devolver la lista de productos con stock bajo
});


// --- Exportar todas las funciones ---
// Asegúrate de que todas las funciones definidas ARRIBA estén listadas AQUÍ para poder importarlas en las rutas.
export {
    crearOrden,
    obtenerOrdenPorId,
    obtenerMisOrdenes,
    obtenerTodasLasOrdenes,
    actualizarOrdenAPagada,
    actualizarOrdenAEntregada,
    actualizarEstadoOrden,
    // Exportar las funciones de estadísticas
    obtenerEstadisticasGeneralesOrdenes,
    obtenerProductosStockBajo,
    // TODO: Exportar funciones relacionadas con pago si se decide mantenerlas en este controlador
    // crearPreferenciaDePago,
    // webhookMercadoPago
};