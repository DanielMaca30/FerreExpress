const pool = require('../db');

// Crear dirección
const crearDireccion = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const { direccion, ciudad, departamento, pais, telefono, es_principal } = req.body;

    if (!direccion || !ciudad) {
      return res.status(400).json({ error: "Dirección y ciudad son requeridas" });
    }

    // Si es_principal = true → desmarcar otras
    if (es_principal) {
      await pool.query("UPDATE direcciones_usuario SET es_principal = 0 WHERE usuario_id = ?", [usuarioId]);
    }

    const [result] = await pool.query(
      `INSERT INTO direcciones_usuario 
       (usuario_id, direccion, ciudad, departamento, pais, telefono, es_principal) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, direccion, ciudad, departamento || null, pais || 'Colombia', telefono || null, es_principal || 0]
    );

    res.status(201).json({ message: "Dirección creada", id: result.insertId });
  } catch (error) {
    console.error("Error al crear dirección:", error);
    res.status(500).json({ error: "Error al crear dirección" });
  }
};

// Listar direcciones del usuario
const listarDirecciones = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const [rows] = await pool.query("SELECT * FROM direcciones_usuario WHERE usuario_id = ?", [usuarioId]);
    res.json(rows);
  } catch (error) {
    console.error("Error al listar direcciones:", error);
    res.status(500).json({ error: "Error al listar direcciones" });
  }
};

// Detalle de dirección
const detalleDireccion = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const rol = req.user.role;
    const { id } = req.params;

    let query = "SELECT * FROM direcciones_usuario WHERE id = ?";
    let params = [id];

    if (rol !== 'ADMIN') {
      query += " AND usuario_id = ?";
      params.push(usuarioId);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Dirección no encontrada o sin permiso" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error en detalleDireccion:", error);
    res.status(500).json({ error: "Error al obtener dirección" });
  }
};

// Actualizar dirección
const actualizarDireccion = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const { id } = req.params;
    const { direccion, ciudad, departamento, pais, telefono, es_principal } = req.body;

    if (es_principal) {
      await pool.query("UPDATE direcciones_usuario SET es_principal = 0 WHERE usuario_id = ?", [usuarioId]);
    }

    const [result] = await pool.query(
      `UPDATE direcciones_usuario
       SET direccion=?, ciudad=?, departamento=?, pais=?, telefono=?, es_principal=? 
       WHERE id=? AND usuario_id=?`,
      [direccion, ciudad, departamento || null, pais || 'Colombia', telefono || null, es_principal || 0, id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Dirección no encontrada o sin permiso" });
    }

    res.json({ message: "Dirección actualizada" });
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    res.status(500).json({ error: "Error al actualizar dirección" });
  }
};

// Eliminar dirección
const eliminarDireccion = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM direcciones_usuario WHERE id = ? AND usuario_id = ?",
      [id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Dirección no encontrada o sin permiso" });
    }

    res.json({ message: "Dirección eliminada" });
  } catch (error) {
    console.error("Error al eliminar dirección:", error);
    res.status(500).json({ error: "Error al eliminar dirección" });
  }
};

module.exports = { crearDireccion, listarDirecciones, detalleDireccion, actualizarDireccion, eliminarDireccion };