const pool = require('../db');

// Verifica vigencia y actualiza en DB si cambió
async function syncVigencia(cotizacion) {
  const hoy = new Date();
  const fechaVigencia = new Date(cotizacion.fecha_vigencia);

  let nuevoEstado = 'VIGENTE';
  if (fechaVigencia < hoy) {
    nuevoEstado = 'VENCIDA';
  }

  if (cotizacion.estado_vigencia !== nuevoEstado) {
    // Actualizar en DB
    await pool.query(
      'UPDATE cotizaciones SET estado_vigencia = ? WHERE id = ?',
      [nuevoEstado, cotizacion.id]
    );
    cotizacion.estado_vigencia = nuevoEstado;
  }

  return cotizacion;
}

module.exports = { syncVigencia };
