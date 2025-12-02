const express = require('express');
const router = express.Router();
const { listarNotificaciones, marcarLeida } = require('../controllers/notificacionController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Listar todas las notificaciones del usuario
router.get('/notificaciones', requireAuth, listarNotificaciones);

// Marcar una como leída
router.put('/notificaciones/:id/leida', requireAuth, marcarLeida);

module.exports = router;