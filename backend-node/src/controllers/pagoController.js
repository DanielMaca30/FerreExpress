// src/controllers/pagoController.js
const pool = require("../db");
const { sendMail } = require("../utils/mailer");

const COMPANY_INFO = {
  email: "expressraquel@gmail.com",
};

/**
 *  Pasarela DEMO para checkout:
 * - No toca la base de datos.
 * - Aplica la lógica: último dígito PAR => aprobado, IMPAR => rechazado.
 * - Si rechaza, devolvemos 200 con {aprobado:false} para que el front lo maneje sin caer en catch.
 */
const simularPago = async (req, res) => {
  try {
    const { tarjeta, monto } = req.body;

    if (!tarjeta || !monto) {
      return res
        .status(400)
        .json({ error: "Tarjeta y monto son requeridos" });
    }

    const digits = tarjeta.toString().replace(/\D+/g, "");
    if (!digits) {
      return res
        .status(400)
        .json({ error: "Número de tarjeta inválido" });
    }

    const lastDigit = parseInt(digits.slice(-1), 10);
    const pagoAprobado = !Number.isNaN(lastDigit) && lastDigit % 2 === 0;

    if (!pagoAprobado) {
      return res.json({
        aprobado: false,
        message:
          "Pago rechazado por pasarela (demo). Prueba con una tarjeta cuyo último dígito sea PAR.",
      });
    }

    return res.json({
      aprobado: true,
      message: "Pago aprobado (demo).",
    });
  } catch (e) {
    console.error("Error en simularPago:", e);
    return res
      .status(500)
      .json({ error: "Error en pasarela simulada (demo)" });
  }
};

/**
 *  Pasarela simulada de pagos REAL:
 * - Se usa cuando ya existe el pedido (p.ej. pagar luego desde “Mis pedidos”).
 * - NO recalcula total, solo verifica y marca el pedido como CONFIRMADO.
 */
const procesarPago = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const usuarioId = req.user.sub;
    const { pedido_id, tarjeta } = req.body;

    if (!pedido_id || !tarjeta) {
      return res
        .status(400)
        .json({ error: "pedido_id y tarjeta son requeridos" });
    }

    await connection.beginTransaction();

    // Traer pedido del usuario con lock
    const [[pedido]] = await connection.query(
      "SELECT id, usuario_id, estado, total, costo_envio, metodo_pago, entrega FROM pedidos WHERE id = ? AND usuario_id = ? FOR UPDATE",
      [pedido_id, usuarioId]
    );

    if (!pedido) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Pedido no encontrado o no pertenece al usuario" });
    }

    if (pedido.estado !== "PENDIENTE") {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "El pedido no está en estado pendiente de pago" });
    }

    // Simulación de pasarela: último dígito par => aprobado
    const lastDigit = parseInt(tarjeta.toString().slice(-1));
    const pagoAprobado = lastDigit % 2 === 0;

    if (!pagoAprobado) {
      await connection.rollback();
      return res.status(402).json({
        aprobado: false,
        message: "Pago rechazado por pasarela",
      });
    }

    // ✅ No tocamos costo_envio ni total aquí (ya fueron definidos al crear el pedido)
    await connection.query(
      "UPDATE pedidos SET estado = 'CONFIRMADO' WHERE id = ?",
      [pedido_id]
    );

    await connection.commit();

    // Correo con factura PDF adjunta — best-effort
    try {
      if (req.user.email) {
        const { buildFacturaPdf } = require("../utils/facturaBuilder");

        const pdfBuffer = await buildFacturaPdf(pedido_id);

        await sendMail({
          to: req.user.email,
          subject: `Recibo de pago — Pedido #${pedido_id} confirmado`,
          text: `Hola ${req.user.username || ""},\n\nTu pedido #${pedido_id} fue pagado con éxito.\nTotal: ${Number(pedido.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}\n\nEncontrará el recibo de pago adjunto en este correo.\n\nGracias por comprar en FerreExpress S.A.S.`,
          html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;color:#2c2c2a;">
          <div style="background:#F9BF20;padding:16px 24px;border-radius:6px 6px 0 0;">
            <strong style="font-size:18px;">FerreExpress S.A.S.</strong>
          </div>
          <div style="padding:24px;border:1px solid #e8e4d9;border-top:none;border-radius:0 0 6px 6px;">
            <p>Hola <strong>${req.user.username || "cliente"}</strong>,</p>
            <p>Tu pedido <strong>#${pedido_id}</strong> fue pagado con éxito y está ahora en estado <strong>CONFIRMADO</strong>.</p>
            <p style="font-size:20px;font-weight:700;color:#F9BF20;">
              Total: ${Number(pedido.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
            </p>
            <p style="color:#666;font-size:13px;">Encontrará el recibo de pago detallado en el archivo adjunto.</p>
            <hr style="border:none;border-top:1px solid #e8e4d9;margin:16px 0;">
            <p style="font-size:12px;color:#888;">Gracias por comprar en FerreExpress S.A.S. · ${COMPANY_INFO.email}</p>
          </div>
        </div>`,
          attachments: [
            {
              filename: `recibo_pedido_${pedido_id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      }
    } catch (mailError) {
      console.warn("⚠️ No se pudo enviar el recibo de pago:", mailError.message);
    }

    res.json({
      aprobado: true,
      message: "Pago aprobado",
      pedido_id,
      estado: "CONFIRMADO",
      costo_envio: Number(pedido.costo_envio),
      total: Number(pedido.total),
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) { }
    console.error("Error en procesarPago:", error);
    res.status(500).json({ error: "Error en pasarela simulada" });
  } finally {
    connection.release();
  }
};

module.exports = { simularPago, procesarPago };