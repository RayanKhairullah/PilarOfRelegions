-- Migration: Create students (siswa) table
CREATE TABLE IF NOT EXISTS siswa (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  gender CHAR(1) NOT NULL
);
