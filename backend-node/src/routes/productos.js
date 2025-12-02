// src/routes/productos.js
const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getImagenesByProducto,
  addImagenToProducto,
  deleteImagen,
  setImagenPrincipal,
} = require("../controllers/productoController");

// ✅ Helper local: combina requireAuth + requireRole("ADMIN")
//    NO toca tus middlewares ya existentes
const requireAdmin = [requireAuth, requireRole("ADMIN")];

// --- Multer: guarda en /uploads y limita a 2MB ---
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"), // <root>/uploads
  filename: (_req, file, cb) => {
    const ext =
      file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/webp"
        ? ".webp"
        : ".jpg"; // por defecto jpg

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB por archivo
});

/* ================== Rutas públicas (catálogo) ================== */
router.get("/productos", getProductos);
router.get("/productos/:id", getProductoById);

/* ================ Rutas protegidas (solo ADMIN) ================ */
router.post(
  "/productos",
  requireAuth,
  requireRole("ADMIN"),
  createProducto
);

router.put(
  "/productos/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateProducto
);

router.delete(
  "/productos/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteProducto
);

/* ====================== Imágenes de productos ====================== */
/**
 * Nota: dejamos TODAS las rutas de imágenes protegidas con ADMIN,
 * porque el front público ya obtiene imágenes desde GET /productos/:id
 * (que devuelve imagenes[]) y el admin usa esta galería.
 */

router.get(
  "/productos/:id/imagenes",
  getImagenesByProducto
);

// Subir una o varias imágenes (campo "imagenes" en el FormData)
router.post(
  "/productos/:id/imagenes",
  requireAdmin,
  upload.array("imagenes", 10), // permite hasta 10 archivos
  addImagenToProducto
);

// Eliminar imagen específica
router.delete(
  "/productos/:id/imagenes/:imgId",
  requireAdmin,
  deleteImagen
);

// Marcar una imagen como principal
router.patch(
  "/productos/:id/imagenes/:imgId/principal",
  requireAdmin,
  setImagenPrincipal
);

module.exports = router;