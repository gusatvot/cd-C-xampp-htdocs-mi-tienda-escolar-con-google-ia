// frontend/js/api/client.js

import { obtenerToken } from '../common/auth.js';

const BASE_URL = 'https://cd-c-xampp-htdocs-mi-tienda-escolar-con-scu2.onrender.com';

/**
 * Función central para realizar TODAS las peticiones a la API.
 * Automáticamente añade el token de autorización si existe.
 * @param {string} endpoint El endpoint, ej: '/api/productos'
 * @param {string} method El método HTTP, ej: 'GET', 'POST', 'PUT', 'DELETE'
 * @param {object | null} body El cuerpo de la petición para POST/PUT
 * @returns {Promise<any>}
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${BASE_URL}${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 1. Obtenemos el token guardado en localStorage
    const token = obtenerToken();

    // 2. Si hay un token, lo añadimos a las cabeceras
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Si hay un cuerpo para la petición (POST/PUT), lo añadimos
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        
        // Intentamos parsear la respuesta como JSON. Si no hay cuerpo, devuelve un objeto vacío.
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Usamos el mensaje de error del backend si está disponible
            const errorMessage = data.message || `Error del servidor: ${response.status}`;
            throw new Error(errorMessage);
        }

        return data; // Si todo fue bien, devolvemos los datos
    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error.message);
        throw error; // Re-lanzamos el error para que sea capturado en la página
    }
}

// --- Re-escribimos las funciones existentes para usar nuestra nueva función central ---

// PRODUCTOS
export function getProductos() {
    return apiRequest('/api/productos'); // Método GET es el default
}

export function getProductoById(id) {
    return apiRequest(`/api/productos/${id}`);
}

// AUTENTICACIÓN
export function registrarUsuario(datosUsuario) {
    return apiRequest('/api/auth/registrar', 'POST', datosUsuario);
}

export function loginUsuario(credenciales) {
    return apiRequest('/api/auth/login', 'POST', credenciales);
}

export function logoutUsuario() {
    // El logout en el backend limpia la cookie (si se usa), pero no necesita body.
    return apiRequest('/api/auth/logout', 'POST');
}

// --- NUEVAS FUNCIONES PARA EL CARRITO ---

/**
 * Obtiene el carrito completo del usuario logueado.
 * Llama a: GET /api/carrito
 */
export function getCarrito() {
    return apiRequest('/api/carrito', 'GET');
}

/**
 * Agrega un producto al carrito.
 * Llama a: POST /api/carrito/items
 * @param {string} productoId - El _id del producto a agregar.
 * @param {number} cantidad - La cantidad a agregar.
 */
export function agregarItemAlCarrito(productoId, cantidad = 1) {
    return apiRequest('/api/carrito/items', 'POST', { productoId, cantidad });
}

// TODO: Aquí añadiremos las funciones para actualizar y eliminar items más adelante.