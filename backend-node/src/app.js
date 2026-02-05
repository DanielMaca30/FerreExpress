// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

// Autenticación Google / sesiones
const session = require("express-session");
const passport = require("./config/passport");

// Rutas especiales
const auditoria = require("./routes/auditoria");
const carrito = require("./routes/carrito");

const app = express();
const isProd = process.env.NODE_ENV === "production";

/* ===== Middlewares base ===== */
app.disable("x-powered-by");
app.set("trust proxy", 1); // ✅ necesario si estás detrás de proxy (Railway/Render/etc)

app.use(express.json({ limit: "2mb" }));

const swaggerDocument = YAML.load(path.join(__dirname, "../docs/openapi.yaml"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ===== CORS (Vercel previews + prod + local) ===== */
const vercelFerreRegex = /^https:\/\/ferre-express(-[a-z0-9-]+)?\.vercel\.app$/i;

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Permite server-to-server / Postman / SSR sin origin
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (vercelFerreRegex.test(origin)) return cb(null, true);

    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ✅ Preflight OPTIONS sin app.options("*") (evita crash path-to-regexp)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

/* ===== Autenticación Google (si la usas) ===== */
app.use(
  session({
    name: process.env.SESSION_NAME || "ferre.sid",
    secret: process.env.SESSION_SECRET || "ferreexpress",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,                 // ✅ en prod debe ser true (https)
      sameSite: isProd ? "none" : "lax", // ✅ cross-site (Vercel -> API) requiere none
      maxAge: 1000 * 60 * 60 * 6,      // 6h
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ===== Rutas ===== */
app.use("/api/v1", require("./routes/health"));
app.use("/api/v1", require("./routes/auth"));
app.use("/api/v1", require("./routes/protected"));

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

app.use("/api/v1/carrito", carrito);
app.use("/api/v1/auditoria", auditoria);

/* ===== Health simple (extra) ===== */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ===== 404 ===== */
app.use((_req, res) => {
  res.status(404).json({ ok: false, message: "Ruta no encontrada" });
});

/* ===== Error handler ===== */
app.use((err, _req, res, _next) => {
  console.error("🔥 Error:", err);
  res.status(500).json({ ok: false, message: "Error interno del servidor" });
});

module.exports = app;