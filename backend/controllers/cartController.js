// backend/controllers/cartController.js
import asyncHandler from '../utils/asyncHandler.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js'; // Necesario para obtener datos del producto

// Función helper para calcular el precio correcto (base o mayorista)
// Esta función podría evolucionar o moverse a un servicio si la lógica de precios se vuelve más compleja
const calcularPrecioProducto = (producto, cantidad, rolUsuario, aprobadoMayorista) => {
    if (rolUsuario === 'mayorista' && aprobadoMayorista && producto.preciosMayorista && producto.preciosMayorista.length > 0) {
        // Ordenar precios mayoristas por cantidad mínima descendente para encontrar el mejor aplicable
        const preciosOrdenados = [...producto.preciosMayorista].sort((a, b) => b.cantidadMinima - a.cantidadMinima);
        for (const precioMayorista of preciosOrdenados) {
            if (cantidad >= precioMayorista.cantidadMinima) {
                return precioMayorista.precio;
            }
        }
    }
    return producto.precioBase; // Precio base por defecto
};


// @desc    Obtener el carrito del usuario logueado
// @route   GET /api/carrito
// @access  Private
const obtenerCarrito = asyncHandler(async (req, res) => {
    let carrito = await Cart.findOne({ usuario: req.user._id }).populate(
        'items.producto', // Populate el campo 'producto' dentro de cada item del array 'items'
        'nombre sku precioBase imagenes stock preciosMayorista categoria' // Campos a traer del producto
    );

    if (!carrito) {
        // Si el usuario no tiene carrito, creamos uno vacío
        carrito = await Cart.create({ usuario: req.user._id, items: [] });
    }

    // Opcional: Recalcular precios en el carrito si han cambiado en el catálogo
    // Por ahora, mantenemos los precios con los que se agregaron,
    // pero se podría añadir una lógica aquí para actualizar si es necesario.

    res.json(carrito);
});

// @desc    Agregar un item al carrito o actualizar su cantidad si ya existe
// @route   POST /api/carrito/items
// @access  Private
const agregarItemAlCarrito = asyncHandler(async (req, res) => {
    const { productoId, cantidad } = req.body;
    const cantidadNum = Number(cantidad) || 1;

    if (cantidadNum <= 0) {
        res.status(400);
        throw new Error('La cantidad debe ser un número positivo');
    }

    const producto = await Product.findById(productoId);
    if (!producto || !producto.activo) {
        res.status(404);
        throw new Error('Producto no encontrado o no está activo');
    }

    if (producto.stock < cantidadNum) {
        res.status(400);
        throw new Error('Stock insuficiente para la cantidad solicitada');
    }

    const carrito = await Cart.findOne({ usuario: req.user._id });
    if (!carrito) {
        res.status(404); // O podríamos crearlo aquí también
        throw new Error('Carrito no encontrado para el usuario. Intente obtener el carrito primero.');
    }

    const itemExistenteIndex = carrito.items.findIndex(
        (item) => item.producto.toString() === productoId
    );

    const precioCalculado = calcularPrecioProducto(producto, cantidadNum, req.user.rol, req.user.aprobadoMayorista);

    if (itemExistenteIndex > -1) {
        // El producto ya está en el carrito, actualizamos la cantidad
        const itemActual = carrito.items[itemExistenteIndex];
        const nuevaCantidad = itemActual.cantidad + cantidadNum;

        if (producto.stock < nuevaCantidad) {
            res.status(400);
            throw new Error('Stock insuficiente para la nueva cantidad total');
        }
        itemActual.cantidad = nuevaCantidad;
        // Podríamos recalcular el precio aquí si la nueva cantidad cambia el tramo mayorista
        itemActual.precio = calcularPrecioProducto(producto, nuevaCantidad, req.user.rol, req.user.aprobadoMayorista);

    } else {
        // El producto no está en el carrito, lo agregamos
        carrito.items.push({
            producto: productoId,
            nombre: producto.nombre,
            cantidad: cantidadNum,
            precio: precioCalculado,
            imagen: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : undefined,
        });
    }

    await carrito.save();
    // Populate después de guardar para devolver el carrito actualizado con detalles de producto
    const carritoActualizado = await Cart.findById(carrito._id).populate('items.producto', 'nombre sku precioBase imagenes stock preciosMayorista categoria');
    res.status(200).json(carritoActualizado);
});


// @desc    Actualizar la cantidad de un item específico en el carrito
// @route   PUT /api/carrito/items/:itemId (donde itemId es el _id del item DENTRO del carrito)
// @access  Private
const actualizarCantidadItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { cantidad } = req.body;
    const nuevaCantidadNum = Number(cantidad);

    if (isNaN(nuevaCantidadNum) || nuevaCantidadNum <= 0) {
        res.status(400);
        throw new Error('La cantidad debe ser un número positivo.');
    }

    const carrito = await Cart.findOne({ usuario: req.user._id });
    if (!carrito) {
        res.status(404);
        throw new Error('Carrito no encontrado');
    }

    const itemDelCarrito = carrito.items.id(itemId); // Método de Mongoose para encontrar subdocumento por _id
    if (!itemDelCarrito) {
        res.status(404);
        throw new Error('Ítem no encontrado en el carrito');
    }

    const producto = await Product.findById(itemDelCarrito.producto);
    if (!producto) {
        res.status(404); // El producto podría haber sido eliminado del catálogo
        // Podríamos eliminar el item del carrito aquí o solo dar error
        carrito.items.pull({ _id: itemId }); // Eliminar item si el producto ya no existe
        await carrito.save();
        throw new Error('Producto asociado al ítem ya no existe, ítem eliminado del carrito.');
    }

    if (producto.stock < nuevaCantidadNum) {
        res.status(400);
        throw new Error('Stock insuficiente para la cantidad solicitada');
    }

    itemDelCarrito.cantidad = nuevaCantidadNum;
    itemDelCarrito.precio = calcularPrecioProducto(producto, nuevaCantidadNum, req.user.rol, req.user.aprobadoMayorista);


    await carrito.save();
    const carritoActualizado = await Cart.findById(carrito._id).populate('items.producto', 'nombre sku precioBase imagenes stock preciosMayorista categoria');
    res.status(200).json(carritoActualizado);
});

// @desc    Eliminar un item del carrito
// @route   DELETE /api/carrito/items/:itemId (donde itemId es el _id del item DENTRO del carrito)
// @access  Private
const eliminarItemDelCarrito = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const carrito = await Cart.findOne({ usuario: req.user._id });
    if (!carrito) {
        res.status(404);
        throw new Error('Carrito no encontrado');
    }

    const itemExistente = carrito.items.id(itemId);
    if (!itemExistente) {
        res.status(404);
        throw new Error('Ítem no encontrado en el carrito');
    }

    // carrito.items.id(itemId).remove(); // Forma deprecated
    carrito.items.pull({ _id: itemId }); // Forma recomendada para eliminar subdocumentos de un array

    await carrito.save();
    const carritoActualizado = await Cart.findById(carrito._id).populate('items.producto', 'nombre sku precioBase imagenes stock preciosMayorista categoria');
    res.status(200).json(carritoActualizado);
});

// @desc    Vaciar todos los items del carrito del usuario
// @route   DELETE /api/carrito
// @access  Private
const vaciarCarrito = asyncHandler(async (req, res) => {
    const carrito = await Cart.findOne({ usuario: req.user._id });

    if (carrito) {
        carrito.items = [];
        await carrito.save();
        // No es necesario popular aquí ya que el carrito estará vacío
        res.status(200).json(carrito);
    } else {
        // Si no tiene carrito, igual es una operación exitosa (no hay nada que vaciar)
        res.status(200).json({ usuario: req.user._id, items: [] });
    }
});


export {
    obtenerCarrito,
    agregarItemAlCarrito,
    actualizarCantidadItem,
    eliminarItemDelCarrito,
    vaciarCarrito,
};