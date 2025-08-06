// Script untuk mengimpor daftar siswa dari CSV ke Supabase
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CSV_PATH = process.argv[2] || path.resolve(__dirname, '../Daftar Absen Kelas X - Sheet1.csv');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  // Ambil kolom nama dan gender, pastikan nama kolom di CSV benar
  const siswaToInsert = records.map(rec => ({
    nama: rec['Nama Lengkap']?.trim(),
    gender: rec['Gender']?.trim() // Match the 'Gender' header from the CSV file
  })).filter(s => s.nama); // Filter baris kosong

  // Hapus semua data lama untuk menghindari duplikat
  console.log('Menghapus data siswa lama...');
  const { error: deleteError } = await supabase.from('siswa').delete().neq('id', 0);
  if (deleteError) {
    console.error('Error saat menghapus data lama:', deleteError);
    return;
  }

  for (const s of siswaToInsert) {
    const { error } = await supabase.from('siswa').insert([s]);
    if (error) console.error('Gagal insert:', s.nama, error.message);
    else console.log('Berhasil insert:', s.nama);
  }
})();
