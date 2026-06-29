# Plan Improve Performance Website

## Summary

Target utama adalah menaikkan performa SPA React ini dari kondisi initial load yang berat menjadi lebih ringan di first render, lebih hemat request saat navigasi, dan lebih stabil di device menengah ke bawah. Fokus perbaikan diprioritaskan pada pengurangan ukuran bundle awal, pemecahan halaman berat menjadi chunk terpisah, penurunan frekuensi refetch realtime yang terlalu agresif, dan standarisasi loading image agar LCP dan interaksi awal tidak terlalu jelek.

## Current State Analysis

### 1. Initial bundle terlalu besar

* Semua halaman di-import secara eager di `src/app/routes.tsx`, termasuk halaman sangat berat seperti `CustomBatikPage`, `AdminPage`, `ChatPage`, dan `ProfilePage`.

* Tidak ditemukan penggunaan `React.lazy`, `Suspense`, atau route-level code splitting.

* Akibatnya, user yang hanya membuka homepage tetap ikut membayar biaya download, parse, dan execute untuk modul editor, admin, chat, dan halaman account.

### 2. `CustomBatikPage` menjadi hotspot performa terbesar

* `src/app/pages/CustomBatikPage.tsx` berukuran sangat besar dan memuat dependensi mahal seperti `fabric`, `motion/react`, `lucide-react`, `sonner`, serta banyak state dan listener.

* File ini juga melakukan `import.meta.glob(..., eager: true)` untuk seluruh SVG motif pada `src/assets/batik-svgs/*.svg`, sehingga semua motif ikut masuk ke bundle JS saat startup.

* Inisialisasi editor, asset map, snapshot history, dan event listener berada dalam satu file besar, sehingga parse cost, rerender risk, dan maintainability sama-sama buruk.

### 3. Query client-side masih boros dan beberapa bersifat N+1

* `src/app/pages/ChatPage.tsx` memuat semua order user lalu menjalankan query tambahan per toko untuk mengambil last message, sehingga skala request memburuk saat jumlah order bertambah.

* `src/app/layouts/RootLayout.tsx` melakukan refetch notifikasi penuh setiap ada perubahan apa pun pada tabel `orders`, padahal layout ini aktif hampir di semua route.

* `src/lib/CartContext.tsx` juga memanggil `fetchCart()` penuh pada setiap event realtime `cart_items`, membuat provider global mudah memicu rerender yang tidak perlu.

* `src/app/pages/CatalogPage.tsx` menjalankan fetch item di setiap perubahan search tanpa debounce, lalu sekaligus memanggil `fetchFavorites()` ulang.

* `src/app/pages/HomePage.tsx` mem-fetch beberapa dataset sekaligus pada mount tanpa caching atau pemisahan prioritas.

### 4. Image loading belum distandarkan

* Banyak penggunaan `<img>` langsung di banyak halaman besar (`HomePage`, `CatalogPage`, `CartPage`, `OrdersPage`, `ProfilePage`, `DesainHistoriPage`, `DesaJetisPage`, `AdminPage`, `ChatPage`, `RootLayout`).

* `src/app/components/ImageWithFallback.tsx` sudah ada, tetapi belum dijadikan abstraction standar dan belum memberi default `loading="lazy"` atau `decoding="async"`.

* Risiko utamanya adalah LCP buruk pada halaman publik dan bandwidth berlebih pada halaman yang memuat banyak kartu/gambar.

### 5. Dependency berpotensi gemuk

* `package.json` masih memuat dependency yang tidak terlihat dipakai di source seperti `@mui/material`, `@mui/icons-material`, `@emotion/react`, dan `@emotion/styled`.

* Dependensi mahal yang benar-benar dipakai seperti `fabric` dan `motion` belum dibatasi agar hanya dimuat saat dibutuhkan.

## Proposed Changes

### Fase 1 — Quick Wins dengan impact terbesar

#### 1. Terapkan route-level lazy loading

**Files**

* `src/app/routes.tsx`

* `src/app/components/ui/skeleton.tsx` atau komponen fallback loading yang sudah ada

**Perubahan**

* Ubah import eager semua page menjadi lazy import berbasis `React.lazy` atau API route lazy yang kompatibel dengan router yang sekarang dipakai.

* Prioritaskan pemisahan chunk untuk:

  * `CustomBatikPage`

  * `AdminPage`

  * `ChatPage`

  * `ProfilePage`

  * `CartPage`

  * `OrdersPage`

  * `DesainHistoriPage`

  * `SuperAdminPage`

* Pertahankan `HomePage` dan `RootLayout` sebagai bagian dari critical path bila memang menjadi landing utama.

* Tambahkan fallback loading ringan yang konsisten secara visual agar transisi route tetap premium, bukan blank screen.

**Alasan**

* Ini adalah perbaikan dengan dampak paling langsung ke Lighthouse performance karena menurunkan JS initial load dan parse time.

#### 2. Pisahkan `CustomBatikPage` dari bundle awal dan pecah hotspot internal

**Files**

* `src/app/pages/CustomBatikPage.tsx`

* file baru di bawah `src/app/pages/custom-batik/` atau folder serupa yang nyata dibuat saat implementasi

**Perubahan**

* Refactor `CustomBatikPage` menjadi beberapa modul:

  * shell halaman

  * editor/canvas manager

  * asset/pattern loader

  * panel UI/toolbox

  * util history/serialization

* Pindahkan logika pattern SVG dari eager load menjadi lazy on demand.

* Ganti `import.meta.glob(..., eager: true)` menjadi lazy glob lalu load SVG hanya saat style yang diperlukan benar-benar dipilih.

* Pastikan `fabric` hanya ikut dimuat ketika route `/custom` dibuka, bukan sejak homepage.

**Alasan**

* Halaman ini adalah biaya terbesar untuk startup, scripting, dan memory pressure. Pemecahan internal akan memperbaiki bundle splitting sekaligus memudahkan optimasi lebih lanjut.

#### 3. Tambahkan manual chunking di Vite

**Files**

* `vite.config.ts`

**Perubahan**

* Tambahkan `build.rollupOptions.output.manualChunks` untuk memisahkan vendor berat:

  * `fabric`

  * `motion`

  * `@supabase/supabase-js`

  * grup `radix`

* Pastikan chunking tidak memecah terlalu granular sehingga request waterfall justru memburuk; fokus pada vendor berat dan route berat.

**Alasan**

* Setelah lazy route diterapkan, manual chunking membantu menjaga chunk tetap stabil dan tidak menggumpal menjadi satu vendor bundle besar.

### Fase 2 — Kurangi request boros dan rerender global

#### 4. Optimasi notifikasi navbar agar tidak refetch seluruh `orders`

**Files**

* `src/app/layouts/RootLayout.tsx`

**Perubahan**

* Ubah `fetchNotifications()` agar query lebih sempit:

  * user customer: select hanya field yang benar-benar dipakai

  * artisan: cache nama toko agar tidak query `stores` berulang

* Saat event realtime datang, gunakan guard:

  * refetch hanya jika user login

  * debounce refetch singkat

  * bila memungkinkan, gunakan payload perubahan untuk memutuskan apakah counter perlu dihitung ulang

* Evaluasi ekstraksi logika notifikasi ke custom hook agar layout tidak menanggung terlalu banyak state bisnis.

**Alasan**

* `RootLayout` hidup di hampir seluruh aplikasi, jadi setiap refetch berat di sini memperburuk pengalaman global.

#### 5. Optimasi `CartContext` agar tidak fetch penuh di setiap perubahan

**Files**

* `src/lib/CartContext.tsx`

**Perubahan**

* Kurangi strategi `fetchCart()` penuh pada setiap event realtime.

* Gunakan salah satu pendekatan berikut pada implementasi:

  * optimistic update lokal untuk operasi `add`, `updateQuantity`, `remove`

  * fallback refetch hanya saat event tidak bisa direkonsiliasi

  * debounce/coalesce event realtime beruntun

* Stabilkan value provider dengan `useMemo` agar consumer tidak rerender hanya karena object identity berubah.

**Alasan**

* Context global yang sering refetch akan menjalar ke banyak komponen dan memperparah responsiveness.

#### 6. Hilangkan pola N+1 di `ChatPage`

**Files**

* `src/app/pages/ChatPage.tsx`

**Perubahan**

* Ganti flow `orders -> Promise.all(query last message per store)` dengan pengambilan data yang lebih terstruktur:

  * ambil semua order relevan sekali

  * ambil pesan terakhir secara batch untuk seluruh `order_id` terkait

  * rangkum latest message per store di client

* Jika query Supabase memungkinkan, gunakan bentuk select yang lebih kaya atau view/materialized strategy pada backend di fase lanjutan.

* Tambahkan memoization pada hasil grouping conversation agar pengurutan dan regrouping tidak dieksekusi berulang tanpa perubahan data.

**Alasan**

* Area chat biasanya sensitif terhadap latency. Mengurangi jumlah request akan langsung terasa pada waktu buka inbox.

#### 7. Debounce pencarian di katalog dan pisahkan fetch favorit

**Files**

* `src/app/pages/CatalogPage.tsx`

**Perubahan**

* Tambahkan debounce pada state `search` sebelum query Supabase dijalankan.

* Pisahkan `fetchFavorites()` dari efek pencarian agar favorit tidak dimuat ulang setiap user mengetik.

* Untuk fallback local filter, lakukan filter terhadap data yang sudah ada bila memungkinkan, bukan selalu fetch ulang.

**Alasan**

* Ini quick win kecil namun jelas, terutama pada device mobile dan koneksi lambat.

#### 8. Kurangi beban mount `HomePage`

**Files**

* `src/app/pages/HomePage.tsx`

**Perubahan**

* Pisahkan fetch data menjadi prioritas:

  * prioritas tinggi: konten hero atau section above the fold

  * prioritas rendah: reviews, trending, favorit

* Gunakan lazy section loading untuk blok di bawah fold bila perlu.

* Hindari request favorit saat user belum login.

**Alasan**

* Homepage adalah pintu masuk utama; pengurangan kerja di mount akan sangat membantu FCP/LCP/TTI.

### Fase 3 — Optimasi media dan render UI

#### 9. Jadikan `ImageWithFallback` sebagai komponen image standar

**Files**

* `src/app/components/ImageWithFallback.tsx`

* halaman-halaman yang banyak memakai `<img>`

**Perubahan**

* Tambahkan default aman:

  * `loading="lazy"` untuk gambar non-hero

  * `decoding="async"`

  * opsi `fetchPriority="high"` hanya untuk hero/LCP image tertentu

* Migrasikan pemakaian `<img>` pada kartu daftar, modal gallery, histori, profile, orders, dan katalog ke komponen ini secara bertahap.

* Untuk hero image yang benar-benar above the fold, tetap pakai prioritas tinggi dan jangan dipaksa lazy.

**Alasan**

* Standarisasi ini menurunkan risiko regressi karena optimasi image tidak bergantung disiplin manual di setiap halaman.

#### 10. Audit animasi berat dan interaksi mahal

**Files**

* `src/app/pages/HomePage.tsx`

* `src/app/pages/ProfilePage.tsx`

* `src/app/pages/DesainHistoriPage.tsx`

* `src/app/pages/CustomBatikPage.tsx`

* `src/app/layouts/RootLayout.tsx`

**Perubahan**

* Identifikasi motion yang purely dekoratif dan turunkan frekuensinya.

* Batasi animasi saat elemen masuk viewport, jangan animasi semua card sekaligus.

* Kurangi animasi yang memicu layout/repaint mahal pada mobile.

* Pada editor custom, prioritaskan interaksi kanvas dibanding efek visual sekunder.

**Alasan**

* Motion berlebihan bisa membuat skor performance jatuh walau bundle sudah dipisah.

### Fase 4 — Bundle hygiene dan observability

#### 11. Bersihkan dependency yang tidak terpakai

**Files**

* `package.json`

* pencarian penggunaan di seluruh `src/`

**Perubahan**

* Audit pemakaian `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, dan dependency lain yang dicurigai tidak terpakai.

* Hapus dependency yang benar-benar tidak digunakan setelah validasi build.

**Alasan**

* Membersihkan dependency menurunkan risiko vendor bundle membengkak dan mempercepat install/build.

#### 12. Tambahkan proses measurement agar optimasi bisa dibuktikan

**Files**

* `package.json`

* opsional dokumen di `docs/` jika ingin menyimpan baseline

**Perubahan**

* Tambahkan script analisis bundle, misalnya memakai visualizer Vite/Rollup.

* Simpan baseline metrik sebelum dan sesudah:

  * ukuran chunk

  * Lighthouse mobile

  * jumlah request awal

  * scripting time halaman `/`, `/catalog`, `/custom`

**Alasan**

* Tanpa measurement, optimasi mudah melebar ke perubahan kosmetik yang tidak memberi dampak nyata.

## Assumptions & Decisions

* Landing page utama tetap `HomePage`, jadi homepage harus menjadi route yang paling ringan.

* `CustomBatikPage` adalah route dengan toleransi loading terbesar karena sifatnya tools/editor, sehingga paling aman dijadikan lazy chunk berat.

* Optimasi awal difokuskan ke client-side karena arsitektur sekarang mengambil data langsung dari Supabase di frontend.

* Tidak diasumsikan adanya SSR atau framework migration; seluruh plan tetap kompatibel dengan stack Vite + React yang sekarang.

* Bila ada query yang secara ideal perlu dipindahkan ke SQL view atau RPC Supabase, itu ditempatkan sebagai optimasi lanjutan setelah quick wins client-side selesai.

## Prioritas Implementasi

1. `src/app/routes.tsx` — lazy route
2. `src/app/pages/CustomBatikPage.tsx` — split route chunk + lazy SVG loading
3. `vite.config.ts` — manual chunks
4. `src/app/layouts/RootLayout.tsx` — refetch notifikasi
5. `src/lib/CartContext.tsx` — refetch realtime keranjang
6. `src/app/pages/ChatPage.tsx` — hilangkan N+1
7. `src/app/pages/CatalogPage.tsx` — debounce search
8. `src/app/pages/HomePage.tsx` — kurangi kerja mount
9. `src/app/components/ImageWithFallback.tsx` + halaman yang memakai `<img>`
10. `package.json` — cleanup dependency dan tooling analisis

## Verification Steps

### Baseline sebelum implementasi

* Jalankan build production dan catat ukuran chunk utama.

* Jalankan Lighthouse mobile minimal pada `/`, `/catalog`, dan `/custom`.

* Catat jumlah request network awal untuk halaman `/` dan `/custom`.

### Verifikasi setelah implementasi

* Pastikan bundle awal mengecil dan route berat pindah ke chunk terpisah.

* Pastikan navigasi ke route berat tetap mulus dengan fallback loading yang rapi.

* Pastikan `CustomBatikPage` tetap menjaga fitur penting: load motif, edit canvas, save, cart, undo/redo, fullscreen.

* Pastikan notifikasi navbar, chat, dan keranjang tetap sinkron walau refetch dikurangi.

* Pastikan gambar non-hero menunda loading dengan benar tanpa broken layout.

* Pastikan Lighthouse mobile naik signifikan, terutama pada performance score dan scripting time.

### Acceptance criteria

* Homepage tidak lagi memuat kode editor/admin/chat pada initial load.

* Route `/custom` memuat asset motif dan modul editor hanya saat dibuka.

* Search katalog tidak menembakkan query pada setiap ketikan mentah.

* Realtime cart dan navbar tidak melakukan refetch penuh tanpa kontrol.

* Tidak ada regressi fungsional pada flow utama: login, katalog, custom, cart, chat, orders, profile, admin.

