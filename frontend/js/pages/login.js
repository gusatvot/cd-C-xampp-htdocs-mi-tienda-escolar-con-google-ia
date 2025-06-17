import { loginUsuario } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Es crucial que tu formulario de login tenga el id="form-login"
    const form = document.getElementById('form-login'); 
    // Y que tengas un div con id="mensaje-error" para mostrar los fallos
    const mensajeError = document.getElementById('mensaje-error'); 

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evita que la página se recargue
            mensajeError.style.display = 'none'; // Oculta errores anteriores

            const email = form.email.value;
            const password = form.password.value;

            try {
                const respuesta = await loginUsuario({ email, password });
                
                if (respuesta.token) {
                    // Guardamos el "pase VIP" (token) en el almacenamiento local del navegador
                    localStorage.setItem('token', respuesta.token);
                    alert('¡Inicio de sesión exitoso!');
                    // Redirigimos al usuario a la página de su cuenta o al inicio
                    window.location.href = 'mi-cuenta.html';
                }
            } catch (error) {
                mensajeError.textContent = error.message;
                mensajeError.style.display = 'block';
            }
        });
    }
});