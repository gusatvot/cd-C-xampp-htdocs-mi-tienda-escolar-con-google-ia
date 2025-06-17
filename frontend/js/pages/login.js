// frontend/js/pages/login.js
import { loginUsuario } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login'); // Asegúrate que tu form tenga este ID
    const mensajeError = document.getElementById('mensaje-error');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = form.email.value;
            const password = form.password.value;

            try {
                const respuesta = await loginUsuario({ email, password });
                
                // Si el login es exitoso, guardamos el token en el navegador
                if (respuesta.token) {
                    localStorage.setItem('token', respuesta.token);
                    alert('¡Inicio de sesión exitoso!');
                    window.location.href = 'mi-cuenta.html'; // O a la página principal
                }

            } catch (error) {
                mensajeError.textContent = error.message;
                mensajeError.style.display = 'block';
            }
        });
    }
});