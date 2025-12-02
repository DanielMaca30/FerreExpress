const fs = require("fs");
const path = require("path");
const pool = require("../db");
const { logAuditoria } = require("../utils/auditoria");

// controllers/productos.js (solo esta función cambia)
const getProductos = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      nombre,
      search,
      precioMin,
      precioMax,
      categoria,
      sort = "created_at",
      order = "desc",
      incluirInactivos,
    } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const offset = (page - 1) * limit;

    const validSort = ["nombre", "precio", "created_at"];
    if (!validSort.includes(sort)) sort = "created_at";
    order = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const nombreFiltro = (search || nombre || "").trim();

    // ⭐ Nuevo: si viene ?incluirInactivos=1 NO filtramos por activo
    const includeInactive = incluirInactivos === "1";
    const soloActivos = !includeInactive;

    let query = `
      SELECT
        p.*,
        (
          SELECT url
          FROM imagenes_producto i
          WHERE i.producto_id = p.id
          ORDER BY i.es_principal DESC, i.id ASC
          LIMIT 1
        ) AS imagen_principal
      FROM productos p
      WHERE 1=1
    `;
    const params = [];

    if (soloActivos) {
      query += " AND p.activo = 1";
    }
    if (nombreFiltro) {
      query += " AND p.nombre LIKE ?";
      params.push(`%${nombreFiltro}%`);
    }
    if (precioMin) {
      query += " AND p.precio >= ?";
      params.push(precioMin);
    }
    if (precioMax) {
      query += " AND p.precio <= ?";
      params.push(precioMax);
    }
    if (categoria) {
      query += " AND p.categoria = ?";
      params.push(categoria);
    }

    query += ` ORDER BY p.${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Conteo total para paginación
    let countQuery = "SELECT COUNT(*) as total FROM productos WHERE 1=1";
    const countParams = [];
    if (soloActivos) {
      countQuery += " AND activo = 1";
    }
    if (nombreFiltro) {
      countQuery += " AND nombre LIKE ?";
      countParams.push(`%${nombreFiltro}%`);
    }
    if (precioMin) {
      countQuery += " AND precio >= ?";
      countParams.push(precioMin);
    }
    if (precioMax) {
      countQuery += " AND precio <= ?";
      countParams.push(precioMax);
    }
    if (categoria) {
      countQuery += " AND categoria = ?";
      countParams.push(categoria);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      page,
      limit,
      total: countResult[0].total,
      productos: rows.map((p) => ({
        ...p,
        precio: Number(p.precio),
        precio_sin_iva: Number(p.precio_sin_iva ?? 0),
        iva: Number(p.iva ?? 0),
        activo: p.activo === 1 || p.activo === true,
        imagen_principal: p.imagen_principal || null,
      })),
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

/* ============================================================
 * GET /productos/:id   (detalle + imágenes)
 *   - Público no ve inactivos
 *   - Admin sí puede verlos
 * ============================================================ */
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const esAdmin = req.user && req.user.role === "ADMIN";

    let sql = "SELECT * FROM productos WHERE id = ?";
    const params = [id];

    if (!esAdmin) {
      sql += " AND activo = 1";
    }

    const [rows] = await pool.query(sql, params);
    if (rows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const producto = rows[0];

    const [imagenes] = await pool.query(
      `
      SELECT id, url, alt_text, es_principal
      FROM imagenes_producto
      WHERE producto_id = ?
      ORDER BY es_principal DESC, id ASC
    `,
      [id]
    );

    res.json({
      ...producto,
      precio: Number(producto.precio),
      precio_sin_iva: Number(producto.precio_sin_iva ?? 0),
      iva: Number(producto.iva ?? 0),
      activo: producto.activo === 1 || producto.activo === true,
      imagenes,
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

/* ============================================================
 * POST /productos     (ADMIN)
 *   - NO escribe en precio_sin_iva ni iva (las calcula MySQL)
 * ============================================================ */
const createProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;

    if (!nombre || precio === undefined || stock === undefined) {
      return res
        .status(400)
        .json({ error: "Nombre, precio y stock son requeridos" });
    }

    const precioNum = Number(precio);
    const stockNum = Number(stock);

    if (!Number.isFinite(precioNum) || precioNum < 0) {
      return res
        .status(400)
        .json({ error: "Precio debe ser un número positivo" });
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return res
        .status(400)
        .json({ error: "Stock debe ser un entero positivo" });
    }

    const [result] = await pool.query(
      `INSERT INTO productos 
        (nombre, descripcion, precio, stock, categoria, activo) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre, descripcion || null, precioNum, stockNum, categoria || null]
    );

    await logAuditoria({
      usuario_id: req.user.sub,
      accion: "PRODUCTO_CREATE",
      entidad: "producto",
      entidad_id: Number(result.insertId),
      cambios: { nombre, descripcion, precio: precioNum, stock: stockNum, categoria },
    });

    res.status(201).json({ message: "Producto creado", id: result.insertId });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

/* ============================================================
 * PUT /productos/:id  (ADMIN)
 *   - NO toca precio_sin_iva ni iva
 *   - Solo actualiza precio, stock, etc. y MySQL recalcula
 * ============================================================ */
const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, activo } = req.body;

    // Traer datos actuales para merge
    const [[actual]] = await pool.query(
      "SELECT * FROM productos WHERE id = ?",
      [id]
    );
    if (!actual) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const nuevoNombre = nombre !== undefined ? nombre : actual.nombre;
    const nuevaDescripcion =
      descripcion !== undefined ? descripcion : actual.descripcion;
    const nuevaCategoria =
      categoria !== undefined ? categoria : actual.categoria;

    const precioNum =
      precio !== undefined ? Number(precio) : Number(actual.precio);
    const stockNum =
      stock !== undefined ? Number(stock) : Number(actual.stock);

    if (!Number.isFinite(precioNum) || precioNum < 0) {
      return res
        .status(400)
        .json({ error: "Precio debe ser un número positivo" });
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return res
        .status(400)
        .json({ error: "Stock debe ser un entero positivo" });
    }

    const nuevoActivo =
      activo !== undefined ? (Number(activo) ? 1 : 0) : actual.activo;

    const [result] = await pool.query(
      `UPDATE productos 
       SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, activo = ?
       WHERE id = ?`,
      [
        nuevoNombre,
        nuevaDescripcion || null,
        precioNum,
        stockNum,
        nuevaCategoria || null,
        nuevoActivo,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await logAuditoria({
      usuario_id: req.user.sub,
      accion: "PRODUCTO_UPDATE",
      entidad: "producto",
      entidad_id: Number(id),
      cambios: {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion,
        precio: precioNum,
        stock: stockNum,
        categoria: nuevaCategoria,
        activo: nuevoActivo,
      },
    });

    res.json({ message: "Producto actualizado" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

/* ============================================================
 * DELETE /productos/:id  (ADMIN)
 *   - Borrado lógico: activo = 0
 * ============================================================ */
const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "UPDATE productos SET activo = 0 WHERE id = ?",
      [id]
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: "Producto no encontrado" });

    await logAuditoria({
      usuario_id: req.user.sub,
      accion: "PRODUCTO_INACTIVAR",
      entidad: "producto",
      entidad_id: Number(id),
      cambios: { activo: 0 },
    });

    res.json({ message: "Producto inactivado" });
  } catch (error) {
    console.error("Error al inactivar producto:", error);
    res.status(500).json({ error: "Error al inactivar producto" });
  }
};

/* ============================================================
 * GET /productos/:id/imagenes
 * ============================================================ */
const getImagenesByProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `
      SELECT id, url, alt_text, es_principal
      FROM imagenes_producto
      WHERE producto_id = ?
      ORDER BY es_principal DESC, id ASC
    `,
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener imágenes:", error);
    res.status(500).json({ error: "Error al obtener imágenes" });
  }
};

/* ============================================================
 * POST /productos/:id/imagenes  (ADMIN)
 *   - Soporta 1 o varias imágenes en la misma request
 *   - Usa req.file (single) o req.files (array)
 * ============================================================ */
const addImagenToProducto = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("👉 POST /productos/:id/imagenes RAW", {
      params: req.params,
      // 👀 ahora sí vemos exactamente qué es req.files y req.file
      filesType: req.files && typeof req.files,
      filesKeys: req.files && Object.keys(req.files),
      hasFileProp: !!req.file,
      body: req.body,
    });

    // Validar que el producto exista
    const [[producto]] = await pool.query(
      "SELECT id FROM productos WHERE id = ?",
      [id]
    );
    if (!producto) {
      console.warn("[addImagenToProducto] Producto no encontrado:", id);
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // 🔧 Normalizamos todas las variantes posibles:
    // - upload.array("imagenes")        -> req.files = [ ... ]
    // - upload.single("imagenes")       -> req.file
    // - upload.fields({imagenes: [...]})-> req.files = { imagenes: [ ... ] }
    let files = [];

    if (Array.isArray(req.files)) {
      // caso upload.array()
      files = req.files;
    } else if (req.files && Array.isArray(req.files.imagenes)) {
      // caso upload.fields({ name: "imagenes" })
      files = req.files.imagenes;
    } else if (req.file) {
      // caso upload.single()
      files = [req.file];
    }

    console.log(
      "[addImagenToProducto] Normalized files count:",
      files.length
    );

    if (!files.length) {
      console.warn(
        "[addImagenToProducto] Sin archivos después de normalizar req.files/req.file"
      );
      return res
        .status(400)
        .json({ error: "Debe adjuntar al menos una imagen" });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Saber cuántas imágenes ya tiene el producto
    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS c FROM imagenes_producto WHERE producto_id = ?",
      [id]
    );
    let existentes = Number(countRow.c);

    const imagenesInsertadas = [];

    for (const file of files) {
      console.log(
        "[addImagenToProducto] procesando archivo:",
        file.originalname,
        file.mimetype,
        file.size
      );

      if (!allowed.includes(file.mimetype)) {
        console.warn("[addImagenToProducto] Formato no permitido:", file.mimetype);
        return res.status(400).json({
          error: "Formato no permitido (usa JPG, PNG o WEBP)",
        });
      }
      if (file.size > maxSize) {
        console.warn("[addImagenToProducto] Imagen demasiado grande:", file.size);
        return res.status(400).json({
          error: "Cada imagen debe pesar máximo 5MB",
        });
      }

      const imageUrl = `/uploads/${file.filename}`;
      const es_principal = existentes === 0 ? 1 : 0;

      const [result] = await pool.query(
        "INSERT INTO imagenes_producto (producto_id, url, alt_text, es_principal) VALUES (?, ?, ?, ?)",
        [id, imageUrl, req.body.alt_text || null, es_principal]
      );

      imagenesInsertadas.push({
        id: result.insertId,
        url: imageUrl,
        alt_text: req.body.alt_text || null,
        es_principal,
      });

      existentes++;
    }

    return res.status(201).json({
      message:
        imagenesInsertadas.length > 1
          ? "Imágenes subidas correctamente"
          : "Imagen subida correctamente",
      imagenes: imagenesInsertadas,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ error: "Error al subir imagen" });
  }
};

/* ============================================================
 * DELETE /productos/:id/imagenes/:imgId  (ADMIN)
 * ============================================================ */
const deleteImagen = async (req, res) => {
  try {
    const { id, imgId } = req.params;

    const [[img]] = await pool.query(
      "SELECT url FROM imagenes_producto WHERE id = ? AND producto_id = ?",
      [imgId, id]
    );
    if (!img) return res.status(404).json({ error: "Imagen no encontrada" });

    const [result] = await pool.query(
      "DELETE FROM imagenes_producto WHERE id = ? AND producto_id = ?",
      [imgId, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    const fileOnDisk = path.join(
      __dirname,
      "../../",
      img.url.replace(/^\//, "")
    );
    fs.unlink(fileOnDisk, (err) => {
      if (err) console.warn("No se pudo borrar el archivo:", err.message);
    });

    res.json({ message: "Imagen eliminada" });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    res.status(500).json({ error: "Error al eliminar imagen" });
  }
};

// controllers/productos.js (mismo archivo que el resto)
const setImagenPrincipal = async (req, res) => {
  const { id, imgId } = req.params; // id = producto_id

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar que la imagen pertenezca al producto
    const [rows] = await connection.query(
      "SELECT id FROM imagenes_producto WHERE id = ? AND producto_id = ?",
      [imgId, id]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    // Poner todas en no-principal
    await connection.query(
      "UPDATE imagenes_producto SET es_principal = 0 WHERE producto_id = ?",
      [id]
    );

    // Marcar esta como principal
    await connection.query(
      "UPDATE imagenes_producto SET es_principal = 1 WHERE id = ? AND producto_id = ?",
      [imgId, id]
    );

    // (Opcional) auditoría
    try {
      await logAuditoria({
        usuario_id: req.user?.sub,
        accion: "PRODUCTO_IMAGEN_PRINCIPAL",
        entidad: "producto",
        entidad_id: Number(id),
        cambios: { imagen_principal_id: Number(imgId) },
      });
    } catch (e) {
      console.warn("No se pudo registrar auditoría de imagen principal:", e);
    }

    await connection.commit();
    res.json({ message: "Imagen marcada como principal" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al marcar imagen principal:", error);
    res.status(500).json({ error: "Error al marcar imagen principal" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getImagenesByProducto,
  addImagenToProducto,
  deleteImagen,
  setImagenPrincipal
};
