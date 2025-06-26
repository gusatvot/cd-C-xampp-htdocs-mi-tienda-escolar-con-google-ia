// frontend/js/pages/carrito.js

import { getCarrito, actualizarCantidadItemCarrito, eliminarItemDelCarrito, vaciarCarrito } from '../api/client.js';
import { isLoggedIn, actualizarUIAuth } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("CARRITO.JS: DOMContentLoaded.");
    inicializarUI();
    actualizarUIAuth();
    // No llamamos a actualizarContadorCarrito() aquí directamente;
    // se llamará desde renderizarCarrito() después de cargar los datos frescos.

    if (!isLoggedIn()) {
        alert('Debes iniciar sesión para ver tu carrito.');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return; 
    }

    const tbodyCarrito = document.querySelector('.tabla-carrito tbody');
    const resumenSubtotalEl = document.querySelector('.valor-subtotal-resumen');
    const resumenTotalEl = document.querySelector('.valor-total-resumen');
    const resumenNumeroItemsEl = document.querySelector('.numero-items-resumen');
    const carritoVacioDiv = document.querySelector('.carrito-vacio');
    const contenidoCarritoLayout = document.querySelector('.contenido-carrito-layout');
    const btnVaciarCarrito = document.querySelector('.btn-vaciar-carrito');
    const mensajeCargaInicial = document.getElementById('mensaje-carga-carrito'); 

    const formatearPrecio = (valor) => {
        if (typeof valor !== 'number' || isNaN(valor)) return '$ 0.00';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    };

    const renderizarCarrito = (carrito) => {
        if (!tbodyCarrito || !resumenSubtotalEl || !resumenTotalEl || !resumenNumeroItemsEl || !carritoVacioDiv || !contenidoCarritoLayout) {
            console.error("CARRITO.JS (renderizarCarrito): Faltan elementos HTML esenciales.");
            return;
        }
        console.log("CARRITO.JS (renderizarCarrito): Renderizando con datos:", carrito ? JSON.parse(JSON.stringify(carrito)) : "Carrito nulo/undefined");

        if (mensajeCargaInicial) mensajeCargaInicial.style.display = 'none'; 
        tbodyCarrito.innerHTML = ''; 

        if (!carrito || !carrito.items || carrito.items.length === 0) {
            console.log("CARRITO.JS (renderizarCarrito): El carrito está vacío o es inválido.");
            carritoVacioDiv.style.display = 'block';
            contenidoCarritoLayout.style.display = 'none';
            if(resumenSubtotalEl) resumenSubtotalEl.textContent = formatearPrecio(0);
            if(resumenTotalEl) resumenTotalEl.textContent = formatearPrecio(0);
            if(resumenNumeroItemsEl) resumenNumeroItemsEl.textContent = '0';
            actualizarContadorCarrito(); 
            return;
        }

        carritoVacioDiv.style.display = 'none';
        contenidoCarritoLayout.style.display = 'flex';

        let subtotalGeneral = 0;
        let numeroTotalItems = 0;

        carrito.items.forEach(item => {
            const producto = item.producto; 
            if (!producto || typeof producto !== 'object') {
                console.warn("CARRITO.JS (renderizarCarrito): Item del carrito no tiene 'producto' populado o no es un objeto. Item:", item);
                return; 
            }
            
            const tr = document.createElement('tr');
            tr.className = 'item-carrito';
            tr.dataset.iditem = item._id; 
            tr.dataset.idproducto = producto._id;

            const nombreItem = item.nombre || producto.nombre || 'Producto Desconocido';
            const skuProducto = producto.sku || 'N/A';
            const imagenUrl = (producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0])
                            ? producto.imagenes[0]
                            : 'img/productos/placeholder.jpg';
            const precioItem = typeof item.precio === 'number' ? item.precio : 0;
            const cantidadItem = typeof item.cantidad === 'number' ? item.cantidad : 0;
            const stockProducto = typeof producto.stock === 'number' ? producto.stock : 99;

            const subtotalItem = precioItem * cantidadItem;
            subtotalGeneral += subtotalItem;
            numeroTotalItems += cantidadItem;

            tr.innerHTML = `
                <td class="imagen-producto-carrito">
                    <a href="producto-detalle.html?id=${producto._id || ''}">
                        <img src="${imagenUrl}" alt="${nombreItem}">
                    </a>
                </td>
                <td class="nombre-producto-carrito">
                    <a href="producto-detalle.html?id=${producto._id || ''}">${nombreItem}</a>
                    <small>SKU: ${skuProducto}</small>
                </td>
                <td data-label="Precio Unitario:" class="precio-unitario-carrito text-right">${formatearPrecio(precioItem)}</td>
                <td data-label="Cantidad:" class="cantidad-item-carrito">
                    <div class="selector-cantidad selector-cantidad-carrito">
                        <button type="button" class="btn-cantidad menos" aria-label="Disminuir" data-iditem="${item._id}">-</button>
                        <input type="number" class="input-cantidad" value="${cantidadItem}" min="1" max="${stockProducto}" readonly>
                        <button type="button" class="btn-cantidad mas" aria-label="Aumentar" data-iditem="${item._id}">+</button>
                    </div>
                </td>
                <td data-label="Subtotal:" class="subtotal-item-carrito text-right">${formatearPrecio(subtotalItem)}</td>
                <td class="acciones-item-carrito">
                    <button class="btn-eliminar-item" aria-label="Eliminar producto" data-iditem="${item._id}">
                        <img src="img/iconos/trash.svg" alt="Eliminar">
                    </button>
                </td>
            `;
            tbodyCarrito.appendChild(tr);
        });

        if(resumenSubtotalEl) resumenSubtotalEl.textContent = formatearPrecio(subtotalGeneral);
        const costoEnvio = 0; 
        if(resumenTotalEl) resumenTotalEl.textContent = formatearPrecio(subtotalGeneral + costoEnvio);
        if(resumenNumeroItemsEl) resumenNumeroItemsEl.textContent = numeroTotalItems.toString();
        
        console.log("CARRITO.JS (renderizarCarrito): Renderizado completo. Subtotal General:", subtotalGeneral, "Número Items:", numeroTotalItems);
        actualizarContadorCarrito(); 
    };

    const cargarCarrito = async () => {
        console.log("CARRITO.JS: Iniciando cargarCarrito()...");
        if (mensajeCargaInicial) mensajeCargaInicial.style.display = 'table-row';

        try {
            const carritoData = await getCarrito();
            renderizarCarrito(carritoData);
        } catch (error) {
            console.error("CARRITO.JS: Error al cargar el carrito:", error);
            if (tbodyCarrito) tbodyCarrito.innerHTML = `<tr><td colspan="6" class="text-center mensaje-error">Error al cargar tu carrito: ${error.message}</td></tr>`;
            if (carritoVacioDiv && contenidoCarritoLayout) { 
                carritoVacioDiv.style.display = 'block';
                contenidoCarritoLayout.style.display = 'none';
            }
            if (mensajeCargaInicial) mensajeCargaInicial.style.display = 'none';
        }
    };

    // --- MANEJO DE EVENTOS PARA ACCIONES DEL CARRITO ---
    if (tbodyCarrito) {
        tbodyCarrito.addEventListener('click', async (event) => {
            const botonMenos = event.target.closest('.btn-cantidad.menos');
            const botonMas = event.target.closest('.btn-cantidad.mas');
            const botonEliminar = event.target.closest('.btn-eliminar-item');

            const itemRow = event.target.closest('.item-carrito');
            if (!itemRow) return;
            const itemId = itemRow.dataset.iditem;
            const inputCantidadEl = itemRow.querySelector('.input-cantidad');
            if (!itemId || !inputCantidadEl) {
                console.warn("CARRITO.JS: No se pudo obtener itemId o inputCantidad del item row.");
                return;
            }
            let cantidadActual = parseInt(inputCantidadEl.value, 10);

            try {
                let accionRealizada = false;
                if (botonMenos) {
                    if (cantidadActual > 1) {
                        // inputCantidadEl.value = cantidadActual - 1; // No hacer actualización optimista aquí para evitar parpadeo si falla
                        await actualizarCantidadItemCarrito(itemId, cantidadActual - 1);
                        accionRealizada = true;
                    } else if (cantidadActual === 1) {
                        if (confirm("¿Reducir a cero eliminará el producto del carrito. ¿Continuar?")) {
                            await eliminarItemDelCarrito(itemId);
                            accionRealizada = true;
                        }
                    }
                } else if (botonMas) {
                    const stockMax = parseInt(inputCantidadEl.max, 10) || 99;
                    if (cantidadActual < stockMax) {
                        // inputCantidadEl.value = cantidadActual + 1; // No hacer actualización optimista
                        await actualizarCantidadItemCarrito(itemId, cantidadActual + 1);
                        accionRealizada = true;
                    } else {
                        alert("No hay más stock disponible para este producto.");
                    }
                } else if (botonEliminar) {
                    if (confirm("¿Estás seguro de que querés eliminar este producto del carrito?")) {
                        await eliminarItemDelCarrito(itemId);
                        accionRealizada = true;
                    }
                }
                if (accionRealizada) {
                    cargarCarrito(); // Recargar y re-renderizar todo el carrito DESPUÉS de la acción
                }
            } catch (error) {
                alert(`Error al actualizar el carrito: ${error.message}`);
                cargarCarrito(); 
            }
        });
    }

    if(btnVaciarCarrito){
        btnVaciarCarrito.addEventListener('click', async () => {
            if(confirm("¿Estás seguro de que querés vaciar todo tu carrito?")){
                try {
                    await vaciarCarrito();
                    cargarCarrito();
                } catch (error) {
                    alert(`Error al vaciar el carrito: ${error.message}`);
                }
            }
        });
    }

    cargarCarrito();
});