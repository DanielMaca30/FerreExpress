const express = require('express');
const router = express.Router();
const {
  crearDireccion,
  listarDirecciones,
  detalleDireccion,
  actualizarDireccion,
  eliminarDireccion
} = require('../controllers/direccionController');

const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// 🔒 Todas las rutas de direcciones requieren autenticación
router.post('/direcciones', requireAuth, crearDireccion);
router.get('/direcciones', requireAuth, listarDirecciones);
router.get('/direcciones/:id', requireAuth, detalleDireccion);
router.put('/direcciones/:id', requireAuth, actualizarDireccion);
router.delete('/direcciones/:id', requireAuth, eliminarDireccion);

module.exports = router;