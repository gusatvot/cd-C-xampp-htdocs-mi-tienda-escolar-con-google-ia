// frontend/js/common/auth.js

// La librería jwt_decode se espera que esté cargada globalmente desde el HTML.
if (typeof jwt_decode === 'undefined') {
    console.error("AUTH.JS: ¡ERROR CRÍTICO! La librería jwt_decode no está cargada. Asegúrate de incluirla en tus HTML.");
}

export function guardarToken(token) {
    console.log("AUTH.JS (guardarToken): Guardando token:", token);
    localStorage.setItem('token', token);
    console.log("AUTH.JS (guardarToken): Token guardado. Valor actual en localStorage:", localStorage.getItem('token'));
}

export function obtenerToken() {
    const token = localStorage.getItem('token');
    // console.log("AUTH.JS (obtenerToken): Obteniendo token. Valor:", token); // Log muy verboso, comentar si no es necesario
    return token;
}

export function logout() {
    console.log("AUTH.JS (logout): Cerrando sesión. Token actual:", obtenerToken());
    localStorage.removeItem('token');
    console.log("AUTH.JS (logout): Token eliminado. localStorage ahora:", localStorage.getItem('token'));
    actualizarUIAuth(); // Actualizar UI inmediatamente
    actualizarContadorCarrito(); // Actualizar carrito también
    alert('Has cerrado sesión.');
    window.location.href = 'index.html';
}

export function isLoggedIn() {
    const token = obtenerToken();
    // console.log("AUTH.JS (isLoggedIn): Verificando. Token encontrado:", token ? 'Sí' : 'No');

    if (!token) {
        // console.log("AUTH.JS (isLoggedIn): No hay token. Devolviendo false.");
        return false;
    }

    if (typeof jwt_decode === 'undefined') {
        console.error("AUTH.JS (isLoggedIn): jwt_decode no definido. No se puede verificar el token. Asumiendo no logueado.");
        return false;
    }

    try {
        const payload = jwt_decode(token);
        // console.log("AUTH.JS (isLoggedIn): Payload del token decodificado:", payload);
        const ahoraEnSegundos = Date.now() / 1000;

        if (payload.exp < ahoraEnSegundos) {
            console.warn("AUTH.JS (isLoggedIn): Token expirado. exp:", payload.exp, "ahora:", ahoraEnSegundos);
            localStorage.removeItem('token'); // Limpiar token expirado
            return false;
        }
        // console.log("AUTH.JS (isLoggedIn): Token válido y no expirado. Devolviendo true.");
        return true;
    } catch (error) {
        console.error("AUTH.JS (isLoggedIn): Error al decodificar el token:", error.message, "Token:", token);
        localStorage.removeItem('token'); // Limpiar token inválido
        return false;
    }
}

export function getUserData() {
    // console.log("AUTH.JS (getUserData): Intentando obtener datos del usuario.");
    if (!isLoggedIn()) { // Esta llamada ya loguea su propio proceso
        // console.log("AUTH.JS (getUserData): No está logueado (según isLoggedIn). Devolviendo null.");
        return null;
    }
    try {
        const token = obtenerToken();
        if (!token) { // Doble verificación por si acaso
            // console.log("AUTH.JS (getUserData): No se encontró token (después de isLoggedIn true, lo cual es raro). Devolviendo null.");
            return null;
        }
        const { userId, rol } = jwt_decode(token);
        // console.log("AUTH.JS (getUserData): Datos del token decodificados: userId:", userId, "rol:", rol);
        return { userId, rol };
    } catch (error) {
        console.error("AUTH.JS (getUserData): Error al obtener datos del usuario del token:", error.message);
        return null;
    }
}

export function actualizarUIAuth() {
    // console.log("AUTH.JS (actualizarUIAuth): Actualizando UI de autenticación.");
    const miCuentaLink = document.getElementById('mi-cuenta-link');
    const logoutButton = document.getElementById('logout-button');

    if (isLoggedIn()) {
        // console.log("AUTH.JS (actualizarUIAuth): Usuario está logueado. Configurando UI para logueado.");
        if (miCuentaLink) {
            miCuentaLink.href = 'mi-cuenta.html';
            miCuentaLink.querySelector('span').textContent = 'Mi Cuenta';
        }
        if (logoutButton) {
            logoutButton.style.display = 'inline-block';
            if (!logoutButton.dataset.listenerAttached) {
                logoutButton.addEventListener('click', logout);
                logoutButton.dataset.listenerAttached = 'true';
            }
        }
    } else {
        // console.log("AUTH.JS (actualizarUIAuth): Usuario NO está logueado. Configurando UI para no logueado.");
        if (miCuentaLink) {
            miCuentaLink.href = 'login.html';
            miCuentaLink.querySelector('span').textContent = 'Ingresar';
        }
        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
    }
}

// Necesitamos importar actualizarContadorCarrito de ui.js aquí si logout lo llama.
// Para evitar dependencias circulares, es mejor que actualizarUIAuth NO llame a actualizarContadorCarrito.
// Quien llame a actualizarUIAuth, también debe llamar a actualizarContadorCarrito si es necesario.
// Sin embargo, para la función logout SÍ tiene sentido que actualice el contador.
// Vamos a importar SOLO para logout, o mover la llamada a actualizarContadorCarrito fuera del logout aquí
// y que el event listener del botón logout lo llame.
// Por ahora, para simplicidad, importaremos. Si causa error de dependencia circular, lo cambiaremos.
import { actualizarContadorCarrito } from './ui.js';