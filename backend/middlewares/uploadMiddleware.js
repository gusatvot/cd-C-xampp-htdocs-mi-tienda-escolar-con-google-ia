// backend/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url'; // Necesario para __dirname en ES Modules
import fs from 'fs'; // Necesario para crear la carpeta

// --- Configuración para __dirname en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- Fin Configuración __dirname ---


// Directorio donde se guardarán las imágenes subidas temporalmente o localmente
// Este es el path DENTRO del servidor backend.
const uploadsDir = path.join(__dirname, '../uploads'); // Ir al directorio superior y luego a 'uploads' (backend/uploads)

// Crear la carpeta 'uploads' si no existe
if (!fs.existsSync(uploadsDir)){
    // { recursive: true } es importante para crear carpetas anidadas si es necesario (aunque aquí solo es 'uploads')
    fs.mkdirSync(uploadsDir, { recursive: true });
}


// --- Configuración del Almacenamiento de Multer ---

// Usamos diskStorage para guardar los archivos en el disco del servidor
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 'cb' es el callback: cb(error, destino)
        // El null significa que no hay error
        cb(null, uploadsDir); // Guardar en la carpeta /backend/uploads
    },
    filename: (req, file, cb) => {
        // Cómo nombrar el archivo en el destino. Evitar colisiones.
        // Usamos el nombre del campo + timestamp + extensión original.
        const fileExtension = path.extname(file.originalname); // Obtener la extensión original (ej: .jpg, .png)
        const fileName = `${file.fieldname}-${Date.now()}${fileExtension}`; // Construir el nombre
        cb(null, fileName); // Usar el nombre construido
    },
});

// --- Configuración del Filtro de Archivos (Opcional pero Recomendado) ---

// Para permitir solo ciertos tipos de archivos (ej: imágenes)
const fileFilter = (req, file, cb) => {
    // Verificar si el archivo es una imagen basándose en el tipo MIME o extensión
    const filetypes = /jpeg|jpg|png|gif|webp/; // Tipos de imagen permitidos
    const mimetype = filetypes.test(file.mimetype); // Verificar el tipo MIME del archivo
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); // Verificar la extensión

    if (mimetype && extname) {
        // Si el tipo MIME y la extensión coinciden con los permitidos
        return cb(null, true); // Aceptar el archivo (null para error, true para aceptar)
    } else {
        // Si el archivo no es de un tipo de imagen permitido
        cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, JPG, PNG, GIF, WebP).'), false); // Rechazar el archivo (mensaje de error, false para rechazar)
    }
};

// --- Inicializar Multer ---

// Creamos una instancia de Multer con nuestra configuración
const upload = multer({
    storage: storage, // Usamos la configuración de almacenamiento en disco
    fileFilter: fileFilter, // Usamos el filtro de archivos
    limits: { fileSize: 1024 * 1024 * 5 } // Opcional: Limite de tamaño por archivo (5MB en este caso)
    // Más opciones de limits: https://github.com/expressjs/multer#limits
});

// --- Exportar Middleware(s) ---

// Exportamos middlewares específicos para usar en las rutas:
// .single('nombreDelCampo'): Para subir un solo archivo con el nombre de campo especificado en el formulario (ej: 'imagen')
// .array('nombreDelCampo', maxCount): Para subir múltiples archivos con el mismo nombre de campo (ej: 'imagenes', hasta 10)
// .fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }]): Para subir múltiples archivos con diferentes nombres de campo

// Para subir múltiples imágenes para un producto, generalmente se usa .array
const uploadMultipleImages = upload.array('imagenes', 10); // 'imagenes' es el nombre del campo 'name' en el formulario del frontend, 10 es el máximo de archivos permitidos

// Para subir una sola imagen (si solo permites una imagen principal por producto)
const uploadSingleImage = upload.single('imagen'); // 'imagen' es el nombre del campo en el formulario

export { uploadMultipleImages, uploadSingleImage, uploadsDir }; // Exportamos también el directorio de subidas para configurar el servidor estático