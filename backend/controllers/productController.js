// backend/controllers/productController.js
import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js'; // Para validar que la categoría exista

// @desc    Crear un nuevo producto
// @route   POST /api/productos
// @access  Private/Admin
const crearProducto = asyncHandler(async (req, res) => {
    const {
        nombre,
        descripcion,
        sku,
        marca,
        categoria, // ID de la categoría
        precioBase,
        preciosMayorista,
        stock,
        imagenes, // Array de URLs de imágenes
        destacado,
        activo,
        unidadVenta,
        peso,
        dimensiones,
    } = req.body;

    // Validar que el SKU sea único
    const productoExistenteSKU = await Product.findOne({ sku });
    if (productoExistenteSKU) {
        res.status(400);
        throw new Error('Ya existe un producto con ese SKU');
    }

    // Validar que la categoría exista
    const categoriaExiste = await Category.findById(categoria);
    if (!categoriaExiste) {
        res.status(400);
        throw new Error('La categoría especificada no existe');
    }

    const producto = new Product({
        nombre,
        descripcion,
        sku,
        marca,
        categoria,
        precioBase,
        preciosMayorista: preciosMayorista || [],
        stock,
        imagenes: imagenes || [],
        destacado,
        activo,
        unidadVenta,
        peso,
        dimensiones,
        user: req.user._id, // Opcional: guardar quién creó/actualizó el producto
    });

    const productoCreado = await producto.save();
    res.status(201).json(productoCreado);
});

// @desc    Obtener todos los productos (con filtros, paginación, búsqueda)
// @route   GET /api/productos
// @access  Public
const obtenerProductos = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 10; // Productos por página
    const page = Number(req.query.pageNumber) || 1; // Número de página actual

    const keyword = req.query.keyword
        ? {
              $or: [ // Buscar en nombre, descripción o SKU
                  { nombre: { $regex: req.query.keyword, $options: 'i' } }, // i = case-insensitive
                  { descripcion: { $regex: req.query.keyword, $options: 'i' } },
                  { sku: { $regex: req.query.keyword, $options: 'i' } },
              ],
          }
        : {};

    const categoriaFilter = req.query.categoria
        ? { categoria: req.query.categoria } // Asume que se pasa el ID de la categoría
        : {};

    // Otros filtros que podrías añadir: marca, precioMin, precioMax, destacado, etc.

    const count = await Product.countDocuments({
        ...keyword,
        ...categoriaFilter,
        activo: true, // Solo productos activos para el público
    });

    const productos = await Product.find({
        ...keyword,
        ...categoriaFilter,
        activo: true,
    })
        .populate('categoria', 'nombre slug') // Popular datos de la categoría
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 }); // Ordenar por más nuevos, puedes cambiarlo

    res.json({
        productos,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
    });
});

// @desc    Obtener un producto por ID
// @route   GET /api/productos/:id
// @access  Public
const obtenerProductoPorId = asyncHandler(async (req, res) => {
    const producto = await Product.findById(req.params.id)
                            .populate('categoria', 'nombre slug');

    if (producto && producto.activo) { // Solo si el producto está activo (o si es admin, podría ver inactivos)
        res.json(producto);
    } else if (producto && !producto.activo && req.user && req.user.rol === 'admin') {
        // Permitir al admin ver productos inactivos
        res.json(producto);
    }
     else {
        res.status(404);
        throw new Error('Producto no encontrado o no está activo');
    }
});


// @desc    Actualizar un producto
// @route   PUT /api/productos/:id
// @access  Private/Admin
const actualizarProducto = asyncHandler(async (req, res) => {
    const {
        nombre,
        descripcion,
        sku,
        marca,
        categoria,
        precioBase,
        preciosMayorista,
        stock,
        imagenes,
        destacado,
        activo,
        unidadVenta,
        peso,
        dimensiones,
    } = req.body;

    const producto = await Product.findById(req.params.id);

    if (producto) {
        // Validar que el nuevo SKU (si cambia) no exista en OTRO producto
        if (sku && sku !== producto.sku) {
            const productoExistenteSKU = await Product.findOne({ sku, _id: { $ne: producto._id } });
            if (productoExistenteSKU) {
                res.status(400);
                throw new Error('Ya existe otro producto con ese SKU');
            }
            producto.sku = sku;
        }

        // Validar que la nueva categoría (si cambia) exista
        if (categoria && categoria.toString() !== producto.categoria.toString()) {
            const categoriaExiste = await Category.findById(categoria);
            if (!categoriaExiste) {
                res.status(400);
                throw new Error('La categoría especificada no existe');
            }
            producto.categoria = categoria;
        }

        producto.nombre = nombre ?? producto.nombre;
        producto.descripcion = descripcion ?? producto.descripcion;
        producto.marca = marca ?? producto.marca;
        producto.precioBase = precioBase ?? producto.precioBase;
        producto.preciosMayorista = preciosMayorista ?? producto.preciosMayorista;
        producto.stock = stock ?? producto.stock;
        producto.imagenes = imagenes ?? producto.imagenes;
        producto.destacado = destacado !== undefined ? destacado : producto.destacado;
        producto.activo = activo !== undefined ? activo : producto.activo;
        producto.unidadVenta = unidadVenta ?? producto.unidadVenta;
        producto.peso = peso ?? producto.peso;
        producto.dimensiones = dimensiones ?? producto.dimensiones;
        // producto.user = req.user._id; // Quién actualizó

        const productoActualizado = await producto.save();
        res.json(productoActualizado);
    } else {
        res.status(404);
        throw new Error('Producto no encontrado');
    }
});

// @desc    Eliminar un producto
// @route   DELETE /api/productos/:id
// @access  Private/Admin
const eliminarProducto = asyncHandler(async (req, res) => {
    const producto = await Product.findById(req.params.id);

    if (producto) {
        // Opcional: verificar si está en órdenes pendientes antes de eliminar,
        // o simplemente marcarlo como inactivo en lugar de eliminarlo realmente.
        // Por ahora, eliminación directa.
        await Product.deleteOne({ _id: req.params.id });
        res.json({ message: 'Producto eliminado correctamente' });
    } else {
        res.status(404);
        throw new Error('Producto no encontrado');
    }
});


export {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto,
};