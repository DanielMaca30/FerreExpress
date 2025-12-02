const nodemailer = require("nodemailer");

// Verificación básica de variables de entorno
if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️ Configuración SMTP incompleta. Revisa tu archivo .env");
}

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT) : 587,
  secure: process.env.MAIL_SECURE === "true" || false, // true para 465 (SSL), false para 587 (TLS)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Evita problemas en entornos locales
  },
});

// Función reutilizable para enviar correo
const sendMail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error("Parámetros incompletos para enviar el correo.");
    }

    const info = await transporter.sendMail({
      from: `"FerreExpress S.A.S" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Correo enviado correctamente a ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error.message);
    throw error;
  }
};

module.exports = { sendMail };