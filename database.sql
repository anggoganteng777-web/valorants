-- ============================================
-- VALORANT CLONE - Database Schema (MySQL)
-- ============================================
-- Jalankan file ini di phpMyAdmin atau MySQL CLI
-- dengan perintah: mysql -u root -p < database.sql

-- Buat database
CREATE DATABASE IF NOT EXISTS valorant_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE valorant_db;

-- ============================================
-- TABLE: users
-- Menyimpan data akun pemain
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  email        VARCHAR(100) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,   -- bcrypt hash, bukan plain text!
  rank         VARCHAR(50)  DEFAULT 'IRON 1',
  wins         INT          DEFAULT 0,
  vp_balance   INT          DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login   TIMESTAMP    NULL,
  is_active    TINYINT(1)   DEFAULT 1   -- 1 = aktif, 0 = banned
);

-- ============================================
-- TABLE: sessions (opsional, jika tidak pakai JWT)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP   NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE: game_history
-- Riwayat pertandingan pemain
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  result     ENUM('win','loss','draw') NOT NULL,
  kills      INT         DEFAULT 0,
  deaths     INT         DEFAULT 0,
  assists    INT         DEFAULT 0,
  map_name   VARCHAR(50),
  agent_name VARCHAR(50),
  played_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Contoh data awal (untuk testing)
-- Password: "password123" dalam bentuk bcrypt
-- Hash ini dibuat dengan: bcrypt.hash("password123", 10)
-- ============================================
INSERT INTO users (username, email, password, rank, wins, vp_balance) VALUES
('testuser', 'test@valorant.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'GOLD 2', 50, 500);

-- ============================================
-- Index untuk performa query
-- ============================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_history_user   ON game_history(user_id);
