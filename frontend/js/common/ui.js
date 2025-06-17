// frontend/js/common/ui.js

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA EL MENÚ MÓVIL (HAMBURGUESA) ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');

    if (navToggle && navMenuWrapper) {
        navToggle.addEventListener('click', (event) => {
            // Detenemos la propagación para que el clic en el toggle
            // no active el listener de 'window' que cierra los menús.
            event.stopPropagation();
            
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);

            // La clase que tu CSS usa para el menú móvil es 'menu-visible'
            navMenuWrapper.classList.toggle('menu-visible'); 
            navToggle.classList.toggle('menu-abierto');
            document.body.classList.toggle('no-scroll');
        });
    }

    // --- LÓGICA CORREGIDA PARA EL MENÚ DESPLEGABLE DE ESCRITORIO ---
    const dropdowns = document.querySelectorAll('.nav-bar .dropdown');

    dropdowns.forEach(dropdown => {
        // Seleccionamos el enlace principal (ej. "Productos")
        const mainLink = dropdown.querySelector('a');

        mainLink.addEventListener('click', (event) => {
            // Prevenimos que el enlace navegue, solo queremos que abra el menú.
            event.preventDefault(); 
            // Detenemos la propagación para que no se cierre inmediatamente por el listener de window.
            event.stopPropagation(); 
            
            // Buscamos el submenú DENTRO del dropdown en el que hicimos clic.
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');

            // Cerramos cualquier otro menú que pueda estar abierto
            closeAllDropdowns(dropdown);

            // Ahora, alternamos las clases que TU CSS está esperando.
            dropdown.classList.toggle('dropdown-active'); // Para rotar la flecha
            dropdownMenu.classList.toggle('dropdown-menu-visible'); // Para mostrar el menú
        });
    });

    /**
     * Cierra todos los menús desplegables excepto el que se está intentando abrir.
     * @param {HTMLElement} currentDropdown - El menú que no debe cerrarse.
     */
    const closeAllDropdowns = (currentDropdown = null) => {
        dropdowns.forEach(d => {
            if (d !== currentDropdown) {
                d.classList.remove('dropdown-active');
                d.querySelector('.dropdown-menu').classList.remove('dropdown-menu-visible');
            }
        });
    };

    // --- CERRAR MENÚS AL HACER CLIC FUERA ---
    window.addEventListener('click', () => {
        closeAllDropdowns();
        // También cerramos el menú móvil si se hace clic fuera
        if (navMenuWrapper && navMenuWrapper.classList.contains('menu-visible')) {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenuWrapper.classList.remove('menu-visible');
            navToggle.classList.remove('menu-abierto');
            document.body.classList.remove('no-scroll');
        }
    });
});