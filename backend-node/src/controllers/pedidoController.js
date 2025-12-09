// src/controllers/pedidoController.js
const pool = require("../db");
const { sendMail } = require("../utils/mailer");
const { logAuditoria } = require("../utils/auditoria");

const COSTO_ENVIO_FIJO = 10000;

// Estados alineados a la documentación:
// PENDIENTE, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO
const ESTADOS_VALIDOS = [
  "PENDIENTE",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

/* =========================================================================
 * ADMIN: LISTAR PEDIDOS  GET /api/v1/pedidos?estado=&usuario=&desde=&hasta=
 * ========================================================================= */
const listarPedidos = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { estado, usuario, desde, hasta } = req.query;

    let sql = `
      SELECT 
        p.id, p.usuario_id, u.username, u.email, 
        p.total, p.metodo_pago, p.costo_envio, p.estado, 
        p.fecha_creacion
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += " AND p.estado = ?";
      params.push(estado);
    }
    if (usuario) {
      sql += " AND p.usuario_id = ?";
      params.push(usuario);
    }
    if (desde) {
      sql += " AND p.fecha_creacion >= ?";
      params.push(desde);
    }
    if (hasta) {
      sql += " AND p.fecha_creacion <= ?";
      params.push(hasta);
    }

    sql += " ORDER BY p.fecha_creacion DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Error listarPedidos:", error);
    res.status(500).json({ error: "Error al listar pedidos" });
  }
};

/* =========================================================================
 * ADMIN: DETALLE PEDIDO  GET /api/v1/pedidos/:id
 * ========================================================================= */
const detallePedido = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { id } = req.params;

    const [cab] = await pool.query(
      `
      SELECT p.*, u.username, u.email
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ?
    `,
      [id]
    );

    if (cab.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const [det] = await pool.query(
      `
      SELECT
        d.*,
        pr.nombre,
        (
          SELECT url
          FROM imagenes_producto ip
          WHERE ip.producto_id = pr.id
          ORDER BY ip.es_principal DESC, ip.id ASC
          LIMIT 1
        ) AS imagen_url
      FROM pedido_detalles d
      JOIN productos pr ON pr.id = d.producto_id
      WHERE d.pedido_id = ?
      `,
      [id]
    );

    res.json({ ...cab[0], detalles: det });
  } catch (error) {
    console.error("Error detallePedido:", error);
    res.status(500).json({ error: "Error al obtener detalle del pedido" });
  }
};

/* Helpers */
const isPositiveInt = (n) =>
  Number.isFinite(Number(n)) && Number(n) > 0 && Number.isInteger(Number(n));

async function validarDireccionDeUsuario(connection, direccion_id, usuarioId) {
  if (!direccion_id) return; // puede ser null si retiro en tienda
  const [rows] = await connection.query(
    "SELECT id FROM direcciones_usuario WHERE id = ? AND usuario_id = ?",
    [direccion_id, usuarioId]
  );
  if (rows.length === 0) {
    throw new Error("La dirección no existe o no pertenece al usuario");
  }
}

/* =========================================================================
 * CLIENTE: CREAR PEDIDO DIRECTO  POST /api/v1/pedidos/directo
 * ========================================================================= */
const crearPedidoDirecto = async (req, res) => {
  const connection = await pool.getConnection();
  console.log(
    "[crearPedidoDirecto] nueva solicitud",
    "user:", req.user?.sub,
    "hora:", new Date().toISOString()
  );
  try {
    const usuarioId = req.user.sub;
    const { productos, direccion_id, metodo_pago, entrega } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "Se requieren productos para crear pedido" });
    }

    // Validar cantidades e ids
    for (const item of productos) {
      if (!isPositiveInt(item?.producto_id) || !isPositiveInt(item?.cantidad)) {
        return res
          .status(400)
          .json({ error: "Producto y cantidad deben ser enteros positivos" });
      }
    }

    // Validar método/entrega
    if (!["CONTRAENTREGA", "PAGO_LINEA"].includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago inválido" });
    }
    if (metodo_pago === "PAGO_LINEA") {
      if (!["DOMICILIO", "TIENDA"].includes(entrega)) {
        return res
          .status(400)
          .json({ error: "Debe especificar entrega: 'DOMICILIO' o 'TIENDA'" });
      }
    }

    await connection.beginTransaction();

    // Dirección debe pertenecer al usuario (si viene)
    await validarDireccionDeUsuario(connection, direccion_id, usuarioId);

    let total = 0;

    // Validar productos, stock y preparar detalles
    for (const item of productos) {
      const [[producto]] = await connection.query(
        "SELECT id, nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE",
        [item.producto_id]
      );
      if (!producto)
        throw new Error(`Producto con id ${item.producto_id} no existe`);

      if (Number(producto.stock) < Number(item.cantidad)) {
        throw new Error(
          `Stock insuficiente para el producto ${producto.nombre}`
        );
      }

      const subtotal = Number(producto.precio) * Number(item.cantidad);
      total += subtotal;

      item.precio_unitario = Number(producto.precio);
      item.subtotal = subtotal;

      // Descontar stock
      await connection.query(
        "UPDATE productos SET stock = stock - ? WHERE id = ?",
        [item.cantidad, item.producto_id]
      );
    }

    // Costo envío (solo reglas de CLIENTE convencional)
    let costoEnvio = 0;
    if (metodo_pago === "CONTRAENTREGA") {
      costoEnvio = COSTO_ENVIO_FIJO;
    } else if (metodo_pago === "PAGO_LINEA") {
      costoEnvio = entrega === "DOMICILIO" ? COSTO_ENVIO_FIJO : 0;
    }

    const totalFinal = total + costoEnvio;

    // Crear pedido con estado explícito
    const [pedidoResult] = await connection.query(
      `INSERT INTO pedidos 
        (usuario_id, direccion_id, metodo_pago, entrega, costo_envio, total, estado) 
       VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        usuarioId,
        direccion_id || null,
        metodo_pago,
        entrega || null,
        costoEnvio,
        totalFinal,
      ]
    );

    const pedidoId = pedidoResult.insertId;

    // Insertar detalles
    for (const item of productos) {
      await connection.query(
        `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          pedidoId,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]
      );
    }

    await connection.commit();

    // Notificación en DB
    try {
      await pool.query(
        "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'PEDIDO')",
        [
          usuarioId,
          `Pedido creado #${pedidoId}`,
          `Tu pedido fue creado con éxito. Total: $${totalFinal}`,
        ]
      );
    } catch (nErr) {
      console.warn("Aviso: no se pudo registrar notificación:", nErr.message);
    }

    // Email (best-effort)
    try {
      if (req.user.email) {
        await sendMail({
          to: req.user.email,
          subject: `Confirmación de tu pedido #${pedidoId}`,
          text: `Tu pedido fue creado con éxito. Total: $${totalFinal}`,
          html: `<p>Hola,</p><p>Tu pedido <b>#${pedidoId}</b> fue creado con éxito.</p>
                 <p>Total: <b>$${totalFinal}</b></p>`,
        });
      }
    } catch (mailErr) {
      console.warn("Aviso: no se pudo enviar el correo:", mailErr.message);
    }

    res.status(201).json({
      message: "Pedido creado con éxito",
      pedido_id: pedidoId,
      total: totalFinal,
      costo_envio: costoEnvio,
      productos,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("Error en crearPedidoDirecto:", error);
    res
      .status(500)
      .json({ error: error.message || "Error al crear pedido directo" });
  } finally {
    connection.release();
  }
};

/* =========================================================================
 * CONTRATISTA: CREAR DESDE COTIZACIÓN  POST /api/v1/pedidos/desde-cotizacion
 * ========================================================================= */
const crearPedidoDesdeCotizacion = async (req, res) => {
  const connection = await pool.getConnection();
  console.log(
    "[crearPedidoDesdeCotizacion] nueva solicitud",
    "user:", req.user?.sub,
    "hora:", new Date().toISOString()
  );
  try {
    const usuarioId = req.user.sub;
    const { cotizacion_id, direccion_id, metodo_pago, entrega } = req.body;

    if (!isPositiveInt(cotizacion_id)) {
      return res.status(400).json({ error: "cotizacion_id inválido" });
    }
    if (!["CONTRAENTREGA", "PAGO_LINEA"].includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago inválido" });
    }
    if (metodo_pago === "PAGO_LINEA") {
      if (!["DOMICILIO", "TIENDA"].includes(entrega)) {
        return res
          .status(400)
          .json({ error: "Debe especificar entrega: 'DOMICILIO' o 'TIENDA'" });
      }
    }

    await connection.beginTransaction();

    // Dirección debe pertenecer al usuario (si viene)
    await validarDireccionDeUsuario(connection, direccion_id, usuarioId);

    // 🔒 Solo cotizaciones ACEPTADAS + VIGENTES pueden generar pedido
    const [cotRows] = await connection.query(
      `SELECT * FROM cotizaciones 
       WHERE id = ? AND usuario_id = ? 
       AND estado_gestion = 'ACEPTADA' 
       AND estado_vigencia = 'VIGENTE' FOR UPDATE`,
      [cotizacion_id, usuarioId]
    );
    if (cotRows.length === 0) {
      return res
        .status(400)
        .json({ error: "Cotización no válida para pedido" });
    }

    const cotizacion = cotRows[0];

    const [detalleRows] = await connection.query(
      `SELECT * FROM cotizacion_detalles WHERE cotizacion_id = ?`,
      [cotizacion_id]
    );

    // Validar stock y descontar
    for (const d of detalleRows) {
      const [[prd]] = await connection.query(
        "SELECT stock FROM productos WHERE id = ? FOR UPDATE",
        [d.producto_id]
      );
      if (!prd)
        throw new Error(`Producto con id ${d.producto_id} no existe`);
      if (Number(prd.stock) < Number(d.cantidad)) {
        throw new Error(`Stock insuficiente para producto ${d.producto_id}`);
      }
      await connection.query(
        "UPDATE productos SET stock = stock - ? WHERE id = ?",
        [d.cantidad, d.producto_id]
      );
    }

    // Costo de envío
    let costoEnvio = 0;
    if (metodo_pago === "CONTRAENTREGA") costoEnvio = COSTO_ENVIO_FIJO;
    else if (metodo_pago === "PAGO_LINEA") {
      costoEnvio = entrega === "DOMICILIO" ? COSTO_ENVIO_FIJO : 0;
    }

    const totalFinal = Number(cotizacion.total) + costoEnvio;

    const [pedidoResult] = await connection.query(
      `INSERT INTO pedidos 
        (cotizacion_id, usuario_id, direccion_id, metodo_pago, entrega, costo_envio, total, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        cotizacion_id,
        usuarioId,
        direccion_id || null,
        metodo_pago,
        entrega || null,
        costoEnvio,
        totalFinal,
      ]
    );

    const pedidoId = pedidoResult.insertId;

    for (const d of detalleRows) {
      await connection.query(
        `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal]
      );
    }

    // 🔁 Marcar la cotización como CONVERTIDA (ya generó pedido)
    await connection.query(
      "UPDATE cotizaciones SET estado_gestion = 'CONVERTIDA' WHERE id = ?",
      [cotizacion_id]
    );

    await connection.commit();

    // 🔍 Auditoría: cotización → pedido
    await logAuditoria({
      usuario_id: usuarioId,
      accion: "COTIZACION_CONVERTIDA_PEDIDO",
      entidad: "cotizacion",
      entidad_id: Number(cotizacion_id),
      cambios: {
        estado_gestion_anterior: "ACEPTADA",
        estado_gestion_nuevo: "CONVERTIDA",
        pedido_id: pedidoId,
      },
    });

    // Notificación (best-effort)
    try {
      await pool.query(
        "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'PEDIDO')",
        [
          usuarioId,
          `Pedido creado desde cotización #${pedidoId}`,
          `Tu pedido fue generado desde una cotización aceptada.`,
        ]
      );
    } catch (nErr) {
      console.warn("Aviso: no se pudo registrar notificación:", nErr.message);
    }

    // Email (best-effort)
    try {
      if (req.user.email) {
        await sendMail({
          to: req.user.email,
          subject: `Confirmación de tu pedido #${pedidoId}`,
          text: `Tu pedido desde cotización fue creado con éxito. Total: $${totalFinal}`,
          html: `<p>Hola,</p><p>Tu pedido <b>#${pedidoId}</b> fue creado desde cotización con éxito.</p>
                 <p>Total: <b>$${totalFinal}</b></p>`,
        });
      }
    } catch (mailErr) {
      console.warn("Aviso: no se pudo enviar el correo:", mailErr.message);
    }

    res.status(201).json({
      message: "Pedido creado con éxito desde cotización",
      pedido_id: pedidoId,
      total: totalFinal,
      costo_envio: costoEnvio,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("Error en crearPedidoDesdeCotizacion:", error);
    res.status(500).json({
      error: error.message || "Error al crear pedido desde cotización",
    });
  } finally {
    connection.release();
  }
};

/* =========================================================================
 * ADMIN / CLIENTE / CONTRATISTA: ACTUALIZAR ESTADO  PUT /api/v1/pedidos/:id/estado
 * ========================================================================= */
const actualizarEstado = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const pedidoId = req.params.id;
    const { estado } = req.body;
    const usuarioId = req.user.sub;
    const rol = req.user.role;

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    await connection.beginTransaction();

    const [[pedido]] = await connection.query(
      "SELECT usuario_id, estado FROM pedidos WHERE id = ? FOR UPDATE",
      [pedidoId]
    );
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const estadoActual = pedido.estado;

    // Pedidos CANCELADO o ENTREGADO no se pueden modificar
    if (["CANCELADO", "ENTREGADO"].includes(estadoActual)) {
      return res.status(400).json({
        error: `No se puede cambiar un pedido en estado ${estadoActual}`,
      });
    }

    let permitido = false;
    let devolverStock = false;
    let setFechaEnvio = false;
    let setFechaEntrega = false;

    switch (estadoActual) {
      case "PENDIENTE":
        // ADMIN confirma
        if (estado === "CONFIRMADO" && rol === "ADMIN") {
          permitido = true;
        }
        // Cliente/Contratista (dueño) o ADMIN cancelan
        if (
          estado === "CANCELADO" &&
          (rol === "ADMIN" || pedido.usuario_id === usuarioId)
        ) {
          permitido = true;
          devolverStock = true;
        }
        break;

      case "CONFIRMADO":
        // ADMIN pasa a ENVIADO
        if (estado === "ENVIADO" && rol === "ADMIN") {
          permitido = true;
          setFechaEnvio = true; // requiere columna fecha_envio
        }
        // Cancelación desde CONFIRMADO
        if (
          estado === "CANCELADO" &&
          (rol === "ADMIN" || pedido.usuario_id === usuarioId)
        ) {
          permitido = true;
          devolverStock = true;
        }
        break;

      case "ENVIADO":
        // Solo ADMIN marca como ENTREGADO
        if (estado === "ENTREGADO" && rol === "ADMIN") {
          permitido = true;
          setFechaEntrega = true; // requiere columna fecha_entrega
        }
        break;

      default:
        break;
    }

    if (!permitido) {
      return res.status(403).json({
        error: `Transición no permitida de ${estadoActual} → ${estado}`,
      });
    }

    // Devolver stock si se cancela
    if (devolverStock) {
      const [detalles] = await connection.query(
        "SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id = ?",
        [pedidoId]
      );
      for (const d of detalles) {
        await connection.query(
          "UPDATE productos SET stock = stock + ? WHERE id = ?",
          [d.cantidad, d.producto_id]
        );
      }
    }

    // Actualizar estado (y fechas especiales)
    let updateSql = "UPDATE pedidos SET estado = ?";
    const params = [estado];

    if (setFechaEnvio) {
      updateSql += ", fecha_envio = NOW()";
    }
    if (setFechaEntrega) {
      updateSql += ", fecha_entrega = NOW()";
    }
    updateSql += " WHERE id = ?";
    params.push(pedidoId);

    await connection.query(updateSql, params);
    await connection.commit();

    // 🔍 Auditoría de cambio de estado
    await logAuditoria({
      usuario_id: usuarioId,
      accion: "PEDIDO_ESTADO",
      entidad: "pedido",
      entidad_id: Number(pedidoId),
      cambios: { estado_anterior: estadoActual, estado_nuevo: estado },
    });

    // Notificación (best-effort)
    try {
      await pool.query(
        "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'PEDIDO')",
        [
          pedido.usuario_id,
          `Pedido #${pedidoId} actualizado`,
          `El estado de tu pedido ahora es: ${estado}`,
        ]
      );
    } catch (nErr) {
      console.warn("Aviso: no se pudo registrar notificación:", nErr.message);
    }

    // Email (best-effort)
    try {
      let destinatario = req.user.email;
      if (rol === "ADMIN") {
        const [[u]] = await pool.query(
          "SELECT email FROM usuarios WHERE id = ?",
          [pedido.usuario_id]
        );
        if (u?.email) destinatario = u.email;
      }
      if (destinatario) {
        await sendMail({
          to: destinatario,
          subject: `Tu pedido #${pedidoId} cambió de estado`,
          text: `Tu pedido ahora está en estado: ${estado}`,
          html: `<p>Hola,</p><p>Tu pedido <b>#${pedidoId}</b> ahora está en estado: <b>${estado}</b>.</p>`,
        });
      }
    } catch (mailErr) {
      console.warn("Aviso: no se pudo enviar el correo:", mailErr.message);
    }

    res.json({ message: `Estado del pedido actualizado a ${estado}` });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("Error en actualizarEstado:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  } finally {
    connection.release();
  }
};

// GET /api/v1/pedidos/mios
const listarMisPedidos = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const [rows] = await pool.query(
      `SELECT id, total, costo_envio, metodo_pago, estado, fecha_creacion
       FROM pedidos
       WHERE usuario_id = ?
       ORDER BY fecha_creacion DESC`,
      [usuarioId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar mis pedidos" });
  }
};

/* =========================================================================
 * CLIENTE/CONTRATISTA: DETALLE DE MI PEDIDO  GET /api/v1/pedidos/:id/mio
 * ========================================================================= */
const detallePedidoPropio = async (req, res) => {
  try {
    const usuarioId = req.user.sub;
    const { id } = req.params;

    // Cabecera con verificación de pertenencia
    const [cab] = await pool.query(
      `
      SELECT p.id, p.usuario_id, p.metodo_pago, p.entrega, p.costo_envio, p.total,
             p.estado, p.fecha_creacion
      FROM pedidos p
      WHERE p.id = ? AND p.usuario_id = ?
      `,
      [id, usuarioId]
    );

    if (cab.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const [det] = await pool.query(
      `
      SELECT 
        d.producto_id, d.cantidad, d.precio_unitario, d.subtotal,
        pr.nombre,
        (
          SELECT url
          FROM imagenes_producto ip
          WHERE ip.producto_id = pr.id
          ORDER BY ip.es_principal DESC, ip.id ASC
          LIMIT 1
        ) AS imagen_url
      FROM pedido_detalles d
      JOIN productos pr ON pr.id = d.producto_id
      WHERE d.pedido_id = ?
      `,
      [id]
    );

    res.json({ ...cab[0], detalles: det });
  } catch (error) {
    console.error("Error detallePedidoPropio:", error);
    res.status(500).json({ error: "Error al obtener detalle del pedido" });
  }
};

module.exports = {
  // ADMIN
  listarPedidos, detallePedido,
  // FLUJOS
  crearPedidoDirecto, crearPedidoDesdeCotizacion, actualizarEstado,
  // CLIENTE
  listarMisPedidos, detallePedidoPropio};