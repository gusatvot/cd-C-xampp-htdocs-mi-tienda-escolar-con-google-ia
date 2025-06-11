// backend/controllers/statsController.js
import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js'; // Para estadísticas de órdenes
import Product from '../models/Product.js'; // Para estadísticas de productos
import User from '../models/User.js'; // Para estadísticas de usuarios
import mongoose from 'mongoose'; // Para trabajar con aggregations si es necesario
// TODO: Importar otras models si se necesitan estadísticas de ellas (ej. Category, Review si existieran)


// @desc    Obtener estadísticas generales del sistema (Admin Dashboard)
// @route   GET /api/admin/stats/generales
// @access  Private/Admin
const obtenerEstadisticasGenerales = asyncHandler(async (req, res) => {
    // Aquí consolidamos varias estadísticas generales

    // 1. Conteo de entidades principales
    const totalUsuarios = await User.countDocuments();
    const totalProductos = await Product.countDocuments();
    // const totalCategorias = await Category.countDocuments(); // Si necesitas el conteo de categorías

    // 2. Estadísticas de Órdenes (reutilizamos lógica de orderController)
    const totalOrdenes = await Order.countDocuments();
    // Conteo de órdenes por estado
    const conteoOrdenesPorEstado = await Order.aggregate([
        { $group: { _id: '$estadoPedido', total: { $sum: 1 } } },
        { $project: { _id: 0, estado: '$_id', total: 1 } }
    ]);
    // Total de ventas (sumar precioTotal de órdenes pagadas)
    const ventasTotalesResult = await Order.aggregate([
        { $match: { estaPagado: true } },
        { $group: { _id: null, totalVentas: { $sum: '$precioTotal' } } },
        { $project: { _id: 0, totalVentas: 1 } }
    ]);
    const ventasTotales = ventasTotalesResult.length > 0 ? ventasTotalesResult[0].totalVentas : 0;

    // 3. Estadísticas de Usuarios (podríamos añadir más allá del conteo total)
     // Conteo de usuarios por rol
     const conteoUsuariosPorRol = await User.aggregate([
         { $group: { _id: '$rol', total: { $sum: 1 } } },
         { $project: { _id: 0, rol: '$_id', total: 1 } }
     ]);
    // Usuarios mayoristas pendientes de aprobación
    const mayoristasPendientesAprobacion = await User.countDocuments({ rol: 'mayorista', aprobadoMayorista: false });


    // 4. Estadísticas de Productos (podríamos añadir más allá del conteo total)
    const productosActivos = await Product.countDocuments({ activo: true });
    const productosInactivos = await Product.countDocuments({ activo: false });
    // Productos destacados
    const productosDestacados = await Product.countDocuments({ destacado: true });
    // Productos con stock bajo (reutilizamos lógica de orderController)
    // Esto podría tener un límite configurable, pero por ahora usamos uno fijo o lo recibimos como query param si la ruta lo soporta
     const limiteStockBajo = 10; // Límite fijo para este reporte
     const productosStockBajo = await Product.countDocuments({ stock: { $lte: limiteStockBajo } }); // Solo el conteo

    // TODO: Añadir reportes de ventas por período (ej. último mes) - Mover desde orderController si se implementa
    // TODO: Añadir top productos más vendidos (Requiere aggregation sobre Order items)
    // TODO: Añadir usuarios con más compras

    res.json({
        usuarios: {
            total: totalUsuarios,
            conteoPorRol: conteoUsuariosPorRol,
            mayoristasPendientesAprobacion: mayoristasPendientesAprobacion,
            // TODO: Más stats de usuarios
        },
        productos: {
            total: totalProductos,
            activos: productosActivos,
            inactivos: productosInactivos,
            destacados: productosDestacados,
            conStockBajo: productosStockBajo, // Conteo, no la lista detallada
            // TODO: Más stats de productos
        },
        ordenes: {
            total: totalOrdenes,
            conteoPorEstado: conteoOrdenesPorEstado,
            ventasTotales: ventasTotales, // Suma total de ventas de órdenes pagadas
            // TODO: Más stats de órdenes
        },
        // TODO: Añadir otras secciones si hay más tipos de estadísticas (ej. reviews, consultas)
    });
});


// @desc    Obtener lista detallada de productos con stock bajo (Admin Reporte)
// @route   GET /api/admin/stats/stock-bajo
// @access  Private/Admin
// NOTA: Esto es un reporte más detallado que solo el conteo.
const obtenerListaProductosStockBajo = asyncHandler(async (req, res) => {
    // El query param 'limite' se espera en la URL (ej: /stock-bajo?limite=5)
    // La validación de este query param se hará en la ruta.
    const limiteStockBajo = Number(req.query.limite) || 10; // Usar 10 por defecto si no se envía o es inválido
    const limiteFinal = limiteStockBajo < 0 ? 0 : limiteStockBajo; // Asegurar que el límite no sea negativo

    const productos = await Product.find({ stock: { $lte: limiteFinal } }) // Buscar productos donde stock es Menor o Igual al límite
        .select('nombre sku stock categoria') // Seleccionar campos relevantes, incluir categoria si es útil
        .populate('categoria', 'nombre') // Popular el nombre de la categoría
        .sort({ stock: 1 }); // Ordenar por stock de menor a mayor

    res.json(productos); // Devolver la lista detallada
});


// TODO: @desc    Obtener reporte de ventas por período (Admin Reporte)
// TODO: @route   GET /api/admin/stats/ventas-por-periodo
// TODO: @access  Private/Admin
// TODO: (Requiere query params para rango de fechas, y lógica de aggregation con $match y $group por fecha)
// const obtenerVentasPorPeriodo = asyncHandler(async (req, res) => { /* ... */ });

// TODO: @desc    Obtener reporte de productos más vendidos (Admin Reporte)
// TODO: @route   GET /api/admin/stats/productos-mas-vendidos
// TODO: @access  Private/Admin
// TODO: (Requiere aggregation sobre los items de órdenes pagadas)
// const obtenerProductosMasVendidos = asyncHandler(async (req, res) => { /* ... */ });


// --- Exportar todas las funciones ---
export {
    obtenerEstadisticasGenerales,
    obtenerListaProductosStockBajo,
    // TODO: Exportar otras funciones de reportes cuando estén implementadas
    // obtenerVentasPorPeriodo,
    // obtenerProductosMasVendidos,
};