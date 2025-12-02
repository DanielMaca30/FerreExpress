// src/utils/auditoria.js
const pool = require("../db");

async function logAuditoria({ usuario_id, accion, entidad, entidad_id = null, cambios = null }) {
  try {
    await pool.query(
      `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, cambios)
       VALUES (?, ?, ?, ?, ?)`,
      [
        usuario_id ?? null,
        accion ?? null,
        entidad ?? null,
        entidad_id ?? null,
        cambios ? JSON.stringify(cambios) : null,
      ]
    );
  } catch (error) {
    // No queremos que un fallo de auditoría rompa el flujo principal
    console.error("Error al registrar auditoría:", error.message);
  }
}

module.exports = { logAuditoria };
