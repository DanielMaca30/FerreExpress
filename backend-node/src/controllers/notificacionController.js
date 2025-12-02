const pool = require('../db');

// 📌 Listar notificaciones del usuario autenticado
const listarNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.sub;

    const [rows] = await pool.query(
      `SELECT id, titulo, mensaje, tipo, leido, fecha
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY fecha DESC`,
      [usuarioId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al listar notificaciones:", error);
    res.status(500).json({ error: "Error al listar notificaciones" });
  }
};

// 📌 Marcar notificación como leída
const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.sub;

    const [result] = await pool.query(
      "UPDATE notificaciones SET leido = 1 WHERE id = ? AND usuario_id = ?",
      [id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ message: `Notificación #${id} marcada como leída` });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    res.status(500).json({ error: "Error al marcar notificación" });
  }
};

// 📌 Crear notificación (para usar desde otros módulos)
const crearNotificacion = async (usuarioId, titulo, mensaje, tipo = 'GENERAL') => {
  try {
    await pool.query(
      "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)",
      [usuarioId, titulo, mensaje, tipo]
    );
    console.log(`✅ Notificación creada para usuario ${usuarioId}: ${titulo}`);
  } catch (error) {
    console.error("Error al crear notificación:", error);
  }
};

module.exports = { listarNotificaciones, marcarLeida, crearNotificacion };