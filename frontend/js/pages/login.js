// frontend/js/pages/login.js (VERSIÓN DE DEPURACIÓN EXTREMA)

// Solo importamos lo estrictamente necesario para el login
import { loginUsuario } from '../api/client.js';
import { guardarToken } from '../common/auth.js'; // Solo para guardar el token

document.addEventListener('DOMContentLoaded', () => {
    console.log("LOGIN.JS (DEBUG): DOMContentLoaded iniciado.");

    const form = document.getElementById('form-login');
    const mensajeErrorDiv = document.getElementById('mensaje-error');

    if (!form) {
        console.error("LOGIN.JS (DEBUG): CRÍTICO - No se encontró el formulario con id 'form-login'.");
        return;
    }
    console.log("LOGIN.JS (DEBUG): Formulario 'form-login' encontrado:", form);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("LOGIN.JS (DEBUG): Submit del formulario capturado.");

        if (mensajeErrorDiv) {
            mensajeErrorDiv.style.display = 'none';
            mensajeErrorDiv.textContent = '';
        }

        // Logueamos toda la colección de elementos del formulario
        console.log("LOGIN.JS (DEBUG): Elementos del formulario (form.elements):", form.elements);

        // Intentamos acceder a los campos usando los nombres que VIMOS en el log anterior
        const emailInput = form.elements['email-login'];
        const passwordInput = form.elements['password-login'];

        console.log("LOGIN.JS (DEBUG): emailInput encontrado:", emailInput);
        console.log("LOGIN.JS (DEBUG): passwordInput encontrado:", passwordInput);

        if (!emailInput || !passwordInput) {
            console.error("LOGIN.JS (DEBUG): Error crítico: No se pudieron encontrar 'email-login' o 'password-login' en form.elements.");
            if (mensajeErrorDiv) {
                mensajeErrorDiv.textContent = "Error al obtener campos del formulario (ver consola).";
                mensajeErrorDiv.style.display = 'block';
            }
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        console.log("LOGIN.JS (DEBUG): Email leído:", email, "Password leída:", password ? '******' : 'VACÍA');

        if (!email || !password) {
            console.warn("LOGIN.JS (DEBUG): Email o Password están vacíos.");
            if (mensajeErrorDiv) {
                mensajeErrorDiv.textContent = "Por favor, complete el email y la contraseña.";
                mensajeErrorDiv.style.display = 'block';
            }
            return;
        }

        try {
            console.log("LOGIN.JS (DEBUG): Enviando credenciales al backend...");
            const respuesta = await loginUsuario({ email, password });
            console.log("LOGIN.JS (DEBUG): Respuesta del backend:", respuesta);

            if (respuesta && respuesta.token) {
                guardarToken(respuesta.token);
                alert('¡Login exitoso! (Redirección manual a mi-cuenta.html necesaria por ahora)');
                // Por ahora, no redirigimos para poder ver los logs tranquilamente.
                // window.location.replace('mi-cuenta.html');
            } else {
                throw new Error(respuesta?.message || 'Respuesta de login inesperada.');
            }
        } catch (error) {
            console.error("LOGIN.JS (DEBUG): Error durante el login:", error);
            if (mensajeErrorDiv) {
                mensajeErrorDiv.textContent = error.message || "Error desconocido.";
                mensajeErrorDiv.style.display = 'block';
            } else {
                alert("Error: " + (error.message || "Error desconocido."));
            }
        }
    });
});