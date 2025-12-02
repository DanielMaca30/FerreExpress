// backend-node/src/controllers/casoController.js
const pool = require('../db');
const { sendMail } = require('../utils/mailer');

// Crear caso
const crearCaso = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const { titulo, descripcion, prioridad } = req.body;

    if (!titulo || !descripcion) {
      return res.status(400).json({ error: "Título y descripción son requeridos" });
    }

    const [result] = await pool.query(
      "INSERT INTO casos (usuario_id, titulo, descripcion, prioridad) VALUES (?, ?, ?, ?)",
      [usuarioId, titulo, descripcion, prioridad || 'MEDIA']
    );

    const casoId = result.insertId;

    // Guardar notificación
    await pool.query(
      "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'CASO')",
      [
        usuarioId,
        `Caso creado #${casoId}`,
        `Tu caso fue creado con éxito y está en estado ABIERTO.`
      ]
    );

    res.status(201).json({
      message: "Caso creado con éxito",
      id: casoId,
      estado: 'ABIERTO'
    });
  } catch (error) {
    console.error("Error al crear caso:", error);
    res.status(500).json({ error: "Error al crear caso" });
  }
};

// Listar casos
const listarCasos = async (req, res) => {
  try {
    const rol = req.user.role;
    const usuarioId = req.user.sub;

    let query = "SELECT * FROM casos";
    const params = [];

    if (rol !== 'ADMIN') {
      query += " WHERE usuario_id = ?";
      params.push(usuarioId);
    }

    query += " ORDER BY fecha_creacion DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error al listar casos:", error);
    res.status(500).json({ error: "Error al listar casos" });
  }
};

// Detalle de caso
const detalleCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = req.user.role;
    const usuarioId = req.user.sub;

    let query = "SELECT * FROM casos WHERE id = ?";
    const params = [id];

    if (rol !== 'ADMIN') {
      query += " AND usuario_id = ?";
      params.push(usuarioId);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Caso no encontrado o sin permiso" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error en detalleCaso:", error);
    res.status(500).json({ error: "Error al obtener detalle del caso" });
  }
};

// Cambiar estado
const actualizarEstadoCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    const rol = req.user.role;
    const usuarioId = req.user.sub;

    const estadosValidos = ['EN_PROGRESO', 'RESUELTO', 'CERRADO', 'CANCELADO'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    // Buscar el caso
    const [rows] = await pool.query(
      "SELECT usuario_id, estado FROM casos WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }
    const caso = rows[0];

    // Permisos: admin o dueño
    if (rol !== 'ADMIN' && caso.usuario_id !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para actualizar este caso" });
    }

    // Actualizar estado
    await pool.query("UPDATE casos SET estado = ? WHERE id = ?", [nuevoEstado, id]);

    // Guardar notificación
    await pool.query(
      "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'CASO')",
      [
        caso.usuario_id,
        `Caso #${id} actualizado`,
        `El estado de tu caso cambió a: ${nuevoEstado}`
      ]
    );

    // 🔔 Obtener correo del dueño real
    let destinatario = req.user.email;
    if (rol === 'ADMIN') {
      const [usuarioRows] = await pool.query(
        "SELECT email FROM usuarios WHERE id = ?",
        [caso.usuario_id]
      );
      if (usuarioRows.length > 0) {
        destinatario = usuarioRows[0].email;
      }
    }

    // 📩 Mensaje según estado
    let subject = `Tu caso #${id} cambió de estado`;
    let text = `Tu caso ahora está en estado: ${nuevoEstado}`;
    let html = `<p>Hola,</p><p>Tu caso <b>#${id}</b> ahora está en estado: <b>${nuevoEstado}</b>.</p>`;

    if (nuevoEstado === 'RESUELTO') {
      subject = `Caso #${id} resuelto 🎉`;
      text = `Tu caso #${id} fue marcado como RESUELTO.`;
      html = `<p>Hola,</p><p>Tu caso <b>#${id}</b> fue resuelto con éxito 🎉.</p>`;
    }

    await sendMail({ to: destinatario, subject, text, html });

    res.json({ message: `Estado del caso actualizado a ${nuevoEstado}` });
  } catch (error) {
    console.error("Error en actualizarEstadoCaso:", error);
    res.status(500).json({ error: "Error al actualizar estado del caso" });
  }
};

/* =========================
   💬 HILO DE COMENTARIOS
   ========================= */

// GET /casos/:id/comentarios
const listarComentariosCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = req.user.role;
    const usuarioId = req.user.sub;

    // Verificar que el caso existe y que tiene permisos
    const [casoRows] = await pool.query(
      "SELECT usuario_id FROM casos WHERE id = ?",
      [id]
    );
    if (casoRows.length === 0) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    const caso = casoRows[0];
    if (rol !== 'ADMIN' && caso.usuario_id !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para ver los comentarios de este caso" });
    }

    const [rows] = await pool.query(
      `SELECT 
         cc.id,
         cc.mensaje,
         cc.fecha_creacion,
         cc.usuario_id,
         cc.origen,
         u.username,
         u.role
       FROM casos_comentarios cc
       JOIN usuarios u ON cc.usuario_id = u.id
       WHERE cc.caso_id = ?
       ORDER BY cc.fecha_creacion ASC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al listar comentarios del caso:", error);
    res.status(500).json({ error: "Error al listar comentarios del caso" });
  }
};

// POST /casos/:id/comentarios
const agregarComentarioCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;
    const rol = req.user.role;
    const usuarioId = req.user.sub;

    if (!mensaje || !mensaje.toString().trim()) {
      return res.status(400).json({ error: "El mensaje del comentario es requerido" });
    }

    // Verificar que el caso existe y permiso
    const [casoRows] = await pool.query(
      "SELECT usuario_id FROM casos WHERE id = ?",
      [id]
    );
    if (casoRows.length === 0) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    const caso = casoRows[0];
    if (rol !== 'ADMIN' && caso.usuario_id !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para comentar este caso" });
    }

    const origen = rol || 'CLIENTE';

    const [insertResult] = await pool.query(
      `INSERT INTO casos_comentarios (caso_id, usuario_id, mensaje, origen)
       VALUES (?, ?, ?, ?)`,
      [id, usuarioId, mensaje.toString().trim(), origen]
    );

    const nuevoId = insertResult.insertId;

    const [rows] = await pool.query(
      `SELECT 
         cc.id,
         cc.mensaje,
         cc.fecha_creacion,
         cc.usuario_id,
         cc.origen,
         u.username,
         u.role
       FROM casos_comentarios cc
       JOIN usuarios u ON cc.usuario_id = u.id
       WHERE cc.id = ?`,
      [nuevoId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al agregar comentario al caso:", error);
    res.status(500).json({ error: "Error al agregar comentario al caso" });
  }
};

module.exports = {
  crearCaso,
  listarCasos,
  detalleCaso,
  actualizarEstadoCaso,
  listarComentariosCaso,
  agregarComentarioCaso,
};
