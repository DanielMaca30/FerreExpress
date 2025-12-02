// src/routes/auditoria.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { listarAuditoria } = require("../controllers/auditoriaController");

// Solo ADMIN puede ver la auditoría
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  listarAuditoria
);

module.exports = router;
