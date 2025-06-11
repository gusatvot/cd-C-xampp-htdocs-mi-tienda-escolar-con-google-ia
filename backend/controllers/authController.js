// backend/controllers/authController.js
import User from '../models/User.js'; // Importar el modelo de usuario
import asyncHandler from '../utils/asyncHandler.js'; // Wrapper para manejo de errores en rutas asíncronas
import generateToken from '../utils/generateToken.js'; // Utilidad para generar JWT y establecer cookie
import sendEmail from '../utils/emailSender.js'; // Utilidad para enviar emails
import crypto from 'crypto'; // Módulo nativo de Node.js para criptografía (ya importado si usas el último código de User)


// --- FUNCIONES DE AUTENTICACIÓN BÁSICA ---

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/registrar
// @access  Public
const registrarUsuario = asyncHandler(async (req, res) => {
    // express-validator ya validó el formato de req.body en la ruta
    const { nombre, apellido, email, password, telefono, razonSocial, cuit } = req.body;

    // Verificar si el usuario ya existe por email (validación de unicidad también la hace Mongoose)
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
        res.status(400); // Bad Request
        throw new Error('El usuario ya existe con ese email');
    }

    // Crear nuevo usuario en la base de datos
    // El rol por defecto es 'cliente' según el modelo User.
    // La contraseña se hashea automáticamente por el hook 'pre-save' en el modelo User.
    const usuario = await User.create({
        nombre,
        apellido,
        email,
        password, // Se hasheará antes de guardar
        telefono,
        razonSocial,
        cuit,
        // Direcciones, aprobadoMayorista, activo usarán sus defaults o se manejarán después
    });

    if (usuario) {
        // Generar token JWT y establecerlo como cookie HTTP-Only
        generateToken(res, usuario._id, usuario.rol);

        // Enviar email de bienvenida
        try {
            const emailSubject = '¡Bienvenido/a a Mi Tienda Escolar!';
            const emailMessage = `Hola ${usuario.nombre},\n\nGracias por registrarte en Mi Tienda Escolar. ¡Estamos emocionados de tenerte con nosotros!\n\nAhora puedes empezar a explorar nuestro catálogo y encontrar todo lo que necesitas.\n\nVisita nuestra tienda aquí: [URL de tu tienda frontend aquí] (Configura FRONTEND_URL en .env)\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\nSaludos,\nEl equipo de Mi Tienda Escolar`;
            // TODO: Usar plantilla HTML para el email de bienvenida para un mejor formato

            await sendEmail({
                email: usuario.email,
                subject: emailSubject,
                message: emailMessage,
            });
            console.log(`Email de bienvenida enviado a ${usuario.email}`);
        } catch (emailError) {
            // Si falla el envío de email, no hacer fallar el registro. Solo loguear el error.
            console.error(`Error al enviar email de bienvenida a ${usuario.email}:`, emailError);
        }

        // Responder al cliente con los datos del usuario creado (sin contraseña)
        res.status(201).json({ // 201 Created
            _id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol,
            aprobadoMayorista: usuario.aprobadoMayorista,
            activo: usuario.activo,
            // No enviar la contraseña ni siquiera hasheada
        });
    } else {
        res.status(400); // Bad Request
        throw new Error('Datos de usuario inválidos, no se pudo crear el usuario');
    }
});

// @desc    Autenticar usuario y obtener token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUsuario = asyncHandler(async (req, res) => {
    // express-validator ya validó email y password no vacíos y formato email en ruta
    const { email, password } = req.body;

    // Buscar usuario por email e incluir la contraseña para la comparación (.select('+password'))
    const usuario = await User.findOne({ email }).select('+password');

    if (usuario && (await usuario.matchPassword(password))) {
        // Verificar si el usuario está activo
        if (!usuario.activo) {
            res.status(403); // Forbidden
            throw new Error('Tu cuenta ha sido desactivada. Por favor, contacta al administrador.');
        }

        // Generar token JWT y establecerlo como cookie HTTP-Only
        generateToken(res, usuario._id, usuario.rol);

        // Responder con los datos del usuario logueado (sin password)
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol,
            aprobadoMayorista: usuario.aprobadoMayorista,
            activo: usuario.activo,
            // Otros datos que el frontend necesite al loguearse (ej. direcciones principales, etc.)
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Email o contraseña incorrectos');
    }
});

// @desc    Cerrar sesión (Logout)
// @route   POST /api/auth/logout
// @access  Private (requiere estar autenticado)
const logoutUsuario = asyncHandler(async (req, res) => {
    // Limpiar la cookie JWT haciendo que expire inmediatamente
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0), // Fecha en el pasado
        secure: process.env.NODE_ENV !== 'development', // Solo en HTTPS en producción
        sameSite: 'strict', // Ayuda a prevenir CSRF
    });
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});


// --- NUEVAS FUNCIONES PARA RESESTEO DE CONTRASEÑA ---

// @desc    Solicitar reseteo de contraseña (Generar token y enviar email)
// @route   POST /api/auth/solicitar-reseteo-password
// @access  Public
const solicitarReseteoPassword = asyncHandler(async (req, res) => {
    // express-validator ya validó el email en la ruta y su formato
    const { email } = req.body;

    const usuario = await User.findOne({ email });

    // Si el usuario no existe, responder con éxito para no revelar si el email está registrado o no.
    // Esto es una buena práctica de seguridad.
    if (!usuario) {
        console.log(`Intento de reseteo de password para email no encontrado: ${email}`);
        // Devolver un mensaje genérico de éxito AUNQUE el usuario no exista
        res.status(200).json({ message: 'Si el usuario está registrado, recibirás un email con instrucciones para resetear tu contraseña.' });
        return; // Salir de la función
    }

    // El usuario existe. Generar el token de reseteo.
    // El método en el modelo User genera el token ORIGINAL y setea/hashea el token y la expiración en el documento.
    const resetTokenOriginal = usuario.getResetPasswordToken();

    // Guardar el usuario con el token hasheado y la fecha de expiración en la base de datos
    // Esto guarda los campos passwordResetToken y passwordResetExpires que seteó usuario.getResetPasswordToken()
    await usuario.save({ validateBeforeSave: false }); // Opcional: omitir validación completa antes de guardar solo estos campos si el modelo es muy complejo

    // Crear la URL de reseteo
    // Esta URL debe apuntar a tu frontend, donde tendrás un formulario para que el usuario ingrese la nueva contraseña.
    // El frontend leerá el token de los parámetros de la URL.
    // Asegúrate de tener FRONTEND_URL en tu archivo .env
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword?token=${resetTokenOriginal}`; // TODO: Usar una ruta de frontend específica como /resetpassword


    const emailSubject = 'Solicitud de Reseteo de Contraseña para Mi Tienda Escolar';
    const emailMessage = `Hola ${usuario.nombre},\n\nHas solicitado resetear tu contraseña para tu cuenta en Mi Tienda Escolar.\n\nHaz click en el siguiente enlace para crear una nueva contraseña:\n\n${resetUrl}\n\nEste enlace es válido por 10 minutos.\n\nSi tú no solicitaste un cambio de contraseña, por favor ignora este email.\n\nSaludos,\nEl equipo de Mi Tienda Escolar`;
    // TODO: Usar plantilla HTML para el email de reseteo para un mejor formato. Incluir el enlace como un tag <a>.

    try {
        await sendEmail({
            email: usuario.email, // Email del usuario al que se le resetea la password
            subject: emailSubject,
            message: emailMessage,
            // html: `<p>Haz click <a href="${resetUrl}">aquí</a> para resetear tu contraseña.</p><p>El enlace es válido por 10 minutos.</p>` // Ejemplo HTML
        });

        console.log(`Email de reseteo de password enviado a ${usuario.email}`);
        // Responder con éxito UNA VEZ que el email se envió correctamente
        res.status(200).json({ message: 'Si el usuario está registrado, recibirás un email con instrucciones para resetear tu contraseña.' });

    } catch (emailError) {
        // Si falla el envío de email, es importante limpiar el token y la expiración por seguridad,
        // para que un token generado no quede válido si el email no llegó.
        usuario.passwordResetToken = undefined;
        usuario.passwordResetExpires = undefined;
        await usuario.save({ validateBeforeSave: false }); // Guardar sin validar todo el documento

        console.error(`Error al enviar email de reseteo a ${usuario.email}:`, emailError);
        // Responder con un error 500 si el envío de email falla
        res.status(500); // Internal Server Error
        throw new Error('Error al enviar el email de reseteo. Por favor, inténtalo de nuevo más tarde.');
    }
});


// @desc    Resetear contraseña usando el token
// @route   PUT /api/auth/resetear-password/:token
// @access  Public
const resetearPassword = asyncHandler(async (req, res) => {
    // express-validator ya validó el token en el param y la nueva password en el body (longitud, no vacío)
    const resetTokenReceived = req.params.token; // Token ORIGINAL recibido en la URL
    const { password: nuevaPassword } = req.body; // La NUEVA contraseña del body (renombrada)

    // 1. Hashear el token recibido para buscarlo en la DB
    // Recordemos que en la DB guardamos el HASH del token, no el token original.
    const resetTokenHasheado = crypto
        .createHash('sha256')
        .update(resetTokenReceived) // Hashear el token ORIGINAL que llegó en la URL
        .digest('hex');

    // 2. Buscar usuario por el token HASHEADO Y verificar que el token no haya expirado
    const usuario = await User.findOne({
        passwordResetToken: resetTokenHasheado, // Buscar por el token HASHEADO
        passwordResetExpires: { $gt: Date.now() }, // Y donde la fecha de expiración sea MAYOR a la fecha actual (no expirado)
    });

    // 3. Validar si se encontró un usuario y si el token es válido/no expirado
    if (!usuario) {
        res.status(400); // Bad Request
        // Mensaje genérico por seguridad, sin diferenciar si el token es inválido o expirado.
        throw new Error('Token inválido o ha expirado. Por favor, solicita un nuevo reseteo de contraseña.');
    }

    // 4. El token es válido y no ha expirado. Proceder a actualizar la contraseña.
    usuario.password = nuevaPassword; // El hook pre('save') en el modelo la hasheará automáticamente antes de guardar
    // Limpiar los campos de reseteo una vez usados (para que el mismo token no se pueda usar dos veces)
    usuario.passwordResetToken = undefined;
    usuario.passwordResetExpires = undefined;

    await usuario.save(); // Guardar el usuario con la nueva password hasheada y campos de reseteo limpios

    // Opcional: Enviar email notificando al usuario que su contraseña ha sido cambiada exitosamente
    // try { await sendEmail({ email: usuario.email, subject: 'Contraseña de Mi Tienda Escolar actualizada', message: 'Tu contraseña ha sido cambiada con éxito. Si no realizaste este cambio, contacta a soporte.' }); } catch (e) { console.error('Error enviando email de confirmación de cambio de password:', e); }


    // 5. Responder con éxito
    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
});


// TODO: Implementar funciones para verificación de email si se requiere
// @desc    Verificar email usando el token de confirmación
// @route   GET /api/auth/verificar-email/:tokenVerificacion
// @access  Public
// const verificarEmail = asyncHandler(async (req, res) => { /* ... */ });

// TODO: Implementar función para reenviar email de verificación
// @desc    Reenviar email de verificación
// @route   POST /api/auth/reenviar-verificacion
// @access  Private (usuario logueado pero no verificado)
// const reenviarVerificacionEmail = asyncHandler(async (req, res) => { /* ... */ });


// --- Exportar todas las funciones ---
// Asegúrate de que todas las funciones definidas ARRIBA estén listadas AQUÍ
export {
    registrarUsuario,
    loginUsuario,
    logoutUsuario,
    // Exportar las funciones de reseteo de password
    solicitarReseteoPassword,
    resetearPassword,
    // TODO: Exportar funciones de verificación de email
    // verificarEmail,
    // reenviarVerificacionEmail,
};