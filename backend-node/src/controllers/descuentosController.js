const pool = require('../db');
const { logAuditoria } = require("../utils/auditoria");

const listarReglas = async (_req,res)=>{
  const [rows] = await pool.query('SELECT * FROM reglas_descuento ORDER BY created_at DESC');
  res.json(rows);
};

const crearRegla = async (req,res)=>{
  const { tipo, umbral_cantidad, umbral_items, porcentaje, activo=1 } = req.body;
  if (!['MISMO_PRODUCTO','VARIOS_PRODUCTOS'].includes(tipo)) return res.status(400).json({error:'tipo inválido'});
  const [r] = await pool.query(
    `INSERT INTO reglas_descuento (tipo, umbral_cantidad, umbral_items, porcentaje, activo) VALUES (?,?,?,?,?)`,
    [tipo, umbral_cantidad||null, umbral_items||null, porcentaje, activo?1:0]
  );
  res.status(201).json({ id:r.insertId });
};

const actualizarRegla = async (req,res)=>{
  const { id } = req.params;
  const { tipo, umbral_cantidad, umbral_items, porcentaje, activo, vigente, version } = req.body;

  const [r] = await pool.query(
    `UPDATE reglas_descuento SET tipo=?, umbral_cantidad=?, umbral_items=?, porcentaje=?, activo=?, vigente=?, version=? WHERE id=?`,
    [tipo, umbral_cantidad||null, umbral_items||null, porcentaje, activo?1:0, vigente?1:0, version||1, id]
  );

  if (!r.affectedRows) return res.status(404).json({error:'Regla no encontrada'});

  await logAuditoria({
    usuario_id: req.user.sub,
    accion: "REGLA_UPDATE",
    entidad: "regla_descuento",
    entidad_id: Number(id),
    cambios: { tipo, umbral_cantidad, umbral_items, porcentaje, activo, vigente, version },
  });

  res.json({ message:'Regla actualizada' });
};

const eliminarRegla = async (req,res)=>{
  const { id } = req.params;
  const [r] = await pool.query('DELETE FROM reglas_descuento WHERE id=?',[id]);
  if (!r.affectedRows) return res.status(404).json({error:'Regla no encontrada'});
  res.json({ message:'Regla eliminada' });
};

const listarReglasActivas = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT tipo, umbral_cantidad, umbral_items, porcentaje
       FROM reglas_descuento
       WHERE activo = 1 AND vigente = 1
       ORDER BY version DESC, updated_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar reglas activas:", error);
    res.status(500).json({ error: "Error al obtener reglas de descuento" });
  }
};

module.exports = { listarReglas, crearRegla, actualizarRegla, eliminarRegla, listarReglasActivas };