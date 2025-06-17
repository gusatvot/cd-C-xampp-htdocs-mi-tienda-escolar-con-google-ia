// frontend/js/common/ui.js

document.addEventListener('DOMContentLoaded', () => {
    
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
            event.preventDefault(); 
            event.stopPropagation(); 
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            closeAllDropdowns(dropdown);
            dropdown.classList.toggle('dropdown-active');
            dropdownMenu.classList.toggle('dropdown-menu-visible');
        });
    });

    const closeAllDropdowns = (currentDropdown = null) => {
        dropdowns.forEach(d => {
            if (d !== currentDropdown) {
                d.classList.remove('dropdown-active');
                d.querySelector('.dropdown-menu').classList.remove('dropdown-menu-visible');
            }
        });
    };

    // --- LÓGICA PARA MOSTRAR/OCULTAR CONTRASEÑA (NUEVO) ---
    // Seleccionamos TODOS los botones para mostrar/ocultar contraseña
    const togglePasswordButtons = document.querySelectorAll('.btn-toggle-password');

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Buscamos el campo de contraseña que está justo antes del botón
            const passwordInput = button.previousElementSibling;
            const icon = button.querySelector('img');

            // Comprobamos el tipo actual del campo
            if (passwordInput.type === 'password') {
                // Si es contraseña, lo cambiamos a texto
                passwordInput.type = 'text';
                // Y cambiamos el icono al ojo abierto
                icon.src = 'img/iconos/eye.svg'; // ¡Asegúrate de tener este icono!
                icon.alt = 'Ocultar contraseña';
            } else {
                // Si es texto, lo volvemos a poner como contraseña
                passwordInput.type = 'password';
                // Y volvemos al icono del ojo tachado
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
});