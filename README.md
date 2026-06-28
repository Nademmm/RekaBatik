# RekaBatik

RekaBatik adalah aplikasi web e-commerce dan kustomisasi batik berbasis React + Supabase. Proyek ini menggabungkan katalog batik, editor desain batik interaktif, pemesanan, chat negosiasi dengan pengrajin, manajemen toko artisan, dan verifikasi toko oleh super admin.

Dokumen ini ditulis berdasarkan kondisi kode saat ini di repository, sehingga fokusnya adalah dokumentasi implementasi yang benar-benar ada, bukan sekadar gambaran konsep produk.

## Daftar Isi
 
- [Ringkasan Proyek](#ringkasan-proyek)
- [Fitur Utama](#fitur-utama)
- [Role dan Hak Akses](#role-dan-hak-akses)
- [Alur Pengguna](#alur-pengguna)
- [Halaman dan Routing](#halaman-dan-routing)
- [Arsitektur Teknis](#arsitektur-teknis)
- [Struktur Folder](#struktur-folder)
- [Persiapan Lokal](#persiapan-lokal)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Supabase dan SQL](#setup-supabase-dan-sql)
- [Ringkasan Skema Database](#ringkasan-skema-database)
- [Aset dan Pola Batik](#aset-dan-pola-batik)
- [Script NPM](#script-npm)
- [Dokumentasi Lanjutan](#dokumentasi-lanjutan)
- [Catatan Implementasi](#catatan-implementasi)
- [Roadmap Singkat](#roadmap-singkat)

## Ringkasan Proyek

Tujuan utama aplikasi ini:

- Memungkinkan pengguna membeli batik katalog maupun batik kustom.
- Memberikan editor visual untuk membuat desain batik sendiri.
- Menghubungkan pelanggan dengan artisan/toko batik.
- Mendukung proses negosiasi, pembayaran, produksi, pengiriman, dan pelacakan pesanan.
- Menyediakan area administrasi untuk artisan dan super admin.

Stack inti yang digunakan:

- Frontend: React 18, TypeScript, Vite
- Routing: React Router 7
- Styling/UI: Tailwind CSS v4, Radix UI, komponen `ui/*`
- Animasi: Motion
- Backend: Supabase Auth, Postgres, Realtime
- Editor desain: Fabric.js

## Fitur Utama

### 1. Landing page dan eksplorasi katalog

- Halaman beranda menampilkan hero section, pola populer, ulasan, CTA menuju katalog dan editor kustom.
- Halaman katalog mengambil data `batik_items` dari Supabase.
- Pengguna bisa mencari item, melihat detail, menambahkan ke keranjang, dan menyimpan favorit.

### 2. Editor kustom batik

Editor kustom adalah salah satu bagian terbesar dalam aplikasi ini. Fitur yang sudah terimplementasi mencakup:

- Memuat motif dari tabel `batik_items`.
- Memuat aset SVG motif dari folder `src/assets/batik-svgs`.
- Recolor motif secara dinamis berdasarkan preset warna.
- Pengelolaan layer desain.
- Pengaturan skala, rotasi, flip horizontal/vertical, urutan layer, lock/unlock, dan visibility layer.
- Tool menggambar dengan brush/eraser.
- Elemen tambahan seperti shape dan teks.
- Mode fullscreen editor.
- Simpan desain ke database sebagai `custom_designs`.
- Tambahkan desain hasil kustom ke keranjang.
- Proteksi perubahan belum disimpan sebelum meninggalkan halaman.
- Dukungan unduh hasil desain.

### 3. Keranjang, checkout, dan order

- Keranjang mendukung item katalog dan item hasil desain kustom.
- Data keranjang sinkron dengan Supabase dan di-refresh realtime.
- Checkout mendukung alamat pengiriman dan penyimpanan alamat ke address book.
- Untuk item kustom, sistem dapat mengarah ke workflow negosiasi dengan artisan.
- Order menyimpan metadata pembayaran, alamat, catatan, jumlah item, dan relasi desain kustom.

### 4. Chat dan negosiasi

- Tersedia halaman chat antara pelanggan dan artisan.
- Pesan disimpan dalam tabel `messages`.
- Mendukung penawaran harga (`price_offer`) dan status negosiasi (`pending`, `accepted`, `rejected`).
- Mendukung attachment gambar referensi.
- Menggunakan Supabase Realtime untuk pembaruan percakapan.

### 5. Tracking pesanan

- Halaman pesanan menampilkan status order pengguna.
- Status order yang digunakan meliputi `negotiating`, `processing`, `shipping`, `delivered`, dan `cancelled`.
- Tersedia informasi metode pembayaran, status pembayaran, alamat kirim, kurir, nomor resi, dan ulasan.

### 6. Ekosistem toko batik

- Halaman `Desa Jetis` menampilkan daftar toko dari tabel `stores`.
- Hanya toko dengan status `approved` yang ditampilkan ke publik.
- Pengguna dapat menandai toko sebagai favorit.
- Halaman detail toko menampilkan hero image, galeri, tim, motif unggulan, dan informasi toko.

### 7. Profil pengguna

Halaman profil mencakup:

- Informasi akun dasar.
- Daftar favorit batik dan toko.
- Riwayat order dan akses cepat ke fitur terkait.
- Address book (`user_addresses`).
- Kelola toko untuk artisan yang lolos verifikasi.

### 8. Dashboard artisan

Halaman admin untuk artisan menyediakan:

- Ringkasan performa toko.
- Daftar pesanan masuk.
- Filter order berdasarkan status pembayaran dan produksi.
- Verifikasi pembayaran.
- Update estimasi produksi.
- Input kurir dan nomor resi saat pengiriman.
- Chat dan negosiasi dengan pelanggan.

### 9. Dashboard super admin

Halaman super admin difokuskan untuk verifikasi toko:

- Melihat daftar toko dengan status `pending`, `approved`, dan `rejected`.
- Menyetujui atau menolak toko artisan.
- Mengontrol lifecycle onboarding toko di sistem.

## Role dan Hak Akses

Aplikasi mengenal beberapa role dari `user_metadata.role` di Supabase Auth:

| Role | Deskripsi |
| --- | --- |
| `customer` | Pengguna biasa/pelanggan |
| `artisan` | Pengrajin batik / pemilik toko |
| `super_admin` | Admin utama untuk verifikasi toko |

Aturan akses penting yang saat ini berlaku:

- Semua route di dalam `ProtectedRoute` mengharuskan login.
- Halaman `/admin` ditujukan untuk `artisan`.
- Halaman `/super-admin` ditujukan untuk `super_admin`.
- Fitur kelola toko di halaman profil hanya boleh muncul untuk user dengan role `artisan` dan toko berstatus `approved`.
- User biasa tidak boleh melihat tab `Kelola Toko` atau tombol `Buat Toko`.
- Fetch data toko pada profil dibatasi agar tidak dijalankan untuk user biasa.
- Redirect defensif diterapkan ketika user mencoba mengakses area yang tidak sesuai role.

## Alur Pengguna

### Alur customer

1. Membuka beranda atau katalog.
2. Login/register melalui `/auth`.
3. Menambahkan batik katalog atau desain kustom ke keranjang.
4. Mengisi alamat pengiriman dan checkout.
5. Memantau pesanan di `/orders`.
6. Jika pesanan kustom memerlukan diskusi, lanjut negosiasi di `/chat`.

### Alur artisan

1. Register sebagai `artisan`.
2. Sistem membuat record awal toko di tabel `stores` dengan status `pending`.
3. Menunggu persetujuan super admin.
4. Setelah toko disetujui, artisan dapat mengelola toko di profil dan mengakses `/admin`.
5. Artisan menangani order, chat, verifikasi pembayaran, estimasi, dan pengiriman.

### Alur super admin

1. Login dengan role `super_admin`.
2. Mengakses `/super-admin`.
3. Memeriksa data toko yang mendaftar.
4. Mengubah status toko menjadi `approved` atau `rejected`.

## Halaman dan Routing

Routing didefinisikan di `src/app/routes.tsx`.

### Public routes

| Path | Halaman | Fungsi |
| --- | --- | --- |
| `/` | `HomePage` | Landing page, highlight produk, review |
| `/auth` | `AuthPage` | Login dan register |
| `/custom` | `CustomBatikPage` | Editor desain batik |
| `/catalog` | `CatalogPage` | Katalog batik |
| `/desa-jetis` | `DesaJetisPage` | Daftar toko batik |
| `/desa-jetis/:storeId` | `DesaJetisStoreDetailPage` | Detail toko |
| `/belajar-batik` | `BelajarBatikPage` | Konten edukasi batik |

### Protected routes

Route berikut dibungkus `ProtectedRoute` dan memerlukan login:

| Path | Halaman | Fungsi |
| --- | --- | --- |
| `/orders` | `OrdersPage` | Daftar dan detail pesanan |
| `/cart` | `CartPage` | Keranjang dan checkout |
| `/desain-histori` | `DesainHistoriPage` | Histori desain kustom |
| `/chat` | `ChatPage` | Chat pelanggan-artisan |
| `/profile` | `ProfilePage` | Profil, favorit, alamat, toko |
| `/admin` | `AdminPage` | Dashboard artisan |
| `/super-admin` | `SuperAdminPage` | Verifikasi toko |

## Arsitektur Teknis

### Frontend

- Entry point: `src/main.tsx`
- Root app: `src/app/App.tsx`
- Router: `src/app/routes.tsx`
- Layout utama: `src/app/layouts/RootLayout.tsx`
- Halaman aplikasi: `src/app/pages/*`
- Komponen reusable: `src/app/components/*`
- Komponen UI: `src/app/components/ui/*`

### Context Provider

Provider utama yang aktif secara global:

- `AuthProvider`: session, user, role, sign out
- `CartProvider`: jumlah item keranjang, refresh, operasi CRUD keranjang
- `FullscreenProvider`: state fullscreen khusus editor

### Backend dan integrasi data

- Semua akses backend utama menggunakan Supabase JS client.
- Auth memanfaatkan `supabase.auth`.
- Data utama disimpan di Postgres.
- Realtime dipakai untuk perubahan tertentu seperti chat dan keranjang.
- Validasi environment dilakukan di `src/lib/supabase.ts`.

## Struktur Folder

Struktur folder inti:

```text
.
|-- public/
|-- src/
|   |-- app/
|   |   |-- components/
|   |   |-- constants/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- App.tsx
|   |   `-- routes.tsx
|   |-- assets/
|   |   |-- batik-svgs/
|   |   `-- catalog-images/
|   |-- imports/
|   |-- lib/
|   |-- styles/
|   |-- types/
|   `-- main.tsx
|-- .env.example
|-- README.md
|-- supabase_schema.sql
|-- supabase_migration.sql
|-- create_chat_and_admin_tables.sql
|-- create_user_addresses_table.sql
|-- add_favorites_tables.sql
|-- add_tracking_fields.sql
`-- package.json
```

Penjelasan singkat:

- `src/app/pages`: seluruh halaman fitur utama.
- `src/lib`: integrasi Supabase dan context global.
- `src/types/database.ts`: interface TypeScript untuk entitas utama.
- `src/assets/batik-svgs`: aset SVG motif untuk editor kustom.
- `src/assets/catalog-images`: gambar katalog batik.
- File SQL di root: skema awal dan migrasi tambahan Supabase.

## Persiapan Lokal

### Prasyarat

- Node.js 18 atau lebih baru
- npm atau pnpm
- Project Supabase aktif

### Instalasi

```bash
npm install
```

atau

```bash
pnpm install
```

### Menjalankan mode development

```bash
npm run dev
```

### Build production

```bash
npm run build
```

Catatan:

- Saat ini `package.json` hanya menyediakan script `dev` dan `build`.
- Belum ada script `test` atau `lint` yang didefinisikan di repo.

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Penjelasan:

- `VITE_SUPABASE_URL`: URL project Supabase.
- `VITE_SUPABASE_ANON_KEY`: anon key untuk akses client-side.

Jika variabel ini kosong atau salah format, aplikasi tetap membuat client placeholder, tetapi koneksi data nyata tidak akan berfungsi dengan benar.

## Setup Supabase dan SQL

Repository ini menyimpan beberapa file SQL. Tidak semua file wajib dijalankan sekaligus, dan beberapa di antaranya bersifat destruktif terhadap data.

### Jalur setup untuk project baru

Jika Anda menyiapkan database dari awal, urutan aman yang direkomendasikan:

1. Jalankan `supabase_schema.sql`
2. Jalankan `supabase_migration.sql`
3. Jalankan `create_chat_and_admin_tables.sql`
4. Jalankan `create_user_addresses_table.sql`
5. Jalankan `add_favorites_tables.sql`
6. Jalankan `add_tracking_fields.sql`
7. Jalankan `add_notes_to_cart_items.sql`
8. Jalankan `fix_payment_status_constraint.sql` bila constraint pembayaran bermasalah

### File SQL dan fungsinya

| File | Fungsi |
| --- | --- |
| `supabase_schema.sql` | Skema dasar: `batik_items`, `orders`, `stores`, `reviews`, `custom_designs`, `cart_items` |
| `supabase_migration.sql` | Upgrade `orders` dan `cart_items` tanpa reset penuh |
| `create_chat_and_admin_tables.sql` | Menambah `owner_id`, `status` toko, tabel `messages`, policy artisan/super admin |
| `create_user_addresses_table.sql` | Membuat tabel buku alamat pengguna |
| `add_favorites_tables.sql` | Membuat tabel favorit batik dan toko |
| `add_tracking_fields.sql` | Menambah resi, kurir, review, dan `custom_design_id` di order |
| `add_notes_to_cart_items.sql` | Menambah kolom `notes` pada `cart_items` |
| `fix_payment_status_constraint.sql` | Memperbaiki constraint `payment_status` |
| `update_batik_items.sql` | Seed/update data katalog batik |
| `clean_and_update_batik_items.sql` | Reset seluruh `batik_items` lalu seed ulang |
| `update_batik_items_with_images.sql` | Menambah `image_url`, hapus `category`, lalu reset item katalog berikut relasi tertentu |

### Peringatan file destruktif

Gunakan dengan hati-hati di environment yang sudah berisi data produksi:

- `clean_and_update_batik_items.sql` menghapus seluruh isi `batik_items`
- `update_batik_items_with_images.sql` menghapus data `cart_items`, `favorite_batik`, lalu menghapus seluruh `batik_items`

## Ringkasan Skema Database

Entitas utama yang dipakai aplikasi:

| Tabel | Fungsi |
| --- | --- |
| `batik_items` | Data katalog batik |
| `orders` | Data order, pembayaran, pengiriman, review |
| `stores` | Data toko artisan |
| `custom_designs` | Desain kustom yang dibuat user |
| `cart_items` | Isi keranjang |
| `messages` | Chat dan negosiasi order |
| `favorite_batik` | Favorit batik per user |
| `favorite_stores` | Favorit toko per user |
| `user_addresses` | Buku alamat pengguna |
| `reviews` | Review/testimoni |

Kolom penting yang perlu dipahami:

### `stores`

- `owner_id`: relasi toko ke akun artisan
- `status`: `pending`, `approved`, `rejected`
- `hero_image`, `gallery`, `team`: dipakai di halaman detail toko dan profil

### `orders`

- `payment_method`: `transfer_bca`, `transfer_mandiri`, `gopay`, `ovo`, `cod`
- `payment_status`: `pending`, `awaiting_verification`, `paid`, `failed`
- `status`: `negotiating`, `processing`, `shipping`, `delivered`, `cancelled`
- `shipping_address`: JSON alamat
- `tracking_number`, `courier`: informasi pengiriman
- `custom_design_id`: relasi ke desain kustom

### `messages`

- `sender_role`: `user` atau `artisan`
- `price_offer`: nominal penawaran
- `negotiation_status`: `pending`, `accepted`, `rejected`
- `status`: `sent`, `delivered`, `read`

### `custom_designs`

- `pattern_id`: motif dasar
- `colors`: JSON warna
- `scale`, `rotation`: transform desain
- `drawing_data`: data gambar/canvas terserialisasi

## Aset dan Pola Batik

Ada dua sumber aset visual utama:

### 1. SVG motif editor

Lokasi: `src/assets/batik-svgs`

Contoh aset:

- `Truntum.svg`
- `ceplok.svg`
- `mega_mendung.svg`
- `parang.svg`
- `sidomukti.svg`

Catatan:

- Sistem pemuatan motif dirancang agar aset SVG dapat dimuat secara dinamis.
- Pendekatan ini memudahkan penambahan motif baru tanpa hardcode satu per satu.

### 2. Gambar katalog

Lokasi: `src/assets/catalog-images`

Contoh:

- `parang.webp`
- `mega_mendung.webp`
- `ceplok.webp`
- `sidomukti.webp`
- `truntum.webp`

Beberapa halaman memetakan `image_url` dari database ke aset lokal agar tampilan katalog tetap stabil.

## Script NPM

Script yang tersedia saat ini:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

Contoh penggunaan:

```bash
npm run dev
npm run build
```

## Dokumentasi Lanjutan

Untuk dokumentasi yang lebih rinci, gunakan dokumen turunan berikut:

- [Panduan Database](./docs/database.md)
- [Panduan RLS Policies](./docs/rls-policies.md)
- [Panduan Deployment](./docs/deployment.md)
- [Panduan Custom Editor](./docs/custom-editor.md)

## Catatan Implementasi

Hal-hal penting untuk developer yang melanjutkan proyek ini:

- Auth role dibaca dari `user_metadata.role`, bukan dari tabel profil terpisah.
- `ProtectedRoute` akan redirect ke `/auth?redirect=<path>` jika user belum login.
- `RootLayout` menangani notifikasi navbar dan sebagian perilaku global UI.
- `CartContext` memiliki subscription realtime ke tabel `cart_items`.
- Fitur toko pada halaman profil sengaja dibatasi ketat agar hanya terlihat untuk artisan yang sudah `approved`.
- Halaman publik toko hanya menampilkan store dengan status `approved`.
- Dashboard artisan mengandalkan kecocokan `orders.artisan` dengan `stores.name`.
- Beberapa migrasi SQL bersifat evolusioner. Cek isi file sebelum menjalankannya di environment yang sudah berisi data.

## Roadmap Singkat

Beberapa pengembangan yang masih relevan untuk tahap berikutnya:

- Menambahkan script `lint` dan `test`
- Merapikan pipeline migrasi database agar lebih terstruktur
- Menyusun dokumentasi RLS policy per tabel secara terpisah
- Menambahkan deployment guide
- Menambahkan payment gateway nyata
- Menambahkan automated test untuk flow auth, checkout, dan role guard

## Penutup

RekaBatik sudah memiliki fondasi aplikasi yang cukup lengkap untuk:

- katalog produk
- editor batik kustom
- checkout dan order management
- chat negosiasi pelanggan-artisan
- dashboard artisan
- verifikasi toko oleh super admin

Jika dokumentasi ini ingin diperluas lagi, langkah terbaik berikutnya adalah menambahkan dokumen turunan seperti:

- `docs/database.md`
- `docs/deployment.md`
- `docs/rls-policies.md`
- `docs/custom-editor.md`
