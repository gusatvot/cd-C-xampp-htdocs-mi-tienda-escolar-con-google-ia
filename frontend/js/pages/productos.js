// frontend/js/pages/productos.js

import { getProductos, agregarItemAlCarrito } from '../api/client.js'; // Importamos ambas de client.js
import { isLoggedIn, actualizarUIAuth } from '../common/auth.js';      // Importamos de auth.js
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js'; // Importamos de ui.js

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-productos');

    // Primero, actualizamos la UI para mostrar "Mi Cuenta" o "Logout" correctamente
    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito(); // También actualizamos el contador al cargar la página

    const renderProductos = async () => {
        if (!gridContainer) return;

        try {
            gridContainer.innerHTML = '<p class="mensaje-carga">Cargando productos...</p>';
            const respuesta = await getProductos();
            gridContainer.innerHTML = '';

            if (!respuesta?.productos?.length) {
                gridContainer.innerHTML = '<p class="mensaje-info">No hay productos disponibles por el momento.</p>';
                return;
            }

            respuesta.productos.forEach(producto => {
                const productoCard = document.createElement('article');
                productoCard.className = 'producto-card';

                // Usamos la URL de tu backend para las imágenes
                const imagenUrl = producto.imagenes?.[0] ? producto.imagenes[0] : 'img/productos/placeholder.jpg';

                productoCard.innerHTML = `
                    <a href="producto-detalle.html?id=${producto._id}">
                        <div class="producto-card-imagen">
                            <img src="${imagenUrl}" alt="${producto.nombre}" loading="lazy">
                        </div>
                        <div class="producto-card-info">
                            <h3>${producto.nombre}</h3>
                            <p class="precio">${formatearPrecio(producto.precioBase)}</p>
                        </div>
                    </a>
                    <button class="btn btn-secondary btn-block btn-anadir-carrito" data-id="${producto._id}">Añadir al Carrito</button>
                `;
                gridContainer.appendChild(productoCard);
            });

        } catch (error) {
            console.error('Error al renderizar los productos:', error);
            gridContainer.innerHTML = `<p class="mensaje-error">No se pudieron cargar los productos. Por favor, intente de nuevo más tarde.</p>`;
        }
    };

    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    };

    // --- LÓGICA PARA "AÑADIR AL CARRITO" USANDO DELEGACIÓN DE EVENTOS ---
    if (gridContainer) {
        gridContainer.addEventListener('click', async (event) => {
            // Verificamos si el clic fue en un botón de "Añadir al Carrito"
            if (event.target.classList.contains('btn-anadir-carrito')) {
                // 1. Verificar si el usuario está logueado
                if (!isLoggedIn()) {
                    alert('Por favor, inicia sesión para agregar productos al carrito.');
                    window.location.href = 'login.html';
                    return;
                }

                // 2. Obtener el ID del producto desde el atributo data-id
                const productoId = event.target.dataset.id;
                
                try {
                    // 3. Llamar a la API para agregar el item
                    const carritoActualizado = await agregarItemAlCarrito(productoId, 1);
                    
                    // 4. Actualizar el ícono del carrito con la nueva cantidad de items
                    actualizarContadorCarrito(); // <-- Llamamos al actualizador
                    
                    // 5. Mostrar confirmación al usuario
                    alert(`"${carritoActualizado.items.find(item => item.producto === productoId)?.nombre || 'El producto'}" fue agregado al carrito.`);
                    
                } catch (error) {
                    // Si la API devuelve un error (ej: sin stock), lo mostramos
                    alert(`Error al agregar el producto: ${error.message}`);
                }
            }
        });
    }

    renderProductos();
});