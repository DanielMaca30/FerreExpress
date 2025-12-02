// src/controllers/carritoController.js
const pool = require("../db");
const { calcularCarrito } = require("../utils/precios");

/**
 * POST /api/v1/carrito/preview
 * Body:
 * {
 *   entrega: "DOMICILIO" | "TIENDA",
 *   items: [{ producto_id:number, cantidad:number }]
 * }
 *
 * - Valida productos y cantidades en base de datos.
 * - Usa PRECIO DEL PRODUCTO (cliente convencional: sin descuentos).
 * - Devuelve { subtotal, envio, total, itemsDetallados[] } para mostrar en la UI.
 */
const previewCarrito = async (req, res) => {
  try {
    const { entrega = "DOMICILIO", items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Debe enviar items" });
    }

    // Validar en DB y armar items normalizados
    const normalizados = [];
    for (const it of items) {
      const id = Number(it.producto_id);
      const qty = Math.max(1, Number(it.cantidad || 1));

      const [rows] = await pool.query("SELECT id, nombre, precio, stock FROM productos WHERE id = ?", [id]);
      if (rows.length === 0) {
        return res.status(400).json({ error: `Producto ${id} no existe` });
      }
      const p = rows[0];
      if (Number(p.stock) <= 0) {
        return res.status(400).json({ error: `Producto ${p.nombre} sin stock` });
      }
      // Nota: en preview no forzamos el stock, solo avisamos si está en 0; si quieres, limita a stock mínimo.
      normalizados.push({
        producto_id: p.id,
        nombre: p.nombre,
        precio_unitario: Number(p.precio),
        cantidad: qty,
        subtotal: Number(p.precio) * qty,
      });
    }

    const { subtotal, envio, total } = calcularCarrito(normalizados, entrega);
    res.json({ entrega, subtotal, envio, total, items: normalizados });
  } catch (error) {
    console.error("Error en previewCarrito:", error);
    res.status(500).json({ error: "Error al previsualizar carrito" });
  }
};

module.exports = { previewCarrito };