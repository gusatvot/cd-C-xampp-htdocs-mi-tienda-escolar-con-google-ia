// backend/controllers/userController.js
import asyncHandler from '../utils/asyncHandler.js'; // Importa el wrapper para manejo de errores asíncronos
import User from '../models/User.js'; // Importa el modelo de Usuario
import generateToken from '../utils/generateToken.js'; // Para regenerar token si se actualizan datos relevantes (ej. rol, aunque admin no cambia rol del propio admin)
import sendEmail from '../utils/emailSender.js'; // Para enviar emails (ej. confirmación cambio email, reseteo password)


// --- FUNCIONES PARA EL USUARIO AUTENTICADO (SU PROPIO PERFIL) ---

// @desc    Obtener perfil del usuario logueado
// @route   GET /api/usuarios/perfil
// @access  Private
const obtenerPerfilUsuario = asyncHandler(async (req, res) => {
    // req.user es el usuario logueado, populado por protegerRuta.
    // Por defecto, el middleware ya excluye la contraseña.
    // Si necesitaras más datos que no están en el token o que podrían haber cambiado:
    const usuario = await User.findById(req.user._id)
        .select('-password') // Asegurar exclusión de password
        // TODO: Popular campos relacionados si los hay y son necesarios para el perfil (ej. órdenes recientes, direcciones completas si las direcciones fueran otra colección)
        ;

    if (usuario) {
        // Devolvemos los datos del usuario (sin la password)
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol, // Rol actual del usuario
            razonSocial: usuario.razonSocial, // Datos de mayorista
            cuit: usuario.cuit,             // Datos de mayorista
            direccionesEnvio: usuario.direccionesEnvio, // Array de subdocumentos de direcciones
            telefono: usuario.telefono,
            aprobadoMayorista: usuario.aprobadoMayorista, // Bandera de mayorista
            activo: usuario.activo, // Estado activo/inactivo
            createdAt: usuario.createdAt,
            updatedAt: usuario.updatedAt,
            // TODO: Incluir otros campos del perfil si los hay
        });
    } else {
        // Esto no debería ocurrir si protegerRuta funciona correctamente
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado');
    }
});

// @desc    Actualizar perfil del usuario logueado
// @route   PUT /api/usuarios/perfil
// @access  Private
const actualizarPerfilUsuario = asyncHandler(async (req, res) => {
    // El usuario logueado es req.user (viene de protegerRuta, solo tiene _id y rol por defecto si no se configuró más)
    // Buscamos el usuario completo en DB para asegurarnos de tener la última versión y poder guardar
    const usuario = await User.findById(req.user._id);

    if (usuario) {
        // Actualizar solo los campos permitidos que vienen en el body
        // Las validaciones en la ruta ya aseguraron que los campos enviados sean válidos y del tipo correcto.
        usuario.nombre = req.body.nombre !== undefined ? req.body.nombre : usuario.nombre;
        usuario.apellido = req.body.apellido !== undefined ? req.body.apellido : usuario.apellido;

        // Si se actualiza el email, verificar si el nuevo email ya existe (Mongoose unique:true lo maneja)
        // TODO: Si cambias el email, considera un flujo de verificación de email para el nuevo email.
        usuario.email = req.body.email !== undefined ? req.body.email : usuario.email;

        usuario.telefono = req.body.telefono !== undefined ? req.body.telefono : usuario.telefono;
        usuario.razonSocial = req.body.razonSocial !== undefined ? req.body.razonSocial : usuario.razonSocial;
        usuario.cuit = req.body.cuit !== undefined ? req.body.cuit : usuario.cuit;

        // NOTA: La contraseña se actualiza en un endpoint separado (/perfil/password) por seguridad.
        // La validación de password corta en la ruta PUT /perfil aplica si se incluye en el body,
        // pero la lógica de hasheo DEBE estar en el modelo User (pre-save hook).
        // Si incluyes `password` aquí, debes asegurarte de que el pre-save hook se dispare.
        // Una opción es: if (req.body.password) { usuario.password = req.body.password; }

        // TODO: Las direcciones de envío se gestionan en sus propios endpoints (POST/PUT/DELETE /perfil/direcciones)

        const usuarioActualizado = await usuario.save(); // Guardar los cambios

        // TODO: Si se actualizó el email, enviar un email de notificación de cambio o de verificación al nuevo email.
        // try { await sendEmail({ email: usuarioActualizado.email, subject: 'Tu email ha cambiado', message: '...' }); } catch(e) { console.error('Error email:', e); }

        // Devolver la info actualizada (sin password)
        res.json({
            _id: usuarioActualizado._id,
            nombre: usuarioActualizado.nombre,
            apellido: usuarioActualizado.apellido,
            email: usuarioActualizado.email,
            rol: usuarioActualizado.rol, // El usuario no puede cambiar su propio rol aquí
            razonSocial: usuarioActualizado.razonSocial,
            cuit: usuarioActualizado.cuit,
            telefono: usuarioActualizado.telefono,
            aprobadoMayorista: usuarioActualizado.aprobadoMayorista, // El usuario no puede cambiar su propia aprobación mayorista aquí
            activo: usuarioActualizado.activo, // El usuario no puede desactivarse a sí mismo aquí
        });

    } else {
         // Esto no debería ocurrir si protegerRuta funciona correctamente
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado');
    }
});

// TODO: @desc    Cambiar la contraseña del usuario logueado
// TODO: @route   PUT /api/usuarios/perfil/password
// TODO: @access  Private
// TODO: (Requiere validar password actual y nueva password. Usar .matchPassword del modelo.)
// const cambiarPasswordUsuario = asyncHandler(async (req, res) => { /* ... */ });


// --- FUNCIONES PARA LA GESTIÓN DE DIRECCIONES DE ENVÍO DEL USUARIO AUTENTICADO ---

// Helper para encontrar una dirección por su _id dentro del array de direcciones del usuario
const encontrarDireccionPorId = (usuario, direccionId) => {
    if (!usuario || !usuario.direccionesEnvio) {
        return null;
    }
    // user.direccionesEnvio.id(direccionId) es un método de Mongoose para encontrar subdocumentos por _id
    const direccion = usuario.direccionesEnvio.id(direccionId);
    return direccion;
};


// @desc    Obtener todas las direcciones de envío del usuario logueado
// @route   GET /api/usuarios/perfil/direcciones
// @access  Private
const obtenerDireccionesEnvio = asyncHandler(async (req, res) => {
    // req.user es el usuario logueado. Buscamos en DB solo para obtener el array de direcciones.
    const usuario = await User.findById(req.user._id).select('direccionesEnvio');

    if (usuario) {
        res.json(usuario.direccionesEnvio); // Devolver el array de subdocumentos de direcciones
    } else {
        // Esto no debería pasar si protegerRuta funcionó
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado para obtener direcciones');
    }
});


// @desc    Agregar una nueva dirección de envío al perfil del usuario logueado
// @route   POST /api/usuarios/perfil/direcciones
// @access  Private
const agregarDireccionEnvio = asyncHandler(async (req, res) => {
    // Los datos de la dirección ya están validados por express-validator en la ruta
    const nuevaDireccionData = req.body; // Esperamos un objeto con calle, numero, ciudad, etc.

    const usuario = await User.findById(req.user._id); // Obtener el usuario completo

    if (usuario) {
        // Lógica para manejar la bandera 'esPrincipal'
        if (nuevaDireccionData.esPrincipal === true) {
            // Si la nueva dirección se marca como principal, desmarcar todas las demás
            usuario.direccionesEnvio.forEach(dir => {
                dir.esPrincipal = false;
            });
        } else if (usuario.direccionesEnvio.length === 0) {
             // Si es la primera dirección que agrega, marcarla como principal por defecto
             nuevaDireccionData.esPrincipal = true;
         } else if (nuevaDireccionData.esPrincipal === undefined) {
             // Si no se especifica esPrincipal y no es la primera, asegurar que sea false
             nuevaDireccionData.esPrincipal = false;
         }


        // Agregar la nueva dirección como subdocumento al array direccionesEnvio
        usuario.direccionesEnvio.push(nuevaDireccionData);
        await usuario.save(); // Guardar los cambios en el documento principal del usuario

        // Devolver la lista completa actualizada de direcciones, incluyendo la nueva dirección con su _id asignado por Mongoose.
        res.status(201).json(usuario.direccionesEnvio); // 201 Created - Devolver la lista actualizada
    } else {
         // Esto no debería pasar si protegerRuta funcionó
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado para agregar dirección');
    }
});


// @desc    Actualizar una dirección de envío específica del usuario logueado
// @route   PUT /api/usuarios/perfil/direcciones/:direccionId
// @access  Private
const actualizarDireccionEnvio = asyncHandler(async (req, res) => {
    // El ID de la dirección (:direccionId) y los datos de actualización (body) ya están validados
    const { direccionId } = req.params;
    const datosActualizacion = req.body; // Esperamos un objeto con los campos a actualizar

    const usuario = await User.findById(req.user._id); // Obtener el usuario completo

    if (usuario) {
        const direccion = encontrarDireccionPorId(usuario, direccionId); // Encontrar el subdocumento por ID

        if (!direccion) {
            res.status(404); // Not Found
            throw new Error('Dirección no encontrada en el perfil del usuario');
        }

        // Lógica para manejar la bandera 'esPrincipal' si se actualiza
         if (datosActualizacion.esPrincipal === true) {
             // Si esta dirección se marca como principal, desmarcar todas las demás
             usuario.direccionesEnvio.forEach(dir => {
                 if (dir._id.toString() !== direccionId) { // Comparar IDs como strings
                     dir.esPrincipal = false;
                 }
             });
         }
        // Si datosActualizacion.esPrincipal es false, simplemente se marcará como false en el siguiente paso.
        // Si datosActualizacion.esPrincipal es undefined, el valor actual de la dirección no cambia.


        // Actualizar los campos de la dirección encontrada con los datos del body.
        // Usar Object.assign o actualizar campo por campo para mayor control.
        // Object.assign(direccion, datosActualizacion); // Opción rápida

        // Opción campo por campo (más explícita):
        direccion.calle = datosActualizacion.calle !== undefined ? datosActualizacion.calle : direccion.calle;
        direccion.numero = datosActualizacion.numero !== undefined ? datosActualizacion.numero : direccion.numero;
        direccion.piso = datosActualizacion.piso !== undefined ? datosActualizacion.piso : direccion.piso;
        direccion.depto = datosActualizacion.depto !== undefined ? datosActualizacion.depto : direccion.depto;
        direccion.ciudad = datosActualizacion.ciudad !== undefined ? datosActualizacion.ciudad : direccion.ciudad;
        direccion.provincia = datosActualizacion.provincia !== undefined ? datosActualizacion.provincia : direccion.provincia;
        direccion.codigoPostal = datosActualizacion.codigoPostal !== undefined ? datosActualizacion.codigoPostal : direccion.codigoPostal;
        direccion.pais = datosActualizacion.pais !== undefined ? datosActualizacion.pais : direccion.pais;
        // El campo esPrincipal requiere manejo especial porque si es undefined, no debe cambiar el valor actual
        if (datosActualizacion.esPrincipal !== undefined) {
             direccion.esPrincipal = datosActualizacion.esPrincipal;
        }
        // TODO: Actualizar otros campos si existen en el schema de direccionSchema

        await usuario.save(); // Guardar los cambios en el documento principal del usuario

        // Devolver la lista completa actualizada de direcciones
        res.json(usuario.direccionesEnvio); // Devolver la lista actualizada
    } else {
         // Esto no debería pasar si protegerRuta funcionó
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado para actualizar dirección');
    }
});

// @desc    Eliminar una dirección de envío específica del usuario logueado
// @route   DELETE /api/usuarios/perfil/direcciones/:direccionId
// @access  Private
const eliminarDireccionEnvio = asyncHandler(async (req, res) => {
    // El ID de la dirección (:direccionId) es validado por express-validator en la ruta
    const { direccionId } = req.params;

    const usuario = await User.findById(req.user._id); // Obtener el usuario completo

    if (usuario) {
        const direccion = encontrarDireccionPorId(usuario, direccionId);

        if (!direccion) {
            res.status(404); // Not Found
            throw new Error('Dirección no encontrada en el perfil del usuario');
        }

        // Opcional: No permitir eliminar la ÚNICA dirección si es obligatorio tener al menos una.
        // if (usuario.direccionesEnvio.length <= 1) { // Si es la única o la última restante
        //     res.status(400); // Bad Request
        //     throw new Error('No se puede eliminar. El usuario debe tener al menos una dirección.');
        // }

        // Verificar si la dirección que se va a eliminar es la principal
        const eraPrincipal = direccion.esPrincipal;

        // Eliminar el subdocumento del array usando el método pull de Mongoose
        usuario.direccionesEnvio.pull({ _id: direccionId });

        await usuario.save(); // Guardar los cambios

        // Si se eliminó la dirección principal y quedan otras, marcar una de las restantes como principal.
        // Esto solo es necesario si tu lógica de negocio requiere SIEMPRE una dirección principal.
        if (eraPrincipal && usuario.direccionesEnvio.length > 0) {
             // Marcar la primera dirección restante como principal por defecto
             usuario.direccionesEnvio[0].esPrincipal = true;
             await usuario.save(); // Guardar este cambio adicional
        }


        // Devolver la lista completa actualizada de direcciones
        res.json(usuario.direccionesEnvio); // Devolver la lista actualizada
        // O podrías devolver un mensaje de éxito: res.json({ message: 'Dirección eliminada correctamente', _id: direccionId });

    } else {
         // Esto no debería pasar si protegerRuta funcionó
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado para eliminar dirección');
    }
});


// --- FUNCIONES SOLO PARA ADMINISTRADORES ---

// @desc    Obtener todos los usuarios (Admin)
// @route   GET /api/usuarios
// @access  Private/Admin
const obtenerUsuarios = asyncHandler(async (req, res) => {
    // Excluir contraseñas por defecto en el modelo User
    // Podemos añadir paginación, filtros y ordenamiento aquí en el futuro
    const usuarios = await User.find({})
        .select('-password') // Asegurar exclusión de password
        .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente

    res.json(usuarios); // Devolver la lista de usuarios (sin password)
});

// @desc    Obtener usuario por ID (Admin)
// @route   GET /api/usuarios/:id
// @access  Private/Admin
const obtenerUsuarioPorId = asyncHandler(async (req, res) => {
    // El ID del usuario es validado por express-validator en la ruta
    const usuario = await User.findById(req.params.id)
        .select('-password'); // Excluir contraseña

    if (usuario) {
        res.json(usuario); // Devolver los datos del usuario (sin password)
    } else {
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado');
    }
});

// @desc    Actualizar usuario por ID (Admin) - Para cambiar rol, estadoActivo, aprobadoMayorista, datos personales
// @route   PUT /api/usuarios/:id
// @access  Private/Admin
const actualizarUsuarioPorAdmin = asyncHandler(async (req, res) => {
    // El ID del usuario en param y los datos en body son validados por express-validator en la ruta
    const usuario = await User.findById(req.params.id);

    if (usuario) {
        // Campos que un admin puede actualizar.
        // Las validaciones en la ruta ya aseguran que los campos enviados sean válidos.
        usuario.nombre = req.body.nombre !== undefined ? req.body.nombre : usuario.nombre;
        usuario.apellido = req.body.apellido !== undefined ? req.body.apellido : usuario.apellido;
        usuario.email = req.body.email !== undefined ? req.body.email : usuario.email; // Cuidado si el email es único
        usuario.rol = req.body.rol !== undefined ? req.body.rol : usuario.rol; // El admin puede cambiar el rol
        usuario.aprobadoMayorista = req.body.aprobadoMayorista !== undefined ? req.body.aprobadoMayorista : usuario.aprobadoMayorista; // El admin puede aprobar mayoristas
        usuario.activo = req.body.activo !== undefined ? req.body.activo : usuario.activo; // El admin puede activar/desactivar

        // NOTA: El admin NO debería poder cambiar la contraseña de un usuario directamente aquí por seguridad.
        // Para eso debería haber un flujo de "reset password for user" si es necesario.
        // Las direcciones de envío de otros usuarios tampoco se manejan desde aquí, sino desde el perfil del propio usuario o un endpoint admin de direcciones si fuera necesario.

        const usuarioActualizado = await usuario.save(); // Guardar los cambios

        // Devolver la info actualizada (sin password)
        res.json({
            _id: usuarioActualizado._id,
            nombre: usuarioActualizado.nombre,
            apellido: usuarioActualizado.apellido,
            email: usuarioActualizado.email,
            rol: usuarioActualizado.rol,
            aprobadoMayorista: usuarioActualizado.aprobadoMayorista,
            activo: usuarioActualizado.activo,
            // No incluir direcciones aquí, solo datos principales
        });

    } else {
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado');
    }
});

// @desc    Eliminar usuario (Admin) - En este caso, lo marcamos como inactivo.
// @route   DELETE /api/usuarios/:id
// @access  Private/Admin
const eliminarUsuario = asyncHandler(async (req, res) => {
    // El ID del usuario es validado por express-validator en la ruta
    const usuario = await User.findById(req.params.id);

    if (usuario) {
        // No permitir que un admin se desactive a sí mismo o a otro admin fácilmente.
        // Si el usuario logueado intenta eliminarse a sí mismo O el usuario a eliminar es un admin:
        if (usuario._id.toString() === req.user._id.toString() || usuario.rol === 'admin') {
            res.status(400); // Bad Request
            throw new Error('No se pueden eliminar/desactivar usuarios administradores desde esta ruta.');
        }

        // TODO: Lógica para manejar datos asociados (órdenes, carritos, etc.) antes de eliminar/desactivar.
        // Usualmente es mejor *no* eliminar físicamente usuarios con historial (órdenes).
        // La lógica actual en el controlador es simplemente desactivarlo (activo: false), lo cual es una buena práctica.

        usuario.activo = false; // Marcar como inactivo
        await usuario.save(); // Guardar el cambio

        // TODO: Opcional: Loguear quién (qué admin) desactivó al usuario.

        res.json({ message: 'Usuario desactivado correctamente', _id: usuario._id }); // Devolver mensaje de éxito
        // O si prefieres eliminarlo físicamente:
        // await User.deleteOne({ _id: req.params.id });
        // res.json({ message: 'Usuario eliminado físicamente correctamente', _id: req.params.id });


    } else {
        res.status(404); // Not Found
        throw new Error('Usuario no encontrado');
    }
});

// TODO: @desc    Obtener estadísticas generales de usuarios (total, por rol, etc.) - Podría ir aquí o en un controlador de stats generales
// TODO: @route   GET /api/usuarios/stats/generales
// TODO: @access  Private/Admin
// const obtenerEstadisticasUsuarios = asyncHandler(async (req, res) => { /* ... */ });


// --- Exportar todas las funciones ---
export {
    obtenerPerfilUsuario,
    actualizarPerfilUsuario,
    // TODO: Exportar cambiarPasswordUsuario cuando esté implementado
    // cambiarPasswordUsuario,

    obtenerDireccionesEnvio,
    agregarDireccionEnvio,
    actualizarDireccionEnvio,
    eliminarDireccionEnvio,

    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuarioPorAdmin,
    // TODO: Renombrar eliminarUsuario a desactivarUsuario para mayor claridad si no se elimina físicamente
    eliminarUsuario, // Esta función desactiva

    // TODO: Exportar funciones de estadísticas de usuarios cuando estén implementadas
    // obtenerEstadisticasUsuarios,
};