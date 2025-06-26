// frontend/js/common/ui.js

import { getCarrito } from '../api/client.js'; 
import { isLoggedIn } from './auth.js';      

/**
 * Inicializa todos los componentes de UI comunes.
 * Esta función debe ser llamada en el DOMContentLoaded de cada página.
 */
export function inicializarUI() {
    console.log("UI.JS: inicializarUI() llamada.");

    // --- LÓGICA PARA EL MENÚ MÓVIL (HAMBURGUESA) ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');

    if (navToggle && navMenuWrapper) {
        console.log("UI.JS (Mobile Menu): Botón hamburguesa y wrapper encontrados.");
        navToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que el clic en el botón se propague al 'window'
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded); // Cambia el estado ARIA
            navMenuWrapper.classList.toggle('menu-visible'); // Muestra/oculta el menú
            navToggle.classList.toggle('menu-abierto');    // Cambia el estilo del icono hamburguesa
            document.body.classList.toggle('no-scroll');   // Previene el scroll del body
            console.log("UI.JS (Mobile Menu): Toggle menú móvil. Wrapper visible:", navMenuWrapper.classList.contains('menu-visible'));
        });
    } else {
        console.warn("UI.JS (Mobile Menu): Elementos del menú móvil (.nav-toggle o .nav-menu-wrapper) no encontrados.");
    }

    // --- LÓGICA PARA EL MENÚ DESPLEGABLE DE ESCRITORIO (Y MÓVIL SI SE CONFIGURA ASÍ) ---
    const dropdowns = document.querySelectorAll('.nav-bar ul > li.dropdown');

    if (dropdowns.length > 0) {
        console.log("UI.JS (Dropdowns): Dropdowns encontrados:", dropdowns.length);
        dropdowns.forEach(dropdownElement => { 
            const mainLink = dropdownElement.querySelector('a:first-child'); 
            const dropdownMenu = dropdownElement.querySelector('.dropdown-menu');

            if (mainLink && dropdownMenu) {
                mainLink.addEventListener('click', (event) => {
                    console.log("UI.JS (Dropdowns): Clic en", mainLink.textContent.trim());
                    
                    // Prevenir navegación si es necesario para abrir el submenú
                    if (window.innerWidth >= 992) { // En escritorio, siempre prevenimos para que el clic abra el submenú
                        event.preventDefault();
                    } else if (navMenuWrapper && navMenuWrapper.classList.contains('menu-visible')) {
                        // En móvil, si el menú principal está desplegado, también prevenimos para abrir el submenú
                        event.preventDefault();
                    }
                    // Si no se previene, el enlace navegará (ej. en móvil si el menú está cerrado y se clickea directo)

                    event.stopPropagation(); // Detener la propagación para el listener de window

                    const isActive = dropdownElement.classList.contains('dropdown-active');

                    // Cerrar otros dropdowns antes de actuar sobre el actual
                    dropdowns.forEach(otherDropdown => {
                        if (otherDropdown !== dropdownElement) {
                            otherDropdown.classList.remove('dropdown-active');
                            otherDropdown.querySelector('.dropdown-menu')?.classList.remove('dropdown-menu-visible');
                        }
                    });

                    // Toggle del dropdown actual
                    if (isActive) {
                        dropdownElement.classList.remove('dropdown-active');
                        dropdownMenu.classList.remove('dropdown-menu-visible');
                        console.log("UI.JS (Dropdowns): Cerrando dropdown.");
                    } else {
                        dropdownElement.classList.add('dropdown-active');
                        dropdownMenu.classList.add('dropdown-menu-visible');
                        console.log("UI.JS (Dropdowns): Abriendo dropdown.");
                    }
                });
            } else {
                console.warn("UI.JS (Dropdowns): Enlace principal o submenú no encontrado para un li.dropdown:", dropdownElement);
            }
        });
    } else {
        console.warn("UI.JS (Dropdowns): No se encontraron elementos 'li.dropdown' en '.nav-bar ul'.");
    }
    
    // --- LÓGICA PARA MOSTRAR/OCULTAR CONTRASEÑA ---
    const togglePasswordButtons = document.querySelectorAll('.btn-toggle-password');
    if (togglePasswordButtons.length > 0) {
        console.log("UI.JS (Password Toggle): Botones encontrados:", togglePasswordButtons.length);
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', () => {
                const passwordInput = button.previousElementSibling; // Asume que el input está justo antes
                const icon = button.querySelector('img');
                
                if (!passwordInput || passwordInput.tagName !== 'INPUT') {
                     console.warn("UI.JS (Password Toggle): No se encontró un input de contraseña antes del botón:", button);
                     return;
                }
                if (!icon) {
                    console.warn("UI.JS (Password Toggle): No se encontró <img> dentro del botón:", button);
                    return;
                }

                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.src = 'img/iconos/eye.svg'; 
                    icon.alt = 'Ocultar contraseña';
                } else {
                    passwordInput.type = 'password';
                    icon.src = 'img/iconos/eye-slash.svg';
                    icon.alt = 'Mostrar contraseña';
                }
            });
        });
    } else {
         console.log("UI.JS (Password Toggle): No se encontraron botones '.btn-toggle-password'.");
    }

    // --- CERRAR MENÚS (MÓVIL Y DESPLEGABLES DE ESCRITORIO) AL HACER CLIC FUERA ---
    window.addEventListener('click', (event) => {
        let clickedOnNavToggle = navToggle ? navToggle.contains(event.target) : false;
        let clickedInsideNavMenuWrapper = navMenuWrapper ? navMenuWrapper.contains(event.target) : false;
        
        // Cerrar menú móvil si está visible y el clic fue fuera de él y fuera del toggle
        if (navMenuWrapper && navMenuWrapper.classList.contains('menu-visible') && !clickedInsideNavMenuWrapper && !clickedOnNavToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenuWrapper.classList.remove('menu-visible');
            navToggle.classList.remove('menu-abierto');
            document.body.classList.remove('no-scroll');
            console.log("UI.JS (Mobile Menu): Menú móvil cerrado por clic fuera.");
        }

        // Cerrar dropdowns de escritorio
        let clickedInsideADesktopDropdownItem = false;
        dropdowns.forEach(dropdownElement => {
            // Verificamos si el clic fue dentro del elemento li.dropdown (que contiene el enlace principal y el submenú)
            if (dropdownElement.contains(event.target)) {
                clickedInsideADesktopDropdownItem = true;
            }
        });
        
        // Si el clic NO fue en el toggle del menú móvil Y NO fue dentro de un ítem de dropdown de escritorio
        if (!clickedOnNavToggle && !clickedInsideADesktopDropdownItem) {
            dropdowns.forEach(d => {
                d.classList.remove('dropdown-active');
                d.querySelector('.dropdown-menu')?.classList.remove('dropdown-menu-visible');
            });
            // console.log("UI.JS (Dropdowns): Clic fuera, cerrando todos los dropdowns de escritorio.");
        }
    });
}

/**
 * Actualiza el número en el ícono del carrito en el header.
 */
export async function actualizarContadorCarrito() {
    const contadorElemento = document.querySelector('.contador-carrito');
    if (!contadorElemento) {
        console.warn("UI.JS (actualizarContadorCarrito): Elemento '.contador-carrito' no encontrado.");
        return;
    }

    console.log("UI.JS (actualizarContadorCarrito): Iniciando actualización del contador.");
    if (isLoggedIn()) { // isLoggedIn viene de auth.js
        try {
            const carrito = await getCarrito(); // getCarrito viene de client.js
            console.log("UI.JS (actualizarContadorCarrito): Carrito recibido de API:", carrito ? JSON.parse(JSON.stringify(carrito)) : "Carrito nulo/undefined"); 
            
            if (carrito && carrito.items && Array.isArray(carrito.items)) {
                const totalItems = carrito.items.reduce((total, item) => {
                    const cantidadItem = Number(item.cantidad); 
                    // console.log(`UI.JS (actualizarContadorCarrito): Item: ${item.nombre || 'Desconocido'}, Cantidad: ${cantidadItem}`);
                    return total + (isNaN(cantidadItem) ? 0 : cantidadItem);
                }, 0);
                console.log("UI.JS (actualizarContadorCarrito): Total items calculado:", totalItems);
                contadorElemento.textContent = totalItems.toString();
                contadorElemento.style.display = totalItems > 0 ? 'inline-flex' : 'none';
            } else {
                console.warn("UI.JS (actualizarContadorCarrito): Carrito o items del carrito no están en el formato esperado. Carrito:", carrito);
                contadorElemento.textContent = '0';
                contadorElemento.style.display = 'none';
            }
        } catch (error) {
            console.error('UI.JS (actualizarContadorCarrito): Error al obtener o procesar el carrito:', error.message);
            contadorElemento.textContent = '0';
            contadorElemento.style.display = 'none';
        }
    } else {
        console.log("UI.JS (actualizarContadorCarrito): Usuario no logueado, contador a 0.");
        contadorElemento.textContent = '0';
        contadorElemento.style.display = 'none';
    }
}