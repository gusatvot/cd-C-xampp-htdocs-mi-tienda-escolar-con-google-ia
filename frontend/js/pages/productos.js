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
            
            const respuesta = await getProductos();
            
            gridContainer.innerHTML = ''; 

            if (!respuesta || !respuesta.productos || respuesta.productos.length === 0) {
                gridContainer.innerHTML = '<p class="mensaje-info">No hay productos disponibles por el momento.</p>';
                return;
            }

            respuesta.productos.forEach(producto => {
                const productoCard = document.createElement('article');
                productoCard.className = 'producto-card';

                const urlImagenCompleta = producto.imagenes[0]?.url 
                    ? `img/productos/${producto.imagenes[0].url}` 
                    : 'img/productos/placeholder.jpg';

                const precio = producto.precioBase;

                // *** CORRECCIÓN APLICADA AQUÍ: Se usa producto._id ***
                productoCard.innerHTML = `
                    <a href="producto-detalle.html?id=${producto._id}">
                        <div class="producto-card-imagen">
                            <img src="${urlImagenCompleta}" alt="${producto.nombre}">
                        </div>
                        <div class="producto-card-info">
                            <h3>${producto.nombre}</h3>
                            <p class="precio">${formatearPrecio(precio)}</p>
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
        if (isNaN(valor)) return '$ 0.00';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(valor);
    };

    renderProductos();
});