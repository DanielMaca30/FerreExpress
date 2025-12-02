const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/v1/usuarios → listar todos los usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, role, created_at FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
