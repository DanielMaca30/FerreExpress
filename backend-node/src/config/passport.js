const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const pool = require("../db");

// ✅ Estrategia Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || "Usuario Google";

        if (!email) {
          console.error("❌ Perfil de Google sin email, no se puede continuar");
          return done(null, false, { message: "No se pudo obtener el correo de Google" });
        }

        // 🔍 Buscar si ya existe el usuario
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        let user = rows[0];

        if (!user) {
          // 🧩 Crear usuario CLIENTE si no existe
          const [result] = await pool.query(
            "INSERT INTO usuarios (username, email, password, role, created_at) VALUES (?, ?, '', 'CLIENTE', NOW())",
            [name, email]
          );
          user = { id: result.insertId, username: name, email, role: "CLIENTE" };
          console.log(`✅ Usuario Google creado: ${email}`);
        } else {
          console.log(`🔑 Usuario existente: ${email}`);
        }

        // 🔐 Generar token JWT (igual formato que login normal)
        const token = jwt.sign(
          { sub: user.id, role: user.role, email: user.email, username: user.username },
          process.env.JWT_SECRET || "supersecret",
          { expiresIn: "2h" }
        );

        user.token = token;
        done(null, user);
      } catch (err) {
        console.error("❌ Error en estrategia Google:", err);
        done(err, null);
      }
    }
  )
);

// ⚙️ Serialización de sesión
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;