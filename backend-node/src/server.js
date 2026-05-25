// src/server.js
require("dotenv").config();
const app = require("./app");
const pool = require("./db");
const { sendMail } = require("./utils/mailer");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  iniciarTareasCron();
});

// RF-03: Alertas proactivas de caducidad de cotizaciones
function iniciarTareasCron() {
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas

  const verificarCotizacionesProximas = async () => {
    try {
      // Marcar vencidas
      await pool.query(
        "UPDATE cotizaciones SET estado_vigencia = 'VENCIDA' WHERE fecha_vigencia < NOW() AND estado_vigencia = 'VIGENTE'"
      );

      // Cotizaciones que vencen en las proximas 24h y aun no tienen notificacion de alerta
      const [proximas] = await pool.query(
        `SELECT c.id, c.usuario_id, c.total, c.fecha_vigencia, u.email, u.username
         FROM cotizaciones c
         JOIN usuarios u ON c.usuario_id = u.id
         WHERE c.estado_vigencia = 'VIGENTE'
           AND c.fecha_vigencia BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
           AND NOT EXISTS (
             SELECT 1 FROM notificaciones n
             WHERE n.usuario_id = c.usuario_id
               AND n.mensaje LIKE CONCAT('%cotizacion #', c.id, '%vence%')
               AND n.created_at > DATE_SUB(NOW(), INTERVAL 25 HOUR)
           )`
      );

      for (const cot of proximas) {
        const horasRestantes = Math.max(0, Math.round(
          (new Date(cot.fecha_vigencia) - new Date()) / (1000 * 60 * 60)
        ));

        // Notificacion en BD
        await pool.query(
          "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'ALERTA')",
          [
            cot.usuario_id,
            "Cotizacion proxima a vencer",
            `Tu cotizacion #${cot.id} (Total: $${cot.total}) vence en ~${horasRestantes}h. Acepta o descargala antes de que expire.`,
          ]
        );

        // Email de alerta
        sendMail({
          to: cot.email,
          subject: `FerreExpress: Tu cotizacion #${cot.id} vence pronto`,
          html: `<p>Hola ${cot.username},</p>
                 <p>Tu cotizacion <strong>#${cot.id}</strong> por <strong>$${cot.total}</strong> vence en aproximadamente <strong>${horasRestantes} horas</strong>.</p>
                 <p>Ingresa a tu cuenta para aceptarla o contacta a nuestro equipo.</p>
                 <p>FerreExpress S.A.S.</p>`,
        }).catch((e) => console.error("Error enviando alerta de caducidad:", e));
      }

      if (proximas.length > 0) {
        console.log(`Cron: ${proximas.length} alertas de caducidad enviadas`);
      }
    } catch (err) {
      console.error("Error en cron de caducidad:", err.message);
    }
  };

  // Ejecutar al arrancar y luego cada 24h
  verificarCotizacionesProximas();
  setInterval(verificarCotizacionesProximas, INTERVALO_MS);
}
