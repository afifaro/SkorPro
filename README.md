# 📊 SkorPro - Sistem Penilaian Profesional

Aplikasi web offline untuk mengelola penilaian siswa, membuat LJK, scan jawaban, dan analisis butir soal secara otomatis.

## ✨ Fitur Utama

- 📝 **Generator LJK** - Membuat lembar jawaban komputer dengan QR Code
- 📸 **Scanner** - Scan jawaban otomatis atau manual
- 📊 **Analisis Butir Soal** - Hitung tingkat kesukaran, daya beda, validitas
- 📘 **Nilai Rapor** - Kelola nilai rapor dengan auto-import dari analisis
- 🌓 **Dark/Light Mode** - Tema gelap dan terang
- 🌐 **Multi-language** - Indonesia & English
- 💾 **Offline First** - Bekerja tanpa koneksi internet

## 🚀 Cara Instalasi

1. Download semua file ke folder lokal
2. Pastikan struktur folder sesuai:
SkorPro/
├── index.html
├── css/styles.css
├── js/ (semua file JS)
└── libs/ (library eksternal)

3. Buka `index.html` di browser modern (Chrome, Firefox, Edge)

## 📚 Library yang Digunakan

- **xlsx.js** - Export/Import Excel
- **qrcode.js** - Generate QR Code
- **jsPDF** - Export PDF
- **html2canvas** - Screenshot untuk PDF
- **Chart.js** - Grafik statistik
- **IndexedDB** - Database offline

## 💡 Cara Penggunaan

### 1. Data Siswa
- Isi data guru (hanya 1 data)
- Tambah sekolah, kelas, mata pelajaran
- Input siswa manual atau import Excel
- Buat rencana penilaian

### 2. Generator LJK
- Pilih sekolah, kelas, mapel
- Atur jumlah soal (PG, BS, Isian, Esai)
- Download PDF LJK untuk semua siswa

### 3. Scanner
- Gunakan kamera untuk scan QR (mode otomatis)
- Atau upload foto dan pilih siswa (mode manual)
- Input jawaban dan skor

### 4. Analisis
- Input kunci jawaban
- Set KKTP
- Sistem otomatis hitung:
  - Tingkat kesukaran
  - Daya beda
  - Validitas
  - Prestasi belajar
- Export laporan Excel/PDF

### 5. Nilai Rapor
- Nilai dari analisis masuk otomatis
- Tambah nilai manual (ulangan lisan)
- Export Excel/PDF landscape F4

## 🔒 Reset Data

Ketuk judul "Data Siswa" 5 kali untuk reset semua data.

## 🎨 Customization

Edit `css/styles.css` untuk mengubah warna tema:
```css
:root {
    --primary-color: #4A90E2;
    --secondary-color: #5AB9EA;
    /* ... */
}
