# Panduan Deploy RekaBatik — Langkah demi Langkah

Panduan ini ditulis **sangat detail** supaya kamu bisa ikuti dari nol, meskipun belum pernah deploy website sebelumnya.

**Yang akan kita lakukan:**
1. Siapkan database di Supabase (tempat data & login)
2. Siapkan website di Vercel (tempat website online)
3. Hubungkan keduanya
4. Cek apakah semuanya jalan

**Estimasi waktu:** 30–60 menit (pertama kali)

---

## Sebelum Mulai — Siapkan Ini Dulu

Centang satu per satu:

- [ ] **Akun GitHub** sudah ada (repo sudah di: `https://github.com/Nademmm/RekaBatik`)
- [ ] **Akun Supabase** — daftar gratis di [supabase.com](https://supabase.com)
- [ ] **Akun Vercel** — daftar gratis di [vercel.com](https://vercel.com) (bisa login pakai GitHub)
- [ ] **Node.js** terinstall di komputer (versi 18 atau lebih baru)
  - Cek: buka PowerShell, ketik `node -v`, harus muncul angka versi
- [ ] **File gambar** di project sudah lengkap (lihat Bagian 0 di bawah)

---

## Bagian 0 — Pastikan Gambar Project Ada (PENTING!)

Website ini butuh file gambar. Kalau gambar hilang, **build bisa gagal**.

Pastikan folder dan file ini **ada** di komputer kamu:

```
src/assets/catalog-images/
  ├── parang.webp
  ├── mega_mendung.webp
  ├── ceplok.webp
  ├── sidomukti.webp
  ├── truntum.webp
  ├── kawung.webp
  ├── sekar_jagad.webp
  └── beras_utah.webp

src/imports/
  ├── rekabatik-logo.png
  └── auth-illustration.png
```

**Kalau file-file itu belum ada:** cari/copi dulu sebelum lanjut deploy.

---

## Bagian 1 — Buat Database di Supabase

### Langkah 1.1 — Buat project baru

1. Buka browser → masuk ke [supabase.com](https://supabase.com) → **Sign In**
2. Klik tombol **New Project**
3. Isi form:
   - **Name:** `rekabatik-prod` (bebas, terserah kamu)
   - **Database Password:** buat password kuat → **SIMPAN di catatan** (jangan lupa!)
   - **Region:** pilih **Southeast Asia (Singapore)** (paling dekat Indonesia)
4. Klik **Create new project**
5. **Tunggu 1–2 menit** sampai status project jadi hijau / siap

### Langkah 1.2 — Catat 2 kunci penting

1. Di dashboard Supabase, klik **Settings** (ikon gear di kiri bawah)
2. Klik **API**
3. Catat dan simpan di Notepad:

| Nama | Contoh bentuk | Di mana |
|------|---------------|---------|
| **Project URL** | `https://abcdefgh.supabase.co` | bagian **Project URL** |
| **anon public key** | `eyJhbGciOiJIUzI1NiIs...` (panjang) | bagian **Project API keys** → **anon** → **public** |

> **Peringatan:** Jangan pakai key yang bertuliskan `service_role`. Itu rahasia, jangan dimasukkan ke website!

### Langkah 1.3 — Jalankan SQL (buat tabel database)

1. Di Supabase, klik **SQL Editor** (menu kiri)
2. Klik **New query**
3. Buka file **`supabase/migrations/supabase_full_schema.sql`** di project kamu (pakai VS Code / Cursor)
4. **Select All** (Ctrl+A) → **Copy** (Ctrl+C) semua isinya
5. **Paste** (Ctrl+V) ke SQL Editor Supabase
6. Klik tombol **Run** (atau Ctrl+Enter)
7. Harus muncul pesan sukses (hijau). Kalau ada error merah, stop dan cek ulang — jangan lanjut dulu

**Catatan:** File ini cukup dijalankan **1 kali saja** di project Supabase **baru**.

### Langkah 1.4 — Buat akun Super Admin

Super admin = akun khusus untuk menyetujui toko pengrajin.

1. Klik **Authentication** → **Users**
2. Klik **Add user** → **Create new user**
3. Isi:
   - **Email:** email kamu (mis. `admin@email.com`)
   - **Password:** password kuat
   - Centang **Auto Confirm User**
4. Klik **Create user**
5. Klik user yang baru dibuat
6. Scroll ke **User Metadata** → klik **Edit**
7. Ganti isinya jadi:

```json
{
  "role": "super_admin"
}
```

8. Klik **Save**

### Langkah 1.5 — Buat tempat simpan foto toko (Storage)

1. Klik **Storage** (menu kiri)
2. Klik **New bucket**
3. Isi:
   - **Name:** `store-images` (harus persis seperti ini)
   - **Public bucket:** **ON** (aktifkan)
4. Klik **Create bucket**
5. Klik bucket `store-images` → tab **Policies** → **New policy**
6. Pilih template **Allow public read access** → **Save**
7. Buat policy kedua untuk upload:
   - **New policy** → **For full customization**
   - Policy name: `Artisans can upload`
   - Allowed operation: **INSERT**
   - Target roles: **authenticated**
   - WITH CHECK expression: `bucket_id = 'store-images'`
   - Klik **Save**

### Langkah 1.6 — Atur Auth URL (sementara dulu)

1. Klik **Authentication** → **URL Configuration**
2. Isi sementara:
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** tambahkan:
     ```
     http://localhost:5173/**
     ```
3. Klik **Save**

> URL production (Vercel) akan kita update lagi di Bagian 3.

---

## Bagian 2 — Tes di Komputer Dulu (Build Lokal)

Supaya tidak surprise saat deploy, kita tes dulu di komputer.

### Langkah 2.1 — Buat file `.env`

1. Di folder project, cari file **`.env.example`**
2. Duplikat → rename jadi **`.env`**
3. Buka `.env`, isi dengan data dari Langkah 1.2:

```env
VITE_SUPABASE_URL=https://ISI_PROJECT_URL_KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=ISI_ANON_KEY_KAMU
```

4. **Save** file

### Langkah 2.2 — Install & build

Buka PowerShell di folder project, ketik satu per satu:

```powershell
npm install
```

Tunggu selesai. Lalu:

```powershell
npm run build
```

**Kalau sukses:** muncul folder `dist/` dan tidak ada error merah.

**Kalau gagal:**
- Error tentang gambar → kembali ke Bagian 0
- Error tentang env → cek `.env` sudah benar belum

### Langkah 2.3 — (Opsional) Tes jalan di browser lokal

```powershell
npm run dev
```

Buka browser → `http://localhost:5173`

Coba:
- [ ] Halaman utama terbuka
- [ ] Buka `/catalog` — ada daftar batik
- [ ] Login pakai akun super admin
- [ ] Buka `/super-admin` — halaman verifikasi toko muncul

Kalau sudah oke, tekan **Ctrl+C** di PowerShell untuk stop server.

---

## Bagian 3 — Deploy ke Vercel

### Langkah 3.1 — Hubungkan GitHub ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Log In** (pakai GitHub)
2. Klik **Add New...** → **Project**
3. Cari repo **`RekaBatik`** → klik **Import**
4. Di halaman setup, pastikan:

| Setting | Isi yang benar |
|---------|----------------|
| Framework Preset | **Vite** |
| Root Directory | `./` (default) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Langkah 3.2 — Masukkan Environment Variables

**Sebelum klik Deploy**, scroll ke bagian **Environment Variables**.

Tambahkan **2 variabel** ini:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Project URL dari Supabase (Langkah 1.2) |
| `VITE_SUPABASE_ANON_KEY` | anon public key dari Supabase (Langkah 1.2) |

Pastikan environment-nya **Production** (centang Production).

> **Kenapa wajib?** Website butuh ini saat build. Kalau tidak diisi, website online tapi data/login tidak jalan.

### Langkah 3.3 — Deploy!

1. Klik tombol **Deploy**
2. Tunggu 1–3 menit (ada progress bar)
3. Kalau sukses, muncul layar **Congratulations!** dengan link website
4. **Catat URL-nya**, contoh: `https://rekabatik-xxxxx.vercel.app`

### Langkah 3.4 — Update URL di Supabase

Sekarang website sudah online. Supabase harus tahu alamatnya.

1. Kembali ke Supabase → **Authentication** → **URL Configuration**
2. Ubah:
   - **Site URL:** `https://rekabatik-xxxxx.vercel.app` (ganti dengan URL Vercel kamu)
   - **Redirect URLs:** tambahkan baris baru:
     ```
     https://rekabatik-xxxxx.vercel.app/**
     ```
3. Klik **Save**

---

## Bagian 4 — Cek Website Sudah Benar

Buka website Vercel kamu. Ikuti checklist ini **satu per satu**:

### 4.1 — Routing (halaman tidak error 404)

Ketik langsung di address bar browser (jangan klik menu):

| URL | Harusnya |
|-----|----------|
| `/` | Halaman utama tampil |
| `/catalog` | Katalog batik tampil |
| `/auth` | Halaman login tampil |

Lalu **tekan F5 (refresh)** di `/catalog`. Kalau masih tampil (bukan halaman 404 Vercel) = **berhasil**.

### 4.2 — Login & Super Admin

1. Buka `/auth` → login pakai akun super admin (Langkah 1.4)
2. Buka `/super-admin`
3. Harus muncul halaman verifikasi toko (boleh kosong kalau belum ada toko pending)

### 4.3 — Register customer

1. Logout
2. Register akun baru sebagai **customer**
3. Login → buka `/profile` → harus tampil halaman profil

### 4.4 — Register artisan

1. Register akun baru sebagai **artisan** (isi data toko)
2. Login sebagai super admin → `/super-admin`
3. **Approve** toko artisan tadi
4. Login lagi sebagai artisan → buka `/admin` → harus bisa masuk

### 4.5 — Fitur utama

- [ ] Katalog: lihat batik, klik detail
- [ ] Editor: buka `/custom`, coba tambah motif
- [ ] Keranjang: tambah item → buka `/cart`
- [ ] Chat: buat order kustom → coba kirim pesan di `/chat`

Kalau semua centang = **deploy sukses!**

---

## Bagian 5 — Deploy Ulang (Setelah Edit Kode)

Setiap kali kamu push kode baru ke GitHub, Vercel otomatis deploy ulang.

```powershell
git add .
git commit -m "pesan perubahan"
git push
```

Tunggu 1–2 menit → refresh website Vercel → perubahan muncul.

**Penting:** Kalau kamu ganti `VITE_SUPABASE_URL` atau `VITE_SUPABASE_ANON_KEY` di Vercel, klik **Redeploy** di dashboard Vercel supaya build ulang.

---

## Kalau Ada Masalah — Baca Ini

### Website putih / kosong

1. Buka website → tekan **F12** → tab **Console**
2. Kalau ada error Supabase → cek Environment Variables di Vercel sudah benar
3. Di Vercel → **Deployments** → klik deployment terbaru → **Redeploy**

### Refresh halaman jadi 404

- Pastikan file `vercel.json` ada di repo (sudah ada)
- Redeploy di Vercel

### Login berhasil tapi data kosong

- SQL belum dijalankan → ulangi Langkah 1.3
- Cek di Supabase → **Table Editor** → tabel `batik_items` harus ada isinya

### Chat tidak realtime (harus refresh manual)

- Supabase → **Database** → **Publications** → pastikan `messages` ada di `supabase_realtime`

### Upload foto toko gagal

- Pastikan bucket `store-images` sudah dibuat (Langkah 1.5)
- Pastikan bucket **public** dan policy INSERT sudah ada

### Build gagal di Vercel

- Klik deployment yang gagal → baca **Build Logs**
- Biasanya karena file gambar hilang (Bagian 0) atau error di kode

---

## Ringkasan Super Singkat

```
1. Supabase → buat project → run supabase_full_schema.sql
2. Supabase → buat super admin → buat bucket store-images
3. Komputer → buat .env → npm run build (tes)
4. Vercel → import repo → isi 2 env vars → Deploy
5. Supabase → update Site URL ke link Vercel
6. Tes website pakai checklist Bagian 4
```

---

## (Opsional) Pasang Domain Sendiri

Kalau punya domain (mis. `rekabatik.com`):

1. Vercel → project kamu → **Settings** → **Domains**
2. Ketik domain → ikuti instruksi DNS
3. Update **Site URL** di Supabase ke domain baru
4. Tambahkan `https://rekabatik.com/**` ke Redirect URLs

---

**Selesai!** Kalau stuck di langkah tertentu, catat: nomor langkah + screenshot error → minta bantuan dengan info itu.
