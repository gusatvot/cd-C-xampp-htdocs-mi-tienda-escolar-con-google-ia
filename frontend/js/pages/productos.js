// frontend/js/pages/productos.js

import { getProductos } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-productos');

    const renderProductos = async () => {
        if (!gridContainer) {
            console.error('Error: El contenedor #grid-productos no se encontró en esta página.');
            return;
        }

        try {
            gridContainer.innerHTML = '<p class="mensaje-carga">Cargando productos...</p>';
            const productos = await getProductos();
            
            gridContainer.innerHTML = ''; 

            if (!productos || productos.length === 0) {
                gridContainer.innerHTML = '<p class="mensaje-info">No hay productos disponibles por el momento.</p>';
                return;
            }

            productos.forEach(producto => {
                const productoCard = document.createElement('article');
                productoCard.className = 'producto-card';

                // Replicamos tu estructura HTML con los datos de la API.
                productoCard.innerHTML = `
                    <a href="producto-detalle.html?id=${producto.id}">
                        <div class="producto-card-imagen">
                            <img src="${producto.imagen}" alt="${producto.nombre}">
                        </div>
                        <div class="producto-card-info">
                            <h3>${producto.nombre}</h3>
                            <p class="precio">${formatearPrecio(producto.precio)}</p>
                        </div>
                    </a>
                    <button class="btn btn-secondary btn-block btn-anadir-carrito" data-id="${producto.id}">Añadir al Carrito</button>
                `;
                gridContainer.appendChild(productoCard);
            });

        } catch (error) {
            gridContainer.innerHTML = `<p class="mensaje-error">No se pudieron cargar los productos. Por favor, intente de nuevo más tarde.</p>`;
        }
    };
    
    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(valor);
    };

    renderProductos();
});