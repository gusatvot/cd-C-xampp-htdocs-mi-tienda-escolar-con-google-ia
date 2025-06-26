// frontend/js/pages/login.js

import { loginUsuario, getPerfilUsuario } from '../api/client.js'; // getPerfilUsuario añadido
import { guardarToken, actualizarUIAuth, isLoggedIn, guardarPerfilEnSesion } from '../common/auth.js'; // isLoggedIn y guardarPerfilEnSesion añadidos/asegurados
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("LOGIN.JS: DOMContentLoaded.");
    inicializarUI();
    actualizarUIAuth(); // Actualiza el header según el estado de login actual (antes de cualquier acción)
    actualizarContadorCarrito();

    if (isLoggedIn()) {
        console.log("LOGIN.JS: Usuario ya logueado, redirigiendo a mi-cuenta.html");
        window.location.replace('mi-cuenta.html');
        return;
    }

    const form = document.getElementById('form-login');
    const mensajeErrorDiv = document.getElementById('mensaje-error');

    if (!form) {
        console.error("LOGIN.JS: Formulario 'form-login' NO encontrado.");
        return;
    }
    console.log("LOGIN.JS: Formulario 'form-login' encontrado.");

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("LOGIN.JS: Submit capturado.");
        if (mensajeErrorDiv) {
            mensajeErrorDiv.style.display = 'none';
            mensajeErrorDiv.textContent = '';
        }

        const emailInput = form.elements['email-login']; // Usando el ID que confirmamos que existe
        const passwordInput = form.elements['password-login']; // Usando el ID que confirmamos que existe

        if (!emailInput || !passwordInput) {
            console.error("LOGIN.JS: Campos de email o password no encontrados en el form.");
            if (mensajeErrorDiv) {
                mensajeErrorDiv.textContent = "Error interno del formulario.";
                mensajeErrorDiv.style.display = 'block';
            }
            return;
        }
        const email = emailInput.value;
        const password = passwordInput.value;
        console.log("LOGIN.JS: Email:", email, "Password:", password ? '******' : 'VACIA');

        try {
            const respuestaLogin = await loginUsuario({ email, password });
            console.log("LOGIN.JS: Respuesta del backend al login:", respuestaLogin);

            if (respuestaLogin && typeof respuestaLogin.token === 'string' && respuestaLogin.token.length > 0) {
                console.log("LOGIN.JS: Token válido recibido:", respuestaLogin.token);
                guardarToken(respuestaLogin.token); // Guarda el token en localStorage
                console.log("LOGIN.JS: Token guardado en localStorage.");

                // --- Obtener y guardar perfil completo ---
                try {
                    console.log("LOGIN.JS: Obteniendo perfil del usuario tras login exitoso...");
                    const perfilUsuario = await getPerfilUsuario(); // Llama a GET /api/usuarios/perfil
                    if (perfilUsuario && perfilUsuario.nombre) { // Verificamos que el perfil y el nombre existan
                        guardarPerfilEnSesion(perfilUsuario); // Guardamos el perfil en sessionStorage
                        console.log("LOGIN.JS: Perfil del usuario guardado en sessionStorage:", perfilUsuario);
                    } else {
                        console.warn("LOGIN.JS: No se pudo obtener el perfil completo del usuario o el perfil no tiene nombre. Respuesta del perfil:", perfilUsuario);
                        // Si falla obtener el perfil, el token sigue guardado, pero el nombre no se mostrará correctamente.
                        // auth.js usará el fallback de decodificar el token si no encuentra el perfil en sessionStorage.
                    }
                } catch (errorPerfil) {
                    console.error("LOGIN.JS: Error al obtener el perfil del usuario:", errorPerfil.message);
                    // No hacemos fallar el login principal si solo falla la obtención del perfil.
                }
                // --- Fin Obtener y guardar perfil ---
                
                console.log("LOGIN.JS: Llamando a actualizarUIAuth() y actualizarContadorCarrito() ANTES de redirigir.");
                actualizarUIAuth(); // Esto debería AHORA poder leer el perfil de sessionStorage y mostrar el nombre
                actualizarContadorCarrito();
                
                console.log("LOGIN.JS: Login y preparación UI completos, redirigiendo a mi-cuenta.html...");
                window.location.replace('mi-cuenta.html'); 
                // No debería haber más código después de la redirección que se espere ejecutar.
            } else {
                let errorMsg = "Credenciales incorrectas o error inesperado del servidor.";
                if (respuestaLogin && respuestaLogin.message) {
                    errorMsg = respuestaLogin.message;
                }
                console.error("LOGIN.JS: Login fallido - Token no recibido o inválido:", respuestaLogin);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("LOGIN.JS: Catch error durante proceso de login:", error);
            if (mensajeErrorDiv) {
                mensajeErrorDiv.textContent = error.message || "Ocurrió un error desconocido.";
                mensajeErrorDiv.style.display = 'block';
            } else {
                alert("Error: " + (error.message || "Ocurrió un error desconocido."));
            }
        }
    });
});