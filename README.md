# RekaBatik: Elevating Indonesian Heritage through Digital Innovation

<p align="center">
  <strong>"Wujudkan Ide Batik Menjadi Karya Indah Penuh Makna"</strong>
</p>

---

## 🌟 Visi & Misi
**RekaBatik** adalah platform *fashion-tech* pionir yang menjembatani kesenjangan antara warisan budaya tradisional Indonesia dengan teknologi digital modern. Kami hadir untuk memberdayakan konsumen dalam mengekspresikan diri melalui desain batik yang dipersonalisasi, sekaligus memperkuat ekosistem pengrajin batik lokal, khususnya di Desa Jetis, Sidoarjo.

### 🚩 Masalah yang Kami Selesaikan
1. **Kurangnya Personalisasi**: Sulitnya menemukan motif batik yang benar-benar sesuai dengan preferensi pribadi atau identitas *brand*.
2. **Kesenjangan Akses**: Banyak pengrajin lokal berbakat yang memiliki keterbatasan akses untuk menjangkau pasar digital yang lebih luas.
3. **Edukasi Budaya**: Menurunnya pemahaman generasi muda terhadap makna filosofis di balik setiap motif batik.

---

## ✨ Fitur Utama & Proposisi Nilai

### 🎨 1. Mesin Kustomisasi Real-Time (Inti Produk)
Teknologi kustomisasi berbasis web yang memungkinkan pengguna untuk merancang kain batik mereka sendiri:
- **Modular Design**: Pilih dari 6+ motif dasar legendaris (Parang, Kawung, Mega Mendung, dll).
- **Infinite Color Palette**: Sesuaikan warna primer dan sekunder sesuai selera.
- **Digital Canting Tool**: Fitur kuas digital unik untuk menambahkan goresan personal langsung di atas motif.
- **Dynamic Preview**: Lihat hasil desain secara instan sebelum dipesan.

### 🛍️ 2. Katalog Terkurasi & Edukasi Motif
Katalog yang tidak hanya menjual, tapi juga mengedukasi pengguna mengenai asal-usul dan makna filosofis dari setiap kain batik yang tersedia.

### 🏘️ 3. Integrasi Ekosistem Desa Jetis
Halaman khusus yang menghubungkan pengguna dengan komunitas pengrajin di Desa Jetis, memberikan transparansi mengenai siapa yang membuat kain mereka dan bagaimana proses produksinya.

### 📦 4. Sistem Pelacakan Transparan
Dashboard pesanan yang informatif, memungkinkan pengguna melihat progres produksi dari tahap "Pesanan Diterima" hingga "Pewarnaan" dan "Pengiriman".

---

## 🗺️ Perjalanan Pengguna (Customer Journey)

1. **Eksplorasi**: Menjelajahi landing page profesional untuk memahami nilai produk.
2. **Kreasi**: Masuk ke halaman [CustomBatikPage](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/CustomBatikPage.tsx) untuk merancang motif.
3. **Pemesanan**: Memilih jenis kain dan menyelesaikan detail pesanan.
4. **Monitoring**: Memantau status produksi fisik batik oleh pengrajin melalui [OrdersPage](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/OrdersPage.tsx).

---

## 🛠️ Arsitektur Teknologi

### Frontend (Modern & Performa Tinggi)
- **Framework**: [React 18](https://react.dev/) dengan [React Router 7](https://reactrouter.com/) untuk navigasi yang mulus.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) untuk antarmuka yang responsif dan estetis.
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/) berbasis Radix UI untuk komponen yang aksesibel.
- **Interaksi & Animasi**: [Framer Motion](https://www.framer.com/motion/) untuk pengalaman pengguna yang interaktif.
- **Grafis**: HTML5 Canvas API untuk implementasi alat lukis digital kustom.

### Backend & Database (Production Ready)
- **Platform**: [Supabase](https://supabase.com/) untuk Database, Autentikasi, dan Storage.
- **Database**: PostgreSQL dengan Row Level Security (RLS) untuk keamanan data.
- **Auth**: Supabase Auth terintegrasi untuk manajemen pengguna.
- **State Management**: React Hooks & Supabase Realtime untuk sinkronisasi data.

---

## 📈 Potensi Bisnis (Konteks FIKSI)

RekaBatik dirancang sebagai solusi *Business-to-Consumer* (B2C) dan *Business-to-Business* (B2B):
- **B2C**: Penjualan kain batik kustom untuk individu (fashion, kado, koleksi).
- **B2B**: Pembuatan seragam korporat dengan motif yang menginkorporasikan identitas perusahaan.
- **Dampak Sosial**: Meningkatkan pendapatan pengrajin lokal melalui digitalisasi pasar dan efisiensi pesanan kustom.

---

## ⚙️ Panduan Instalasi & Pengembangan

### Prasyarat
- Node.js versi 18 atau lebih baru.
- npm atau pnpm.

### Menjalankan di Lokal
1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
2. **Konfigurasi Environment**:
   - Salin file `.env.example` menjadi `.env`.
   - Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan kredensial dari dashboard Supabase Anda.
3. **Mode Pengembangan**:
   ```bash
   npm run dev
   ```
3. **Build Produksi**:
   ```bash
   npm run build
   ```

---

## 🚀 Rencana Pengembangan (Roadmap)
- [ ] **Integrasi AI**: Implementasi AI untuk memberikan saran motif berdasarkan deskripsi teks pengguna.
- [x] **Infrastruktur Backend**: Migrasi ke Supabase untuk Database dan Autentikasi.
- [ ] **Sistem Autentikasi**: Implementasi Login/Register menggunakan Supabase Auth.
- [ ] **Payment Gateway**: Integrasi Midtrans atau Xendit untuk pembayaran otomatis.
- [ ] **Export to SVG**: Fitur untuk mengunduh hasil desain digital untuk keperluan lain.

---
<p align="center">
  <b>Dibuat untuk melestarikan budaya Batik Indonesia melalui inovasi teknologi.</b><br>
  © 2026 RekaBatik Team. All Rights Reserved.
</p>
