// frontend/js/pages/registro.js
import { registrarUsuario } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro'); // Asegúrate que tu form tenga este ID
    const mensajeError = document.getElementById('mensaje-error'); // Un div para mostrar errores

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = form.nombre.value;
            const email = form.email.value;
            const password = form.password.value;

            try {
                const respuesta = await registrarUsuario({ nombre, email, password });
                
                // Si el registro es exitoso, redirigimos al login
                alert(respuesta.message); // O usar SweetAlert2
                window.location.href = 'login.html';

            } catch (error) {
                mensajeError.textContent = error.message;
                mensajeError.style.display = 'block';
            }
        });
    }
});