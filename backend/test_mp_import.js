// backend/test_mp_import.js
import * as mercadopago from 'mercadopago';

console.log('Importación de Mercado Pago exitosa.');
console.log('Tipo de la variable mercadopago:', typeof mercadopago);
console.log('Contenido de mercadopago (parcial):', Object.keys(mercadopago).slice(0, 10)); // Mostrar algunas claves
console.log('¿mercadopago.configure es una función?', typeof mercadopago.configure === 'function');

// Intenta configurar si parece que el objeto está presente
if (typeof mercadopago.configure === 'function') {
    try {
        // Intentamos configurar con un token ficticio solo para ver si el método existe y se llama
        mercadopago.configure({
            access_token: 'TEST-ficticio-12345'
        });
        console.log('mercadopago.configure pudo ser llamado.');
    } catch (e) {
        console.error('Error al llamar a mercadopago.configure:', e.message);
    }
} else {
    console.error('mercadopago.configure NO es una función después de la importación.');
}