// backend-node/src/routes/auth.js
const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  registerCliente,
  registerEmpresa,
  convertirAEmpresa,
  login,
  forgotPassword,
  verifyReset,
  resetPassword,
  changePassword,
  listarUsuarios,
  cambiarEstadoUsuario,
  getPerfil,
  updatePerfil,
} = require("../controllers/authController");

const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

/* ============================================================
   ✅ Config Frontend URL (para redirects Google)
   - En local: http://localhost:5173
   - En prod:  FRONTEND_URL=https://tu-front.vercel.app
   ============================================================ */
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
  /\/$/,
  ""
);

/* ============================================================
   🔐 Autenticación con Google (OAuth 2.0)
   ============================================================ */
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  (req, res) => {
    const token = req.user?.token;

    if (!token) {
      // fallback defensivo
      return res.redirect(`${FRONTEND_URL}/login?error=google_token_missing`);
    }

    // ✅ Redirigir al frontend con el JWT
    return res.redirect(
      `${FRONTEND_URL}/login?token=${encodeURIComponent(token)}`
    );
  }
);

/* ============================================================
   🧾 Registro y autenticación local
   ============================================================ */

/**
 * @route   POST /auth/register/cliente
 * @desc    Registro de cliente convencional
 * @access  Público
 */
router.post("/auth/register/cliente", registerCliente);

/**
 * @route   POST /auth/register/empresa
 * @desc    Registro de empresa/contratista
 * @access  Público
 */
router.post("/auth/register/empresa", registerEmpresa);

/**
 * @route   POST /auth/login
 * @desc    Login para todos los roles (Cliente, Empresa, Admin)
 * @access  Público
 */
router.post("/auth/login", login);

/**
 * @route   POST /auth/forgot-password
 * @desc    Solicita código de recuperación y lo envía por correo
 * @access  Público
 */
router.post("/auth/forgot-password", forgotPassword);

/**
 * @route   POST /auth/verify-reset
 * @desc    Verifica código de recuperación y genera token temporal
 * @access  Público
 */
router.post("/auth/verify-reset", verifyReset);

/**
 * @route   PUT /auth/reset-password
 * @desc    Restablece la contraseña con token temporal
 * @access  Token temporal (sin sesión)
 */
router.put("/auth/reset-password", resetPassword);

/**
 * @route   PUT /auth/change-password
 * @desc    Cambia la contraseña estando autenticado
 * @access  Privado (JWT normal)
 */
router.put("/auth/change-password", requireAuth, changePassword);

/* ============================================================
   👤 Gestión de Perfil de Usuario
   ============================================================ */

/**
 * @route   GET /auth/perfil
 * @desc    Obtener datos del usuario logueado
 * @access  Privado
 */
router.get("/auth/perfil", requireAuth, getPerfil);

/**
 * @route   PUT /auth/perfil
 * @desc    Actualizar datos básicos (username, telefono)
 * @access  Privado
 */
router.put("/auth/perfil", requireAuth, updatePerfil);

/**
 * @route   POST /auth/convertir-empresa
 * @desc    Convierte un CLIENTE a CONTRATISTA guardando NIT + razón social
 * @access  Privado (JWT)
 */
router.post("/auth/convertir-empresa", requireAuth, convertirAEmpresa);

/* ============================================================
   🧑‍💼 Administración de usuarios (solo ADMIN)
   ============================================================ */

/**
 * @route   GET /admin/usuarios
 * @desc    Listar usuarios del sistema
 * @access  Privado (ADMIN)
 */
router.get("/admin/usuarios", requireAuth, requireRole("ADMIN"), listarUsuarios);

/**
 * @route   PUT /admin/usuarios/:id/estado
 * @desc    Cambiar estado de usuario (ACTIVO / BLOQUEADO)
 * @access  Privado (ADMIN)
 */
router.put(
  "/admin/usuarios/:id/estado",
  requireAuth,
  requireRole("ADMIN"),
  cambiarEstadoUsuario
);

/* ============================================================
   📤 Exportación del router
   ============================================================ */
module.exports = router;
