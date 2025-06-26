// frontend/js/pages/nosotros.js
import { actualizarUIAuth } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito();
    // No hay lógica de redirección aquí
});