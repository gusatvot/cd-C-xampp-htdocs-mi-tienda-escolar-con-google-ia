// backend/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Necesario para crear la carpeta

// Usar una ruta relativa al directorio de trabajo actual del proceso Node.js.
// Si tu comando de inicio en Render es 'cd backend && node server.js', 
// process.cwd() DENTRO de server.js (y los módulos que importa)
// será la ruta a tu carpeta 'backend' en el servidor de Render.
// Esto creará una carpeta 'uploads' DENTRO de 'backend'.
const uploadsDir = path.join(process.cwd(), 'uploads'); 

console.log(`UPLOAD_MIDDLEWARE: Directorio de trabajo actual (process.cwd()): ${process.cwd()}`);
console.log(`UPLOAD_MIDDLEWARE: Ruta de subidas configurada para: ${uploadsDir}`);

// Crear la carpeta 'uploads' si no existe
// Esto se ejecutará cuando el módulo se cargue por primera vez (cuando arranque el servidor)
if (!fs.existsSync(uploadsDir)){
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`UPLOAD_MIDDLEWARE: Carpeta de subidas creada exitosamente en ${uploadsDir}`);
    } catch (err) {
        console.error(`UPLOAD_MIDDLEWARE: ¡ERROR CRÍTICO! No se pudo crear la carpeta de subidas en ${uploadsDir}. Error:`, err);
        // Si la carpeta no se puede crear, Multer fallará al intentar guardar archivos.
        // Considera lanzar un error aquí o manejarlo de forma que el servidor no arranque si es crítico.
    }
} else {
    console.log(`UPLOAD_MIDDLEWARE: La carpeta de subidas ${uploadsDir} ya existe.`);
}

// Configuración del Almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Verificar si el directorio de destino existe justo antes de la subida
        // (aunque ya lo hicimos al cargar el módulo, es una doble verificación)
        if (!fs.existsSync(uploadsDir)) {
            // Intentar crearla de nuevo si por alguna razón no existe
            try {
                fs.mkdirSync(uploadsDir, { recursive: true });
                console.log(`UPLOAD_MIDDLEWARE (destination): Carpeta ${uploadsDir} creada justo a tiempo.`);
            } catch (mkdirErr) {
                console.error(`UPLOAD_MIDDLEWARE (destination): Error creando ${uploadsDir} en callback de destino.`, mkdirErr);
                return cb(mkdirErr, null); // Pasar error a Multer
            }
        }
        cb(null, uploadsDir); // Guardar en la carpeta /backend/uploads (relativa a donde se ejecuta el script)
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        // Sanitizar el nombre original para evitar problemas con caracteres especiales y limitar longitud
        const originalNameSanitized = file.originalname
            .replace(/\.[^/.]+$/, "") // Quitar extensión original para no duplicarla
            .replace(/[^a-zA-Z0-9._-]/g, '_') // Reemplazar caracteres no seguros por guion bajo
            .substring(0, 50); // Limitar longitud del nombre base
        
        const fileName = `${file.fieldname}-${Date.now()}-${originalNameSanitized}${fileExtension}`;
        cb(null, fileName);
    },
});

// Configuración del Filtro de Archivos
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true); // Aceptar el archivo
    } else {
        // Rechazar el archivo con un error específico que Multer puede capturar
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, JPG, PNG, GIF, WebP).'), false);
    }
};

// Inicializar Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 1024 * 1024 * 5, // Límite de 5MB por archivo
        files: 10 // Límite de 10 archivos por petición (para upload.array)
    } 
});

// Middleware para múltiples imágenes
const uploadMultipleImages = upload.array('imagenes', 10); // 'imagenes' es el nombre del campo, 10 máx archivos

// Middleware para una sola imagen (si lo necesitas en otro lado)
const uploadSingleImage = upload.single('imagen');

export { uploadMultipleImages, uploadSingleImage, uploadsDir }; // Exportar uploadsDir no es estrictamente necesario si server.js usa la misma lógica