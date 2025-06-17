// backend/app.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); // <-- ¡ESTA ES LA LÍNEA CORRECTA!

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

// Ruta para obtener todos los productos
app.get('/api/productos', (req, res) => {
    const sql = `SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error interno del servidor' });
        res.json({ productos: results });
    });
});

// Ruta para obtener un producto por su ID
app.get('/api/productos/:_id', (req, res) => {
    const { _id } = req.params;
    const sql = `SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p._id = ?`;
    db.query(sql, [_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error interno del servidor' });
        if (results.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(results[0]);
    });
});

// Ruta de Registro
app.post('/api/registro', (req, res) => {
    const { nombre, apellido, email, password } = req.body;
    const nombreCompleto = `${nombre} ${apellido}`;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const checkUserSql = 'SELECT email FROM usuarios WHERE email = ?';
    db.query(checkUserSql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en DB al verificar' });
        if (results.length > 0) return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: 'Error al encriptar' });

            const insertUserSql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
            db.query(insertUserSql, [nombreCompleto, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error al registrar usuario' });
                res.status(201).json({ message: 'Usuario registrado con éxito.' });
            });
        });
    });
});

// Ruta de Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en DB al buscar' });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });

        const usuario = results[0];
        bcrypt.compare(password, usuario.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error al comparar' });
            if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas.' });

            const payload = { usuario: { id: usuario._id, nombre: usuario.nombre } };
            const token = jwt.sign(payload, 'secretoDeMiTienda', { expiresIn: '1h' });
            res.json({ token });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log('--- Versión con CommonJS (require) desplegada ---');
});