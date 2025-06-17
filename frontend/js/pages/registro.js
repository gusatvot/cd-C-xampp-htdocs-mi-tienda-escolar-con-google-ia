import { registrarUsuario } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Tu formulario de registro debe tener el id="form-registro"
    const form = document.getElementById('form-registro');
    const mensajeError = document.getElementById('mensaje-error');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            mensajeError.style.display = 'none';

            const nombre = form.nombre.value;
            const email = form.email.value;
            const password = form.password.value;
            // Podrías añadir un campo para confirmar contraseña aquí

            try {
                const respuesta = await registrarUsuario({ nombre, email, password });
                
                alert(respuesta.message); // Muestra "Usuario registrado con éxito"
                // Redirigimos al usuario a la página de login para que inicie sesión
                window.location.href = 'login.html';

            } catch (error) {
                mensajeError.textContent = error.message;
                mensajeError.style.display = 'block';
            }
        });
    }
});