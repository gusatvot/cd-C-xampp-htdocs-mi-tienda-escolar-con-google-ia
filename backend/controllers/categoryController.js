// backend/controllers/categoryController.js
import asyncHandler from '../utils/asyncHandler.js';
import Category from '../models/Category.js';

// @desc    Crear una nueva categoría
// @route   POST /api/categorias
// @access  Private/Admin
const crearCategoria = asyncHandler(async (req, res) => {
    const { nombre, descripcion, imagen, parent_id, slug } = req.body;

    const categoriaExistenteNombre = await Category.findOne({ nombre });
    if (categoriaExistenteNombre) {
        res.status(400);
        throw new Error('Ya existe una categoría con ese nombre');
    }
    if (slug) {
        const categoriaExistenteSlug = await Category.findOne({ slug });
        if (categoriaExistenteSlug) {
            res.status(400);
            throw new Error('Ya existe una categoría con ese slug');
        }
    }

    const categoria = new Category({
        nombre,
        slug,
        descripcion,
        imagen,
        parent_id: parent_id || null,
    });

    const categoriaCreada = await categoria.save();
    res.status(201).json(categoriaCreada);
});

// @desc    Obtener todas las categorías
// @route   GET /api/categorias
// @access  Public
const obtenerCategorias = asyncHandler(async (req, res) => {
    const categorias = await Category.find({ activa: true })
        .populate('parent_id', 'nombre slug') // Popula el campo 'parent_id'
        .sort({ nombre: 1 }); // Ordenar alfabéticamente por nombre

    res.json(categorias);
});

// @desc    Obtener una categoría por ID o Slug
// @route   GET /api/categorias/:identificador
// @access  Public
const obtenerCategoriaPorIdOSlug = asyncHandler(async (req, res) => {
    const identificador = req.params.identificador;
    let categoria;

    if (identificador.match(/^[0-9a-fA-F]{24}$/)) { // Es un ObjectId válido?
        categoria = await Category.findById(identificador)
                            .populate('parent_id', 'nombre slug');
    }

    if (!categoria) { // Si no se encontró por ID o no era un ID, buscar por slug
        categoria = await Category.findOne({ slug: identificador, activa: true })
                            .populate('parent_id', 'nombre slug');
    }

    if (categoria) {
        res.json(categoria);
    } else {
        res.status(404);
        throw new Error('Categoría no encontrada');
    }
});

// @desc    Actualizar una categoría
// @route   PUT /api/categorias/:id
// @access  Private/Admin
const actualizarCategoria = asyncHandler(async (req, res) => {
    const { nombre, descripcion, imagen, parent_id, activa, slug } = req.body;
    const categoria = await Category.findById(req.params.id);

    if (categoria) {
        if (nombre && nombre !== categoria.nombre) {
            const existeNombre = await Category.findOne({ nombre, _id: { $ne: categoria._id } });
            if (existeNombre) {
                res.status(400);
                throw new Error('Ya existe otra categoría con ese nombre.');
            }
            categoria.nombre = nombre;
        }
        if (slug && slug !== categoria.slug) {
            const existeSlug = await Category.findOne({ slug, _id: { $ne: categoria._id } });
            if (existeSlug) {
                res.status(400);
                throw new Error('Ya existe otra categoría con ese slug.');
            }
            categoria.slug = slug;
        }

        categoria.descripcion = descripcion ?? categoria.descripcion;
        categoria.imagen = imagen ?? categoria.imagen;
        categoria.parent_id = parent_id !== undefined ? (parent_id || null) : categoria.parent_id;
        categoria.activa = activa !== undefined ? activa : categoria.activa;
        // El slug se actualiza si el nombre cambia (y no se provee slug) o si se provee un nuevo slug explícitamente
        // y es manejado por el hook pre('validate') del modelo.

        const categoriaActualizada = await categoria.save();
        res.json(categoriaActualizada);
    } else {
        res.status(404);
        throw new Error('Categoría no encontrada');
    }
});

// @desc    Eliminar una categoría
// @route   DELETE /api/categorias/:id
// @access  Private/Admin
const eliminarCategoria = asyncHandler(async (req, res) => {
    const categoria = await Category.findById(req.params.id);

    if (categoria) {
        // Opcional: Lógica para manejar productos o subcategorías antes de eliminar
        const subcategorias = await Category.countDocuments({ parent_id: categoria._id });
        if (subcategorias > 0) {
            res.status(400);
            throw new Error('No se puede eliminar. Esta categoría tiene subcategorías asociadas. Elimine o reasigne las subcategorías primero.');
        }
        // const productosEnCategoria = await Product.countDocuments({ categoria: categoria._id });
        // if (productosEnCategoria > 0) {
        //     res.status(400);
        //     throw new Error('No se puede eliminar. Hay productos asociados a esta categoría.');
        // }


        await Category.deleteOne({ _id: req.params.id });
        res.json({ message: 'Categoría eliminada correctamente' });
    } else {
        res.status(404);
        throw new Error('Categoría no encontrada');
    }
});

export {
    crearCategoria,
    obtenerCategorias,
    obtenerCategoriaPorIdOSlug,
    actualizarCategoria,
    eliminarCategoria,
};