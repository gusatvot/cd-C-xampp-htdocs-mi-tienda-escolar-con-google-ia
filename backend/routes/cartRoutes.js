// backend/routes/cartRoutes.js
import express from 'express';
import {
    obtenerCarrito,
    agregarItemAlCarrito,
    actualizarCantidadItem,
    eliminarItemDelCarrito,
    vaciarCarrito,
} from '../controllers/cartController.js';
import { protegerRuta } from '../middlewares/authMiddleware.js'; // Solo necesitamos protegerRuta aquí,
                                                              // ya que el carrito es específico del usuario
                                                              // y no depende del rol para estas acciones.

const router = express.Router();

// Todas las rutas del carrito requieren que el usuario esté autenticado.
// Podemos aplicar el middleware protegerRuta a nivel del router para todas las rutas definidas abajo.
router.use(protegerRuta);

// Rutas para el carrito
router.get('/', obtenerCarrito); // Obtener el carrito del usuario
router.post('/items', agregarItemAlCarrito); // Agregar un item al carrito
router.put('/items/:itemId', actualizarCantidadItem); // Actualizar cantidad de un item
router.delete('/items/:itemId', eliminarItemDelCarrito); // Eliminar un item del carrito
router.delete('/', vaciarCarrito); // Vaciar todo el carrito

export default router;