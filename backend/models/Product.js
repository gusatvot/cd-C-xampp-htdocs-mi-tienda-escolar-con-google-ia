import mongoose from 'mongoose';

const precioMayoristaSchema = new mongoose.Schema({
    cantidadMinima: { type: Number, required: true, min: 1 },
    precio: { type: Number, required: true, min: 0 },
}, {_id: false}); // _id: false para no generar IDs para estos subdocumentos

const productSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre del producto es obligatorio'],
            trim: true,
        },
        descripcion: {
            type: String,
            required: [true, 'La descripción es obligatoria'],
        },
        sku: { // Stock Keeping Unit - Identificador único del producto
            type: String,
            required: [true, 'El SKU es obligatorio'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        marca: {
            type: String,
            trim: true,
        },
        categoria: { // Cambiado de categoria_id a solo categoria para claridad
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'La categoría es obligatoria'],
        },
        // subcategoria: { // Opcional si tienes subcategorías y quieres asignarlas directamente
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'Category',
        // },
        precioBase: { // Precio para clientes minoristas o base antes de descuento mayorista
            type: Number,
            required: [true, 'El precio base es obligatorio'],
            min: 0,
        },
        preciosMayorista: [precioMayoristaSchema], // Array de precios por volumen para mayoristas
        stock: {
            type: Number,
            required: [true, 'El stock es obligatorio'],
            default: 0,
            min: 0,
        },
        imagenes: [
            {
                type: String, // URLs de las imágenes
                trim: true,
            },
        ],
        destacado: { // Para mostrar en la home, por ejemplo
            type: Boolean,
            default: false,
        },
        activo: { // Para habilitar/deshabilitar producto de la vista pública
            type: Boolean,
            default: true,
        },
        unidadVenta: { // Ej: 'unidad', 'caja x10', 'docena', 'blister'
            type: String,
            default: 'unidad',
        },
        peso: { // En kg, para cálculo de envío
            type: Number,
            min: 0,
        },
        dimensiones: { // En cm, para cálculo de envío
            largo: { type: Number, min: 0 },
            ancho: { type: Number, min: 0 },
            alto: { type: Number, min: 0 },
        },
        // Puedes añadir campos como 'tags', 'material', 'color', etc.
    },
    {
        timestamps: true,
    }
);

// Índice para búsquedas comunes
productSchema.index({ nombre: 'text', descripcion: 'text', sku: 'text' }); // Para búsquedas de texto
productSchema.index({ categoria: 1 });
productSchema.index({ marca: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;