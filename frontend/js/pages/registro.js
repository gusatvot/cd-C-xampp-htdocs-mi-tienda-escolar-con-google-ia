// frontend/js/pages/registro.js

import { registrarUsuario } from '../api/client.js';
import { actualizarUIAuth, isLoggedIn } from '../common/auth.js'; // Importamos isLoggedIn
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito();

    // --- LÓGICA OPCIONAL: Si ya está logueado, redirigir ---
    if (isLoggedIn()) {
        window.location.href = 'mi-cuenta.html';
        return; 
    }
    // ----------------------------------------------------

    const form = document.getElementById('form-registro');
    const mensajeErrorDiv = document.getElementById('mensaje-error');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password-confirmar'); // Asumo que este es el ID

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (mensajeErrorDiv) {
                mensajeErrorDiv.style.display = 'none';
                mensajeErrorDiv.textContent = '';
            }

            if (passwordInput.value !== passwordConfirmInput.value) {
                if(mensajeErrorDiv) {
                    mensajeErrorDiv.textContent = 'Las contraseñas no coinciden.';
                    mensajeErrorDiv.style.display = 'block';
                } else {
                    alert('Las contraseñas no coinciden.');
                }
                return;
            }

            const nombre = form.elements['nombre'].value; // Usar form.elements es más seguro
            const apellido = form.elements['apellido'].value;
            const email = form.elements['email'].value;
            const password = passwordInput.value;

            try {
                // El backend en registrarUsuario devuelve el usuario creado, no un token
                const respuesta = await registrarUsuario({ nombre, apellido, email, password });
                
                alert('¡Registro exitoso! Serás redirigido para iniciar sesión.');
                window.location.href = 'login.html';

            } catch (error) {
                if (mensajeErrorDiv) {
                    mensajeErrorDiv.textContent = error.message || "Ocurrió un error desconocido.";
                    mensajeErrorDiv.style.display = 'block';
                } else {
                    alert(`Error: ${error.message || "Ocurrió un error desconocido."}`);
                }
                console.error("Error en registro:", error);
            }
        });
    } else {
        console.error("No se encontró el formulario con id 'form-registro'.");
    }
});