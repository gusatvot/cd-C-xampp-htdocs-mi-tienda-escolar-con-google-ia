// frontend/js/pages/registro.js

import { registrarUsuario } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Apuntamos a los elementos del formulario por su ID
    const form = document.getElementById('form-registro');
    const mensajeError = document.getElementById('mensaje-error');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password-confirmar');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evita que la página se recargue
            mensajeError.style.display = 'none'; // Oculta errores anteriores

            // --- VALIDACIÓN EN EL FRONTEND (UNA BUENA PRÁCTICA) ---
            if (passwordInput.value !== passwordConfirmInput.value) {
                mensajeError.textContent = 'Las contraseñas no coinciden. Por favor, verifíquelas.';
                mensajeError.style.display = 'block';
                return; // Detiene el envío si las contraseñas no coinciden
            }

            // *** CORRECCIÓN CLAVE: Leemos los valores de los inputs correctos ***
            const nombre = document.getElementById('nombre').value;
            const apellido = document.getElementById('apellido').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;

            try {
                // Enviamos un objeto que coincide con lo que el backend espera
                const respuesta = await registrarUsuario({ nombre, apellido, email, password });
                
                alert(respuesta.message); // Muestra "Usuario registrado con éxito..."
                
                // Redirigimos al usuario a la página de login para que inicie sesión
                window.location.href = 'login.html';

            } catch (error) {
                // Muestra el mensaje de error que viene del backend (ej: "El correo ya existe")
                mensajeError.textContent = error.message;
                mensajeError.style.display = 'block';
            }
        });
    }
});