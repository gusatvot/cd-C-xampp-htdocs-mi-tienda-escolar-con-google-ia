// frontend/js/pages/producto-detalle.js

import { getProductoById, agregarItemAlCarrito } from '../api/client.js';
import { isLoggedIn, actualizarUIAuth, getUserData } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("PRODUCTO-DETALLE.JS: DOMContentLoaded.");
    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito();

    const params = new URLSearchParams(window.location.search);
    const productoIdGlobal = params.get('id');
    // --- LOG AÑADIDO ---
    console.log("PRODUCTO-DETALLE.JS: ID de producto obtenido de la URL (productoIdGlobal):", productoIdGlobal);
    // --------------------

    const mainContainer = document.getElementById('main-container');
    const paginaTitulo = document.getElementById('pagina-titulo');
    const breadcrumbNombre = document.getElementById('breadcrumb-producto-nombre');
    const imgPrincipalEl = document.getElementById('producto-imagen-principal');
    const miniaturasContainerEl = document.getElementById('producto-miniaturas');
    const nombreProductoEl = document.getElementById('producto-nombre');
    const skuEl = document.getElementById('producto-sku');
    const marcaEl = document.getElementById('producto-marca');
    const precioActualEl = document.getElementById('producto-precio-actual');
    const descCortaEl = document.getElementById('producto-descripcion-corta');
    const descLargaEl = document.getElementById('producto-descripcion-larga');
    const formCompraDetalle = document.getElementById('formulario-compra-detalle');
    const inputCantidadDetalle = document.getElementById('cantidad-detalle');
    const btnMenosCantidad = formCompraDetalle ? formCompraDetalle.querySelector('.btn-cantidad.menos') : null;
    const btnMasCantidad = formCompraDetalle ? formCompraDetalle.querySelector('.btn-cantidad.mas') : null;
    const btnAnadirCarritoSubmit = formCompraDetalle ? formCompraDetalle.querySelector('button[type="submit"]') : null;

    let productoActual = null; 

    const formatearPrecio = (valor) => {
        if (typeof valor !== 'number' || isNaN(valor)) return '$ 0.00';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    };

    const cargarProducto = async () => {
        // --- LOG AÑADIDO ---
        console.log("PRODUCTO-DETALLE.JS: Entrando a cargarProducto(). Usando ID:", productoIdGlobal);
        // --------------------

        if (!productoIdGlobal) {
            console.error("PRODUCTO-DETALLE.JS: productoIdGlobal es nulo o undefined. No se puede cargar producto.");
            if(mainContainer) mainContainer.innerHTML = '<h1>Error</h1><p>ID de producto no especificado. <a href="productos.html">Volver a productos</a>.</p>';
            return;
        }
        
        // Mostrar "Cargando..." en los campos principales mientras se obtienen los datos
        if (nombreProductoEl) nombreProductoEl.textContent = 'Cargando...';
        if (skuEl) skuEl.textContent = '...';
        if (marcaEl) marcaEl.textContent = '...';
        if (precioActualEl) precioActualEl.textContent = '';
        if (descCortaEl) descCortaEl.textContent = '';


        try {
            productoActual = await getProductoById(productoIdGlobal);
            // --- LOG AÑADIDO ---
            console.log("PRODUCTO-DETALLE.JS: Producto cargado desde API (objeto completo):", productoActual ? JSON.parse(JSON.stringify(productoActual)) : "Respuesta nula/undefined de API");
            // --------------------

            if (!productoActual || Object.keys(productoActual).length === 0) {
                throw new Error("Producto no encontrado o datos no válidos recibidos de la API.");
            }

            // --- Actualizar Info General del Producto ---
            if (paginaTitulo) paginaTitulo.textContent = `TuTiendaEscolar - ${productoActual.nombre || 'Detalle del Producto'}`;
            if (breadcrumbNombre) breadcrumbNombre.textContent = productoActual.nombre || 'Producto';
            if (nombreProductoEl) nombreProductoEl.textContent = productoActual.nombre || 'Nombre no disponible';
            if (skuEl) skuEl.textContent = productoActual.sku || 'N/A';
            if (marcaEl) marcaEl.textContent = productoActual.marca || 'Sin marca';
            if (precioActualEl) precioActualEl.textContent = formatearPrecio(productoActual.precioBase);
            const descripcionCortaTexto = productoActual.descripcion_corta || productoActual.descripcion?.substring(0,120)+'...' || 'Descripción no disponible.';
            if (descCortaEl) descCortaEl.textContent = descripcionCortaTexto;
            if (descLargaEl) descLargaEl.innerHTML = productoActual.descripcion || '<p>No hay descripción detallada.</p>';
            
            // --- LÓGICA PARA LA GALERÍA DE IMÁGENES ---
            if (imgPrincipalEl && miniaturasContainerEl) {
                // --- LOG AÑADIDO ---
                console.log("PRODUCTO-DETALLE.JS: Procesando galería. productoActual.imagenes:", productoActual.imagenes);
                // --------------------
                if (productoActual.imagenes && Array.isArray(productoActual.imagenes) && productoActual.imagenes.length > 0) {
                    console.log("PRODUCTO-DETALLE.JS: Primera URL de imagen a mostrar:", productoActual.imagenes[0]);
                    imgPrincipalEl.src = productoActual.imagenes[0];
                    imgPrincipalEl.alt = `${productoActual.nombre || 'Producto'} - Imagen principal`;
                    miniaturasContainerEl.innerHTML = ''; 

                    productoActual.imagenes.forEach((urlImagen, index) => {
                        if (typeof urlImagen === 'string' && urlImagen.trim() !== '') {
                            const miniaturaImg = document.createElement('img');
                            miniaturaImg.src = urlImagen;
                            miniaturaImg.alt = `${productoActual.nombre || 'Producto'} - Miniatura ${index + 1}`;
                            miniaturaImg.className = 'miniatura';
                            if (index === 0) miniaturaImg.classList.add('active');
                            miniaturaImg.addEventListener('click', () => {
                                imgPrincipalEl.src = urlImagen;
                                imgPrincipalEl.alt = `${productoActual.nombre || 'Producto'} - Imagen ${index + 1}`;
                                miniaturasContainerEl.querySelectorAll('.miniatura').forEach(m => m.classList.remove('active'));
                                miniaturaImg.classList.add('active');
                            });
                            miniaturasContainerEl.appendChild(miniaturaImg);
                        } else {
                            console.warn(`PRODUCTO-DETALLE.JS: URL de imagen inválida en el índice ${index}:`, urlImagen);
                        }
                    });
                } else {
                    console.warn("PRODUCTO-DETALLE.JS: No hay imágenes válidas en productoActual.imagenes o el array está vacío.");
                    imgPrincipalEl.src = 'img/productos/placeholder.jpg'; 
                    imgPrincipalEl.alt = 'Imagen no disponible';
                    miniaturasContainerEl.innerHTML = ''; 
                }
            } else {
                console.warn("PRODUCTO-DETALLE.JS: Elementos de galería (imgPrincipal o miniaturasContainer) no encontrados en el DOM.");
            }

            // Configurar stock y botones
            if (inputCantidadDetalle && productoActual.stock !== undefined) {
                const stockNumber = Number(productoActual.stock);
                inputCantidadDetalle.max = stockNumber > 0 ? stockNumber : 1;
                inputCantidadDetalle.value = stockNumber > 0 ? 1 : 0;
                if (stockNumber === 0) {
                    if(btnAnadirCarritoSubmit) { btnAnadirCarritoSubmit.disabled = true; btnAnadirCarritoSubmit.textContent = 'Sin Stock';}
                    if(btnMenosCantidad) btnMenosCantidad.disabled = true;
                    if(btnMasCantidad) btnMasCantidad.disabled = true;
                } else {
                    if(btnAnadirCarritoSubmit) { btnAnadirCarritoSubmit.disabled = false; btnAnadirCarritoSubmit.textContent = 'Añadir al Carrito';}
                    if(btnMenosCantidad) btnMenosCantidad.disabled = false;
                    if(btnMasCantidad) btnMasCantidad.disabled = false;
                }
            }

        } catch (error) {
            console.error('PRODUCTO-DETALLE.JS: Error al cargar y renderizar el producto:', error);
            if(mainContainer) mainContainer.innerHTML = `<h1>Error al Cargar Producto</h1><p>${error.message}. <a href="productos.html">Volver a productos</a>.</p>`;
        }
    };

    // ... (Lógica de botones +/- cantidad y submit del formulario como la tenías) ...
    if (btnMenosCantidad && inputCantidadDetalle) { /* ... */ }
    if (btnMasCantidad && inputCantidadDetalle) { /* ... */ }
    if (formCompraDetalle) { formCompraDetalle.addEventListener('submit', async (event) => { /* ... tu lógica de submit ... */ });}

    cargarProducto(); 
});