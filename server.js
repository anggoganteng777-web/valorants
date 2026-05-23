// ============================================
// VALORANT CLONE - server.js (PLAINTEXT VERSION)
// ============================================
// Cara menjalankan:
//   1. npm install
//   2. Copy .env.example menjadi .env dan isi nilainya
//   3. node server.js
require('dotenv').config();
require('dotenv').config();

const express = require('express');
const mysql   = require('mysql2/promise');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// DATABASE CONNECTION
// ============================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'valorant_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============================================
// TEST DATABASE CONNECTION
// ============================================

async function testDB() {
  try {
    const conn = await pool.getConnection();

    console.log('✅ Database berhasil terhubung!');

    conn.release();

  } catch (err) {

    console.error('❌ Database gagal terhubung!');
    console.error(err.message);

    process.exit(1);
  }
}

// ============================================
// JWT AUTH MIDDLEWARE
// ============================================

function authMiddleware(req, res, next) {

  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan!'
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(403).json({
      success: false,
      message: 'Token tidak valid!'
    });
  }
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {

  res.json({
    success: true,
    message: 'Server berjalan!',
    time: new Date()
  });

});

// ============================================
// REGISTER
// ============================================

app.post('/api/register', async (req, res) => {

  const { username, email, password } = req.body;

  // VALIDASI
  if (!username || !email || !password) {

    return res.status(400).json({
      success: false,
      message: 'Semua field wajib diisi!'
    });

  }

  if (username.length < 3) {

    return res.status(400).json({
      success: false,
      message: 'Username minimal 3 karakter!'
    });

  }

  if (password.length < 6) {

    return res.status(400).json({
      success: false,
      message: 'Password minimal 6 karakter!'
    });

  }

  try {

    // Cek user sudah ada atau belum
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {

      return res.status(409).json({
        success: false,
        message: 'Username atau email sudah digunakan!'
      });

    }

    // ============================================
    // SIMPAN PASSWORD ASLI (PLAINTEXT)
    // ============================================

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );

    res.status(201).json({
      success: true,
      message: 'Register berhasil!',
      userId: result.insertId
    });

  } catch (err) {

    console.error('REGISTER ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server!'
    });

  }

});

// ============================================
// LOGIN
// ============================================

app.post('/api/login', async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {

    return res.status(400).json({
      success: false,
      message: 'Username dan password wajib diisi!'
    });

  }

  try {

    // Cari user
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (rows.length === 0) {

      return res.status(401).json({
        success: false,
        message: 'Username atau password salah!'
      });

    }

    const user = rows[0];

    // ============================================
    // CEK PASSWORD LANGSUNG
    // ============================================

    const passwordMatch = password === user.password;

    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message: 'Username atau password salah!'
      });

    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    // Response
    res.json({
      success: true,
      message: 'Login berhasil!',
      token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        rank: user.rank,
        wins: user.wins,
        vp_balance: user.vp_balance,
        created_at: user.created_at
      }
    });

  } catch (err) {

    console.error('LOGIN ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server!'
    });

  }

});

// ============================================
// PROFILE
// ============================================

app.get('/api/profile', authMiddleware, async (req, res) => {

  try {

    const [rows] = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        password,
        rank,
        wins,
        vp_balance,
        created_at,
        last_login
      FROM users
      WHERE id = ?
      `,
      [req.user.userId]
    );

    if (rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan!'
      });

    }

    res.json({
      success: true,
      user: rows[0]
    });

  } catch (err) {

    console.error('PROFILE ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server!'
    });

  }

});

// ============================================
// GET ALL USERS
// ============================================

app.get('/api/users', authMiddleware, async (req, res) => {

  try {

    const [rows] = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        password,
        rank,
        wins,
        vp_balance,
        created_at
      FROM users
      WHERE is_active = 1
      ORDER BY wins DESC
      `
    );

    res.json({
      success: true,
      total: rows.length,
      users: rows
    });

  } catch (err) {

    console.error('USERS ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server!'
    });

  }

});

// =====================================
// AUTO LOGIN / AUTO CREATE ACCOUNT
// =====================================

app.post('/api/auto-login', async (req,res)=>{

  const { username, password } = req.body;

  if(!username || !password){
    return res.json({
      success:false,
      message:'Username & password required.'
    });
  }

  try{

    // cek user
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    let user;

    // =====================================
    // USER BELUM ADA
    // =====================================

    if(rows.length === 0){

      const [result] = await pool.query(
        `INSERT INTO users
        (username,email,password,rank,wins,vp_balance,is_active)
        VALUES (?,?,?,?,?,?,?)`,
        [
          username,
          username + '@valorant.com',
          password,
          'IRON I',
          0,
          1000,
          1
        ]
      );

      user = {
        id: result.insertId,
        username,
        email: username + '@valorant.com',
        rank:'IRON I',
        wins:0,
        vp_balance:1000
      };

    }else{

      user = rows[0];

      // cek password
      if(user.password !== password){

        return res.json({
          success:false,
          message:'Wrong password.'
        });

      }

    }

    // LOGIN SUCCESS
    res.json({
      success:true,
      user:{
        id:user.id,
        username:user.username,
        email:user.email,
        rank:user.rank,
        wins:user.wins,
        vp_balance:user.vp_balance
      }
    });

  }catch(err){

    console.log(err);

    res.json({
      success:false,
      message:'Server error.'
    });

  }

});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan!'
  });

});

// ============================================
// START SERVER
// ============================================

testDB().then(() => {

  app.listen(PORT, () => {

    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);

    console.log(`📡 API aktif di http://localhost:${PORT}/api`);

  });

});