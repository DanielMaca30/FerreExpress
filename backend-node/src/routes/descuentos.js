const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { listarReglas, crearRegla, actualizarRegla, eliminarRegla } = require('../controllers/descuentosController');

router.get('/descuentos', requireAuth, requireRole('ADMIN'), listarReglas);
router.post('/descuentos', requireAuth, requireRole('ADMIN'), crearRegla);
router.put('/descuentos/:id', requireAuth, requireRole('ADMIN'), actualizarRegla);
router.delete('/descuentos/:id', requireAuth, requireRole('ADMIN'), eliminarRegla);

module.exports = router;
