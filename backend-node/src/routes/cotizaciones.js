const express = require('express');
const router = express.Router();
const { crearCotizacion, listarCotizaciones, detalleCotizacion, cambiarEstadoCotizacion, exportarCotizacionPDF} = require('../controllers/cotizacionController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Solo empresas/contratistas pueden crear cotizaciones
router.post('/cotizaciones', requireAuth, requireRole('CONTRATISTA'), crearCotizacion);

// Listar cotizaciones (empresa ve las suyas, admin ve todas)
router.get('/cotizaciones', requireAuth, requireRole('CONTRATISTA', 'ADMIN'), listarCotizaciones);

// Ver detalle de una cotización
router.get('/cotizaciones/:id', requireAuth, requireRole('CONTRATISTA', 'ADMIN'), detalleCotizacion);

// Admin cambia estado
router.put('/cotizaciones/:id/estado', requireAuth, requireRole('ADMIN'), cambiarEstadoCotizacion);

// Descargar PDF
router.get('/cotizaciones/:id/pdf', requireAuth, requireRole('CONTRATISTA','ADMIN'), exportarCotizacionPDF);

module.exports = router;