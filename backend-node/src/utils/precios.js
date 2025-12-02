// src/utils/precios.js
const COSTO_ENVIO_FIJO = 10000;

/**
 * Calcula costo de envío según entrega
 * @param {"DOMICILIO"|"TIENDA"} entrega
 * @returns {number}
 */
function calcularEnvio(entrega) {
  if (entrega === "DOMICILIO") return COSTO_ENVIO_FIJO;
  if (entrega === "TIENDA") return 0;
  return 0; // fallback seguro
}

/**
 * Calcula subtotal, envío y total a partir de items validados
 * @param {Array<{precio_unitario:number, cantidad:number}>} items
 * @param {"DOMICILIO"|"TIENDA"} entrega
 */
function calcularCarrito(items = [], entrega = "DOMICILIO") {
  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad),
    0
  );
  const envio = calcularEnvio(entrega);
  const total = subtotal + envio;
  return { subtotal, envio, total };
}

module.exports = { COSTO_ENVIO_FIJO, calcularEnvio, calcularCarrito };