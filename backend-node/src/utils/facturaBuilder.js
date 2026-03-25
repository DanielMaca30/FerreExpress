// src/utils/facturaBuilder.js 

const PDFDocument = require("pdfkit");
const pool = require("../db");

// Mismos valores que cotizacionController.js
const IVA_RATE = 0.19;

const COMPANY_INFO = {
  nombre: "FerreExpress S.A.S.",
  nit: "NIT 805.030.111-8",
  direccion: "Calle 16 #76-28, Prados del Limonar",
  telefono: "+57 (302) 804 3116",
  email: "expressraquel@gmail.com",
};

const round2 = (v) =>
  Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const formatCurrency = (num) =>
  Number(num).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  });

/**
 * Consulta la BD y genera el PDF del recibo de pago.
 * @param {number} pedidoId
 * @returns {Promise<Buffer>} — buffer del PDF
 */
async function buildFacturaPdf(pedidoId) {
  // ── 1. Consultar cabecera del pedido ─────────────────────
  const [[pedido]] = await pool.query(
    `SELECT p.id, p.total, p.costo_envio, p.metodo_pago,
            p.entrega, p.estado, p.fecha_creacion,
            p.cotizacion_id,
            u.username, u.email
     FROM pedidos p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = ?`,
    [pedidoId]
  );

  if (!pedido) throw new Error(`Pedido #${pedidoId} no encontrado`);

  // ── 2. Consultar líneas del pedido con desglose IVA ──────
  const [lineas] = await pool.query(
    `SELECT d.cantidad,
            d.precio_unitario,
            d.subtotal,
            pr.nombre,
            pr.precio_sin_iva,
            pr.iva AS iva_unitario
     FROM pedido_detalles d
     JOIN productos pr ON pr.id = d.producto_id
     WHERE d.pedido_id = ?`,
    [pedidoId]
  );

  // ── 3. Calcular totales ──────────────────────────────────
  let baseGravable = 0;
  let totalIva = 0;

  for (const l of lineas) {
    const cant = Number(l.cantidad);
    const baseUnit =
      l.precio_sin_iva != null
        ? Number(l.precio_sin_iva)
        : round2(Number(l.precio_unitario) / (1 + IVA_RATE));
    const ivaUnit =
      l.iva_unitario != null
        ? Number(l.iva_unitario)
        : round2(Number(l.precio_unitario) - baseUnit);

    baseGravable = round2(baseGravable + baseUnit * cant);
    totalIva = round2(totalIva + ivaUnit * cant);

    // Enriquecer línea para la tabla
    l.base_linea = round2(baseUnit * cant);
    l.iva_linea = round2(ivaUnit * cant);
    l.precio_sin_iva_unit = baseUnit;
  }

  const costoEnvio = Number(pedido.costo_envio) || 0;
  const subtotalProductos = round2(baseGravable + totalIva);

  // Etiquetas legibles
  const metodoPagoLabel =
    pedido.metodo_pago === "PAGO_LINEA"
      ? "Pago en línea (simulado)"
      : "Contraentrega";
  const entregaLabel =
    pedido.entrega === "DOMICILIO"
      ? "Domicilio"
      : pedido.entrega === "TIENDA"
      ? "Retiro en tienda"
      : "—";

  // ── 4. Construir PDF ─────────────────────────────────────
  // PDFKit no soporta Promises nativamente: usamos un Buffer
  // acumulando chunks en un array y resolviendo en 'end'.
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Paleta idéntica a exportarCotizacionPDF
    const primaryColor = "#111827";
    const accentColor  = "#F9BF20";
    const lightGray    = "#F3F4F6";
    const borderGray   = "#D1D5DB";
    const textGray     = "#374151";

    const pageWidth    = doc.page.width;
    const marginLeft   = doc.page.margins.left;
    const contentWidth = pageWidth - marginLeft - doc.page.margins.right;

    // ── ENCABEZADO ───────────────────────────────────────────
    const headerTop    = 40;
    const headerHeight = 80;

    doc.save()
       .rect(marginLeft, headerTop, contentWidth, headerHeight)
       .fill(lightGray)
       .restore();

    // Logo
    try {
      doc.image(
        "public/img/LOGOFERREEXPRESS.jpg",
        marginLeft + 10,
        headerTop + 10,
        { width: 130 }
      );
    } catch {
      console.warn("⚠️ Logo no encontrado, se omite en PDF de factura");
    }

    // Datos empresa
    const empresaX = marginLeft + 160;
    let empresaY = headerTop + 12;

    doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor)
       .text(COMPANY_INFO.nombre, empresaX, empresaY, { width: 220 });
    empresaY += 14;
    doc.font("Helvetica").fontSize(9).fillColor(textGray)
       .text(COMPANY_INFO.nit,       empresaX, empresaY, { width: 220 }); empresaY += 11;
    doc.text(COMPANY_INFO.direccion, empresaX, empresaY, { width: 220 }); empresaY += 11;
    doc.text(`Tel: ${COMPANY_INFO.telefono}`, empresaX, empresaY, { width: 220 }); empresaY += 11;
    doc.text(COMPANY_INFO.email,     empresaX, empresaY, { width: 220 });

    // Bloque "RECIBO DE PAGO" a la derecha
    const cotX = marginLeft + contentWidth - 180;
    let cotY = headerTop + 12;

    doc.font("Helvetica-Bold").fontSize(12).fillColor(primaryColor)
       .text(`RECIBO DE PAGO`, cotX, cotY, { width: 170, align: "right" });
    cotY += 16;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor)
       .text(`Pedido N° ${pedido.id}`, cotX, cotY, { width: 170, align: "right" });
    cotY += 16;

    // Si viene de cotización, referenciarlo
    if (pedido.cotizacion_id) {
      doc.font("Helvetica").fontSize(9).fillColor(textGray)
         .text(`Cotización origen: #${pedido.cotizacion_id}`, cotX, cotY, {
           width: 170, align: "right",
         });
      cotY += 12;
    }

    doc.font("Helvetica").fontSize(9).fillColor(textGray)
       .text(
         `Fecha de pago: ${new Date().toLocaleDateString("es-CO")}`,
         cotX, cotY, { width: 170, align: "right" }
       );
    cotY += 12;
    doc.text(`Método: ${metodoPagoLabel}`, cotX, cotY, {
      width: 170, align: "right",
    });
    cotY += 12;
    doc.text(`Entrega: ${entregaLabel}`, cotX, cotY, {
      width: 170, align: "right",
    });

    // Cursor bajo encabezado
    doc.y = headerTop + headerHeight + 20;

    // Divisor
    doc.strokeColor(borderGray).lineWidth(0.8)
       .moveTo(marginLeft, doc.y)
       .lineTo(marginLeft + contentWidth, doc.y)
       .stroke();
    doc.moveDown(1.3);

    // ── DATOS DEL CLIENTE ────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor)
       .text("Datos del cliente", marginLeft, doc.y);

    doc.strokeColor(borderGray).lineWidth(0.5)
       .moveTo(marginLeft, doc.y + 14)
       .lineTo(marginLeft + contentWidth, doc.y + 14)
       .stroke();
    doc.moveDown(1.3);

    doc.font("Helvetica").fontSize(9.5).fillColor(textGray)
       .text(`Nombre: ${pedido.username}`, marginLeft, doc.y);
    doc.text(`Correo electrónico: ${pedido.email}`);
    doc.moveDown(1);

    // ── TABLA DE PRODUCTOS ───────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor)
       .text("Detalle del pedido", marginLeft, doc.y);

    doc.strokeColor(borderGray).lineWidth(0.5)
       .moveTo(marginLeft, doc.y + 14)
       .lineTo(marginLeft + contentWidth, doc.y + 14)
       .stroke();
    doc.moveDown(1);

    const tableTop  = doc.y;
    const rowHeight = 18;

    // Columnas — ajustadas para 5 columnas (añadimos IVA unit.)
    const colProducto  = marginLeft;
    const colCant      = marginLeft + 200;
    const colSinIva    = marginLeft + 248;
    const colIvaUnit   = marginLeft + 338;
    const colSubtotal  = marginLeft + 420;

    // Banda cabecera
    doc.save()
       .rect(marginLeft, tableTop - 4, contentWidth, rowHeight + 4)
       .fill(lightGray)
       .restore();

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(primaryColor);
    doc.text("Producto",          colProducto + 2, tableTop, { width: 185 });
    doc.text("Cant.",             colCant,         tableTop, { width: 40,  align: "right" });
    doc.text("Precio s/IVA",      colSinIva,       tableTop, { width: 80,  align: "right" });
    doc.text("IVA (19%)",         colIvaUnit,      tableTop, { width: 70,  align: "right" });
    doc.text("Total línea",       colSubtotal,     tableTop, { width: 90,  align: "right" });

    doc.font("Helvetica").fontSize(8.5).fillColor(textGray);

    let y = tableTop + rowHeight;

    lineas.forEach((l, idx) => {
      // Salto de página
      if (y > doc.page.height - 140) {
        doc.addPage();
        y = doc.page.margins.top;

        // Redibujar cabecera
        doc.save()
           .rect(marginLeft, y - 4, contentWidth, rowHeight + 4)
           .fill(lightGray)
           .restore();

        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(primaryColor);
        doc.text("Producto",     colProducto + 2, y, { width: 185 });
        doc.text("Cant.",        colCant,         y, { width: 40,  align: "right" });
        doc.text("Precio s/IVA", colSinIva,       y, { width: 80,  align: "right" });
        doc.text("IVA (19%)",    colIvaUnit,      y, { width: 70,  align: "right" });
        doc.text("Total línea",  colSubtotal,     y, { width: 90,  align: "right" });

        doc.font("Helvetica").fontSize(8.5).fillColor(textGray);
        y += rowHeight;
      }

      // Zebra
      if (idx % 2 === 0) {
        doc.save()
           .rect(marginLeft, y - 3, contentWidth, rowHeight)
           .fill("#FAFAFA")
           .restore();
      }

      doc.text(l.nombre,                           colProducto + 2, y, { width: 185 });
      doc.text(String(l.cantidad),                 colCant,         y, { width: 40,  align: "right" });
      doc.text(formatCurrency(l.precio_sin_iva_unit), colSinIva,    y, { width: 80,  align: "right" });
      doc.text(formatCurrency(l.iva_unitario ?? 0),   colIvaUnit,   y, { width: 70,  align: "right" });
      doc.text(formatCurrency(l.subtotal),             colSubtotal, y, { width: 90,  align: "right" });

      y += rowHeight;
    });

    // ── RESUMEN ECONÓMICO ────────────────────────────────────
    doc.moveDown(2);

    const resumenTop   = doc.y;
    const resumenWidth = 220;
    const resumenX     = marginLeft + contentWidth - resumenWidth;

    // Altura dinámica: +1 fila si hay envío
    const resumenHeight = costoEnvio > 0 ? 108 : 94;

    doc.save()
       .rect(resumenX, resumenTop - 6, resumenWidth, resumenHeight)
       .fill("#F9FAFB")
       .restore();
    doc.strokeColor(borderGray).lineWidth(0.7)
       .rect(resumenX, resumenTop - 6, resumenWidth, resumenHeight)
       .stroke();

    let ry = resumenTop;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor)
       .text("Resumen económico", resumenX + 10, ry);
    ry += 16;

    doc.font("Helvetica").fontSize(9).fillColor(textGray)
       .text("Base gravable (sin IVA):", resumenX + 10, ry, { width: 120 })
       .text(formatCurrency(baseGravable), resumenX + 130, ry, { align: "right", width: 80 });
    ry += 13;

    doc.text(`IVA (${Math.round(IVA_RATE * 100)}%):`, resumenX + 10, ry, { width: 120 })
       .text(formatCurrency(totalIva), resumenX + 130, ry, { align: "right", width: 80 });
    ry += 13;

    doc.text("Subtotal productos:", resumenX + 10, ry, { width: 120 })
       .text(formatCurrency(subtotalProductos), resumenX + 130, ry, { align: "right", width: 80 });
    ry += 13;

    if (costoEnvio > 0) {
      doc.text("Costo de envío:", resumenX + 10, ry, { width: 120 })
         .text(formatCurrency(costoEnvio), resumenX + 130, ry, { align: "right", width: 80 });
      ry += 13;
    }

    // Total en amarillo — igual que cotizaciones
    ry += 3;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor)
       .text("Total pagado:", resumenX + 10, ry, { width: 120 })
       .fillColor(accentColor)
       .text(formatCurrency(pedido.total), resumenX + 130, ry, { align: "right", width: 80 });

    // ── NOTAS LEGALES ────────────────────────────────────────
    doc.moveDown(3);

    doc.font("Helvetica-Bold").fontSize(9).fillColor(primaryColor)
       .text("Notas y condiciones:", marginLeft, doc.y);
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(8.5).fillColor(textGray)
       .text(
         "- Este documento es un recibo de pago y no reemplaza la factura de venta oficial.\n" +
         "- Los valores están expresados en pesos colombianos (COP) e incluyen IVA.\n" +
         "- El pago fue procesado a través de pasarela simulada con fines de demostración.\n" +
         "- Para mayor información, comuníquese con nosotros indicando el número de pedido.",
         marginLeft, doc.y, { width: contentWidth }
       );

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(9).fillColor(primaryColor)
       .text("Agradecemos su compra en FerreExpress S.A.S.", marginLeft, doc.y);

    doc.end();
  });
}

module.exports = { buildFacturaPdf };