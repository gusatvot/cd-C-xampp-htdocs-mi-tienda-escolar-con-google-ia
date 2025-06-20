// frontend/js/common/ui.js

// Importamos las funciones que este módulo necesita de otros módulos.
import { getCarrito } from '../api/client.js';
import { isLoggedIn } from './auth.js';

/**
 * Inicializa los componentes de UI comunes en todas las páginas,
 * (menú móvil, desplegables, botones para ver/ocultar contraseñas).
 */
export function inicializarUI() {
    
    // --- LÓGICA PARA EL MENÚ MÓVIL (HAMBURGUESA) ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');

    if (navToggle && navMenuWrapper) {
        navToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenuWrapper.classList.toggle('menu-visible');
            navToggle.classList.toggle('menu-abierto');
            document.body.classList.toggle('no-scroll');
        });
    }

    // --- LÓGICA PARA EL MENÚ DESPLEGABLE DE ESCRITORIO ---
    const dropdowns = document.querySelectorAll('.nav-bar .dropdown');

    dropdowns.forEach(dropdown => {
        const mainLink = dropdown.querySelector('a');
        mainLink.addEventListener('click', (event) => {
            if (window.innerWidth >= 992) {
                event.preventDefault();
            }
            event.stopPropagation();
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                closeAllDropdowns(dropdown);
                dropdown.classList.toggle('dropdown-active');
                dropdownMenu.classList.toggle('dropdown-menu-visible');
            }
        });
    });

    const closeAllDropdowns = (currentDropdown = null) => {
        dropdowns.forEach(d => {
            if (d !== currentDropdown) {
                d.classList.remove('dropdown-active');
                const menu = d.querySelector('.dropdown-menu');
                if(menu) menu.classList.remove('dropdown-menu-visible');
            }
        });
    };

    // --- LÓGICA PARA MOSTRAR/OCULTAR CONTRASEÑA ---
    const togglePasswordButtons = document.querySelectorAll('.btn-toggle-password');

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const passwordInput = button.previousElementSibling;
            const icon = button.querySelector('img');
            if (!passwordInput || !icon) return;

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

    // --- CERRAR MENÚS AL HACER CLIC FUERA ---
    window.addEventListener('click', () => {
        closeAllDropdowns();
        if (navMenuWrapper && navMenuWrapper.classList.contains('menu-visible')) {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenuWrapper.classList.remove('menu-visible');
            navToggle.classList.remove('menu-abierto');
            document.body.classList.remove('no-scroll');
        }
    });
}


/**
 * Actualiza el número en el ícono del carrito en el header.
 */
export async function actualizarContadorCarrito() {
    const contadorElemento = document.querySelector('.contador-carrito');
    if (!contadorElemento) return;

    if (isLoggedIn()) {
        try {
            const carrito = await getCarrito();
            const totalItems = carrito.items.reduce((total, item) => total + item.cantidad, 0);
            contadorElemento.textContent = totalItems;
            contadorElemento.style.display = totalItems > 0 ? 'inline-flex' : 'none';
        } catch (error) {
            console.error('No se pudo actualizar el contador del carrito:', error.message);
            contadorElemento.textContent = '0';
            contadorElemento.style.display = 'none';
        }
    } else {
        contadorElemento.textContent = '0';
        contadorElemento.style.display = 'none';
    }
}