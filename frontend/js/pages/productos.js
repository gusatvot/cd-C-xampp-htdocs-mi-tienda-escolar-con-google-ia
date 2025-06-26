// frontend/js/pages/productos.js

import { getProductos, agregarItemAlCarrito } from '../api/client.js';
import { isLoggedIn, actualizarUIAuth } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("PRODUCTOS.JS: DOMContentLoaded.");
    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito(); // Cargar contador inicial del carrito

    const gridContainer = document.getElementById('grid-productos');
    const totalProductosSpan = document.querySelector('.total-productos'); // Para actualizar el conteo de productos

    const formatearPrecio = (valor) => {
        if (typeof valor !== 'number' || isNaN(valor)) return '$ --.--';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(valor);
    };

    const renderProductos = async () => {
        if (!gridContainer) {
            console.error('PRODUCTOS.JS: El contenedor #grid-productos no se encontró.');
            return;
        }

        try {
            gridContainer.innerHTML = '<p class="mensaje-carga">Cargando productos...</p>';
            
            // Podrías añadir query params aquí si implementas filtros/paginación
            const respuesta = await getProductos(); 
            
            gridContainer.innerHTML = ''; 

            if (!respuesta || !respuesta.productos || respuesta.productos.length === 0) {
                gridContainer.innerHTML = '<p class="mensaje-info">No hay productos disponibles por el momento.</p>';
                if (totalProductosSpan) totalProductosSpan.textContent = 'Mostrando 0 de 0 productos';
                return;
            }

            if (totalProductosSpan) {
                // Asumiendo que la API devuelve 'total' para el conteo total de productos (si hay paginación)
                // o usamos la longitud del array si no hay paginación.
                const total = respuesta.total || respuesta.productos.length;
                const mostrados = respuesta.productos.length;
                totalProductosSpan.textContent = `Mostrando ${mostrados} de ${total} productos`;
            }

            respuesta.productos.forEach(producto => {
                const productoCard = document.createElement('article');
                productoCard.className = 'producto-card';

                // Asumimos que 'imagenes' es un array y tomamos la primera, o un placeholder
                // Y que las URLs del backend ya son completas o relativas a la base de la API.
                // Si son relativas solo al servidor, necesitas prefijarlas con BASE_URL de client.js
                const imagenUrl = (producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0])
                    ? producto.imagenes[0] // Usar la URL completa si viene del backend
                    : 'img/productos/placeholder.jpg';

                productoCard.innerHTML = `
                    <a href="producto-detalle.html?id=${producto._id}">
                        <div class="producto-card-imagen">
                            <img src="${imagenUrl}" alt="${producto.nombre || 'Producto'}" loading="lazy">
                        </div>
                        <div class="producto-card-info">
                            <h3>${producto.nombre || 'Nombre no disponible'}</h3>
                            <p class="precio">${formatearPrecio(producto.precioBase)}</p>
                        </div>
                    </a>
                    <button class="btn btn-secondary btn-block btn-anadir-carrito" data-id="${producto._id}" data-nombre="${producto.nombre || 'Producto'}">Añadir al Carrito</button>
                `;
                gridContainer.appendChild(productoCard);
            });

        } catch (error) {
            console.error('PRODUCTOS.JS: Error al renderizar los productos:', error);
            gridContainer.innerHTML = `<p class="mensaje-error">No se pudieron cargar los productos: ${error.message}. Intente de nuevo más tarde.</p>`;
            if (totalProductosSpan) totalProductosSpan.textContent = 'Error al cargar productos';
        }
    };
    
    // Event Listener para los botones "Añadir al Carrito" usando delegación de eventos
    if (gridContainer) {
        gridContainer.addEventListener('click', async (event) => {
            const botonCarrito = event.target.closest('.btn-anadir-carrito');

            if (botonCarrito) {
                event.preventDefault();
                console.log("PRODUCTOS.JS: Clic en 'Añadir al Carrito'.");

                if (!isLoggedIn()) {
                    alert('Por favor, inicia sesión para agregar productos al carrito.');
                    // Guardamos la página actual para poder volver después del login
                    const redirectUrl = window.location.pathname + window.location.search;
                    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
                    return;
                }

                const productoId = botonCarrito.dataset.id;
                const productoNombre = botonCarrito.dataset.nombre || "El producto";

                if (!productoId) {
                    console.error("PRODUCTOS.JS: No se encontró data-id en el botón.");
                    alert("Error: No se pudo identificar el producto.");
                    return;
                }

                botonCarrito.disabled = true;
                botonCarrito.textContent = 'Agregando...';

                try {
                    console.log(`PRODUCTOS.JS: Agregando productoId: ${productoId} al carrito.`);
                    const carritoActualizado = await agregarItemAlCarrito(productoId, 1); 
                    
                    console.log("PRODUCTOS.JS: Producto agregado. Carrito actualizado:", carritoActualizado);
                    
                    await actualizarContadorCarrito(); // Actualizar el ícono del carrito
                    
                    // Usar una notificación más sutil sería mejor, pero alert funciona por ahora
                    alert(`"${productoNombre}" fue agregado al carrito.`);
                    
                } catch (error) {
                    console.error("PRODUCTOS.JS: Error al agregar el producto al carrito:", error);
                    alert(`Error al agregar "${productoNombre}": ${error.message}`);
                } finally {
                    botonCarrito.disabled = false;
                    botonCarrito.textContent = 'Añadir al Carrito';
                }
            }
        });
    }

    renderProductos(); // Llamar a la función para cargar y mostrar los productos
});