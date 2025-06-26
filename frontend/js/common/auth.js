// frontend/js/common/auth.js

// La librería jwt_decode se espera que esté cargada globalmente desde el HTML.
if (typeof jwt_decode === 'undefined') {
    console.error("AUTH.JS: ¡ERROR CRÍTICO! La librería jwt_decode no está cargada.");
}

const USER_PROFILE_KEY = 'userProfile'; // Clave para guardar el perfil en sessionStorage

export function guardarToken(token) {
    console.log("AUTH.JS (guardarToken): Guardando token.");
    localStorage.setItem('token', token);
}

export function obtenerToken() {
    return localStorage.getItem('token');
}

export function guardarPerfilEnSesion(perfil) {
    if (perfil) {
        console.log("AUTH.JS (guardarPerfilEnSesion): Guardando perfil en sessionStorage:", perfil);
        sessionStorage.setItem(USER_PROFILE_KEY, JSON.stringify(perfil));
    }
}

export function obtenerPerfilDeSesion() {
    const perfilString = sessionStorage.getItem(USER_PROFILE_KEY);
    if (perfilString) {
        try {
            return JSON.parse(perfilString);
        } catch (e) {
            console.error("AUTH.JS: Error parseando perfil de sessionStorage", e);
            sessionStorage.removeItem(USER_PROFILE_KEY);
            return null;
        }
    }
    return null;
}

export function logout() {
    console.log("AUTH.JS (logout): Cerrando sesión.");
    localStorage.removeItem('token');
    sessionStorage.removeItem(USER_PROFILE_KEY);
    
    actualizarUIAuth();
    // Es mejor que el script de la página (o ui.js si tiene una función para ello)
    // llame a actualizarContadorCarrito después de un logout.
    // import { actualizarContadorCarrito } from './ui.js'; // Evitar dependencia circular si es posible
    // actualizarContadorCarrito(); 
    
    alert('Has cerrado sesión.');
    window.location.href = 'index.html';
}

export function isLoggedIn() {
    const token = obtenerToken();
    if (!token) return false;

    if (typeof jwt_decode === 'undefined') return false; // Si jwt_decode no existe, no podemos validar
    try {
        const payload = jwt_decode(token);
        return payload.exp > (Date.now() / 1000);
    } catch (error) {
        localStorage.removeItem('token');
        sessionStorage.removeItem(USER_PROFILE_KEY);
        return false;
    }
}

export function getUserData() {
    if (!isLoggedIn()) {
        return null;
    }
    const perfilGuardado = obtenerPerfilDeSesion();
    if (perfilGuardado && perfilGuardado.nombre) {
        return perfilGuardado;
    }
    try {
        const token = obtenerToken();
        if (!token) return null;
        const { userId, rol, nombre } = jwt_decode(token); // Asume que el token puede tener nombre
        // Si el token no tiene nombre, el 'nombre' aquí será undefined, lo cual está bien.
        return { _id: userId, rol, nombre, id: userId }; // Devolvemos _id también para consistencia
    } catch (error) {
        return null;
    }
}

export function actualizarUIAuth() {
    const miCuentaLink = document.getElementById('mi-cuenta-link');
    const logoutButton = document.getElementById('logout-button');
    const datosUsuario = getUserData();

    console.log("AUTH.JS (actualizarUIAuth): Datos de usuario para UI:", datosUsuario);

    if (datosUsuario) { 
        if (miCuentaLink) {
            miCuentaLink.href = 'mi-cuenta.html';
            const nombreAMostrar = datosUsuario.nombre || datosUsuario.rol || 'Mi Cuenta'; // Prioriza nombre, luego rol, luego genérico
            miCuentaLink.querySelector('span').textContent = nombreAMostrar;
            console.log("AUTH.JS (actualizarUIAuth): UI para logueado. Nombre mostrado:", nombreAMostrar);
        }
        if (logoutButton) {
            logoutButton.style.display = 'inline-block';
            if (!logoutButton.dataset.listenerAttached) {
                logoutButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
                logoutButton.dataset.listenerAttached = 'true';
            }
        }
    } else { 
        console.log("AUTH.JS (actualizarUIAuth): UI para NO logueado.");
        if (miCuentaLink) {
            miCuentaLink.href = 'login.html';
            miCuentaLink.querySelector('span').textContent = 'Ingresar';
        }
        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
    }
}