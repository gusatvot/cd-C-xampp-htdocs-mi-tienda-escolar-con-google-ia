// frontend/js/api/client.js

// La URL base de tu backend desplegado en Render.
const BASE_URL = 'https://cd-c-xampp-htdocs-mi-tienda-escolar-con-scu2.onrender.com';

/**
 * Realiza una petición a tu API de Express y maneja los errores.
 * @param {string} endpoint - La ruta de la API (ej. '/api/productos').
 * @param {object} options - Opciones para fetch (method, headers, body).
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                error: `Error del servidor: ${response.status}` 
            }));
            throw new Error(errorData.error || 'Ocurrió un error inesperado.');
        }
        // Si la respuesta es exitosa pero no tiene contenido (ej: un 204), devuelve null.
        if (response.status === 204) {
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error.message);
        throw error;
    }
}

/**
 * Obtiene la lista completa de productos desde el backend.
 * Llama al endpoint: GET /api/productos
 */
export function getProductos() {
    return apiFetch('/api/productos');
}

/**
 * Obtiene un solo producto por su ID desde el backend.
 * Llama al endpoint: GET /api/productos/:id
 */
export function getProductoById(id) {
    if (!id) throw new Error('Se requiere un ID de producto.');
    return apiFetch(`/api/productos/${id}`);
}