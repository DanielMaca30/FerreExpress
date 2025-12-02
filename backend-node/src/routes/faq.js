// backend-node/routes/faq.js
const express = require('express');
const router = express.Router();
const {
  listarFAQ,
  crearFAQ,
  actualizarFAQ,
  eliminarFAQ,
  reordenarFAQ,
  feedbackFAQ
} = require('../controllers/faqController');

const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

/* ============================================================
   📘 Rutas de FAQ (Preguntas Frecuentes)
   ============================================================ */

/**
 * @route   GET /faq
 * @desc    Listar preguntas frecuentes (todos los roles autenticados)
 * @access  Privado (cualquier rol)
 */
router.get('/faq', requireAuth, listarFAQ);

/**
 * @route   POST /faq
 * @desc    Crear una nueva pregunta frecuente
 * @access  Privado (ADMIN)
 */
router.post('/faq', requireAuth, requireRole('ADMIN'), crearFAQ);

/**
 * @route   PUT /faq/:id
 * @desc    Actualizar una pregunta frecuente existente
 * @access  Privado (ADMIN)
 */
router.put('/faq/:id', requireAuth, requireRole('ADMIN'), actualizarFAQ);

/**
 * @route   DELETE /faq/:id
 * @desc    Eliminar una pregunta frecuente
 * @access  Privado (ADMIN)
 */
router.delete('/faq/:id', requireAuth, requireRole('ADMIN'), eliminarFAQ);

/**
 * @route   PUT /faq/:id/orden
 * @desc    Reordenar posición de una pregunta frecuente
 * @access  Privado (ADMIN)
 */
router.put('/faq/:id/orden', requireAuth, requireRole('ADMIN'), reordenarFAQ);

/**
 * @route   POST /faq/:id/feedback
 * @desc    Registrar retroalimentación del usuario sobre la FAQ
 * @access  Privado (cualquier rol autenticado)
 */
router.post('/faq/:id/feedback', requireAuth, feedbackFAQ);

/* ============================================================
   📤 Exportación del router
   ============================================================ */
module.exports = router;
