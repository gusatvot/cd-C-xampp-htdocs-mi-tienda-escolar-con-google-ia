// backend/routes/uploadRoutes.js
import express from 'express';
// Importamos el middleware de Multer que acabamos de crear
// Usaremos uploadMultipleImages ya que un producto puede tener varias fotos
import { uploadMultipleImages, uploadsDir } from '../middlewares/uploadMiddleware.js';
import { protegerRuta, autorizarRoles } from '../middlewares/authMiddleware.js'; // Para proteger la ruta de subida
import path from 'path'; // Necesario para construir la URL
import { fileURLToPath } from 'url'; // Necesario para __dirname en ES Modules

// --- Configuración para __dirname en ES Modules (necesaria si construyes la URL aquí) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- Fin Configuración __dirname ---

const router = express.Router(); // Creamos un nuevo router

// @desc    Subir una o varias imágenes
// @route   POST /api/upload/images
// @access  Private/Admin
// NOTA: El nombre del campo en el formulario HTML/FormData debe ser 'imagenes'
router.post(
    '/images',
    protegerRuta,          // Solo usuarios autenticados pueden subir
    autorizarRoles('admin'), // Solo administradores pueden subir
    uploadMultipleImages,  // <--- Middleware de Multer: procesa los archivos.
                           // Si tiene éxito, adjunta req.files (array de archivos)
                           // Si hay un error (tipo, tamaño, etc.), lanza un error que errorHandler puede capturar.
    (req, res) => {          // Este controlador se ejecuta SOLO si uploadMultipleImages fue exitoso

        // Si la subida con Multer fue exitosa, la información de los archivos está en req.files (si usaste .array)
        // o en req.file (si usaste .single).
        console.log('Archivos subidos por Multer:', req.files); // Log para depuración

        if (req.files && req.files.length > 0) {
            // Construir la URL de cada archivo subido localmente.
            // La URL pública será http://localhost:4000/uploads/nombre_del_archivo.jpg
            // Esto depende de cómo configuramos el servidor estático en server.js
            const fileUrls = req.files.map(file => {
                // file.filename es el nombre que Multer le dio al archivo guardado.
                // Construimos la URL completa para que el frontend la guarde en la BD o la use.
                 // process.env.BACKEND_URL es la URL base de tu backend (definida en .env)
                return `${process.env.BACKEND_URL}/uploads/${file.filename}`;
                // TODO: Si usas Cloudinary/S3, aquí enviarías los archivos a ese servicio
                // y obtendrías las URLs definitivas de Cloudinary/S3 para devolver.
            });

            // Devolver las URLs de los archivos subidos al frontend
            res.status(200).json(fileUrls); // 200 OK - Devolver un array con las URLs

        } else {
             // Si no se subieron archivos (pero Multer no lanzó un error)
            res.status(400).json({ message: 'No se recibieron archivos para subir.' });
        }
    }
);

// TODO: Podrías tener una ruta DELETE para eliminar imágenes (más compleja si usas Cloudinary/S3)
// router.delete('/images/:imageFilename', protegerRuta, autorizarRoles('admin'), eliminarImagenLocal);

export default router; // Exportar el router