// backend/utils/emailSender.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Asegúrate de que las variables de entorno estén cargadas

const sendEmail = async (options) => {
    // 1. Crear un transportador (transporter)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT), // Puerto 465
        secure: true, // Usar SSL (true para puerto 465)
        auth: {
            user: process.env.EMAIL_USER, // tu_correo_gmail@gmail.com
            pass: process.env.EMAIL_PASS, // tu_contraseña_de_aplicacion_de_16_caracteres
        },
    });

    // 2. Definir las opciones del email
    const mailOptions = {
        from: process.env.EMAIL_FROM, // Ej: '"Nombre de tu Tienda" <tu_correo_gmail@gmail.com>'
        to: options.email,            // Email del destinatario
        subject: options.subject,     // Asunto del email
        text: options.message,        // Cuerpo del email en texto plano
        // html: options.html,        // Opcional: si quieres enviar contenido HTML
    };

    // 3. Enviar el email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado exitosamente: ' + info.response);
        console.log('Message ID: ' + info.messageId);
        // Puedes ver la preview URL si usas ethereal.email para pruebas, pero no con Gmail.
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error al intentar enviar email:', error);
        // Es importante loguear el error completo para diagnóstico
        return { success: false, error: error }; // Devuelve el objeto de error completo
    }
};

export default sendEmail;