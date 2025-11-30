import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fsm_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const connection = await pool.getConnection();

    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if ((existing as any).length > 0) {
      console.log('Admin user already exists');
      connection.release();
      pool.end();
      return;
    }

    // Create admin user
    await connection.query(
      `INSERT INTO users (id, name, email, password, role, avatar, address, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'admin-001',
        'System Administrator',
        'admin@example.com',
        hashedPassword,
        'SuperAdmin',
        '',
        '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}',
        '["Admin","Management"]',
        'Available'
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Role: SuperAdmin');

    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    pool.end();
  }
}

createAdminUser();