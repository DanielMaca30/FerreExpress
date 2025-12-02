const bcrypt = require('bcryptjs');
const pool = require('./src/db');

async function crearAdmin() {
  try {
    const hashed = await bcrypt.hash('123456', 10);

    await pool.query(
      'INSERT INTO usuarios (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@ferreexpress.com', hashed, 'ADMIN']
    );

    console.log('✅ Admin creado con éxito');
    process.exit();
  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    process.exit(1);
  }
}

crearAdmin();


// para crear un nuevo usuario de admin:
// node seedAdmin.js (en terminal)