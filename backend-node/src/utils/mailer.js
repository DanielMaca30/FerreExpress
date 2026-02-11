// backend-node/src/utils/mailer.js
const nodemailer = require("nodemailer");

const SMTP_READY = Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);

let transporter = null;

if (!SMTP_READY) {
  console.warn("⚠️ SMTP deshabilitado: falta MAIL_HOST/MAIL_USER/MAIL_PASS (se omiten correos).");
} else {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
    secure: process.env.MAIL_SECURE === "true", // true para 465
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: { rejectUnauthorized: false },

    // ✅ CLAVE: timeouts cortos para no colgar peticiones
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 8000,
  });

  // opcional: verificar en arranque (no tumba el server)
  transporter.verify().then(
    () => console.log("✅ SMTP listo"),
    (err) => console.warn("⚠️ SMTP verify falló:", err?.message)
  );
}

const sendMail = async ({ to, subject, text, html }) => {
  // ✅ Nunca romper flujo por correo
  if (!SMTP_READY || !transporter) {
    return { skipped: true, reason: "smtp_not_configured" };
  }

  if (!to || !subject || (!text && !html)) {
    return { skipped: true, reason: "missing_params" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"FerreExpress S.A.S" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Correo enviado a ${to} (${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.warn("⚠️ sendMail falló:", err?.message);
    return { ok: false, error: err?.message };
  }
};

module.exports = { sendMail, SMTP_READY };