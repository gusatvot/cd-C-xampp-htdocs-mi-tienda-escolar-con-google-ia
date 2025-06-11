// backend/models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre de la categoría es obligatorio'],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            trim: true,
            unique: true,
            lowercase: true,
            index: true, // Buen tener un índice en el slug para búsquedas
        },
        descripcion: {
            type: String,
            trim: true,
        },
        imagen: { // URL de la imagen de la categoría
            type: String,
            trim: true,
        },
        parent_id: { // Para subcategorías
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Referencia al mismo modelo 'Category'
            default: null,   // null si es una categoría padre
        },
        activa: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Añade createdAt y updatedAt
    }
);

// Middleware para generar slug ANTES de la validación y guardado
categorySchema.pre('validate', function(next) {
    if (this.isModified('nombre') && !this.slug) {
        this.slug = this.nombre
            .toLowerCase()
            .split(' ')
            .join('-')
            .replace(/[^\w-]+/g, ''); // Elimina caracteres no alfanuméricos excepto guiones
    } else if (this.slug) { // Si se provee un slug, asegurar su formato
         this.slug = this.slug
            .toLowerCase()
            .split(' ')
            .join('-')
            .replace(/[^\w-]+/g, '');
    }

    // Si después de esto el slug sigue vacío y el nombre no, generarlo
    if (!this.slug && this.nombre) {
         this.slug = this.nombre
            .toLowerCase()
            .split(' ')
            .join('-')
            .replace(/[^\w-]+/g, '');
    }
    next();
});

// Opcional: Hook para asegurar que el slug no esté vacío antes de guardar si es crítico
// y para manejar la lógica de unicidad del slug si se quiere un control más fino que el índice `unique`.
// categorySchema.pre('save', async function(next) {
//     if (!this.slug && this.nombre) {
//         this.slug = this.nombre.toLowerCase().split(' ').join('-').replace(/[^\w-]+/g, '');
//     }
//     // Mongoose maneja el error de unicidad del slug con `unique:true` en el schema.
//     next();
// });

const Category = mongoose.model('Category', categorySchema);

export default Category;