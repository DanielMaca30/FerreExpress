// backend-node/src/routes/casos.js
const express = require('express');
const router = express.Router();

const {
  crearCaso,
  listarCasos,
  detalleCaso,
  actualizarEstadoCaso,
  listarComentariosCaso,
  agregarComentarioCaso,
} = require('../controllers/casoController');

const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Crear caso (CLIENTE o CONTRATISTA)
router.post(
  '/casos',
  requireAuth,
  requireRole('CLIENTE', 'CONTRATISTA'),
  crearCaso
);

// Listar casos (usuario ve los suyos, admin ve todos)
router.get(
  '/casos',
  requireAuth,
  requireRole('CLIENTE', 'CONTRATISTA', 'ADMIN'),
  listarCasos
);

// Ver detalle
router.get(
  '/casos/:id',
  requireAuth,
  requireRole('CLIENTE', 'CONTRATISTA', 'ADMIN'),
  detalleCaso
);

// Cambiar estado (solo admin o dueño del caso; validado en el controller)
router.put(
  '/casos/:id/estado',
  requireAuth,
  requireRole('ADMIN', 'CLIENTE', 'CONTRATISTA'),
  actualizarEstadoCaso
);

/* ====== Hilo de comentarios ====== */

// Listar comentarios de un caso
router.get(
  '/casos/:id/comentarios',
  requireAuth,
  requireRole('CLIENTE', 'CONTRATISTA', 'ADMIN'),
  listarComentariosCaso
);

// Agregar comentario a un caso
router.post(
  '/casos/:id/comentarios',
  requireAuth,
  requireRole('CLIENTE', 'CONTRATISTA', 'ADMIN'),
  agregarComentarioCaso
);

module.exports = router;
