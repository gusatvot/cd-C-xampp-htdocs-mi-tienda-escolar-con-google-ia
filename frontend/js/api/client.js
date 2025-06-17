// frontend/js/api/client.js

// La URL base de tu backend desplegado en Render.
const BASE_URL = 'https://cd-c-xampp-htdocs-mi-tienda-escolar-con-scu2.onrender.com';

/**
 * Realiza una petición a tu API de Express y maneja los errores de forma centralizada.
 * @param {string} endpoint - La ruta de la API a la que llamar (ej. '/api/productos').
 * @param {object} options - Opciones para la petición fetch (method, headers, body).
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);

        // Intenta obtener el cuerpo de la respuesta como JSON, sin importar si fue exitosa o no.
        const data = await response.json().catch(() => ({})); 

        if (!response.ok) {
            // Si la respuesta no fue exitosa, usamos el mensaje de error del JSON si existe,
            // o creamos uno genérico si no.
            const errorMessage = data.error || `Error del servidor: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        // Si la respuesta fue exitosa, devolvemos los datos.
        return data;

    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error.message);
        // Propagamos el error para que el script que llamó a la función sepa que algo falló.
        throw error;
    }
}


// --- FUNCIONES PARA PRODUCTOS ---

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
    if (!id) throw new Error('Se requiere un ID de producto para la búsqueda.');
    return apiFetch(`/api/productos/${id}`);
}


// --- NUEVAS FUNCIONES PARA USUARIOS ---

/**
 * Registra un nuevo usuario en el backend.
 * Llama al endpoint: POST /api/registro
 * @param {object} datosUsuario - Un objeto con { nombre, email, password }.
 * @returns {Promise<object>}
 */
export function registrarUsuario(datosUsuario) {
    return apiFetch('/api/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosUsuario)
    });
}

/**
 * Inicia sesión de un usuario y obtiene un token de autenticación.
 * Llama al endpoint: POST /api/login
 * @param {object} credenciales - Un objeto con { email, password }.
 * @returns {Promise<object>} - Una promesa que resuelve a un objeto con el token.
 */
export function loginUsuario(credenciales) {
    return apiFetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credenciales)
    });
}