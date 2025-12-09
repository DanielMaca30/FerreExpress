const pool = require("../db");

// Listar preguntas frecuentes según rol
const listarFAQ = async (req, res) => {
  try {
    const rol = req.user.role;

    let query = "SELECT * FROM faq WHERE rol_destino = 'GENERAL'";
    if (rol === "CLIENTE") {
      query += " OR rol_destino = 'CLIENTE'";
    } else if (rol === "CONTRATISTA") {
      query += " OR rol_destino = 'CONTRATISTA'";
    } else if (rol === "ADMIN") {
      query += " OR rol_destino IN ('CLIENTE','CONTRATISTA')";
    }
    // si 'orden' puede ser NULL, usa COALESCE
    query += " ORDER BY COALESCE(orden, 9999) ASC, id ASC";

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al listar FAQ:", error);
    res.status(500).json({ error: "Error al listar FAQ" });
  }
};

// Crear FAQ
const crearFAQ = async (req, res) => {
  try {
    const { pregunta, respuesta, rol_destino } = req.body;

    if (!pregunta || !respuesta) {
      return res
        .status(400)
        .json({ error: "Pregunta y respuesta son requeridas" });
    }

    const [result] = await pool.query(
      "INSERT INTO faq (pregunta, respuesta, rol_destino) VALUES (?, ?, ?)",
      [pregunta, respuesta, rol_destino || "GENERAL"]
    );

    res
      .status(201)
      .json({ message: "FAQ creada con éxito", id: result.insertId });
  } catch (error) {
    console.error("Error al crear FAQ:", error);
    res.status(500).json({ error: "Error al crear FAQ" });
  }
};

// Actualizar FAQ
const actualizarFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { pregunta, respuesta, rol_destino } = req.body;

    const [result] = await pool.query(
      "UPDATE faq SET pregunta = ?, respuesta = ?, rol_destino = ? WHERE id = ?",
      [pregunta, respuesta, rol_destino || "GENERAL", id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "FAQ no encontrada" });
    }

    res.json({ message: "FAQ actualizada con éxito" });
  } catch (error) {
    console.error("Error al actualizar FAQ:", error);
    res.status(500).json({ error: "Error al actualizar FAQ" });
  }
};

// Eliminar FAQ
const eliminarFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM faq WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "FAQ no encontrada" });
    }

    res.json({ message: "FAQ eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar FAQ:", error);
    res.status(500).json({ error: "Error al eliminar FAQ" });
  }
};

const reordenarFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { orden } = req.body;
    const [r] = await pool.query("UPDATE faq SET orden=? WHERE id=?", [
      Number(orden) || 0,
      id,
    ]);
    if (!r.affectedRows)
      return res.status(404).json({ error: "FAQ no encontrada" });
    res.json({ message: "Orden actualizado" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al reordenar FAQ" });
  }
};

const feedbackFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { util } = req.body; // true/false
    const field = util ? "util" : "no_util";
    const [r] = await pool.query(
      `UPDATE faq SET ${field}=${field}+1 WHERE id=?`,
      [id]
    );
    if (!r.affectedRows)
      return res.status(404).json({ error: "FAQ no encontrada" });
    res.json({ message: "Gracias por tu feedback" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar feedback" });
  }
};

module.exports = {listarFAQ, crearFAQ, actualizarFAQ, eliminarFAQ, reordenarFAQ, feedbackFAQ};