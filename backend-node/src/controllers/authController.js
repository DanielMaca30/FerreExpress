// backend-node/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const crypto = require("crypto");
const { sendMail } = require("../utils/mailer");
const { logAuditoria } = require("../utils/auditoria");


const generarToken = (usuario) => {
  return jwt.sign(
    {
      sub: usuario.id,
      role: usuario.role,
      email: usuario.email,
      username: usuario.username,
    },
    process.env.JWT_SECRET || "supersecret",
    { expiresIn: process.env.JWT_EXPIRES || "1h" }
  );
};

// Registro Cliente
const registerCliente = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const [existe] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (existe.length > 0) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO usuarios (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashed, "CLIENTE"]
    );

    const usuario = {
      id: result.insertId,
      username,
      email,
      role: "CLIENTE",
    };

    const token = generarToken(usuario);

    res.status(201).json({
      message: "Cliente registrado con éxito",
      id: result.insertId,
      token,
      role: usuario.role,
      username: usuario.username,
      email: usuario.email,
    });
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({ error: "Error en el registro de cliente" });
  }
};

// Registro Empresa
const registerEmpresa = async (req, res) => {
  try {
    const { username, email, password, nit } = req.body;

    if (!username || !email || !password || !nit) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos (incluido el NIT)" });
    }

    const [existe] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (existe.length > 0) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const [nitExistente] = await pool.query(
      "SELECT id FROM usuarios WHERE nit = ?",
      [nit]
    );
    if (nitExistente.length > 0) {
      return res.status(400).json({ error: "El NIT ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO usuarios (username, email, password, nit, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashed, nit, "CONTRATISTA"]
    );

    const usuario = {
      id: result.insertId,
      username,
      email,
      nit,
      role: "CONTRATISTA",
    };

    const token = generarToken(usuario);

    res.status(201).json({
      message: "Empresa registrada con éxito",
      id: result.insertId,
      token,
      role: usuario.role,
      username: usuario.username,
      email: usuario.email,
      nit: usuario.nit,
    });
  } catch (error) {
    console.error("Error al registrar empresa:", error);
    res.status(500).json({ error: "Error en el registro de empresa" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const usuario = rows[0];

    if (usuario.estado === "BLOQUEADO") {
      return res
        .status(403)
        .json({ error: "Tu cuenta está bloqueada. Contacta al soporte." });
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const token = generarToken(usuario);

    res.json({
      message: "Login exitoso",
      token,
      role: usuario.role,
      username: usuario.username,
      email: usuario.email,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el login" });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const [rows] = await pool.query(
      "SELECT id, username FROM usuarios WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "Si el correo existe, se enviará un código." });
    }

    const user = rows[0];
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "INSERT INTO reset_tokens (user_id, token, expira) VALUES (?, ?, ?)",
      [user.id, codigo, expira]
    );

    await sendMail({
      to: email,
      subject: "Código de recuperación de contraseña",
      text: `Tu código es ${codigo} (válido por 10 minutos).`,
      html: `<p>Hola ${user.username},</p><p>Tu código de recuperación es <b>${codigo}</b>. Válido por 10 minutos.</p>`,
    });

    res.json({ message: "Código enviado si el correo existe." });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ error: "Error al enviar código" });
  }
};

// Verify Reset
const verifyReset = async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: "Código requerido" });

    const cleanCode = codigo.toString().trim();

    const [rows] = await pool.query(
      `SELECT r.*, u.id as user_id, u.email
       FROM reset_tokens r
       JOIN usuarios u ON r.user_id = u.id
       WHERE CAST(r.token AS CHAR) = ? 
         AND r.usado = 0`,
      [cleanCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Código inválido" });
    }

    const user = rows[0];
    const ahora = new Date();
    const expira = new Date(user.expira);
    if (expira.getTime() < ahora.getTime()) {
      return res.status(400).json({ error: "Código expirado" });
    }

    await pool.query("UPDATE reset_tokens SET usado = 1 WHERE id = ?", [
      user.id,
    ]);

    const tempToken = jwt.sign(
      { sub: user.user_id, tipo: "RESET", email: user.email },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "10m" }
    );

    res.json({ message: "Código verificado correctamente", token: tempToken });
  } catch (error) {
    console.error("Error en verifyReset:", error);
    res.status(500).json({ error: "Error al verificar código" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { password } = req.body;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(400).json({ error: "Token inválido" });

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Token temporal inválido o expirado" });
    }

    if (payload.tipo !== "RESET") {
      return res
        .status(400)
        .json({ error: "Token no autorizado para este proceso" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "UPDATE usuarios SET password = ? WHERE id = ?",
      [hashed, payload.sub]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
};

// Change Password (Logueado)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.sub;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ error: "Contraseñas requeridas" });

    const [rows] = await pool.query(
      "SELECT password FROM usuarios WHERE id = ?",
      [userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const valido = await bcrypt.compare(oldPassword, rows[0].password);
    if (!valido)
      return res.status(401).json({ error: "Contraseña actual incorrecta" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [
      hashed,
      userId,
    ]);

    res.json({ message: "Contraseña cambiada correctamente" });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

// Perfil: GET /auth/perfil
const getPerfil = async (req, res) => {
  try {
    const userId = req.user.sub;

    const [rows] = await pool.query(
      "SELECT id, username, email, role, nit, telefono, avatar, estado, created_at FROM usuarios WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

// Perfil: PUT /auth/perfil
const updatePerfil = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { username, telefono } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ error: "El nombre de usuario es requerido" });
    }

    const [result] = await pool.query(
      "UPDATE usuarios SET username = ?, telefono = ? WHERE id = ?",
      [username, telefono || null, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

// Listar Usuarios (Admin)
const listarUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, role, estado, created_at, telefono, nit FROM usuarios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ error: "Error al listar usuarios" });
  }
};

// Cambiar Estado Usuario (Admin)
const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'ACTIVO' | 'BLOQUEADO'

    if (!["ACTIVO", "BLOQUEADO"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const [r] = await pool.query("UPDATE usuarios SET estado = ? WHERE id = ?", [
      estado,
      id,
    ]);

    if (!r.affectedRows) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await logAuditoria({
      usuario_id: req.user.sub,
      accion: "USUARIO_ESTADO",
      entidad: "usuario",
      entidad_id: Number(id),
      cambios: { estado },
    });

    res.json({ message: `Usuario #${id} → ${estado}` });
  } catch (e) {
    console.error("Error al actualizar usuario:", e);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

module.exports = {registerCliente, registerEmpresa, login, forgotPassword, verifyReset, resetPassword, changePassword, getPerfil, updatePerfil, listarUsuarios, cambiarEstadoUsuario};