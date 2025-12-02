const express = require("express");
const router = express.Router();
const { simularPago, procesarPago } = require("../controllers/pagoController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");


// ✅ Nueva ruta para checkout (NO crea ni toca pedidos)
router.post(
  "/pagos/simular",
  requireAuth,
  requireRole("CLIENTE", "CONTRATISTA"),
  simularPago
);

// 🔵 Ruta existente: pagar pedidos ya creados (p.ej. “pagar después”)
router.post(
  "/pagos",
  requireAuth,
  requireRole("CLIENTE", "CONTRATISTA"),
  procesarPago
);

module.exports = router;