// frontend/js/api/client.js

import { obtenerToken } from '../common/auth.js';

const BASE_URL = 'https://cd-c-xampp-htdocs-mi-tienda-escolar-con-scu2.onrender.com';

async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {};
    const token = obtenerToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData && body) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method: method.toUpperCase(),
        headers,
    };

    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        // --- LOG AÑADIDO ---
        console.log(`CLIENT.JS (apiRequest): Haciendo ${options.method} a ${url}`, options.body ? `con body.` : `sin body.`);
        // --------------------
        const response = await fetch(url, options);
        let data;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else if (response.status === 204) {
            data = {}; 
        } else {
            data = { message: await response.text().catch(() => response.statusText) };
        }

        if (!response.ok) {
            const errorMessage = data.message || data.msg || `Error ${response.status}: ${response.statusText}`;
            console.error(`CLIENT.JS (apiRequest): Error API para ${options.method} ${endpoint}. Status: ${response.status}. Mensaje: ${errorMessage}. Respuesta:`, data);
            throw new Error(errorMessage);
        }
        console.log(`CLIENT.JS (apiRequest): Respuesta OK de API para ${options.method} ${endpoint}.`);
        return data;
    } catch (error) {
        console.error(`CLIENT.JS (apiRequest): Error de red/fetch para ${options.method} ${endpoint}:`, error.message);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(String(error) || "Error desconocido en la petición a la API.");
        }
    }
}

// --- PRODUCTOS ---
export function getProductos(queryParams = {}) {
    const queryString = new URLSearchParams(queryParams).toString();
    return apiRequest(`/api/productos${queryString ? `?${queryString}` : ''}`);
}

export function getProductoById(id) {
    if (!id) {
        console.error("CLIENT.JS (getProductoById): ID de producto no proporcionado.");
        return Promise.reject(new Error("ID de producto no proporcionado para getProductoById."));
    }
    // --- LOG AÑADIDO ---
    console.log("CLIENT.JS (getProductoById): Solicitando producto con ID:", id);
    // --------------------
    return apiRequest(`/api/productos/${id}`);
}
export function crearProducto(datosProducto) {
    return apiRequest('/api/productos', 'POST', datosProducto);
}
export function actualizarProducto(idProducto, datosProducto) {
    if (!idProducto) return Promise.reject(new Error("ID de producto no proporcionado para actualizar."));
    return apiRequest(`/api/productos/${idProducto}`, 'PUT', datosProducto);
}

// --- AUTENTICACIÓN ---
export function registrarUsuario(datosUsuario) {
    return apiRequest('/api/auth/registrar', 'POST', datosUsuario);
}
export function loginUsuario(credenciales) {
    return apiRequest('/api/auth/login', 'POST', credenciales);
}
export function logoutUsuario() {
    return apiRequest('/api/auth/logout', 'POST');
}

// --- PERFIL DE USUARIO ---
export function getPerfilUsuario() {
    return apiRequest('/api/usuarios/perfil', 'GET'); 
}

// --- CARRITO DE COMPRAS ---
export function getCarrito() {
    return apiRequest('/api/carrito', 'GET');
}
export function agregarItemAlCarrito(productoId, cantidad = 1) {
    if (!productoId) return Promise.reject(new Error("ID del producto no proporcionado para agregar al carrito."));
    return apiRequest('/api/carrito/items', 'POST', { productoId, cantidad });
}
export function actualizarCantidadItemCarrito(itemId, cantidad) {
    if (!itemId || typeof cantidad !== 'number' || cantidad <= 0) return Promise.reject(new Error("Datos inválidos para actualizar ítem del carrito."));
    return apiRequest(`/api/carrito/items/${itemId}`, 'PUT', { cantidad });
}
export function eliminarItemDelCarrito(itemId) {
    if (!itemId) return Promise.reject(new Error("ID del ítem no proporcionado para eliminar del carrito."));
    return apiRequest(`/api/carrito/items/${itemId}`, 'DELETE');
}
export function vaciarCarrito() {
    return apiRequest('/api/carrito', 'DELETE');
}

// --- CATEGORÍAS ---
export function getCategorias() {
    return apiRequest('/api/categorias', 'GET');
}

// --- SUBIDA DE ARCHIVOS ---
export function subirImagenes(formData) {
    return apiRequest('/api/upload/images', 'POST', formData, true); 
}