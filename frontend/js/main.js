document.addEventListener('DOMContentLoaded', function () {
    // --- INICIO Manejo del menú desplegable de productos (Escritorio y preparación para Móvil) ---
    const desktopDropdowns = document.querySelectorAll('.nav-bar > .nav-bar-container > .nav-menu-wrapper > ul > li.dropdown');

    // Función para cerrar TODOS los submenús de escritorio
    function closeAllDesktopSubmenus(exceptThisMenu = null) {
        desktopDropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu && menu !== exceptThisMenu && menu.classList.contains('dropdown-menu-visible')) {
                menu.classList.remove('dropdown-menu-visible');
                dropdown.classList.remove('dropdown-active');
            }
        });
    }

    desktopDropdowns.forEach((dropdown, index) => {
        const link = dropdown.querySelector('a:first-child');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (link && menu) {
            menu.classList.remove('dropdown-menu-visible');
            dropdown.classList.remove('dropdown-active');
            link.addEventListener('click', function (event) {
                const navToggle = document.querySelector('.nav-toggle');
                const isMobileView = navToggle && getComputedStyle(navToggle).display !== 'none';
                if (event.target.closest('li.dropdown > a:first-child') === link) {
                    event.preventDefault();
                    const isCurrentlyVisible = menu.classList.contains('dropdown-menu-visible');
                    if (!isCurrentlyVisible) {
                        closeAllDesktopSubmenus(menu);
                        menu.classList.add('dropdown-menu-visible');
                        dropdown.classList.add('dropdown-active');
                    } else {
                        menu.classList.remove('dropdown-menu-visible');
                        dropdown.classList.remove('dropdown-active');
                    }
                }
            });
            menu.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        }
    });

    document.addEventListener('click', function (event) {
        const navToggle = document.querySelector('.nav-toggle');
        const isMobileView = navToggle && getComputedStyle(navToggle).display !== 'none';
        if (!isMobileView) {
            if (!event.target.closest('.nav-bar li.dropdown')) {
                closeAllDesktopSubmenus();
            }
        }
    });
    // --- FIN CÓDIGO DEL MENÚ DESPLEGABLE (ESCRITORIO) ---

    // --- INICIO CÓDIGO MENÚ HAMBURGUESA (MÓVIL) ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');
    if (navToggle && navMenuWrapper) {
        navToggle.addEventListener('click', () => {
            const isMenuVisible = navMenuWrapper.classList.contains('menu-visible');
            navMenuWrapper.classList.toggle('menu-visible');
            navToggle.classList.toggle('menu-abierto');
            if (isMenuVisible) {
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
            } else {
                navToggle.setAttribute('aria-expanded', 'true');
                navToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
                closeAllDesktopSubmenus();
            }
        });
        navMenuWrapper.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (event) => {
                const parentLi = link.closest('li.dropdown');
                const isSubmenuTrigger = parentLi && link === parentLi.querySelector('a:first-child');
                if (navMenuWrapper.classList.contains('menu-visible')) {
                    if (!isSubmenuTrigger && link.getAttribute('href') && link.getAttribute('href') !== '#') {
                        navMenuWrapper.classList.remove('menu-visible');
                        navToggle.classList.remove('menu-abierto');
                        navToggle.setAttribute('aria-expanded', 'false');
                        navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
                    }
                }
            });
        });
    }
    // --- FIN CÓDIGO MENÚ HAMBURGUESA ---

    // --- CÓDIGO DEL CARRITO DE COMPRAS ---
    function obtenerCarrito() {
        const carritoJSON = localStorage.getItem('carrito');
        return carritoJSON ? JSON.parse(carritoJSON) : [];
    }

    function guardarCarrito(carrito) {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }

    function actualizarContadorCarrito() {
        const carrito = obtenerCarrito();
        const contadorElemento = document.querySelector('.contador-carrito');
        if (contadorElemento) {
            let totalItems = 0;
            carrito.forEach(item => {
                totalItems += item.cantidad;
            });
            contadorElemento.textContent = totalItems;
        }
    }

    function agregarAlCarrito(id, nombre, precio, imagen, cantidad = 1) {
        const carrito = obtenerCarrito();
        const itemExistente = carrito.find(item => item.id === id);

        if (itemExistente) {
            itemExistente.cantidad += cantidad;
        } else {
            carrito.push({ id, nombre, precio: parseFloat(precio), imagen, cantidad });
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();

        mostrarNotificacion(`${nombre} (x${cantidad}) añadido al carrito.`);
    }

    const botonesAnadirCarritoCards = document.querySelectorAll('.producto-card .btn-anadir-carrito');
    botonesAnadirCarritoCards.forEach(boton => {
        boton.addEventListener('click', function () {
            const card = this.closest('.producto-card');
            const id = this.dataset.id;
            const nombreElemento = card.querySelector('h3');
            const precioElemento = card.querySelector('.precio');
            const imagenElemento = card.querySelector('.producto-card-imagen img');
            if (nombreElemento && precioElemento && imagenElemento) {
                const nombre = nombreElemento.textContent.trim();
                let precioTexto = precioElemento.childNodes[0].nodeValue.trim().replace('$', '').replace(/\./g, '').replace(',', '.');
                const precio = parseFloat(precioTexto);
                const imagen = imagenElemento.src;
                if (id && nombre && !isNaN(precio) && imagen) {
                    agregarAlCarrito(id, nombre, precio, imagen, 1);
                }
            }
        });
    });

    const formDetalleProducto = document.querySelector('.formulario-compra');
    if (formDetalleProducto) {
        formDetalleProducto.addEventListener('submit', function (event) {
            event.preventDefault();
            const id = this.dataset.idproducto;
            let nombre = this.dataset.nombre;
            let precio = parseFloat(this.dataset.precio);
            let imagen = this.dataset.imagen;

            if (!nombre || isNaN(precio) || !imagen) {
                const tituloProducto = document.querySelector('.info-producto-compra h1');
                const precioActual = document.querySelector('.info-producto-compra .precio-actual');
                const imagenPrincipal = document.getElementById('imagen-principal-producto');

                nombre = nombre || (tituloProducto ? tituloProducto.textContent.trim() : "Producto Desconocido");
                precio = !isNaN(precio) ? precio : (precioActual ? parseFloat(precioActual.textContent.trim().replace('$', '').replace(/\./g, '').replace(',', '.')) : 0);
                imagen = imagen || (imagenPrincipal ? imagenPrincipal.src : 'img/placeholder.jpg');
            }

            const cantidadInput = this.querySelector('#cantidad');
            const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;

            if (id && nombre && !isNaN(precio) && imagen && cantidad > 0) {
                agregarAlCarrito(id, nombre, precio, imagen, cantidad);
            }
        });
    }

    function mostrarNotificacion(mensaje) {
        let notificacion = document.getElementById('carrito-notificacion');
        if (!notificacion) {
            notificacion = document.createElement('div');
            notificacion.id = 'carrito-notificacion';
            notificacion.style.position = 'fixed';
            notificacion.style.bottom = '20px';
            notificacion.style.right = '20px';
            notificacion.style.backgroundColor = 'var(--color-exito)';
            notificacion.style.color = 'var(--color-texto-claro)';
            notificacion.style.padding = '15px';
            notificacion.style.borderRadius = '5px';
            notificacion.style.zIndex = '2000';
            notificacion.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            notificacion.style.opacity = '0';
            notificacion.style.transition = 'opacity 0.3s ease-in-out';
            document.body.appendChild(notificacion);
        }
        notificacion.textContent = mensaje;
        notificacion.style.display = 'block';
        setTimeout(() => {
            notificacion.style.opacity = '1';
        }, 10);
        setTimeout(() => {
            notificacion.style.opacity = '0';
            setTimeout(() => {
                notificacion.style.display = 'none';
            }, 300);
        }, 3000);
    }

    function renderizarCarrito() {
        const paginaCarrito = document.querySelector('.pagina-carrito');
        if (!paginaCarrito) return;

        const carrito = obtenerCarrito();
        const tablaCarritoBody = paginaCarrito.querySelector('.tabla-carrito tbody');
        const resumenCompraLayout = paginaCarrito.querySelector('.contenido-carrito-layout');
        const mensajeCarritoVacio = paginaCarrito.querySelector('.carrito-vacio');
        const numeroItemsResumen = paginaCarrito.querySelector('.numero-items-resumen');
        const valorSubtotalResumen = paginaCarrito.querySelector('.valor-subtotal-resumen');
        const valorTotalResumen = paginaCarrito.querySelector('.valor-total-resumen');

        if (!tablaCarritoBody || !resumenCompraLayout || !mensajeCarritoVacio) {
            return;
        }

        tablaCarritoBody.innerHTML = '';
        if (carrito.length === 0) {
            if (resumenCompraLayout) resumenCompraLayout.style.display = 'none';
            if (mensajeCarritoVacio) mensajeCarritoVacio.style.display = 'block';
            if (numeroItemsResumen) numeroItemsResumen.textContent = '0';
            if (valorSubtotalResumen) valorSubtotalResumen.textContent = '$0.00';
            if (valorTotalResumen) valorTotalResumen.textContent = '$0.00';
        } else {
            if (resumenCompraLayout) resumenCompraLayout.style.display = 'grid';
            if (mensajeCarritoVacio) mensajeCarritoVacio.style.display = 'none';

            let subtotalGeneral = 0;
            let totalItemsGeneral = 0;

            carrito.forEach(item => {
                const itemSubtotal = item.precio * item.cantidad;
                subtotalGeneral += itemSubtotal;
                totalItemsGeneral += item.cantidad;

                const tr = document.createElement('tr');
                tr.classList.add('item-carrito');
                tr.dataset.iditem = item.id;
                tr.innerHTML = `
                    <td class="imagen-producto-carrito"><a href="producto-detalle.html?id=${item.id}"><img src="${item.imagen}" alt="${item.nombre}"></a></td>
                    <td class="nombre-producto-carrito"><a href="producto-detalle.html?id=${item.id}">${item.nombre}</a><small>SKU: ${item.id ? item.id.toUpperCase() : 'N/A'}</small></td>
                    <td data-label="Precio Unitario:" class="precio-unitario-carrito text-right">$${item.precio.toFixed(2)}</td>
                    <td data-label="Cantidad:" class="cantidad-item-carrito">
                        <div class="selector-cantidad selector-cantidad-carrito">
                            <button type="button" class="btn-cantidad menos" aria-label="Disminuir" data-id="${item.id}">-</button>
                            <input type="number" class="input-cantidad" value="${item.cantidad}" min="1" max="99" readonly data-id="${item.id}">
                            <button type="button" class="btn-cantidad mas" aria-label="Aumentar" data-id="${item.id}">+</button>
                        </div>
                    </td>
                    <td data-label="Subtotal:" class="subtotal-item-carrito text-right">$${itemSubtotal.toFixed(2)}</td>
                    <td class="acciones-item-carrito">
                        <button class="btn-eliminar-item" aria-label="Eliminar producto" data-id="${item.id}">
                            <img src="img/iconos/trash.svg" alt="Eliminar">
                        </button>
                    </td>
                `;
                tablaCarritoBody.appendChild(tr);
            });

            if (numeroItemsResumen) numeroItemsResumen.textContent = totalItemsGeneral;
            if (valorSubtotalResumen) valorSubtotalResumen.textContent = `$${subtotalGeneral.toFixed(2)}`;
            if (valorTotalResumen) valorTotalResumen.textContent = `$${subtotalGeneral.toFixed(2)}`;

            asignarListenersItemsCarrito();
        }

        actualizarContadorCarrito();
    }

    function asignarListenersItemsCarrito() {
        const paginaCarrito = document.querySelector('.pagina-carrito');
        if (!paginaCarrito) return;

        paginaCarrito.querySelectorAll('.selector-cantidad-carrito .menos').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function () {
                const inputCantidad = this.parentElement.querySelector('.input-cantidad');
                actualizarCantidadItem(this.dataset.id, parseInt(inputCantidad.value) - 1);
            });
        });

        paginaCarrito.querySelectorAll('.selector-cantidad-carrito .mas').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function () {
                const inputCantidad = this.parentElement.querySelector('.input-cantidad');
                actualizarCantidadItem(this.dataset.id, parseInt(inputCantidad.value) + 1);
            });
        });

        paginaCarrito.querySelectorAll('.btn-eliminar-item').forEach(boton => {
            const newBoton = boton.cloneNode(true);
            boton.parentNode.replaceChild(newBoton, boton);
            newBoton.addEventListener('click', function () {
                eliminarItemCarrito(this.dataset.id);
            });
        });
    }

    function actualizarCantidadItem(id, nuevaCantidad) {
        const carrito = obtenerCarrito();
        const itemIndex = carrito.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            const item = carrito[itemIndex];
            const inputOriginal = document.querySelector(`.item-carrito[data-iditem="${id}"] .input-cantidad`);
            const minVal = inputOriginal ? parseInt(inputOriginal.min) : 1;
            const maxVal = inputOriginal ? parseInt(inputOriginal.max) : 99;
            if (nuevaCantidad >= minVal && nuevaCantidad <= maxVal) {
                item.cantidad = nuevaCantidad;
            } else if (nuevaCantidad < minVal) {
                item.cantidad = minVal;
            } else if (nuevaCantidad > maxVal) {
                item.cantidad = maxVal;
            }
            guardarCarrito(carrito);
            renderizarCarrito();
        }
    }

    function eliminarItemCarrito(id) {
        let carrito = obtenerCarrito();
        carrito = carrito.filter(item => item.id !== id);
        guardarCarrito(carrito);
        renderizarCarrito();
        mostrarNotificacion("Producto eliminado del carrito.");
    }

    const btnVaciarCarrito = document.querySelector('.btn-vaciar-carrito');
    if (btnVaciarCarrito) {
        btnVaciarCarrito.addEventListener('click', function () {
            if (confirm("¿Estás seguro de que querés vaciar el carrito?")) {
                guardarCarrito([]);
                renderizarCarrito();
                mostrarNotificacion("Carrito vaciado.");
            }
        });
    }
    // --- FIN CÓDIGO DEL CARRITO DE COMPRAS ---

    // --- FUNCIÓN NUEVA: Cargar productos desde el backend ---
    async function cargarProductos() {
        try {
            const respuesta = await fetch("http://localhost:3000/api/productos");
            const productos = await respuesta.json();

            const contenedor = document.getElementById("productos");
            if (!contenedor) return;
            contenedor.innerHTML = "";

            if (productos.length === 0) {
                contenedor.innerHTML = "<p>No hay productos disponibles</p>";
                return;
            }

            productos.forEach(producto => {
                const card = document.createElement("div");
                card.className = "producto-card";
                card.innerHTML = `
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <h3>${producto.nombre}</h3>
                    <p>$${producto.precioMinorista} (minorista)</p>
                    <p>$${producto.precioMayorista} (mayorista)</p>
                    <button class="btn-anadir-carrito" data-id="${producto._id}">Agregar al carrito</button>
                `;
                contenedor.appendChild(card);
            });

            // Recargar eventos del carrito
            const nuevosBotones = document.querySelectorAll('.producto-card .btn-anadir-carrito');
            nuevosBotones.forEach(boton => {
                boton.addEventListener('click', function () {
                    const card = this.closest('.producto-card');
                    const id = this.dataset.id;
                    const nombreElemento = card.querySelector('h3');
                    const precioElemento = card.querySelector('.precio-unitario-carrito');
                    const imagenElemento = card.querySelector('img');
                    if (nombreElemento && precioElemento && imagenElemento) {
                        const nombre = nombreElemento.textContent.trim();
                        let precioTexto = precioElemento.textContent.trim().replace('$', '');
                        const precio = parseFloat(precioTexto);
                        const imagen = imagenElemento.src;
                        if (id && nombre && !isNaN(precio) && imagen) {
                            agregarAlCarrito(id, nombre, precio, imagen, 1);
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Error al cargar productos:", error);
            alert("No se pudieron cargar los productos");
        }
    }

    // Llamar a cargar productos si estamos en index.html
    if (document.getElementById("productos")) {
        cargarProductos();
    }
    // --- FIN DE LA FUNCIÓN NUEVA ---

    // --- CÓDIGO PARA LA PÁGINA DE DETALLE DE PRODUCTO ---
    const galeriaProducto = document.querySelector('.galeria-producto');
    const tabsNav = document.querySelector('.tabs-nav');

    if (galeriaProducto) {
        const imagenPrincipal = document.getElementById('imagen-principal-producto');
        const miniaturas = galeriaProducto.querySelectorAll('.miniaturas-galeria .miniatura');
        if (imagenPrincipal && miniaturas.length > 0) {
            miniaturas.forEach(miniatura => {
                miniatura.addEventListener('click', function () {
                    const nuevaImagenSrc = this.dataset.imagenGrande;
                    if (nuevaImagenSrc) {
                        imagenPrincipal.src = nuevaImagenSrc;
                        imagenPrincipal.alt = this.alt;
                    }
                    miniaturas.forEach(m => m.classList.remove('active'));
                    this.classList.add('active');
                });
                miniatura.addEventListener('mouseenter', function () {
                    const nuevaImagenSrc = this.dataset.imagenGrande;
                    if (nuevaImagenSrc) {
                        const imgPreload = new Image();
                        imgPreload.src = nuevaImagenSrc;
                    }
                });
            });
        }
    }

    if (tabsNav) {
        const tabLinks = tabsNav.querySelectorAll('.tab-link');
        const tabContentsContainer = document.querySelector('.descripcion-tabs-producto');
        if (tabContentsContainer) {
            const tabContents = tabContentsContainer.querySelectorAll(':scope > .tab-content');
            tabLinks.forEach(link => {
                link.addEventListener('click', function () {
                    const tabId = this.dataset.tab;
                    tabContents.forEach(content => content.classList.remove('active'));
                    tabLinks.forEach(l => l.classList.remove('active'));
                    const activeContent = document.getElementById(tabId);
                    if (activeContent) activeContent.classList.add('active');
                    this.classList.add('active');
                });
            });
        }
    }

    const selectoresCantidadGlobales = document.querySelectorAll('.selector-cantidad:not(.selector-cantidad-carrito)');
    selectoresCantidadGlobales.forEach(selector => {
        const esDelCarrito = selector.classList.contains('selector-cantidad-carrito');
        const btnMenos = selector.querySelector('.menos');
        const btnMas = selector.querySelector('.mas');
        const inputCantidad = selector.querySelector('.input-cantidad');
        if (btnMenos && btnMas && inputCantidad) {
            if (!esDelCarrito || (esDelCarrito && !btnMenos.dataset.listenerAsignado)) {
                btnMenos.addEventListener('click', function () {
                    let valorActual = parseInt(inputCantidad.value);
                    const minVal = parseInt(inputCantidad.min) || 1;
                    if (valorActual > minVal) {
                        inputCantidad.value = valorActual - 1;
                        if (esDelCarrito) {
                            actualizarCantidadItem(inputCantidad.dataset.id, parseInt(inputCantidad.value));
                        }
                    }
                });
                if (esDelCarrito) btnMenos.dataset.listenerAsignado = 'true';
            }
            if (!esDelCarrito || (esDelCarrito && !btnMas.dataset.listenerAsignado)) {
                btnMas.addEventListener('click', function () {
                    let valorActual = parseInt(inputCantidad.value);
                    const maxVal = parseInt(inputCantidad.max) || 99;
                    if (valorActual < maxVal) {
                        inputCantidad.value = valorActual + 1;
                        if (esDelCarrito) {
                            actualizarCantidadItem(inputCantidad.dataset.id, parseInt(inputCantidad.value));
                        }
                    }
                });
                if (esDelCarrito) btnMas.dataset.listenerAsignado = 'true';
            }
        }
    });
    // --- FIN CÓDIGO PARA LA PÁGINA DE DETALLE DE PRODUCTO ---

    // --- CÓDIGO PARA LA NAVEGACIÓN DEL CHECKOUT ---
    const paginaCheckout = document.querySelector('.pagina-checkout');
    if (paginaCheckout) {
        const pasosCheckout = paginaCheckout.querySelectorAll('.paso-checkout');
        const botonesContinuar = paginaCheckout.querySelectorAll('.btn-continuar-checkout');
        const botonesVolver = paginaCheckout.querySelectorAll('.btn-volver-checkout');
        let pasoActual = 0;

        function mostrarPaso(indicePaso) {
            pasosCheckout.forEach((paso, index) => {
                if (index === indicePaso) {
                    paso.style.display = 'block';
                } else {
                    paso.style.display = 'none';
                }
            });
            pasoActual = indicePaso;
        }

        botonesContinuar.forEach(boton => {
            boton.addEventListener('click', function () {
                const siguientePasoId = this.dataset.siguientePaso;
                let indiceSiguiente = -1;
                pasosCheckout.forEach((paso, index) => {
                    if (paso.id === siguientePasoId) {
                        indiceSiguiente = index;
                    }
                });
                if (indiceSiguiente !== -1) {
                    mostrarPaso(indiceSiguiente);
                }
            });
        });

        botonesVolver.forEach(boton => {
            boton.addEventListener('click', function () {
                const pasoAnteriorId = this.dataset.pasoAnterior;
                let indiceAnterior = -1;
                pasosCheckout.forEach((paso, index) => {
                    if (paso.id === pasoAnteriorId) {
                        indiceAnterior = index;
                    }
                });
                if (indiceAnterior !== -1) {
                    mostrarPaso(indiceAnterior);
                }
            });
        });

        if (pasosCheckout.length > 0) {
            mostrarPaso(0);
        }
    }
    // --- FIN CÓDIGO PARA LA NAVEGACIÓN DEL CHECKOUT ---

    // --- CÓDIGO PARA MOSTRAR/OCULTAR CONTRASEÑA ---
    const togglePasswordButtons = document.querySelectorAll('.btn-toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function () {
            const wrapper = this.closest('.input-password-wrapper');
            if (!wrapper) return;
            const passwordInput = wrapper.querySelector('input[type="password"], input[type="text"]');
            const icon = this.querySelector('.icono-password');
            if (passwordInput && icon) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.src = 'img/iconos/eye.svg';
                    icon.alt = 'Mostrar contraseña';
                } else {
                    passwordInput.type = 'password';
                    icon.src = 'img/iconos/eye-slash.svg';
                    icon.alt = 'Ocultar contraseña';
                }
            }
        });
    });
    // --- FIN CÓDIGO PARA MOSTRAR/OCULTAR CONTRASEÑA ---

    // Inicialización final
    if (document.querySelector('.pagina-carrito')) {
        renderizarCarrito();
    }
    actualizarContadorCarrito();
});