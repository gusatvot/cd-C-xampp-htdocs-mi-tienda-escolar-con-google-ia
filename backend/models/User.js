// backend/models/User.js
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs'; // Para hashear contraseñas (asegúrate de tenerlo instalado npm install bcryptjs)
import crypto from 'crypto'; // Módulo nativo de Node.js para criptografía

// Schema para subdocumentos de direcciones de envío dentro del usuario
const direccionSchema = new mongoose.Schema({
    calle: { type: String, required: true },
    numero: { type: String, required: true },
    piso: { type: String },
    depto: { type: String },
    ciudad: { type: String, required: true },
    provincia: { type: String, required: true },
    codigoPostal: { type: String, required: true },
    pais: { type: String, default: 'Argentina' },
    esPrincipal: { type: Boolean, default: false },
    // TODO: Añadir un alias para la dirección (ej: 'Casa', 'Trabajo')
});

const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        apellido: {
            type: String,
            required: [true, 'El apellido es obligatorio'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true, // Asegura que cada email sea único en la colección
            trim: true,
            lowercase: true, // Guardar emails siempre en minúsculas
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Por favor, introduce un email válido', // Mensaje si no cumple el formato de email
            ],
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'], // Validación de longitud mínima
            select: false, // Por defecto, no incluir el campo password en las consultas FIND
        },
        rol: {
            type: String,
            enum: ['cliente', 'mayorista', 'admin'], // Limitar los valores posibles del rol
            default: 'cliente', // Rol por defecto si no se especifica
        },
        razonSocial: {
            type: String,
            trim: true,
            // TODO: Añadir validación si solo aplica a mayoristas
        },
        cuit: {
            type: String,
            trim: true,
            // TODO: Añadir validación de formato CUIT
        },
        direccionesEnvio: [direccionSchema], // Array de subdocumentos usando el schema de dirección
        telefono: {
            type: String,
            trim: true,
        },
        aprobadoMayorista: { // Bandera para saber si el usuario mayorista está aprobado
            type: Boolean,
            default: false,
        },
        activo: { // Bandera para activar/desactivar cuentas (ej: por admin)
            type: Boolean,
            default: true,
        },
        // TODO: Añadir campo para verificación de email si se implementa
        // emailConfirmado: { type: Boolean, default: false },
        // emailConfirmationToken: String,
        // emailConfirmationExpires: Date,

        // --- Nuevos campos para reseteo de contraseña ---
        passwordResetToken: String, // Almacena el token HASHEADO (el que guardamos en la DB)
        passwordResetExpires: Date, // Almacena la fecha/hora de expiración del token de reseteo
        // ---------------------------------------------
    },
    {
        timestamps: true, // Añade automáticamente campos createdAt y updatedAt
    }
);

// Middleware (hook) para hashear la contraseña ANTES de guardar el usuario
// Se ejecuta en usuario.save()
userSchema.pre('save', async function (next) {
    // Solo hashear la contraseña si ha sido modificada (o es nueva)
    // Esto evita hashear una contraseña ya hasheada al actualizar otros campos del usuario
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcryptjs.genSalt(10); // Generar un "salt" (cadena aleatoria)
    this.password = await bcryptjs.hash(this.password, salt); // Hashear la contraseña con el salt
    next(); // Continuar con el proceso de guardado
});

// Método para comparar la contraseña ingresada (texto plano) con la contraseña hasheada en la BD
// Se usa en el login: usuario.matchPassword(passwordIngresada)
userSchema.methods.matchPassword = async function (enteredPassword) {
    // bcryptjs.compare() compara el texto plano con el hash
    return await bcryptjs.compare(enteredPassword, this.password);
};

// --- Nuevo método para generar y hashear un token de reseteo de contraseña ---
// Este método genera el token, lo guarda HASHEADO en el campo passwordResetToken,
// setea la expiración, y DEVUELVE el token ORIGINAL para enviarlo por email.
userSchema.methods.getResetPasswordToken = function () {
    // 1. Generar un token de reseteo (string aleatorio único)
    // Usamos randomBytes de crypto para generar bytes aleatorios y los convertimos a string hexadecimal
    const resetTokenOriginal = crypto.randomBytes(20).toString('hex'); // Token de 40 caracteres hexadecimales

    // 2. Hashear el token (el que se guarda en la BD)
    // Usamos SHA256 para hashear el token ORIGINAL. Solo guardamos el hash en la BD.
    // Esto mejora la seguridad: si la DB se ve comprometida, los tokens hasheados no pueden usarse directamente.
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetTokenOriginal) // Actualizar el hash con el token original
        .digest('hex'); // Obtener el hash en formato hexadecimal

    // 3. Establecer la fecha de expiración para el token
    // Le damos un tiempo de vida limitado (ej. 10 o 15 minutos)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutos (en milisegundos)
    // TODO: Hacer la expiración configurable (ej. desde .env)

    // 4. Devolver el token ORIGINAL (sin hashear)
    // Este es el token que se enviará al usuario por email y que el frontend usará.
    return resetTokenOriginal;
};

// TODO: Método similar para generar token de confirmación de email
// userSchema.methods.getEmailConfirmationToken = function() { /* ... */ };


const User = mongoose.model('User', userSchema);

export default User;