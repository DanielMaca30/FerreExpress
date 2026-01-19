const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) return res.status(401).json({ error: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET || "supersecret", (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    // ✅ compatibilidad: algunos controladores usan sub, otros id
    req.user = decoded;
    if (req.user && !req.user.id && req.user.sub) req.user.id = req.user.sub;

    next();
  });
};

module.exports = { requireAuth };