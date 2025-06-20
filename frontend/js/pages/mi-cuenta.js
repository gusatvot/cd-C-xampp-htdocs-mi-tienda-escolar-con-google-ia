// frontend/js/pages/mi-cuenta.js

import { isLoggedIn, getUserData, actualizarUIAuth, logout } from '../common/auth.js';
import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';
// import { getPerfilUsuario } from '../api/client.js'; // Preparamos para cuando tengas esta función en client.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("MI-CUENTA.JS: DOMContentLoaded iniciado.");

    inicializarUI();
    actualizarUIAuth();
    actualizarContadorCarrito();

    console.log("MI-CUENTA.JS: Estado de isLoggedIn() al INICIO de la carga de la página de mi-cuenta:", isLoggedIn()); 

    async function cargarYMostrarPerfil() {
        console.log("MI-CUENTA.JS: Entrando a cargarYMostrarPerfil.");
        const saludoUsuarioElemento = document.getElementById('saludo-usuario-nombre');
        
        // Obtenemos los datos del token. getUserData() ya incluye la lógica de isLoggedIn()
        // y manejo de expiración/validez del token.
        const datosDelToken = getUserData(); 

        if (datosDelToken) {
            // Si getUserData() devuelve datos, el usuario está logueado y el token es válido.
            console.log("MI-CUENTA.JS: Usuario logueado. Datos del token:", datosDelToken);
            if (saludoUsuarioElemento) {
                // --- Solución Temporal: Usar datos del token ---
                // Tu token JWT actualmente contiene 'userId' y 'rol'.
                // Lo ideal sería que el backend incluyera el 'nombre' en el token
                // o tener un endpoint /api/usuarios/perfil para obtener el nombre.
                
                // Ejemplo mostrando el rol o el userId si el rol no está definido.
                let nombreAMostrar = 'Usuario'; // Valor por defecto
                if (datosDelToken.rol) {
                    nombreAMostrar = datosDelToken.rol.charAt(0).toUpperCase() + datosDelToken.rol.slice(1); // Capitalizar rol
                } else if (datosDelToken.userId) {
                    nombreAMostrar = datosDelToken.userId; // Como fallback
                }
                saludoUsuarioElemento.textContent = nombreAMostrar;
                // --- Fin Solución Temporal ---

                // --- Opción ideal (cuando la implementes): Obtener perfil desde el backend ---
                // try {
                //     console.log("MI-CUENTA.JS: Intentando obtener perfil del backend...");
                //     const perfil = await getPerfilUsuario(); // Necesitas crear esta función en api/client.js y el endpoint
                //     console.log("MI-CUENTA.JS: Perfil obtenido:", perfil);
                //     if (perfil && perfil.nombre) {
                //         saludoUsuarioElemento.textContent = perfil.nombre;
                //     } else if (datosDelToken.userId) { // Fallback si el perfil no tiene nombre
                //         saludoUsuarioElemento.textContent = datosDelToken.userId;
                //     }
                // } catch (error) {
                //     console.error("MI-CUENTA.JS: Error al cargar el perfil del usuario desde la API:", error);
                //     saludoUsuarioElemento.textContent = datosDelToken.userId || 'Usuario (Error)'; // Fallback
                // }
                // --- Fin Opción ideal ---

            } else {
                console.warn("MI-CUENTA.JS: Elemento 'saludo-usuario-nombre' no encontrado, pero usuario logueado.");
            }
        } else {
            // Si getUserData() devuelve null, el usuario no está logueado o el token no es válido/expiró.
            console.log("MI-CUENTA.JS: Usuario NO logueado (según getUserData()). Redirigiendo a login.html.");
            alert('Debes iniciar sesión para acceder a tu cuenta.');
            window.location.href = 'login.html';
            return; // Importante: salir de la función para evitar que se ejecute más código
        }
    }

    cargarYMostrarPerfil(); // Llamamos a la función para que se ejecute

    // Lógica para la navegación entre secciones del panel de Mi Cuenta
    const linksSeccion = document.querySelectorAll('.link-seccion-cuenta');
    const seccionesContenido = document.querySelectorAll('.seccion-contenido-cuenta');

    linksSeccion.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.dataset.seccion) {
                e.preventDefault();
                const seccionId = this.dataset.seccion;

                seccionesContenido.forEach(s => s.classList.remove('active'));
                linksSeccion.forEach(l => l.classList.remove('active'));

                const seccionTarget = document.getElementById(seccionId);
                if (seccionTarget) {
                    seccionTarget.classList.add('active');
                }
                this.classList.add('active');
                window.location.hash = seccionId; 
            }
        });
    });

    if (window.location.hash) {
        const seccionActivaInicial = window.location.hash.substring(1);
        const linkActivo = document.querySelector(`.link-seccion-cuenta[data-seccion="${seccionActivaInicial}"]`);
        if (linkActivo) {
            linkActivo.click();
        }
    } else {
        const panelPrincipalLink = document.querySelector('.link-seccion-cuenta[data-seccion="panel-principal"]');
        const panelPrincipalSeccion = document.getElementById('panel-principal');
        if(panelPrincipalLink && panelPrincipalSeccion){
            linksSeccion.forEach(l => l.classList.remove('active'));
            seccionesContenido.forEach(s => s.classList.remove('active'));
            panelPrincipalLink.classList.add('active');
            panelPrincipalSeccion.classList.add('active');
        }
    }
    
    const logoutLinkPanel = document.querySelector('.link-cerrar-sesion');
    if (logoutLinkPanel) {
        logoutLinkPanel.addEventListener('click', (e) => {
            e.preventDefault(); 
            logout(); 
        });
    }
});