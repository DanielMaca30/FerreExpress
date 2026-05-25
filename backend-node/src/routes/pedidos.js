// src/routes/pedidos.js
const express = require("express");
const router = express.Router();

const {
  // ADMIN
  listarPedidos,
  detallePedido,
  // FLUJOS
  crearPedidoDirecto,
  crearPedidoDesdeCotizacion,
  actualizarEstado,
  // CLIENTE
  listarMisPedidos,
  detallePedidoPropio,
} = require("../controllers/pedidoController");

const { buildFacturaPdf } = require("../utils/facturaBuilder");

const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

/*
  NOTAS DE SEGURIDAD Y FLUJO
  - Para ADMIN usamos requireRole("ADMIN").
  - Para endpoints con lógica de permisos en el controller (ej. cancelar propio pedido),
    dejamos solo requireAuth aquí, y el controller valida el resto.
  - Para “pedido directo” lo usará CLIENTE y también CONTRATISTA.
*/

// ------------------- CLIENTE / CONTRATISTA -------------------

// ⚠️ IMPORTANTE: estas rutas van ANTES de /pedidos/:id (ADMIN)

// GET /api/v1/pedidos/mios  → lista del usuario autenticado
router.get("/pedidos/mios", requireAuth, listarMisPedidos);

// GET /api/v1/pedidos/:id/mio → detalle del propio pedido (ticket)
router.get("/pedidos/:id/mio", requireAuth, detallePedidoPropio);

// GET /api/v1/pedidos/:id/comprobante → descarga PDF del comprobante (RF-04)
router.get("/pedidos/:id/comprobante", requireAuth, async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);
    const userId = req.user.sub || req.user.id;
    const role = req.user.role;

    // Solo el dueno del pedido o un ADMIN puede descargar
    const pool = require("../db");
    const [[pedido]] = await pool.query(
      "SELECT usuario_id FROM pedidos WHERE id = ? LIMIT 1",
      [pedidoId]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (role !== "ADMIN" && pedido.usuario_id !== userId) {
      return res.status(403).json({ error: "Acceso no autorizado" });
    }

    const pdfBuffer = await buildFacturaPdf(pedidoId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="comprobante-pedido-${pedidoId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    console.error("Error generando comprobante:", err);
    res.status(500).json({ error: "Error al generar comprobante" });
  }
});

// POST /api/v1/pedidos/directo → crear pedido desde carrito (cliente/contratista)
router.post(
  "/pedidos/directo",
  requireAuth,
  requireRole("CLIENTE", "CONTRATISTA"),   // 👈 AQUÍ EL FIX
  crearPedidoDirecto
);

// POST /api/v1/pedidos/desde-cotizacion (alias: /pedidos/cotizacion) → contratista
router.post(
  "/pedidos/desde-cotizacion",
  requireAuth,
  requireRole("CONTRATISTA"),
  crearPedidoDesdeCotizacion
);
router.post(
  "/pedidos/cotizacion",
  requireAuth,
  requireRole("CONTRATISTA"),
  crearPedidoDesdeCotizacion
);

// PUT /api/v1/pedidos/:id/estado → controller valida permisos finos (ADMIN vs dueños)
router.put("/pedidos/:id/estado", requireAuth, actualizarEstado);

// ✅ Atajo semántico para cancelar propio pedido (setea estado y reutiliza actualizarEstado)
router.put(
  "/pedidos/:id/cancelar",
  requireAuth,
  (req, _res, next) => {
    req.body.estado = "CANCELADO";
    next();
  },
  actualizarEstado
);

// ------------------- ADMIN -------------------

// GET /api/v1/pedidos → listar pedidos (admin)
router.get("/pedidos", requireAuth, requireRole("ADMIN"), listarPedidos);

// GET /api/v1/pedidos/:id → detalle de pedido (admin)
router.get("/pedidos/:id", requireAuth, requireRole("ADMIN"), detallePedido);

module.exports = router;
