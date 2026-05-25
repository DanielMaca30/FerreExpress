// backend-node/routes/faq.js
const express = require('express');
const router = express.Router();
const {
  listarFAQ,
  crearFAQ,
  actualizarFAQ,
  eliminarFAQ,
  reordenarFAQ,
  feedbackFAQ,
  metricsFAQ,
} = require('../controllers/faqController');

const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Listar FAQs (publico para usuarios autenticados)
router.get('/faq', requireAuth, listarFAQ);

// Metricas de FAQ (solo ADMIN) - RF-05
router.get('/faq/metricas', requireAuth, requireRole('ADMIN'), metricsFAQ);

// CRUD admin
router.post('/faq', requireAuth, requireRole('ADMIN'), crearFAQ);
router.put('/faq/:id', requireAuth, requireRole('ADMIN'), actualizarFAQ);
router.delete('/faq/:id', requireAuth, requireRole('ADMIN'), eliminarFAQ);
router.put('/faq/:id/orden', requireAuth, requireRole('ADMIN'), reordenarFAQ);

// Feedback de usuario
router.post('/faq/:id/feedback', requireAuth, feedbackFAQ);

module.exports = router;
