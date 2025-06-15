// backend/app.js

const express = require('express');
const cors = require('cors');
const db = require('./db'); // Correcta referencia a tu archivo de base de datos.

const app = express();
const PORT = process.env.PORT || 3000;

// *** MODIFICACIÓN CLAVE PARA EVITAR ERRORES DE CORS ***
// Configuración de CORS más explícita para permitir peticiones
// desde cualquier origen (incluyendo tu entorno local 127.0.0.1).
const corsOptions = {
  origin: '*', // Permite CUALQUIER origen
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
// *** FIN DE LA MODIFICACIÓN ***

app.use(express.json());

// Tus rutas de API se mantienen intactas, ya son perfectas.
app.get('/api/productos', (req, res) => {
    const sql = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ error: 'Error interno del servidor al obtener productos' });
        }
        res.json(results);
    });
});

app.get('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.id = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(`Error al obtener producto con id ${id}:`, err);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el producto' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});