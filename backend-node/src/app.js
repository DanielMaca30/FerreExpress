// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

const session = require("express-session");
const passport = require("./config/passport");

const auditoria = require("./routes/auditoria");
const carrito = require("./routes/carrito");

const app = express();
const isProd = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
app.use(express.json({ limit: "2mb" }));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta en un momento." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera 15 minutos." },
  skipSuccessfulRequests: true,
});

const swaggerDocument = YAML.load(path.join(__dirname, "../docs/openapi.yaml"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const vercelFerreRegex = /^https:\/\/ferre-express(-[a-z0-9-]+)?\.vercel\.app$/i;
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
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
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return cors(corsOptions)(req, res, () => res.sendStatus(204));
  next();
});

app.use(session({
  name: process.env.SESSION_NAME || "ferre.sid",
  secret: process.env.SESSION_SECRET || "ferreexpress",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", maxAge: 1000 * 60 * 60 * 6 },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", require("./routes/health"));
app.use("/api/v1", require("./routes/auth")(authLimiter));
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

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((_req, res) => res.status(404).json({ ok: false, message: "Ruta no encontrada" }));

app.use((err, _req, res, _next) => {
  console.error("Error:", err.message || err);
  res.status(500).json({ ok: false, message: "Error interno del servidor" });
});

module.exports = app;
