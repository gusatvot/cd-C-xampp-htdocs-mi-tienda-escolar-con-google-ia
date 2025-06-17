// backend/app.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); // La ruta correcta que ya arreglamos

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors({ origin: '*' }));
app.use(express.json());


// --- RUTAS DE LA API (Reescritas con async/await) ---

// Ruta para obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const sql = `SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id`;
        const [results] = await db.query(sql);
        res.json({ productos: results });
    } catch (error) {
        console.error("Error en /api/productos:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener un producto por su ID
app.get('/api/productos/:_id', async (req, res) => {
    try {
        const { _id } = req.params;
        const sql = `SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p._id = ?`;
        const [results] = await db.query(sql, [_id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error(`Error en /api/productos/:_id:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de Registro de nuevos usuarios
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;
        const nombreCompleto = `${nombre || ''} ${apellido || ''}`.trim();

        if (!nombreCompleto || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const checkUserSql = 'SELECT email FROM usuarios WHERE email = ?';
        const [existingUsers] = await db.query(checkUserSql, [email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const insertUserSql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        await db.query(insertUserSql, [nombreCompleto, email, hashedPassword]);
        
        res.status(201).json({ message: 'Usuario registrado con éxito. Ahora puede iniciar sesión.' });

    } catch (error) {
        console.error("Error en /api/registro:", error);
        res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
    }
});

// Ruta de Login de usuarios
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
        }

        const sql = 'SELECT * FROM usuarios WHERE email = ?';
        const [results] = await db.query(sql, [email]);
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const usuario = results[0];
        const isMatch = await bcrypt.compare(password, usuario.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const payload = { usuario: { id: usuario._id, nombre: usuario.nombre } };
        const token = jwt.sign(payload, 'secretoDeMiTienda', { expiresIn: '1h' });
        
        res.json({ token });

    } catch (error) {
        console.error("Error en /api/login:", error);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log('--- Versión con Async/Await desplegada. ¡Sistema listo! ---');
});