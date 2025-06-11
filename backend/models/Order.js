// backend/models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true },
        cantidad: { type: Number, required: true },
        imagen: { type: String }, // URL de la imagen principal del producto
        precio: { type: Number, required: true }, // Precio unitario al momento de la orden
        producto: { // Referencia al producto original
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        // Podrías añadir SKU aquí también si es útil
    },
    {
        _id: false, // No necesitamos _id separados para los items de la orden,
                   // ya que son una instantánea y no se modifican individualmente después de crear la orden.
    }
);

const orderSchema = new mongoose.Schema(
    {
        usuario: { // Usuario que realizó el pedido
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        itemsPedido: [orderItemSchema],
        direccionEnvio: {
            // Copiamos la dirección aquí para que no cambie si el usuario actualiza sus direcciones después
            calle: { type: String, required: true },
            numero: { type: String, required: true },
            piso: { type: String },
            depto: { type: String },
            ciudad: { type: String, required: true },
            provincia: { type: String, required: true },
            codigoPostal: { type: String, required: true },
            pais: { type: String, default: 'Argentina' },
            // Podrías añadir un teléfono de contacto para el envío
        },
        metodoPago: {
            type: String,
            required: true,
            default: 'Pendiente', // Se actualizará cuando se elija/procese el pago
        },
        resultadoPago: { // Información devuelta por la pasarela de pago
            id: { type: String },         // ID de la transacción en la pasarela
            status: { type: String },    // ej. 'approved', 'pending', 'rejected'
            update_time: { type: String },// Fecha/hora de la actualización del pago
            email_address: { type: String },// Email del pagador (si la pasarela lo provee)
        },
        precioItems: { // Suma de (precio * cantidad) de todos los items
            type: Number,
            required: true,
            default: 0.0,
        },
        precioImpuestos: { // Si aplicas impuestos
            type: Number,
            required: true,
            default: 0.0,
        },
        precioEnvio: {
            type: Number,
            required: true,
            default: 0.0,
        },
        precioTotal: { // precioItems + precioImpuestos + precioEnvio
            type: Number,
            required: true,
            default: 0.0,
        },
        estadoPedido: {
            type: String,
            required: true,
            enum: ['pendiente_pago', 'procesando', 'enviado', 'entregado', 'cancelado'],
            default: 'pendiente_pago',
        },
        estaPagado: {
            type: Boolean,
            required: true,
            default: false,
        },
        pagadoEn: { // Fecha y hora en que se confirmó el pago
            type: Date,
        },
        estaEntregado: {
            type: Boolean,
            required: true,
            default: false,
        },
        entregadoEn: { // Fecha y hora en que se marcó como entregado
            type: Date,
        },
    },
    {
        timestamps: true, // createdAt (cuando se creó la orden), updatedAt
    }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;