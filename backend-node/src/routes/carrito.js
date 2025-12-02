// src/routes/carritoRoutes.js
const express = require("express");
const router = express.Router();

// Si ya tienes este controlador, lo importas.
// Debe exportar: previewCarrito(req, res)
const { previewCarrito } = require("../controllers/carritoController");

// Si requieres auth para preview, inserta tu middleware requireAuth aquí.
// const { requireAuth } = require("../middlewares/auth");

// POST /api/v1/carrito/preview
router.post("/preview", /* requireAuth, */ previewCarrito);

module.exports = router;