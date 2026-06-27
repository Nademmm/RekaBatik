# Database Guide

Dokumen ini menjelaskan struktur database RekaBatik berdasarkan file SQL dan pemakaian aktual di kode aplikasi. Fokusnya adalah onboarding developer, migrasi, relasi tabel, dan hal-hal yang perlu diperhatikan saat mengubah skema.

## Tujuan

Database mendukung lima domain utama:

- autentikasi pengguna melalui Supabase Auth
- katalog batik
- desain batik kustom
- order, pembayaran, dan pengiriman
- toko artisan, favorit, chat, dan address book

## Sumber Kebenaran Skema

Repository ini memakai beberapa file SQL yang saling melengkapi:

- `supabase_schema.sql`: skema dasar awal
- `supabase_migration.sql`: upgrade aman untuk `orders` dan `cart_items`
- `create_chat_and_admin_tables.sql`: fitur chat, role artisan, status toko, dan policy tambahan
- `create_user_addresses_table.sql`: address book pengguna
- `add_favorites_tables.sql`: tabel favorit
- `add_tracking_fields.sql`: pelacakan pengiriman, review, dan relasi desain kustom di order
- `add_notes_to_cart_items.sql`: metadata tambahan di keranjang
- `fix_payment_status_constraint.sql`: perbaikan constraint pembayaran

## Urutan Setup yang Disarankan

Untuk database baru:

1. Jalankan `supabase_schema.sql`
2. Jalankan `supabase_migration.sql`
3. Jalankan `create_chat_and_admin_tables.sql`
4. Jalankan `create_user_addresses_table.sql`
5. Jalankan `add_favorites_tables.sql`
6. Jalankan `add_tracking_fields.sql`
7. Jalankan `add_notes_to_cart_items.sql`
8. Jalankan `fix_payment_status_constraint.sql` bila diperlukan

Alasan urutan ini:

- `supabase_schema.sql` membuat tabel dasar
- migrasi berikutnya menambah kolom dan policy tanpa perlu reset penuh
- fitur chat, favorites, tracking, dan address book bergantung pada entitas dasar yang sudah ada

## Diagram Entitas Ringkas

```text
auth.users
  |--< orders.user_id
  |--< custom_designs.user_id
  |--< cart_items.user_id
  |--< favorite_batik.user_id
  |--< favorite_stores.user_id
  |--< user_addresses.user_id
  `--< stores.owner_id

batik_items
  |--< cart_items.batik_id
  `--< favorite_batik.batik_id

custom_designs
  |--< cart_items.custom_design_id
  `--< orders.custom_design_id

stores
  `--< favorite_stores.store_id

orders
  `--< messages.order_id
```

Catatan penting:

- relasi artisan order saat ini tidak memakai foreign key langsung ke `stores.id`
- dashboard artisan bergantung pada kecocokan string `orders.artisan` dengan `stores.name`

## Tabel Inti

### `batik_items`

Fungsi:

- menyimpan katalog batik
- menjadi sumber motif katalog
- dipakai juga sebagai sumber pilihan motif awal di editor kustom

Kolom penting:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | bigint | primary key |
| `name` | text | nama batik |
| `price` | numeric | harga item |
| `description` | text | deskripsi produk |
| `origin` | text | asal motif |
| `primary_color` | text | warna utama default |
| `secondary_color` | text | warna sekunder default |
| `bg_color` | text | warna latar default |
| `rating` | int | rating awal/rekap |
| `sold` | int | jumlah terjual |
| `style_type` | text | mapping visual ke motif editor |
| `image_url` | text | referensi gambar katalog |

Catatan:

- file `update_batik_items_with_images.sql` menambahkan `image_url`
- beberapa halaman memetakan nilai `image_url` ke aset lokal di `src/assets/catalog-images`

### `orders`

Fungsi:

- menyimpan transaksi pembelian
- menyimpan status pembayaran, negosiasi, produksi, dan pengiriman
- menjadi anchor untuk fitur chat

Kolom penting:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | text | primary key order |
| `user_id` | uuid | pemilik order |
| `item` | text | nama item yang ditampilkan |
| `description` | text | detail order |
| `date` | timestamptz | waktu dibuat |
| `estimated_date` | timestamptz | estimasi selesai |
| `delivered_date` | timestamptz | tanggal diterima |
| `status` | text | status lifecycle order |
| `total` | numeric | total biaya |
| `type` | text | tipe order |
| `artisan` | text | nama toko / artisan tujuan |
| `payment_method` | text | metode pembayaran |
| `payment_status` | text | status pembayaran |
| `shipping_address` | jsonb | alamat kirim |
| `quantity` | int | jumlah item |
| `notes` | text | catatan user/sistem |
| `tracking_number` | varchar | nomor resi |
| `courier` | varchar | nama kurir |
| `review_rating` | integer | rating review |
| `review_comment` | text | komentar review |
| `custom_design_id` | integer | relasi ke desain kustom |

Nilai status yang dipakai saat ini:

- `negotiating`
- `processing`
- `shipping`
- `delivered`
- `cancelled`

Nilai `payment_status`:

- `pending`
- `awaiting_verification`
- `paid`
- `failed`

Nilai `payment_method`:

- `transfer_bca`
- `transfer_mandiri`
- `gopay`
- `ovo`
- `cod`

### `stores`

Fungsi:

- menyimpan profil toko artisan
- menjadi basis halaman `Desa Jetis`
- digunakan untuk dashboard artisan dan verifikasi super admin

Kolom penting:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | bigint | primary key |
| `name` | text | nama toko |
| `owner` | text | nama pemilik |
| `owner_id` | uuid | user artisan pemilik toko |
| `specialty` | text | spesialisasi toko |
| `address` | text | alamat |
| `phone` | text | nomor telepon |
| `hours` | text | jam operasional |
| `price_range` | text | rentang harga |
| `tags` | text[] | kategori/tag toko |
| `motifs` | text[] | motif unggulan |
| `image` | text | gambar utama lama |
| `hero_image` | text | hero image detail toko |
| `gallery` | text[] | galeri toko |
| `team` | text[] | daftar tim/pengrajin |
| `featured` | boolean | highlight toko |
| `status` | text | `pending`, `approved`, `rejected` |

Catatan:

- saat artisan mendaftar, record toko dibuat otomatis dari `AuthPage`
- akses kelola toko dibatasi hanya untuk artisan dengan toko berstatus `approved`

### `custom_designs`

Fungsi:

- menyimpan hasil desain batik kustom per user
- menjadi sumber histori desain dan item kustom di keranjang

Kolom penting:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | bigint | primary key |
| `user_id` | uuid | pemilik desain |
| `pattern_id` | int | motif dasar |
| `colors` | jsonb | preset warna |
| `scale` | int | skala |
| `rotation` | int | rotasi |
| `drawing_data` | text | payload JSON/stringified canvas |
| `created_at` | timestamptz | waktu simpan |

Catatan implementasi:

- aplikasi menyimpan payload yang lebih kaya daripada kolom formal tabel
- `drawing_data` berisi JSON hasil serialisasi Fabric, thumbnail, background, offscreen bitmap, dan metadata proyek

### `cart_items`

Fungsi:

- keranjang user untuk item katalog dan desain kustom

Kolom penting:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid | primary key |
| `user_id` | uuid | pemilik keranjang |
| `batik_id` | bigint | relasi ke `batik_items` |
| `custom_design_id` | bigint | relasi ke `custom_designs` |
| `quantity` | int | jumlah item |
| `created_at` | timestamptz | waktu tambah |
| `notes` | text | metadata tambahan |

Catatan:

- kolom `notes` dipakai untuk skenario pemulihan item kustom dari order/negosiasi

## Tabel Pendukung

### `messages`

Dipakai untuk chat order antara user dan artisan.

Kolom penting:

- `order_id`
- `sender_id`
- `sender_role`
- `message`
- `price_offer`
- `negotiation_status`
- `status`
- `created_at`

Catatan:

- tabel ini diaktifkan untuk Supabase Realtime
- attachment gambar dipakai di kode, jadi jika ada perubahan skema aktual di Supabase, pastikan dokumentasi dan file SQL tetap sinkron

### `favorite_batik`

Relasi favorit batik per user.

- unik per kombinasi `user_id` + `batik_id`
- dipakai di beranda, katalog, dan profil

### `favorite_stores`

Relasi favorit toko per user.

- unik per kombinasi `user_id` + `store_id`
- dipakai di `DesaJetisPage`, detail toko, dan profil

### `user_addresses`

Address book pengguna.

Kolom penting:

- `label`
- `recipient_name`
- `phone`
- `street`
- `city`
- `province`
- `postal_code`
- `is_default`

### `reviews`

Saat ini dipakai sebagai data testimoni/review yang tampil di UI.

## Aliran Data Utama

### Register artisan

1. User melakukan `signUp` lewat Supabase Auth
2. Metadata auth menyimpan `full_name` dan `role`
3. Jika role `artisan`, aplikasi langsung membuat baris `stores`
4. Status toko default `pending`
5. Super admin meninjau dan mengubah status toko

### Checkout item katalog

1. User menambah item ke `cart_items`
2. User checkout dari `CartPage`
3. Aplikasi membuat satu atau lebih `orders`
4. User memantau status di `OrdersPage`

### Checkout item kustom

1. User menyimpan desain ke `custom_designs`
2. Desain dapat dimasukkan ke `cart_items`
3. Saat checkout, order kustom dapat terhubung ke toko artisan
4. Komunikasi lanjutan berjalan di `messages`

## Sinkronisasi dengan TypeScript

Tipe utama ada di `src/types/database.ts`. Saat menambah atau mengubah kolom:

1. ubah SQL migrasi yang relevan
2. ubah interface di `src/types/database.ts`
3. audit query Supabase di halaman terkait
4. audit state UI yang bergantung pada field tersebut

## Risiko dan Keterbatasan Saat Ini

- file SQL di repo tidak sepenuhnya mencerminkan seluruh kolom runtime yang tampak dipakai di kode
- `orders.artisan` masih berupa string, bukan foreign key ke `stores.id`
- `drawing_data` di `custom_designs` menampung payload besar dan fleksibel, sehingga sulit divalidasi ketat di level database
- beberapa file seed/migrasi bersifat destruktif dan tidak aman dijalankan di production tanpa backup

## File SQL yang Perlu Diwaspadai

### `clean_and_update_batik_items.sql`

Efek:

- menghapus seluruh isi `batik_items`
- mengisi ulang data katalog

### `update_batik_items_with_images.sql`

Efek:

- menambah kolom `image_url`
- menghapus `category`
- menghapus `cart_items`
- menghapus `favorite_batik`
- menghapus seluruh isi `batik_items`

Gunakan hanya jika memang ingin reset data katalog dan relasi terkait.

## Rekomendasi Pengembangan Berikutnya

- pindahkan seluruh migrasi ke format versioned migration yang konsisten
- ganti relasi `orders.artisan` dari string menjadi foreign key yang stabil
- sinkronkan file SQL dengan semua field yang sudah digunakan runtime
- buat definisi schema TypeScript yang dihasilkan otomatis dari Supabase
