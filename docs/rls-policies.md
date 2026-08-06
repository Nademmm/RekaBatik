# RLS Policies Guide

Dokumen ini merangkum Row Level Security (RLS) yang didefinisikan di file SQL repository dan menjelaskan implikasinya ke perilaku aplikasi.

## Tujuan RLS di Proyek Ini

RLS dipakai untuk memastikan:

- user hanya bisa melihat dan mengubah data miliknya sendiri
- artisan hanya bisa menangani order yang terkait dengan tokonya
- super admin hanya bisa mengubah status toko
- tabel publik tertentu tetap dapat dibaca tanpa login bila memang dibutuhkan

## Prinsip Dasar yang Dipakai

- identitas user diambil dari `auth.uid()`
- role aplikasi dibaca dari `auth.jwt() -> 'user_metadata' ->> 'role'`
- ownership toko didasarkan pada `stores.owner_id`
- ownership order didasarkan pada `orders.user_id`
- hak artisan atas order didasarkan pada kecocokan `stores.name = orders.artisan`

## Ringkasan per Tabel

| Tabel | RLS | Tujuan |
| --- | --- | --- |
| `orders` | aktif | pisahkan order milik user dan order yang dikelola artisan |
| `custom_designs` | aktif | user hanya mengelola desainnya sendiri |
| `cart_items` | aktif | user hanya mengelola keranjangnya sendiri |
| `messages` | aktif | chat hanya bisa diakses pihak yang terkait order |
| `stores` | aktif | semua orang boleh baca, tapi update dibatasi |
| `user_addresses` | aktif | user hanya mengelola address book sendiri |
| `favorite_batik` | aktif | user hanya mengelola favoritnya sendiri |
| `favorite_stores` | aktif | user hanya mengelola favoritnya sendiri |

## Policy Detail

### `orders`

Sumber utama di `supabase/migrations/`:

- `supabase_schema.sql`
- `create_chat_and_admin_tables.sql`
- `supabase_migration.sql`

Policy yang ada:

#### 1. User dapat melihat order miliknya

Nama policy:

- `Users can view their own orders`

Makna:

- user yang login dapat `SELECT` order dengan `user_id = auth.uid()`

#### 2. User dapat membuat order miliknya

Nama policy:

- `Users can insert their own orders`

Makna:

- user hanya boleh `INSERT` order untuk dirinya sendiri

#### 3. User dapat mengubah order miliknya

Nama policy:

- `Users can update their own orders`

Makna:

- dipakai untuk perubahan dari sisi pelanggan, misalnya status pembayaran atau data terkait order milik sendiri

#### 4. Artisan dapat melihat order toko mereka

Nama policy:

- `Artisans can view their store orders`

Makna:

- artisan dapat melihat order bila ada toko dengan `owner_id = auth.uid()` dan `stores.name = orders.artisan`

Risiko:

- policy ini bergantung pada nama toko sebagai string
- jika nama toko berubah tanpa sinkronisasi, akses order artisan bisa terganggu

#### 5. Artisan dapat mengubah order toko mereka

Nama policy:

- `Artisans can update their store orders`

Makna:

- artisan dapat update status produksi, estimasi, dan pengiriman untuk order yang ditujukan ke tokonya

Digunakan di UI untuk:

- verifikasi pembayaran
- update status order
- input nomor resi dan kurir
- update estimasi selesai

### `custom_designs`

Sumber:

- `supabase_schema.sql`

Policy:

- `Users can view their own custom designs`
- `Users can insert their own custom designs`
- `Users can update their own custom designs`
- `Users can delete their own custom designs`

Makna:

- seluruh lifecycle desain kustom dibatasi ke pemilik desain

Dampak ke aplikasi:

- halaman histori desain aman untuk menampilkan data user yang sedang login
- desain hanya bisa di-edit, dihapus, atau dipakai ulang oleh pemiliknya

### `cart_items`

Sumber:

- `supabase_schema.sql`
- `supabase_migration.sql`

Policy:

- `Users can view their own cart items`
- `Users can insert their own cart items`
- `Users can update their own cart items`
- `Users can delete their own cart items`

Makna:

- keranjang benar-benar bersifat privat per user

Dampak ke aplikasi:

- `CartContext` dapat subscribe realtime ke keranjang user tanpa mengekspos data user lain

### `messages`

Sumber:

- `create_chat_and_admin_tables.sql`

Policy:

- `Users can view messages for their orders`
- `Users can insert messages for their orders`
- `Sender can update their messages`

Makna:

- user pembeli dapat melihat chat untuk order miliknya
- artisan dapat melihat chat bila order tersebut milik tokonya
- user atau artisan yang relevan dapat mengirim pesan pada order yang terhubung
- update status pesan juga dibatasi pada sender atau artisan pemilik order

Catatan penting:

- logic akses chat mengandalkan relasi order dan toko, bukan membership room terpisah
- perubahan struktur `orders.artisan` atau `stores.name` berpengaruh langsung ke akses chat

### `stores`

Sumber:

- `create_chat_and_admin_tables.sql`

Policy:

#### 1. Semua orang bisa membaca toko

Nama:

- `Anyone can view stores`

Makna:

- route publik seperti daftar toko dapat tetap berjalan
- filtering toko `approved` tetap dilakukan di query aplikasi untuk tampilan publik

#### 2. User login bisa membuat toko sendiri

Nama:

- `Users can insert their own stores`

Makna:

- `owner_id` saat insert harus sama dengan `auth.uid()`

Dipakai saat:

- register artisan dari `AuthPage`

#### 3. Artisan dapat mengubah toko sendiri

Nama:

- `Artisans can update their own stores`

Makna:

- artisan boleh mengubah data toko yang memang dimilikinya

Catatan:

- aplikasi masih menambahkan guard UI tambahan supaya fitur kelola toko hanya muncul jika status toko `approved`

#### 4. Super admin dapat mengubah toko

Nama:

- `Super admin can update stores`

Makna:

- user dengan role `super_admin` di JWT dapat memperbarui data toko

Dipakai untuk:

- approve/reject toko di `SuperAdminPage`

### `user_addresses`

Sumber:

- `create_user_addresses_table.sql`

Policy:

- `Users can view their own addresses`
- `Users can insert their own addresses`
- `Users can update their own addresses`
- `Users can delete their own addresses`

Makna:

- address book bersifat private per user

### `favorite_batik`

Sumber:

- `add_favorites_tables.sql`

Policy:

- `Users can view their own favorite batik`
- `Users can insert their own favorite batik`
- `Users can delete their own favorite batik`

Makna:

- user hanya melihat dan mengubah wishlist batiknya sendiri

### `favorite_stores`

Sumber:

- `add_favorites_tables.sql`

Policy:

- `Users can view their own favorite stores`
- `Users can insert their own favorite stores`
- `Users can delete their own favorite stores`

Makna:

- user hanya melihat dan mengubah wishlist tokonya sendiri

## Peta Role vs Akses

| Kemampuan | Anon | Customer | Artisan | Super Admin |
| --- | --- | --- | --- | --- |
| Lihat daftar toko | ya | ya | ya | ya |
| Buat order | tidak | ya | ya | ya |
| Lihat order sendiri | tidak | ya | ya | ya |
| Lihat order toko artisan | tidak | tidak | ya | tidak langsung via policy khusus |
| Update order sendiri | tidak | ya | ya | tidak langsung via policy khusus |
| Update order toko artisan | tidak | tidak | ya | tidak |
| Buat toko | tidak | ya bila login | ya | ya |
| Update toko sendiri | tidak | tidak | ya | ya |
| Approve/reject toko | tidak | tidak | tidak | ya |
| Lihat chat order terkait | tidak | ya | ya | tidak via policy terpisah |

Catatan:

- tabel `stores` memang bisa dibaca anon, tetapi UI publik tetap sebaiknya hanya menampilkan data yang layak publik
- super admin tidak memiliki policy eksplisit untuk semua tabel; aksesnya saat ini terutama fokus pada update `stores`

## Interaksi RLS dan Guard di Frontend

RLS bukan satu-satunya lapisan keamanan. Frontend juga menambah guard:

- `ProtectedRoute` mencegah route privat diakses tanpa login
- `ProfilePage` menyembunyikan fitur kelola toko dari user biasa
- `AdminPage` melakukan redirect jika role bukan `artisan`
- `SuperAdminPage` melakukan redirect jika role bukan `super_admin`

Kenapa tetap perlu guard frontend:

- UX lebih baik karena user tidak melihat fitur yang pasti ditolak
- mengurangi query yang tidak perlu
- membantu mencegah state UI membingungkan

## Titik Lemah Saat Ini

### Ketergantungan pada `orders.artisan` sebagai string

Masalah:

- access control artisan ke order dan message bergantung pada `stores.name = orders.artisan`

Dampak:

- rename toko bisa memutus hubungan historis order-chat

Saran:

- tambahkan `store_id` di `orders`
- ubah policy artisan agar memakai foreign key stabil

### Perbedaan skema SQL vs field runtime

Masalah:

- ada field yang tampak dipakai UI runtime tetapi tidak selalu terlihat di semua file SQL repo

Dampak:

- migrasi baru bisa tampak benar di kode tetapi belum lengkap di database baru

Saran:

- audit skema aktual Supabase dan sinkronkan seluruh file SQL

### Tidak ada policy eksplisit super admin untuk semua operasi admin

Masalah:

- role `super_admin` saat ini terutama punya update ke `stores`

Saran:

- jika nantinya super admin perlu dashboard lebih luas, tambahkan policy terpisah yang eksplisit

## Checklist Saat Menambah Tabel Baru

Jika menambah fitur yang menyimpan data user:

1. buat tabel
2. aktifkan RLS
3. definisikan policy `SELECT`, `INSERT`, `UPDATE`, `DELETE` yang jelas
4. tambahkan interface di `src/types/database.ts`
5. audit kebutuhan role lain seperti artisan atau super admin
6. uji query dengan akun berbeda

## Checklist Saat Mengubah Policy

Sebelum mengubah RLS:

1. identifikasi apakah akses berbasis user, store, order, atau role
2. cek apakah frontend sudah punya guard yang selaras
3. cek apakah query Supabase existing akan tetap lolos policy baru
4. uji minimal sebagai customer, artisan, dan super admin
5. dokumentasikan perubahan di file ini dan SQL terkait
