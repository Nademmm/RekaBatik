# Architecture Guide

Dokumen ini memetakan arsitektur aplikasi RekaBatik berdasarkan implementasi repository saat ini. Fokus utama dokumen adalah:

- flow antarpages dan guard routing
- lapisan context global yang membungkus aplikasi
- query Supabase yang dijalankan oleh page, layout, dan context
- alur data end-to-end untuk customer, artisan, dan super admin

## Ringkasan Runtime

Stack runtime utama:

- frontend: Vite + React + TypeScript
- routing: React Router browser routing
- backend client-side: Supabase Auth, Postgres, Realtime
- state global: React Context

Urutan bootstrap aplikasi:

1. `src/main.tsx` me-mount aplikasi React.
2. `src/app/App.tsx` membungkus aplikasi dengan `AuthProvider`, `CartProvider`, dan `FullscreenProvider`.
3. `RouterProvider` memakai router dari `src/app/routes.tsx`.
4. Route root `/` memakai `RootLayout` sebagai shell bersama untuk header, footer, badge notifikasi, dan outlet page.

## Layer Aplikasi

### 1. Routing Layer

`src/app/routes.tsx` membagi route menjadi dua blok:

- public routes: bisa diakses tanpa login
- protected routes: dibungkus `ProtectedRoute` dan redirect ke `/auth?redirect=<path>` jika session belum ada

Struktur route aktif:

| Path | Tipe | Komponen | Catatan |
| --- | --- | --- | --- |
| `/` | Public | `HomePage` | Landing page, favorit, quick add to cart |
| `/auth` | Public | `AuthPage` | Login, register, OAuth |
| `/custom` | Public | `CustomBatikPage` | Editor desain batik |
| `/catalog` | Public | `CatalogPage` | Katalog dan favorit produk |
| `/desa-jetis` | Public | `DesaJetisPage` | Daftar toko publik |
| `/desa-jetis/:storeId` | Public | `DesaJetisStoreDetailPage` | Detail toko |
| `/belajar-batik` | Public | `BelajarBatikPage` | Konten edukasi |
| `/orders` | Protected | `OrdersPage` | Riwayat order customer |
| `/cart` | Protected | `CartPage` | Keranjang dan checkout |
| `/desain-histori` | Protected | `DesainHistoriPage` | Daftar desain tersimpan |
| `/chat` | Protected | `ChatPage` | Chat customer ke artisan |
| `/profile` | Protected | `ProfilePage` | Akun, alamat, favorit, toko |
| `/admin` | Protected | `AdminPage` | Dashboard artisan |
| `/super-admin` | Protected | `SuperAdminPage` | Verifikasi toko |

### 2. Layout Layer

`RootLayout` adalah shell bersama untuk hampir semua halaman selain `/auth`.

Tanggung jawab utama `RootLayout`:

- merender header, footer, dan `Outlet`
- membaca `user`, `userRole`, dan `cartCount` dari context
- menghitung badge notifikasi order
- subscribe realtime ke tabel `orders` untuk refresh notifikasi navbar

Peran query di layout:

- artisan: ambil `stores.name` berdasarkan `owner_id`, lalu ambil `orders` berdasar nama artisan
- customer: ambil `orders` berdasar `user_id`

### 3. Context Layer

Provider global aktif berurutan seperti ini:

```text
AuthProvider
└── CartProvider
    └── FullscreenProvider
        └── RouterProvider
```

#### `AuthProvider`

Lokasi: `src/lib/AuthContext.tsx`

Fungsi:

- mengambil session awal dengan `supabase.auth.getSession()`
- mendengar perubahan auth dengan `supabase.auth.onAuthStateChange()`
- menurunkan `userRole` dari `user.user_metadata.role`
- menyediakan `signOut()`

Role yang dikenali:

- `customer`
- `artisan`
- `super_admin`

#### `CartProvider`

Lokasi: `src/lib/CartContext.tsx`

Fungsi:

- memuat ringkasan keranjang user
- menyediakan CRUD item keranjang
- menyediakan `fetchFullCart()` dengan relasi `batik_items(*)` dan `custom_designs(*)`
- subscribe realtime ke tabel `cart_items` milik user aktif

#### `FullscreenProvider`

Lokasi: `src/lib/FullscreenContext.tsx`

Fungsi:

- menyimpan status `isFullMode`
- dipakai terutama oleh `CustomBatikPage` untuk mode editor layar penuh

## Flow Antarpages

### Flow utama customer

```text
/ atau /catalog
-> /auth
-> /catalog atau /custom
-> /cart
-> /orders
-> /chat (jika order kustom masih negosiasi)
-> /profile
```

Penjelasan:

- customer bisa mulai dari landing page, katalog, atau editor
- item katalog dan desain kustom bermuara ke `cart_items`
- checkout membuat record `orders`
- order kustom otomatis diarahkan ke percakapan di `/chat`

### Flow onboarding artisan

```text
/auth (register artisan)
-> insert record awal ke stores
-> /admin
-> menunggu approval di /super-admin
-> /profile tab store + /admin
```

Penjelasan:

- saat register artisan, `AuthPage` membuat user auth lalu insert baris `stores`
- status toko dikendalikan oleh super admin
- fitur kelola toko di profil hanya aktif jika role `artisan` dan status toko `approved`

### Flow super admin

```text
/auth
-> /super-admin
-> review stores
-> update status approved/rejected
```

### Flow negosiasi custom order

```text
/custom
-> simpan ke custom_designs
-> tambah ke cart_items
-> /cart
-> insert orders dengan status negotiating
-> insert messages template
-> /chat
-> artisan kirim price offer
-> customer accept/reject
-> /orders
```

Jika customer menerima penawaran:

- `messages.negotiation_status` menjadi `accepted`
- `orders.status` berubah ke `processing`
- `orders.payment_status` menjadi `pending`
- user diarahkan ke `/orders` untuk bayar

Jika customer menolak:

- `messages.negotiation_status` menjadi `rejected`
- `orders.status` menjadi `cancelled`
- user diarahkan kembali ke `/cart` untuk memilih toko lain

## Peta Page, Context, dan Query Supabase

### Auth dan session

| Modul | Query/Auth Call | Tujuan |
| --- | --- | --- |
| `AuthContext` | `auth.getSession()` | Memuat session awal |
| `AuthContext` | `auth.onAuthStateChange()` | Sinkronisasi login, logout, update user |
| `AuthContext` | `auth.signOut()` | Logout global |
| `ProtectedRoute` | Tidak query DB | Redirect ke `/auth` jika belum login |
| `AuthPage` | `auth.signInWithPassword()` | Login email/password |
| `AuthPage` | `auth.signUp()` | Register user baru |
| `AuthPage` | `auth.signInWithOAuth()` | Login social |
| `AuthPage` | `from("stores").insert()` | Membuat toko awal saat register artisan |

### Shell dan notifikasi global

| Modul | Query | Tujuan |
| --- | --- | --- |
| `RootLayout` | `from("stores").select("name").eq("owner_id", user.id)` | Cari nama toko artisan aktif |
| `RootLayout` | `from("orders").select(...)` | Hitung badge unpaid, negotiating, awaiting verification |
| `RootLayout` | `channel("navbar-orders-realtime")` | Refresh badge saat order berubah |
| `CartContext` | `from("cart_items").select("*")` | Ambil ringkasan keranjang |
| `CartContext` | `from("cart_items").select("*, batik_items(*), custom_designs(*)")` | Ambil isi keranjang lengkap |
| `CartContext` | `from("cart_items").insert/update/delete()` | Operasi CRUD keranjang |
| `CartContext` | `channel("cart-changes")` | Sinkronisasi realtime keranjang |

### Discovery dan halaman publik

| Halaman | Query | Tujuan |
| --- | --- | --- |
| `HomePage` | `from("batik_items").select("*").order("sold").limit(6)` | Pola populer |
| `HomePage` | `from("reviews").select("*").limit(4)` | Review landing page |
| `HomePage` | `from("favorite_batik")` | Baca/toggle favorit user |
| `HomePage` | `from("cart_items")` | Quick add produk ke keranjang |
| `CatalogPage` | `from("batik_items").select("*")` | Daftar katalog dan search |
| `CatalogPage` | `from("favorite_batik")` | Baca/toggle favorit |
| `DesaJetisPage` | `from("stores").select("*").eq("status", "approved")` | Daftar toko publik |
| `DesaJetisPage` | `from("favorite_stores")` | Baca/toggle favorit toko |
| `DesaJetisStoreDetailPage` | `from("stores").select("*").eq("id", storeId)` | Detail toko |
| `DesaJetisStoreDetailPage` | `from("favorite_stores")` | Status favorit dan toggle |

Catatan:

- halaman publik toko hanya menampilkan atau mengambil toko `approved`
- katalog dan beranda punya fallback lokal bila query katalog gagal

### Editor dan histori desain

| Halaman | Query | Tujuan |
| --- | --- | --- |
| `CustomBatikPage` | `from("batik_items").select("*").order("id")` | Ambil motif dasar untuk editor |
| `CustomBatikPage` | `from("custom_designs").select("*").eq("id", editDesignId).eq("user_id", user.id)` | Load desain untuk edit ulang |
| `CustomBatikPage` | `from("custom_designs").insert()` | Simpan desain baru |
| `CustomBatikPage` | `from("custom_designs").update()` | Update desain tersimpan |
| `DesainHistoriPage` | `from("custom_designs").select("*").eq("user_id", user.id)` | Ambil histori desain |
| `DesainHistoriPage` | `from("custom_designs").delete()` | Hapus desain |
| `DesainHistoriPage` | `from("cart_items").select("id")` | Cek apakah desain sudah ada di cart |
| `DesainHistoriPage` | `from("cart_items").insert()` | Tambahkan desain ke keranjang |

### Checkout dan order customer

| Halaman | Query | Tujuan |
| --- | --- | --- |
| `CartPage` | `fetchFullCart()` dari `CartContext` | Ambil item keranjang lengkap |
| `CartPage` | `from("user_addresses").select("*")` | Buku alamat saat checkout |
| `CartPage` | `from("stores").select("*").eq("status", "approved")` | Pilihan toko untuk order kustom |
| `CartPage` | `from("orders").insert()` | Membuat order dari keranjang |
| `CartPage` | `from("messages").insert()` | Auto-create pesan pembuka negosiasi |
| `CartPage` | `from("user_addresses").insert()` | Simpan alamat baru ke address book |
| `CartPage` | `from("cart_items").delete().eq("user_id", user.id)` | Kosongkan keranjang setelah checkout |
| `OrdersPage` | `from("orders").select("*").eq("user_id", user.id)` | Daftar order customer |
| `OrdersPage` | `from("orders").update()` | Konfirmasi diterima, status bayar, ulasan |
| `OrdersPage` | `from("batik_items").select("id").eq("name", order.item)` | Cari ulang produk untuk buy again |
| `OrdersPage` | `from("cart_items").insert()` | Buy again ke keranjang |

### Chat, negosiasi, dan operasi artisan

| Halaman | Query | Tujuan |
| --- | --- | --- |
| `ChatPage` | `from("orders").select("id, artisan, status, date, total")` | Bentuk daftar percakapan per toko |
| `ChatPage` | `from("messages").select("*").in("order_id", orderIds)` | Ambil riwayat chat |
| `ChatPage` | `channel("chat-store-*")` | Realtime insert/update messages |
| `ChatPage` | `from("messages").insert()` | Kirim teks, gambar, atau respon negosiasi |
| `ChatPage` | `from("messages").update({ negotiation_status })` | Accept/reject price offer |
| `ChatPage` | `from("orders").update(...)` | Ubah order setelah accept/reject offer |
| `AdminPage` | `from("stores").select("*").eq("owner_id", user.id)` | Ambil profil toko artisan |
| `AdminPage` | `from("orders").select("*").eq("artisan", storeInfo.name)` | Ambil order milik toko |
| `AdminPage` | `from("messages").select("*").in("order_id", orderIds)` | Riwayat chat per customer |
| `AdminPage` | `channel("admin-chat-user-*")` | Realtime pesan masuk |
| `AdminPage` | `from("messages").insert()` | Balas chat, kirim gambar, kirim price offer |
| `AdminPage` | `from("orders").update()` | Verifikasi pembayaran, update status, estimasi, resi |

Catatan penting:

- pengelompokan chat customer dilakukan per `artisan` pada tabel `orders`
- dashboard artisan mengandalkan kecocokan `orders.artisan` dengan `stores.name`

### Profil, favorit, alamat, dan manajemen toko

| Halaman | Query/Auth Call | Tujuan |
| --- | --- | --- |
| `ProfilePage` | `from("user_addresses").select/insert/update/delete()` | CRUD buku alamat |
| `ProfilePage` | `from("favorite_stores").select("*, stores(*)")` | Favorit toko user |
| `ProfilePage` | `from("favorite_batik").select("*, batik_items(*)")` | Favorit batik user |
| `ProfilePage` | `from("stores").select("*").eq("owner_id", user.id)` | Ambil data toko artisan |
| `ProfilePage` | `from("stores").insert/update()` | Buat atau ubah profil toko |
| `ProfilePage` | `auth.updateUser({ data: { full_name }})` | Ubah nama |
| `ProfilePage` | `auth.signInWithPassword()` | Verifikasi password lama |
| `ProfilePage` | `auth.updateUser({ password })` | Ubah password |
| `ProfilePage` | `from("favorite_stores").delete()` | Hapus favorit toko |
| `ProfilePage` | `from("favorite_batik").delete()` | Hapus favorit batik |

Guard bisnis di `ProfilePage`:

- tab store disembunyikan untuk user biasa
- fetch store tidak dijalankan untuk non-artisan
- aksi simpan toko ditolak jika user bukan artisan approved
- redirect defensif memaksa user kembali ke tab `account` bila tab store tidak valid

### Moderasi super admin

| Halaman | Query | Tujuan |
| --- | --- | --- |
| `SuperAdminPage` | `from("stores").select("*").order("id", desc)` | Ambil daftar toko |
| `SuperAdminPage` | `from("stores").update({ status })` | Approve atau reject toko |

## Flow Data End-to-End

### 1. Login dan role resolution

```text
AuthPage
-> supabase.auth.signInWithPassword/signUp/signInWithOAuth
-> AuthContext menerima perubahan session
-> AuthContext menurunkan userRole dari user_metadata.role
-> Route/layout/page menyesuaikan UI dan akses
```

### 2. Katalog ke checkout

```text
HomePage/CatalogPage
-> baca batik_items
-> insert/update cart_items
-> CartContext refresh cartCount
-> CartPage baca cart_items + relasi
-> insert orders
-> hapus cart_items user
-> OrdersPage membaca order terbaru
```

### 3. Custom design ke negosiasi

```text
CustomBatikPage
-> baca batik_items untuk daftar motif
-> insert/update custom_designs
-> cart_items.custom_design_id
-> CartPage insert orders(status=negotiating)
-> CartPage insert messages template
-> ChatPage membaca orders + messages
-> AdminPage kirim price offer
-> ChatPage accept/reject
-> OrdersPage lanjut pembayaran atau batal
```

### 4. Onboarding artisan ke approval

```text
AuthPage register artisan
-> insert stores(owner_id=user.id)
-> SuperAdminPage review stores
-> update stores.status
-> ProfilePage/AdminPage membuka fitur lanjutan hanya jika approved
```

## Tabel Supabase yang Menjadi Backbone

| Tabel | Dipakai oleh |
| --- | --- |
| `stores` | auth artisan, halaman publik toko, profile, admin, super admin, root layout |
| `batik_items` | home, catalog, custom editor, orders buy again |
| `favorite_batik` | home, catalog, profile |
| `favorite_stores` | desa jetis, detail toko, profile |
| `custom_designs` | custom editor, desain histori, cart relation |
| `cart_items` | home, catalog, desain histori, cart context, orders |
| `orders` | root layout, cart, orders, chat, admin |
| `messages` | cart auto-template, chat customer, chat artisan/admin |
| `user_addresses` | cart, profile |
| `reviews` | home |

## Keputusan Arsitektur yang Perlu Diperhatikan

- aplikasi adalah pure SPA; semua route browser harus di-rewrite ke `index.html`
- integrasi backend dilakukan langsung dari client ke Supabase tanpa backend custom
- source of truth role berasal dari `user_metadata.role`, bukan tabel profil tersendiri
- relasi order ke artisan saat ini bersifat logis melalui `orders.artisan = stores.name`, bukan foreign key numerik
- notifikasi navbar dan sinkronisasi keranjang memakai Supabase Realtime
- beberapa halaman memakai fallback lokal untuk menjaga UI tetap hidup saat query katalog gagal

## Risiko dan Titik Sensitif

- perubahan nama toko artisan dapat memengaruhi query yang mengandalkan `orders.artisan`
- banyak flow bisnis penting masih hidup di sisi client, sehingga RLS Supabase tetap wajib kuat
- `CustomBatikPage` adalah page dengan state paling kompleks karena menggabungkan canvas state, URL param edit, histori, dan persistence ke database
- deploy tanpa SPA rewrite akan memicu 404 saat refresh route seperti `/profile`, `/orders`, atau `/admin`

## Referensi Dokumen Lain

- `README.md`
- `docs/database.md`
- `docs/rls-policies.md`
- `docs/custom-editor.md`
- `docs/deployment.md`
