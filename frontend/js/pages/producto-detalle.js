// frontend/js/pages/producto-detalle.js

import { getProductoById } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const productoId = params.get('id');

    const mainContainer = document.getElementById('main-container');

    if (!productoId) {
        mainContainer.innerHTML = '<h1>Error</h1><p>No se ha especificado un producto. Por favor, vuelva a la <a href="productos.html">página de productos</a>.</p>';
        return;
    }

    const cargarProducto = async () => {
        try {
            const producto = await getProductoById(productoId);

            // Mapeamos los datos de la API a los IDs del HTML
            document.getElementById('pagina-titulo').textContent = `TuTiendaEscolar - ${producto.nombre}`;
            document.getElementById('breadcrumb-producto-nombre').textContent = producto.nombre;

            const imagenUrl = producto.imagenes[0]?.url ? `img/productos/${producto.imagenes[0].url}` : 'img/productos/placeholder.jpg';
            document.getElementById('producto-imagen-principal').src = imagenUrl;
            document.getElementById('producto-imagen-principal').alt = producto.nombre;

            document.getElementById('producto-nombre').textContent = producto.nombre;
            document.getElementById('producto-sku').textContent = producto.sku || 'No disponible';
            document.getElementById('producto-marca').textContent = producto.marca || 'Sin marca';
            document.getElementById('producto-precio-actual').textContent = formatearPrecio(producto.precioBase);
            document.getElementById('producto-descripcion-corta').textContent = producto.descripcion_corta || '';
            document.getElementById('producto-descripcion-larga').innerHTML = producto.descripcion || '<p>No hay una descripción detallada disponible para este producto.</p>';
            
            const form = document.getElementById('formulario-compra');
            if (form) {
                // *** CORRECCIÓN APLICADA AQUÍ: Se usa producto._id ***
                form.dataset.idproducto = producto._id;
            }

        } catch (error) {
            console.error('Error al cargar el producto:', error);
            mainContainer.innerHTML = `<h1>Error</h1><p>No se pudo cargar la información del producto. Es posible que no exista o haya ocurrido un problema de conexión. Intente volver a la <a href="productos.html">página de productos</a>.</p>`;
        }
    };

    const formatearPrecio = (valor) => {
        if (isNaN(valor)) return '$ 0.00';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(valor);
    };

    cargarProducto();
});