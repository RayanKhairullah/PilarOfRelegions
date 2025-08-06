# Sistem Pelaporan Sholat Siswa

Aplikasi web yang dirancang untuk memantau dan melaporkan kegiatan sholat harian siswa secara efisien. Proyek ini dibangun menggunakan Next.js, Supabase, dan Tailwind CSS.

## Fitur Utama

- **Formulir Laporan Siswa:** Antarmuka yang bersih dan sederhana bagi siswa untuk mengirimkan laporan sholat harian.
- **Notifikasi & Aturan:** Menampilkan pemberitahuan dengan aturan yang jelas sebelum siswa dapat mengisi formulir.
- **Validasi Unik Harian:** Siswa hanya dapat mengirimkan satu laporan per hari, namun dapat mengeditnya pada hari yang sama jika terjadi kesalahan.
- **Dashboard Admin:**
  - Login aman untuk administrator.
  - Tabel laporan sholat modern, responsif, dan mudah dibaca.
  - Filter laporan berdasarkan gender, tanggal, minggu, dan bulan.
  - Export laporan ke file Excel (.xlsx) dengan tampilan profesional (warna header, border, centang/❌, lebar kolom otomatis).
  - UI/UX dashboard dipoles: modal animasi, tombol modern, loading spinner, notifikasi, dan desain responsif.
- **Manajemen Data Siswa:**
  - Skrip untuk mengimpor data siswa dari file CSV langsung ke database Supabase.

## Teknologi yang Digunakan

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Database & Backend:** [Supabase](https://supabase.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Excel Export:** [xlsx-js-style](https://github.com/protobi/js-xlsx) (SheetJS fork, mendukung styling)

---

## Fitur Teknis & Best Practice

- **Formulir Siswa:**
  - Nama terakhir otomatis terpilih (localStorage), form selalu fetch data terbaru dari Supabase setiap refresh atau ganti nama.
  - Loading spinner saat fetch data laporan.
  - State form tetap konsisten setelah submit dan refresh, sesuai best practice.
- **Code Quality:**
  - Kode sudah bebas lint error dan warning (ESLint, TypeScript clean).
  - Struktur komponen dan tipe data rapi.
- **Export Excel:**
  - File hasil export sudah otomatis berwarna, border, centang/❌, dan lebar kolom proporsional.
  - Menggunakan `xlsx-js-style` untuk styling maksimal.

## Panduan Instalasi & Setup

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah berikut:

### 1. Clone Repository

```bash
# Ganti 'your-username' dengan username GitHub Anda
git clone https://github.com/your-username/sholatapps.git
cd sholatapps
```

### 2. Install Dependencies

```bash
npm install
# Untuk styling export Excel, pastikan juga:
npm install xlsx-js-style
```

### 3. Setup Environment Variables

Buat file baru bernama `.env` di root direktori proyek. Salin konten di bawah ini ke dalam file tersebut dan isi dengan kredensial Supabase Anda.

```env
# Kredensial Supabase - Anda dapat menemukannya di Pengaturan Proyek > API
NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_SUPABASE_ANDA
NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_PUBLIK_SUPABASE_ANDA
```

### 4. Setup Database

Pastikan Anda telah menginstal [Supabase CLI](https://supabase.com/docs/guides/cli) dan login.

**a. Jalankan Migrasi Database:**
Perintah ini akan membuat tabel `siswa` dan `sholat_reports` di database lokal Anda.

```bash
supabase db reset
```

**b. Seed Data Siswa:**
Perintah ini akan mengisi tabel `siswa` dengan data dari file CSV.

```bash
node scripts/import_siswa.js "Daftar Absen Kelas X - Sheet1.csv"
```

### 5. Jalankan Aplikasi

Setelah semua langkah di atas selesai, jalankan server pengembangan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---

## Catatan
- Untuk hasil export Excel yang full styling, gunakan aplikasi Excel modern atau Google Sheets.
- Jika ingin kontribusi atau menemukan bug, silakan open issue atau pull request!