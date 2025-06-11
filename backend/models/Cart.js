// backend/models/Cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
    {
        producto: { // Referencia al producto
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        nombre: { // Guardamos el nombre para fácil visualización, aunque podría cambiar en el producto original
            type: String,
            required: true,
        },
        cantidad: {
            type: Number,
            required: true,
            min: [1, 'La cantidad debe ser al menos 1'],
            default: 1,
        },
        precio: { // Precio unitario al momento de agregar al carrito (importante si los precios cambian)
            type: Number,
            required: true,
        },
        imagen: { // URL de la imagen principal del producto para fácil visualización
            type: String,
        },
        // Podrías añadir SKU aquí también si es útil
    },
    {
        _id: true, // Cada item del carrito tendrá su propio _id para facilitar su actualización/eliminación
                  // Si quisieras usar producto._id como identificador del item, pondrías _id: false y usarías producto._id.
                  // Pero tener un _id propio para el item de carrito es más flexible.
    }
);

const cartSchema = new mongoose.Schema(
    {
        usuario: { // Usuario dueño del carrito
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // Cada usuario tiene un solo carrito activo
        },
        items: [cartItemSchema],
        // Podríamos añadir un campo 'activo' si quisiéramos manejar carritos abandonados vs. activos,
        // pero para empezar, asumimos que el carrito de un usuario siempre es su carrito "activo".
        // También podrías añadir un subtotal o total calculado, pero es mejor calcularlo dinámicamente
        // al obtener el carrito para asegurar que los precios estén actualizados si hay cambios.
    },
    {
        timestamps: true, // createdAt, updatedAt para el carrito en general
    }
);

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;