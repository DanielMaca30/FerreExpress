// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Autenticación Google / sesiones
const session = require("express-session");
const passport = require("./config/passport");

// Rutas especiales
const auditoria = require("./routes/auditoria"); // archivo auditoria.js
const carrito = require("./routes/carrito");

const app = express();

/* ===== Middlewares base ===== */
app.use(express.json());
// (Opcional) si vas a recibir formularios x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (p.ej. imágenes subidas)
// __dirname = src → ../uploads = <root>/uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Permite producción + previews del mismo proyecto + local
const vercelFerreRegex = /^https:\/\/ferre-express(-[a-z0-9-]+)?\.vercel\.app$/i;

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/health checks

    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (vercelFerreRegex.test(origin)) return cb(null, true);

    return cb(null, false); // bloquea sin tumbar el server
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ preflight para todas

/* ===== Autenticación Google (si la usas) ===== */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ferreexpress",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

/* ===== Rutas ===== */
// Básicas / salud / auth
app.use("/api/v1", require("./routes/health"));
app.use("/api/v1", require("./routes/auth"));
app.use("/api/v1", require("./routes/protected"));

// Módulos del sistema
app.use("/api/v1", require("./routes/usuarios"));
app.use("/api/v1", require("./routes/productos"));
app.use("/api/v1", require("./routes/cotizaciones"));
app.use("/api/v1", require("./routes/pedidos"));
app.use("/api/v1", require("./routes/pagos"));
app.use("/api/v1", require("./routes/faq"));
app.use("/api/v1", require("./routes/casos"));
app.use("/api/v1", require("./routes/direcciones"));
app.use("/api/v1", require("./routes/notificaciones"));
app.use("/api/v1", require("./routes/descuentos"));

// Carrito (preview/totales desde back)
app.use("/api/v1/carrito", carrito);

// Auditoría (solo ADMIN, lógica de permisos va dentro de auditoria.js)
app.use("/api/v1/auditoria", auditoria);

/* ===== Health simple (extra) ===== */
app.get("/health", (_req, res) => res.json({ ok: true }));

module.exports = app;
