  const express = require('express');
  const router = express.Router();
  const { requireAuth } = require('../middlewares/authMiddleware');
  const { requireRole } = require('../middlewares/roleMiddleware');

  // Cualquier usuario autenticado
  router.get('/protected/me', requireAuth, (req, res) => {
    res.json({
      message: 'Acceso permitido',
      user: req.user
    });
  });

  // Solo ADMIN
  router.get('/protected/admin/only', requireAuth, requireRole('ADMIN'), (req, res) => {
    res.json({
      message: 'Bienvenido ADMIN',
      user: req.user
    });
  });

  // Solo CONTRATISTA o ADMIN
  router.get('/protected/empresa/only', requireAuth, requireRole('CONTRATISTA', 'ADMIN'), (req, res) => {
    res.json({
      message: 'Bienvenido EMPRESA o ADMIN',
      user: req.user
    });
  });

  module.exports = router;
