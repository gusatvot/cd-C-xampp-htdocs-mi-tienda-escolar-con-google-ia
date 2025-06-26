// frontend/js/pages/index-page.js
import { actualizarUIAuth } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("INDEX.JS: DOMContentLoaded.");
    inicializarUI();
    actualizarUIAuth(); // <--- ¡LLAMARLA AQUÍ!
    actualizarContadorCarrito();

    // Aquí puedes poner cualquier otra lógica específica de tu index.html
    // como inicializar el slider, cargar productos destacados, etc.
});