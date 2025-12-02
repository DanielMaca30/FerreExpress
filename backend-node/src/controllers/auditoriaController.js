// src/controllers/auditoriaController.js
const pool = require("../db");

/**
 * GET /api/v1/auditoria
 * Query opcionales:
 *  - accion
 *  - entidad
 *  - usuario_id
 */
const listarAuditoria = async (req, res) => {
  try {
    const { accion, entidad, usuario_id } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.usuario_id,
        u.username,
        u.email,
        a.accion,
        a.entidad,
        a.entidad_id,
        a.cambios,
        a.fecha
      FROM auditoria a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE 1=1
    `;
    const params = [];

    if (accion) {
      sql += " AND a.accion = ?";
      params.push(accion);
    }

    if (entidad) {
      sql += " AND a.entidad = ?";
      params.push(entidad);
    }

    if (usuario_id) {
      sql += " AND a.usuario_id = ?";
      params.push(usuario_id);
    }

    sql += " ORDER BY a.fecha DESC LIMIT 100";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Error al listar auditoría:", error);
    res.status(500).json({ error: "Error al listar auditoría" });
  }
};

module.exports = { listarAuditoria };
