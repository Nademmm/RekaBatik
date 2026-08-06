# Deployment Guide

Dokumen ini menjelaskan cara men-deploy RekaBatik berdasarkan kondisi repository saat ini. Proyek ini adalah aplikasi frontend Vite + React yang terhubung langsung ke Supabase dari sisi client.

> **Pemula?** Ikuti panduan langkah demi langkah yang lebih detail: [panduan-deploy.md](./panduan-deploy.md)

## Gambaran Arsitektur Deployment

Komponen yang perlu tersedia:

- hosting static/frontend untuk hasil build Vite
- project Supabase aktif untuk Auth, Database, Realtime, dan Storage

## Status Pemenuhan Kebutuhan PaaS

Untuk kebutuhan tugas yang meminta deploy `App`, `DB`, dan `Storage`, repository ini **sudah mendukung semuanya**.

Arsitektur yang paling relevan untuk project saat ini:

- `App`: frontend React + Vite di-deploy ke Vercel atau Netlify
- `DB`: PostgreSQL yang disediakan Supabase
- `Storage`: Supabase Storage untuk file upload

Catatan penting:

- `DB` dan `Storage` memang berada di **platform yang sama**, yaitu Supabase
- hal ini tetap valid secara arsitektur karena keduanya adalah **layanan berbeda**
- Supabase berperan sebagai backend platform yang menyediakan lebih dari satu komponen sekaligus
- jadi, untuk tugas ini Anda tetap bisa menjelaskan bahwa project memakai 3 komponen: `App`, `Database`, dan `Storage`

Ringkasnya:

- Vercel = platform untuk aplikasi frontend
- Supabase Database = layanan database
- Supabase Storage = layanan object/file storage

## Bukti Penggunaan Storage di Repository

Storage pada project ini bukan sekadar rencana, tetapi **sudah dipakai langsung di kode aplikasi**.

Bucket yang dipakai saat ini:

- `store-images`

Use case yang sudah berjalan di kode:

- upload foto toko artisan
- upload hero image toko
- upload galeri toko
- upload bukti transfer checkout
- upload lampiran pembayaran premium

Implementasi upload ke Supabase Storage saat ini ada di:

- `src/app/pages/ArtisanStorePage.tsx`
- `src/app/pages/CartPage.tsx`
- `src/app/pages/CheckoutPage.tsx`

Alur teknisnya:

1. file di-upload ke bucket `store-images`
2. aplikasi mengambil public URL dari file tersebut
3. URL hasil upload disimpan ke tabel database, misalnya ke field gambar toko atau bukti pembayaran

Dengan demikian, storage pada project ini **sudah termasuk bagian dari arsitektur production**, bukan fitur yang belum dibuat

## Checklist Storage Production

Agar deployment production benar-benar lengkap, pastikan item berikut sudah ada di project Supabase:

- bucket `store-images`
- bucket diset `public` jika file perlu diakses lewat URL publik
- policy untuk read publik bila memang memakai public URL
- policy upload untuk user yang sudah login

Jika bucket belum dibuat, maka:

- aplikasi tetap bisa build dan deploy
- tetapi fitur upload file akan gagal saat dipakai

Jika bucket `store-images` sudah ada dan policy-nya benar, maka bagian `Storage` dapat dianggap **sudah selesai terdeploy**

Yang tidak ada saat ini di repository:

- server backend custom
- API server terpisah
- Dockerfile
- CI/CD workflow
- pipeline deploy terotomasi dari repository

Artinya, deployment saat ini paling cocok dilakukan sebagai static SPA.

## Prasyarat

Sebelum deploy, siapkan:

- project Supabase production
- environment variable production
- database schema dan policy yang sudah diterapkan
- akun user dengan role yang diperlukan untuk verifikasi manual

## Build Lokal

Script build yang tersedia:

```bash
npm run build
```

Output default Vite:

- folder `dist/`

Karena repo tidak mengubah `build.outDir`, asumsi output production tetap `dist`.

## Environment Variable

Frontend membutuhkan:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Catatan penting:

- keduanya dibaca di build-time oleh Vite
- prefix `VITE_` wajib dipertahankan
- jangan gunakan service role key di frontend

## Checklist Sebelum Deploy

Sebelum upload build:

1. pastikan schema Supabase production sudah lengkap
2. pastikan policy RLS sesuai kebutuhan role
3. pastikan akun `super_admin` production sudah ada
4. pastikan data seed minimum tersedia jika UI membutuhkannya
5. jalankan `npm run build`
6. uji hasil build secara lokal bila memungkinkan

## Setup Database Production

### Project Supabase baru (disarankan)

Jalankan **1 file** di SQL Editor dari folder `supabase/migrations/`:

- `supabase_full_schema.sql` — schema final, RLS, Realtime, dan seed data

### Project yang sudah pernah di-setup (migrasi incremental)

Jalankan file SQL di `supabase/migrations/` yang **belum pernah** di-run, berurutan:

1. `supabase_schema.sql`
2. `supabase_migration.sql`
3. `create_chat_and_admin_tables.sql`
4. `create_user_addresses_table.sql`
5. `add_favorites_tables.sql`
6. `add_tracking_fields.sql`
7. `add_notes_to_cart_items.sql`
8. `fix_payment_status_constraint.sql` bila perlu

Jangan jalankan `supabase_full_schema.sql` jika database sudah berisi data.

### File destruktif — jangan di production

- `clean_and_update_batik_items.sql`
- `update_batik_items_with_images.sql`

Keduanya dapat menghapus data yang sudah ada.

## SPA Routing Requirement

Karena aplikasi memakai React Router browser routing, hosting harus mendukung rewrite semua route ke `index.html`.

Route yang perlu tetap bekerja saat refresh browser misalnya:

- `/catalog`
- `/custom`
- `/profile`
- `/orders`
- `/admin`
- `/super-admin`

Jika rewrite tidak diatur:

- route akan gagal saat di-refresh langsung
- server bisa mengembalikan 404 karena mencari file fisik yang tidak ada

## Opsi Deployment yang Cocok

### Vercel

Cocok untuk:

- deploy cepat tanpa konfigurasi backend khusus

Konfigurasi minimum:

- framework preset: Vite
- build command: `npm run build`
- output directory: `dist`
- set environment variables di dashboard
- file `vercel.json` di root repo sudah menambahkan rewrite semua route ke `index.html`

Konfigurasi yang sekarang dipakai:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify

Cocok untuk:

- deploy static SPA dengan rewrite yang mudah

Konfigurasi minimum:

- build command: `npm run build`
- publish directory: `dist`
- set environment variables di dashboard
- file `netlify.toml` di root repo sudah menambahkan redirect SPA

Konfigurasi yang sekarang dipakai:

```text
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
/* /index.html 200
```

### GitHub Pages

Bisa dipakai, tetapi kurang ideal jika:

- Anda membutuhkan routing browser tanpa konfigurasi tambahan
- Anda ingin setup yang lebih sederhana untuk SPA dengan route banyak

Jika memakai GitHub Pages:

- perlu penyesuaian base path Vite
- perlu strategi fallback route

Karena repo belum memiliki konfigurasi base path, GitHub Pages bukan opsi paling praktis saat ini.

### Shared hosting / object storage static site

Bisa dipakai jika mendukung:

- upload folder `dist`
- rewrite ke `index.html`
- HTTPS

## Langkah Deploy Manual

### 1. Build aplikasi

```bash
npm install
npm run build
```

### 2. Verifikasi output

Pastikan folder `dist/` muncul dan berisi file build frontend.

### 3. Upload ke hosting

Upload seluruh isi `dist/` ke hosting tujuan.

### 4. Atur environment variable

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Jika hosting membaca env hanya saat build:

- pastikan env sudah diset sebelum proses build production berjalan

### 5. Atur SPA rewrite

Ini wajib untuk route React Router.

### 6. Verifikasi aplikasi

Uji minimal:

- buka `/`
- refresh `/catalog`
- login
- buka `/profile`
- buka `/custom`
- buka `/orders`
- uji akun artisan ke `/admin`
- uji akun super admin ke `/super-admin`

## Deploy dari Vercel atau Netlify via Git

Alur umum:

1. push repo ke Git provider
2. hubungkan project ke Vercel/Netlify
3. set environment variables
4. tetapkan build command `npm run build`
5. tetapkan output directory `dist`
6. deploy

Keuntungan:

- build otomatis setiap push
- rollback lebih mudah
- env management lebih terpusat

## Verifikasi Pasca Deploy

Lakukan smoke test berikut:

### Auth

- register customer
- login customer
- logout

### Artisan

- register artisan
- cek apakah record `stores` dibuat
- cek status awal toko `pending`

### Super admin

- login sebagai `super_admin`
- buka halaman verifikasi toko
- approve/reject toko

### Store visibility

- pastikan hanya toko `approved` yang tampil publik

### Catalog dan favorites

- lihat katalog
- tambah/hapus favorit batik
- tambah/hapus favorit toko

### Editor kustom

- buka editor
- tambah motif
- gambar dengan brush
- simpan desain
- unduh desain
- tambah ke keranjang

### Checkout dan orders

- checkout item katalog
- checkout item kustom
- lihat order di `OrdersPage`
- cek status pembayaran dan pengiriman

### Chat

- pastikan user dan artisan dapat membaca order terkait
- kirim pesan
- uji realtime

## Konfigurasi Supabase Production

### Auth

Pastikan:

- site URL mengarah ke domain production
- redirect URL production ditambahkan bila diperlukan

### Database

Pastikan:

- semua migrasi sudah diterapkan
- seed minimum tersedia
- akun super admin sudah memiliki metadata role yang benar

### Realtime

Pastikan:

- tabel `messages` sudah masuk publication realtime

## Keamanan

Checklist keamanan minimum:

- jangan expose service role key
- gunakan hanya anon key di frontend
- pastikan RLS aktif di tabel privat
- pastikan account admin memakai metadata role yang benar
- backup database sebelum menjalankan script destruktif

## Troubleshooting

### 1. Halaman kosong setelah deploy

Kemungkinan:

- env Supabase belum terpasang
- build memakai env kosong
- ada masalah import asset

Cek:

- variable `VITE_SUPABASE_URL`
- variable `VITE_SUPABASE_ANON_KEY`
- console browser

### 2. Refresh route langsung menjadi 404

Kemungkinan:

- rewrite SPA belum diaktifkan

Solusi:

- arahkan semua route ke `index.html`

### 3. Login berhasil tetapi data kosong

Kemungkinan:

- schema production belum lengkap
- policy RLS terlalu ketat atau belum diterapkan
- data seed belum ada

### 4. Artisan tidak bisa melihat order

Kemungkinan:

- `stores.owner_id` belum sesuai
- `orders.artisan` tidak cocok dengan `stores.name`
- policy artisan belum terpasang

### 5. Super admin tidak bisa approve toko

Kemungkinan:

- metadata role bukan `super_admin`
- policy update `stores` belum ada

## Saran Penyempurnaan Deployment

Untuk meningkatkan kesiapan production, berikut perbaikan yang direkomendasikan:

- tambahkan CI pipeline untuk build check
- tambahkan script `preview`
- tambahkan dokumen backup/restore database
- tambahkan proses migrasi ter-versioning
- tambahkan environment separation yang jelas untuk dev/staging/prod

## Ringkasan

Model deployment paling sederhana dan aman untuk kondisi repo saat ini adalah:

- frontend static build dari Vite
- hosting di platform yang mendukung SPA rewrite
- backend sepenuhnya memakai Supabase

Jika ingin saya lanjutkan, saya bisa bantu membuat:

- `vercel.json`
- `netlify.toml`
- checklist deployment production yang lebih operasional
