import { actualizarUIAuth } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("CONTACTO.JS: DOMContentLoaded.");
    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito();
});