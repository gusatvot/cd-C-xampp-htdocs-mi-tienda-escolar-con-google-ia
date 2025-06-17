// frontend/js/api/client.js

// La URL base de tu backend se mantiene.
const BASE_URL = 'https://cd-c-xampp-htdocs-mi-tienda-escolar-con-scu2.onrender.com';

async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json().catch(() => ({})); 

        if (!response.ok) {
            const errorMessage = data.message || data.error || `Error del servidor: ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error.message);
        throw error;
    }
}

// --- FUNCIONES PARA PRODUCTOS (Apuntando a tus productRoutes) ---
export function getProductos() {
    return apiFetch('/api/productos'); // Basado en tu productRoutes.js
}

export function getProductoById(id) {
    return apiFetch(`/api/productos/${id}`); // Basado en tu productRoutes.js
}

// --- FUNCIONES PARA AUTENTICACIÓN (Apuntando a tus authRoutes) ---

/**
 * Registra un nuevo usuario.
 * Llama a: POST /api/auth/registrar
 */
export function registrarUsuario(datosUsuario) {
    return apiFetch('/api/auth/registrar', { // <-- RUTA CORREGIDA
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosUsuario)
    });
}

/**
 * Inicia sesión de un usuario.
 * Llama a: POST /api/auth/login
 */
export function loginUsuario(credenciales) {
    return apiFetch('/api/auth/login', { // <-- RUTA CORREGIDA
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales)
    });
}