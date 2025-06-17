// backend/app.js

// --- MODIFICACIÓN: Usamos 'import' en lugar de 'require' ---
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js'; // Importante: añadir .js a las importaciones de archivos locales

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS se mantiene igual
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Las rutas no cambian su lógica, solo su sintaxis si fuera necesario ---

// Ruta para obtener todos los productos
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
        res.json({ productos: results }); // Asegurándonos que siempre devuelva el objeto
    });
});

// Ruta para obtener un producto por su ID
app.get('/api/productos/:_id', (req, res) => { // Cambiado a _id para coincidir
    const { _id } = req.params;
    const sql = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        WHERE p._id = ?
    `;
    db.query(sql, [_id], (err, results) => {
        if (err) {
            console.error(`Error al obtener producto con id ${_id}:`, err);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el producto' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(results[0]);
    });
});

// Ruta de Registro
app.post('/api/registro', (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const checkUserSql = 'SELECT email FROM usuarios WHERE email = ?';
    db.query(checkUserSql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos al verificar usuario.' });
        if (results.length > 0) return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: 'Error al hashear la contraseña.' });

            const insertUserSql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
            db.query(insertUserSql, [nombre, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error al registrar el usuario.' });
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
        if (err) return res.status(500).json({ error: 'Error en la base de datos al buscar usuario.' });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });

        const usuario = results[0];
        bcrypt.compare(password, usuario.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error al comparar contraseñas.' });
            if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas.' });

            const payload = { usuario: { id: usuario._id, nombre: usuario.nombre } };
            const token = jwt.sign(payload, 'secretoDeMiTienda', { expiresIn: '1h' });
            res.json({ token });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log('--- Versión con sintaxis ES Module desplegada ---');
});