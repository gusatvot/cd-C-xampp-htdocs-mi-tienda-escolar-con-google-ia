// backend/app.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para crear los "pases VIP"
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

// --- RUTAS DE PRODUCTOS (YA EXISTENTES) ---
app.get('/api/productos', (req, res) => {
    // ... tu código de getProductos no cambia ...
});
app.get('/api/productos/:id', (req, res) => {
    // ... tu código de getProductoById no cambia ...
});


// --- NUEVA RUTA: REGISTRO DE USUARIOS ---
app.post('/api/registro', async (req, res) => {
    const { nombre, email, password } = req.body;

    // 1. Validar que los datos llegaron
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        // 2. Revisar si el email ya existe
        const userExistsSql = 'SELECT * FROM usuarios WHERE email = ?';
        db.query(userExistsSql, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Error en la base de datos.' });
            if (results.length > 0) {
                return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
            }

            // 3. Hashear (encriptar) la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Insertar el nuevo usuario en la DB
            const insertSql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
            db.query(insertSql, [nombre, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error al registrar el usuario.' });
                res.status(201).json({ message: 'Usuario registrado con éxito.' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// --- NUEVA RUTA: LOGIN DE USUARIOS ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos.' });
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' }); // No decimos "usuario no existe" por seguridad
        }

        const usuario = results[0];

        // Comparamos la contraseña enviada con la hasheada en la DB
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Si las credenciales son válidas, creamos el "pase VIP" (JWT)
        const payload = {
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        };

        jwt.sign(payload, 'secretoDeMiTienda', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token }); // Enviamos el token al frontend
        });
    });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});