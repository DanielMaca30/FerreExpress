// backend-node/src/routes/auth.js
const express = require("express");
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

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

// authLimiter se recibe como parametro desde app.js
module.exports = (authLimiter) => {
  const router = express.Router();

  // Google OAuth
  router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
    (req, res) => {
      const token = req.user?.token;
      if (!token) return res.redirect(`${FRONTEND_URL}/login?error=google_token_missing`);
      return res.redirect(`${FRONTEND_URL}/login?token=${encodeURIComponent(token)}`);
    }
  );

  // Registro
  router.post("/auth/register/cliente", registerCliente);
  router.post("/auth/register/empresa", registerEmpresa);

  // Login (rate limited)
  router.post("/auth/login", authLimiter, login);

  // Recuperacion de contrasena (rate limited)
  router.post("/auth/forgot-password", authLimiter, forgotPassword);
  router.post("/auth/verify-reset", verifyReset);
  router.put("/auth/reset-password", resetPassword);

  // Cambio de contrasena autenticado
  router.put("/auth/change-password", requireAuth, changePassword);

  // Perfil
  router.get("/auth/perfil", requireAuth, getPerfil);
  router.put("/auth/perfil", requireAuth, updatePerfil);

  // Convertir cliente a contratista
  router.post("/auth/convertir-empresa", requireAuth, convertirAEmpresa);

  // Admin - gestion de usuarios
  router.get("/admin/usuarios", requireAuth, requireRole("ADMIN"), listarUsuarios);
  router.put("/admin/usuarios/:id/estado", requireAuth, requireRole("ADMIN"), cambiarEstadoUsuario);

  return router;
};
