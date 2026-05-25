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
  getProductosRelacionados,
} = require("../controllers/productoController");

const requireAdmin = [requireAuth, requireRole("ADMIN")];

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const ext =
      file.mimetype === "image/png" ? ".png"
      : file.mimetype === "image/webp" ? ".webp"
      : ".jpg";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Rutas publicas
router.get("/productos", getProductos);
router.get("/productos/:id/relacionados", getProductosRelacionados);
router.get("/productos/:id", getProductoById);

// Rutas admin
router.post("/productos", requireAdmin, createProducto);
router.put("/productos/:id", requireAdmin, updateProducto);
router.delete("/productos/:id", requireAdmin, deleteProducto);

// Imagenes
router.get("/productos/:id/imagenes", getImagenesByProducto);
router.post("/productos/:id/imagenes", requireAdmin, upload.array("imagenes", 10), addImagenToProducto);
router.delete("/productos/:id/imagenes/:imgId", requireAdmin, deleteImagen);
router.patch("/productos/:id/imagenes/:imgId/principal", requireAdmin, setImagenPrincipal);

module.exports = router;
