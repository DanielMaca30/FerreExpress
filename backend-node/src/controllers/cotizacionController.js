const pool = require("../db");
const { syncVigencia } = require("../utils/cotizaciones");
const PDFDocument = require("pdfkit");
const { logAuditoria } = require("../utils/auditoria");

//Config IVA 
const IVA_RATE = 0.19;
// centralizar datos de la empresa para el PDF
const COMPANY_INFO = {
  nombre: "FerreExpress S.A.S.",
  nit: "NIT 805.030.111-8", 
  direccion: "Calle 16 #76-28, Prados del Limonar", 
  telefono: "+57 (302) 804 3116", 
  email: "expressraquel@gmail.com", 
};

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;



// Crear cotización (solo CONTRATISTA/EMPRESA)
const crearCotizacion = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const usuarioId = req.user.sub;
    const { productos } = req.body;

    if (!productos || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "Se requieren productos para la cotización" });
    }

    await connection.beginTransaction();

    // Totales acumulados
    let baseIvaTotal = 0;   // base gravable (sin IVA)
    let ivaTotal = 0;       // valor del IVA
    let totalBruto = 0;     // base + IVA (antes de descuentos)

    // Calcular subtotales y total
    for (const item of productos) {
      const [rows] = await connection.query(
        "SELECT * FROM productos WHERE id = ?",
        [item.producto_id]
      );
      if (rows.length === 0)
        throw new Error(`Producto con id ${item.producto_id} no existe`);

      const producto = rows[0];
      const cantidad = Number(item.cantidad);

      if (!cantidad || cantidad <= 0) {
        throw new Error(
          `Cantidad inválida para producto ${item.producto_id}: ${item.cantidad}`
        );
      }

      // Precio de la tabla productos (ya incluye IVA)
      const precioConIva = Number(producto.precio);

      // Usamos tus columnas auxiliares; si vienen nulas, las calculamos
      const baseUnit =
        producto.precio_sin_iva != null
          ? Number(producto.precio_sin_iva)
          : round2(precioConIva / (1 + IVA_RATE));

      const ivaUnit =
        producto.iva != null
          ? Number(producto.iva)
          : round2(precioConIva - baseUnit);

      const subtotal = round2(precioConIva * cantidad); // total con IVA por línea
      const baseLinea = round2(baseUnit * cantidad);
      const ivaLinea = round2(ivaUnit * cantidad);

      totalBruto = round2(totalBruto + subtotal);
      baseIvaTotal = round2(baseIvaTotal + baseLinea);
      ivaTotal = round2(ivaTotal + ivaLinea);

      // Enriquecemos el item que devolveremos al front
      item.precio_unitario = precioConIva;
      item.subtotal = subtotal;
      item.base_iva = baseLinea;
      item.iva = ivaLinea;
    }

    // === Reglas de descuento ===
    const [reglas] = await connection.query(
      `SELECT * FROM reglas_descuento 
       WHERE activo=1 AND vigente=1 
       ORDER BY version DESC, updated_at DESC`
    );

    const reglaMP = reglas.find((r) => r.tipo === "MISMO_PRODUCTO");
    const reglaVP = reglas.find((r) => r.tipo === "VARIOS_PRODUCTOS");

    const umbralMismoProd = Number(reglaMP?.umbral_cantidad ?? 12);
    const umbralVariosProd = Number(reglaVP?.umbral_items ?? 3);

    const hayMismoProducto = productos.some(
      (p) => Number(p.cantidad) >= umbralMismoProd
    );
    const hayVariosProductos = productos.length >= umbralVariosProd;

    let descuentoRate = 0; // 0–1
    if (hayMismoProducto && reglaMP) {
      descuentoRate = Number(reglaMP.porcentaje) / 100;
    } else if (hayVariosProductos && reglaVP) {
      descuentoRate = Number(reglaVP.porcentaje) / 100;
    }

    // === Aplicamos descuento sobre la BASE sin IVA y recalculamos IVA 19% ===
    let baseNeta = baseIvaTotal;
    let ivaNeta;
    let totalFinal;
    let descuento = 0;

    if (descuentoRate > 0) {
      const baseConDescuento = round2(baseIvaTotal * (1 - descuentoRate));
      const ivaConDescuento = round2(baseConDescuento * IVA_RATE);

      const totalAntesDescuento = round2(baseIvaTotal + ivaTotal);
      const totalConDescuento = round2(baseConDescuento + ivaConDescuento);

      baseNeta = baseConDescuento;
      ivaNeta = ivaConDescuento;
      totalFinal = totalConDescuento;
      descuento = round2(totalAntesDescuento - totalConDescuento);
    } else {
      baseNeta = round2(baseIvaTotal);
      ivaNeta = round2(ivaTotal);
      totalFinal = round2(baseNeta + ivaNeta);
      descuento = 0;
    }

    // Vigencia 7 días
    const fechaVigencia = new Date();
    fechaVigencia.setDate(fechaVigencia.getDate() + 7);

    // Insert en cabecera de cotización, guardando base_iva e iva
    const [cotizacionResult] = await connection.query(
      `INSERT INTO cotizaciones 
        (usuario_id, total, descuento, estado_gestion, estado_vigencia, fecha_vigencia, base_iva, iva) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        totalFinal,
        descuento,
        "PENDIENTE",
        "VIGENTE",
        fechaVigencia,
        baseNeta,
        ivaNeta,
      ]
    );

    const cotizacionId = cotizacionResult.insertId;

    // Detalle
    for (const item of productos) {
      await connection.query(
        `INSERT INTO cotizacion_detalles 
          (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          cotizacionId,
          item.producto_id,
          Number(item.cantidad),
          Number(item.precio_unitario),
          Number(item.subtotal),
        ]
      );
    }

    await connection.commit();

    // Notificación
    await pool.query(
      "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'GENERAL')",
      [
        usuarioId,
        `Cotización creada #${cotizacionId}`,
        `Tu cotización fue registrada con éxito. Total con IVA: $${totalFinal}`,
      ]
    );

    res.status(201).json({
      message: "Cotización creada con éxito",
      cotizacion_id: cotizacionId,
      total: totalFinal,
      descuento,
      base_iva: baseNeta,
      iva: ivaNeta,
      estado_gestion: "PENDIENTE",
      estado_vigencia: "VIGENTE",
      fecha_vigencia: fechaVigencia,
      productos,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {}
    console.error("Error al crear cotización:", error);
    res.status(500).json({ error: "Error al crear cotización" });
  } finally {
    connection.release();
  }
};

// Listar cotizaciones
const listarCotizaciones = async (req, res) => {
  try {
    const { estado_gestion, estado_vigencia, fecha_desde, fecha_hasta } =
      req.query;

    // Sincroniza vigencia en BD
    await pool.query(
      "UPDATE cotizaciones SET estado_vigencia = 'VENCIDA' WHERE fecha_vigencia < NOW() AND estado_vigencia = 'VIGENTE'"
    );

    let query = `
      SELECT c.id, u.username, u.email, 
             c.total, c.descuento, c.base_iva, c.iva,
             c.estado_gestion, c.estado_vigencia, 
             c.fecha_creacion, c.fecha_vigencia
      FROM cotizaciones c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== "ADMIN") {
      query += " AND c.usuario_id = ?";
      params.push(req.user.sub);
    }

    if (estado_gestion) {
      query += " AND c.estado_gestion = ?";
      params.push(estado_gestion);
    }

    if (estado_vigencia) {
      query += " AND c.estado_vigencia = ?";
      params.push(estado_vigencia);
    }

    if (fecha_desde) {
      query += " AND c.fecha_vigencia >= ?";
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += " AND c.fecha_vigencia <= ?";
      params.push(fecha_hasta);
    }

    query += " ORDER BY c.fecha_creacion DESC";

    const [rows] = await pool.query(query, params);

    const resultados = [];
    for (const row of rows) {
      resultados.push(await syncVigencia(row));
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al listar cotizaciones:", error);
    res.status(500).json({ error: "Error al listar cotizaciones" });
  }
};

// Detalle de una cotización
const detalleCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    let queryCabecera;
    const paramsCabecera = [id];

    if (req.user.role === "ADMIN") {
      queryCabecera = `
        SELECT c.id, u.username, u.email, 
               c.total, c.descuento, c.base_iva, c.iva,
               c.estado_gestion, c.estado_vigencia, 
               c.fecha_creacion, c.fecha_vigencia
        FROM cotizaciones c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.id = ?`;
    } else {
      queryCabecera = `
        SELECT c.id, u.username, u.email, 
               c.total, c.descuento, c.base_iva, c.iva,
               c.estado_gestion, c.estado_vigencia, 
               c.fecha_creacion, c.fecha_vigencia
        FROM cotizaciones c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.id = ? AND c.usuario_id = ?`;
      paramsCabecera.push(req.user.sub);
    }

    const [cabeceraRows] = await pool.query(queryCabecera, paramsCabecera);

    if (cabeceraRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Cotización no encontrada o sin permiso" });
    }

    const cotizacion = cabeceraRows[0];

    // Incluimos info de base e IVA por línea usando las columnas del producto
    const [detalleRaw] = await pool.query(
      `SELECT 
          d.id,
          p.nombre,
          d.cantidad,
          d.precio_unitario,
          d.subtotal,
          p.precio_sin_iva,
          p.iva AS iva_unitario
       FROM cotizacion_detalles d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.cotizacion_id = ?`,
      [id]
    );

    const detalle = detalleRaw.map((row) => {
      const cantidad = Number(row.cantidad);
      const baseUnit =
        row.precio_sin_iva != null
          ? Number(row.precio_sin_iva)
          : round2(Number(row.precio_unitario) / (1 + IVA_RATE));
      const ivaUnit =
        row.iva_unitario != null
          ? Number(row.iva_unitario)
          : round2(Number(row.precio_unitario) - baseUnit);

      return {
        id: row.id,
        nombre: row.nombre,
        cantidad,
        precio_unitario: Number(row.precio_unitario),
        subtotal: Number(row.subtotal),
        base_iva: round2(baseUnit * cantidad),
        iva: round2(ivaUnit * cantidad),
      };
    });

    cotizacion.productos = detalle;
    res.json(await syncVigencia(cotizacion));
  } catch (error) {
    console.error("Error al obtener detalle de cotización:", error);
    res.status(500).json({ error: "Error al obtener detalle de cotización" });
  }
};

// Cambiar estado (solo Admin)
const cambiarEstadoCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    const estadosValidos = ["ACEPTADA", "RECHAZADA"];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res
        .status(400)
        .json({ error: "Estado inválido. Solo ACEPTADA o RECHAZADA" });
    }

    const [rows] = await pool.query("SELECT * FROM cotizaciones WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    await pool.query(
      "UPDATE cotizaciones SET estado_gestion = ? WHERE id = ?",
      [nuevoEstado, id]
    );

    // Notificación al usuario dueño
    await pool.query(
      "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES (?, ?, ?, 'GENERAL')",
      [
        rows[0].usuario_id,
        `Cotización #${id} actualizada`,
        `Tu cotización fue marcada como ${nuevoEstado}`,
      ]
    );

    // Auditoría
    await logAuditoria({
      usuario_id: req.user.sub,
      accion: "COTIZACION_ESTADO",
      entidad: "cotizacion",
      entidad_id: Number(id),
      cambios: { estado_gestion: nuevoEstado },
    });

    res.json({ message: `Cotización ${id} actualizada a ${nuevoEstado}` });
  } catch (error) {
    console.error("Error al cambiar estado de cotización:", error);
    res.status(500).json({ error: "Error al cambiar estado de la cotización" });
  }
};

// Exportar PDF con diseño formal de cotización
const exportarCotizacionPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const [cotizacionRows] = await pool.query(
      `SELECT c.*, u.username, u.email 
       FROM cotizaciones c 
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (cotizacionRows.length === 0) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const cotizacion = cotizacionRows[0];

    const [productos] = await pool.query(
      `SELECT d.*, p.nombre, p.precio_sin_iva, p.iva AS iva_unitario 
       FROM cotizacion_detalles d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.cotizacion_id = ?`,
      [id]
    );

    const formatCurrency = (num) =>
      Number(num).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 2,
      });

    // === Configuración base del PDF ===
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=cotizacion_${id}.pdf`
    );
    doc.pipe(res);

    // Paleta simple (formal, empresarial)
    const primaryColor = "#111827"; // gris-azul oscuro
    const accentColor = "#F9BF20";  // amarillo FerreExpress
    const lightGray = "#F3F4F6";
    const borderGray = "#D1D5DB";
    const textGray = "#374151";

    const pageWidth = doc.page.width;
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // === ENCABEZADO: banda con logo + datos empresa + datos cotización ===
    const headerTop = 40;
    const headerHeight = 80;

    // Banda de fondo
    doc
      .save()
      .rect(marginLeft, headerTop, contentWidth, headerHeight)
      .fill(lightGray)
      .restore();

    // Logo (si existe)
    try {
      doc.image("public/img/LOGOFERREEXPRESS.jpg", marginLeft + 10, headerTop + 10, {
        width: 130,
      });
    } catch (err) {
      console.warn("⚠️ Logo no encontrado, se omite en PDF de cotización");
    }

    // Datos de la empresa
    const empresaX = marginLeft + 160;
    let empresaY = headerTop + 12;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(primaryColor)
      .text(COMPANY_INFO.nombre, empresaX, empresaY, {
        width: 220,
      });

    empresaY += 14;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(textGray)
      .text(COMPANY_INFO.nit, empresaX, empresaY, { width: 220 });
    empresaY += 11;
    doc.text(COMPANY_INFO.direccion, empresaX, empresaY, { width: 220 });
    empresaY += 11;
    doc.text(`Tel: ${COMPANY_INFO.telefono}`, empresaX, empresaY, { width: 220 });
    empresaY += 11;
    doc.text(COMPANY_INFO.email, empresaX, empresaY, { width: 220 });

    // Bloque "COTIZACIÓN" a la derecha
    const cotX = marginLeft + contentWidth - 180;
    let cotY = headerTop + 16;

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(primaryColor)
      .text(`COTIZACIÓN N° ${cotizacion.id}`, cotX, cotY, {
        width: 170,
        align: "right",
      });

    cotY += 20;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(textGray)
      .text(
        `Fecha de emisión: ${new Date(
          cotizacion.fecha_creacion
        ).toLocaleDateString("es-CO")}`,
        cotX,
        cotY,
        { width: 170, align: "right" }
      );
    cotY += 12;
    doc.text(
      `Vigente hasta: ${new Date(
        cotizacion.fecha_vigencia
      ).toLocaleDateString("es-CO")}`,
      cotX,
      cotY,
      { width: 170, align: "right" }
    );
    cotY += 12;
    doc.text(
      `Estado: ${cotizacion.estado_gestion} / ${cotizacion.estado_vigencia}`,
      cotX,
      cotY,
      { width: 170, align: "right" }
    );

    // Posicionar el cursor debajo del encabezado
    doc.moveDown();
    doc.y = headerTop + headerHeight + 20;

    // Línea divisoria
    doc
      .strokeColor(borderGray)
      .lineWidth(0.8)
      .moveTo(marginLeft, doc.y)
      .lineTo(marginLeft + contentWidth, doc.y)
      .stroke();

    doc.moveDown(1.3);

    // === DATOS DEL CLIENTE ===
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(primaryColor)
      .text("Datos del cliente", marginLeft, doc.y);

    doc
      .strokeColor(borderGray)
      .lineWidth(0.5)
      .moveTo(marginLeft, doc.y + 14)
      .lineTo(marginLeft + contentWidth, doc.y + 14)
      .stroke();

    doc.moveDown(1.3);

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(textGray)
      .text(`Nombre: ${cotizacion.username}`, marginLeft, doc.y);
    doc.text(`Correo electrónico: ${cotizacion.email}`);
    doc.moveDown(1);

    // === DETALLE DE PRODUCTOS (tabla) ===
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(primaryColor)
      .text("Detalle de la cotización", marginLeft, doc.y);

    doc
      .strokeColor(borderGray)
      .lineWidth(0.5)
      .moveTo(marginLeft, doc.y + 14)
      .lineTo(marginLeft + contentWidth, doc.y + 14)
      .stroke();

    doc.moveDown(1);

    const tableTop = doc.y;
    const rowHeight = 18;

    // Encabezados de la tabla
    doc.fontSize(9).font("Helvetica-Bold").fillColor(primaryColor);

    const colProducto = marginLeft;
    const colCant = marginLeft + 250;
    const colPrecioUnit = marginLeft + 310;
    const colSubtotal = marginLeft + 420;

    // Banda suave detrás de cabecera
    doc
      .save()
      .rect(marginLeft, tableTop - 4, contentWidth, rowHeight + 4)
      .fill(lightGray)
      .restore();

    doc.text("Producto", colProducto + 2, tableTop, { width: 230 });
    doc.text("Cant.", colCant, tableTop, { width: 40, align: "right" });
    doc.text("P. Unit. (c/IVA)", colPrecioUnit, tableTop, {
      width: 90,
      align: "right",
    });
    doc.text("Subtotal", colSubtotal, tableTop, {
      width: 90,
      align: "right",
    });

    doc.font("Helvetica").fillColor(textGray);

    let y = tableTop + rowHeight;

    productos.forEach((p, idx) => {
      // Salto de página si se acerca al final
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = doc.page.margins.top;

        // Redibujar cabecera de tabla en la nueva página
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(primaryColor);

        doc
          .save()
          .rect(marginLeft, y - 4, contentWidth, rowHeight + 4)
          .fill(lightGray)
          .restore();

        doc.text("Producto", colProducto + 2, y, { width: 230 });
        doc.text("Cant.", colCant, y, { width: 40, align: "right" });
        doc.text("P. Unit. (c/IVA)", colPrecioUnit, y, {
          width: 90,
          align: "right",
        });
        doc.text("Subtotal", colSubtotal, y, {
          width: 90,
          align: "right",
        });

        doc.font("Helvetica").fillColor(textGray);
        y += rowHeight;
      }

      // Fondo zebra para filas pares
      if (idx % 2 === 0) {
        doc
          .save()
          .rect(marginLeft, y - 3, contentWidth, rowHeight)
          .fill("#FAFAFA")
          .restore();
      }

      doc.text(p.nombre, colProducto + 2, y, { width: 230 });
      doc.text(String(p.cantidad), colCant, y, {
        width: 40,
        align: "right",
      });
      doc.text(formatCurrency(p.precio_unitario), colPrecioUnit, y, {
        width: 90,
        align: "right",
      });
      doc.text(formatCurrency(p.subtotal), colSubtotal, y, {
        width: 90,
        align: "right",
      });

      y += rowHeight;
    });

    // === RESUMEN ECONÓMICO (base / IVA / descuento / total) ===
    doc.moveDown(2);

    const resumenTop = doc.y;
    const resumenWidth = 220;
    const resumenX = marginLeft + contentWidth - resumenWidth;

    // Caja de fondo (usamos rect en vez de roundRect por compatibilidad)
    doc
      .save()
      .rect(resumenX, resumenTop - 6, resumenWidth, 90)
      .fill("#F9FAFB")
      .restore();

    doc
      .strokeColor(borderGray)
      .lineWidth(0.7)
      .rect(resumenX, resumenTop - 6, resumenWidth, 90)
      .stroke();

    let ry = resumenTop;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(primaryColor)
      .text("Resumen económico", resumenX + 10, ry);
    ry += 16;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(textGray)
      .text(
        `Base gravable (sin IVA):`,
        resumenX + 10,
        ry,
        { width: 120 }
      )
      .text(formatCurrency(cotizacion.base_iva), resumenX + 130, ry, {
        align: "right",
        width: 80,
      });
    ry += 13;

    doc
      .text(
        `IVA (${Math.round(IVA_RATE * 100)}%):`,
        resumenX + 10,
        ry,
        { width: 120 }
      )
      .text(formatCurrency(cotizacion.iva), resumenX + 130, ry, {
        align: "right",
        width: 80,
      });
    ry += 13;

    doc
      .text(`Descuento:`, resumenX + 10, ry, { width: 120 })
      .text(`- ${formatCurrency(cotizacion.descuento || 0)}`, resumenX + 130, ry, {
        align: "right",
        width: 80,
      });
    ry += 16;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(primaryColor)
      .text(
        `Total cotización:`,
        resumenX + 10,
        ry,
        { width: 120 }
      )
      .fillColor(accentColor)
      .text(formatCurrency(cotizacion.total), resumenX + 130, ry, {
        align: "right",
        width: 80,
      });

    // === Nota legal / condiciones breves ===
    doc.moveDown(3);
    const notaTop = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(primaryColor)
      .text("Notas y condiciones:", marginLeft, notaTop);

    doc.moveDown(0.6);
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(textGray)
      .text(
        "- Esta cotización es informativa y no constituye factura de venta.\n" +
          "- Los valores están expresados en pesos colombianos (COP) e incluyen IVA.\n" +
          "- La vigencia de la cotización está sujeta a disponibilidad de inventario y puede variar si cambian las condiciones del mercado.\n" +
          "- Para confirmar su pedido, por favor comuníquese con nosotros indicando el número de esta cotización.",
        marginLeft,
        doc.y,
        { width: contentWidth }
      );

    doc.moveDown(2);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(primaryColor)
      .text("Agradecemos su interés en FerreExpress S.A.S.", marginLeft, doc.y);

    doc.end();
  } catch (error) {
    console.error("Error al exportar PDF:", error);
    res.status(500).json({ error: "Error al exportar PDF" });
  }
};



module.exports = {
  crearCotizacion,
  listarCotizaciones,
  detalleCotizacion,
  cambiarEstadoCotizacion,
  exportarCotizacionPDF,
};
