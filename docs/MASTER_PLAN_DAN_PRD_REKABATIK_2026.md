# MASTER BUSINESS PLAN & PRODUCT REQUIREMENT DOCUMENT (PRD) RINCI

**Nama Proyek:** RekaBatik: Web-Based Interactive Batik Customization & Fair-Trade Artisan Marketplace  
**Fokus Wilayah:** Sentra Kampung Batik Jetis Sidoarjo, Koridor Kriya Jawa Timur, & Pasar Konsumen Nasional  
**Target Implementasi MVP:** 3 – 4 Minggu (Rapid Lean Development Sprint)  
**Versi Dokumen:** 2.0 (Comprehensive Specification Edition)  
**Tujuan Dokumen:** Menyediakan cetak biru bisnis terverifikasi dan spesifikasi rekayasa produk tingkat operasional untuk membangun platform kustomisasi batik interaktif dan *marketplace* pengrajin lokal berkeadilan (*fair-trade*) yang mengintegrasikan target SDGs PBB (SDG 8, 11, 12, 9, 4, 10).

---

# BAGIAN I: STRATEGI BISNIS & ANALISIS PASAR MENDALAM

---

## 1. Ringkasan Eksekutif (Executive Summary)

Tahun 2026 menandai momentum krusial bagi pelestarian warisan budaya nusantara di tengah disrupsi ganda industri tekstil: krisis kepunahan regenerasi kriya wastra tradisional dan ancaman pencemaran lingkungan akibat *fast fashion*. Meskipun batik telah diakui oleh UNESCO sebagai *Masterpiece of the Oral and Intangible Heritage of Humanity* sejak 2009, rantai nilai kriya batik di Indonesia masih terjebak dalam model konvensional yang tidak adil dan tidak berkelanjutan.

Sektor pengrajin batik skala mikro dan menengah di Jawa Timur (khususnya di sentra bersejarah seperti Kampung Batik Jetis Sidoarjo, sentra kriya Madura, dan Mojokerto) berada dalam posisi rentan:
1. **Ketergantungan Tengkulak Eksploitatif:** Pengrajin tidak memiliki akses pasar langsung ke konsumen modern dan terpaksa menjual kain batik tulis manual dengan harga rendah ke pedagang perantara, dengan potongan margin keuntungan perantara mencapai 40% – 60%.
2. **Kesenjangan Desain Generasi Muda:** Generasi Z dan milenial memandang batik sebagai busana formal yang kaku, monokrom, dan seragam. Minimnya media kustomisasi digital memutus minat anak muda untuk mengenakan wastra nusantara sehari-hari.
3. **Krisis Limbah Tekstil (*Deadstock Crisis*):** Model produksi massal spekulatif di industri pakaian menghasilkan sekitar 30% – 40% stok kain tak terjual yang akhirnya berakhir di TPA dan mencemari ekosistem air dengan residu pewarna kimia sintetis.

Platform ini hadir sebagai **Web-Based Interactive Batik Customization & Fair-Trade Artisan Marketplace** yang mengintegrasikan mesin editor vektor *Dual-Canvas* (Fabric.js + Offscreen Bitmap Canvas) dengan sistem negosiasi harga *real-time* berbasis WebSocket. RekaBatik menggeser paradigma industri menuju **manufaktur presisi *Made-to-Order* (Zero Deadstock)**, di mana kain hanya diproduksi setelah ada rancangan dan kesepakatan harga yang adil (*fair trade*) antara pembeli urban dan pengrajin daerah, memberikan efisiensi material 100% dan meningkatkan pendapatan bersih pengrajin hingga 300%.

---

## 2. Analisis Makroekonomi & Landskap Regulasi 2026

### 2.1 Regulasi Global & Kesinambungan SDGs PBB
Sesuai arahan pembangunan global PBB 2030 dan regulasi rantai pasok berkelanjutan (*EU Corporate Sustainability Due Diligence Directive*), konsumen global maupun domestik kian menuntut transparansi etika kerja dan dampak lingkungan produk fesyen:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   KORELASI TIGA PILAR UTAMA SDGS                       │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 💼 SDG 8: DECENT   │ 🏛️ SDG 11: SUSTAIN │ ♻️ SDG 12: RESPONSIBLE       │
│    WORK & GROWTH   │    COMMUNITIES     │    PRODUCTION & CONSUMPTION  │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ Target 8.3 & 8.9:  │ Target 11.4:       │ Target 12.2 & 12.5:          │
│ Formalisasi UMKM,  │ Perlindungan dan   │ Manufaktur Made-to-Order,    │
│ sistem fair-trade, │ pelestarian warisan│ eliminasi deadstock tekstil, │
│ upah adil perajin. │ budaya kriya lokal.│ opsi pewarna alami ramah air.│
└────────────────────┴────────────────────┴──────────────────────────────┘
```

* **SDG 8 (Target 8.3 & 8.9):** Memberikan infrastruktur e-commerce mandiri bagi pengrajin lokal untuk menetapkan harga adil (*fair compensation*) melalui fitur penawaran harga interaktif di modul obrolan.
* **SDG 11 (Target 11.4):** Menyelamatkan pakem motif nusantara (Parang, Kawung, Mega Mendung, Truntum, Sidomukti, Sekar Jagad) dari kepunahan melalui digitalisasi vektor dan modul ensiklopedia filosofis.
* **SDG 12 (Target 12.5):** Menerapkan paradigma *zero-overproduction*; tidak ada kain mori yang dicanting atau dicelup malam tanpa kepastian kepemilikan konsumen.

### 2.2 Regulasi Domestik: Pelindungan HAKI, Dekranasda, & Mandat Ekonomi Kreatif
* **UU No. 28/2014 tentang Hak Cipta & Indikasi Geografis:** Melindungi orisinalitas motif komunal daerah (seperti motif *Beras Wutah* khas Jetis Sidoarjo). Sistem kurasi Super Admin RekaBatik mencegah masuknya produk sablon printing tekstil murah impor yang membajak motif asli.
* **Instruksi Presiden No. 2/2022 tentang P3DN (Peningkatan Penggunaan Produk Dalam Negeri):** Mendorong belanja seragam instansi pemerintah dan BUMN dialihkan ke produk kriya UMKM lokal bersertifikasi.
* **Mandat Dekranasda Jawa Timur:** Program percepatan transformasi digital 1.000 sentra UMKM kriya pedesaan guna memperluas inklusi perbankan dan transaksi digital.

### 2.3 Lanskap Sentra Kriya Batik Jawa Timur
Jawa Timur memiliki lebih dari 38 kabupaten/kota dengan karakter motif pesisiran dan pedalaman yang khas. RekaBatik mengonsentrasikan fase implementasi pada 4 sentra strategis:

| Sentra Batik | Kabupaten/Kota | Karakteristik & Profil Fasilitas | Kebutuhan Kritis |
|---|---|---|---|
| **Kampung Batik Jetis** | Sidoarjo | Sentra batik tertua Jawa Timur (sejak 1675), karakter warna cerah pesisiran (*Beras Wutah*, *Kembang Bayem*), puluhan pengrajin skala rumahan. | Akses pasar langsung tanpa tengkulak, digitalisasi portofolio toko, dan regenerasi pembeli muda. |
| **Sentra Kriya Tanjungbumi** | Bangkalan (Madura) | Karakter batik gentongan dengan perendaman alami tahan lama, tingkat kerumitan canting sangat tinggi. | Sistem negosiasi harga adil (*bidding*) yang menghargai lamanya pengerjaan berbulan-bulan. |
| **Kampung Batik Kauman & Kliwon** | Mojokerto | Corak khas peninggalan Majapahit (*Surya Majapahit*, *Koco Piring*), binaan Dekranasda aktif. | Standardisasi pemesanan seragam B2B dan eksposur katalog online. |
| **Sentra Lasem & Tuban** | Tuban / Pesisir Utara | Akulturasi budaya Tionghoa-Jawa (Lokcan), kain tenun gedog tradisional yang sangat ramah lingkungan. | Platform pemesanan *on-demand* dengan opsi serat kain alami. |

---

## 3. Analisis Kompetisi & Kesenjangan Pasar (Market Void)

| Kategori Solusi | Contoh Pemain | Kelemahan Kritis di Pasar Indonesia 2026 |
|---|---|---|
| **Marketplace Horisontal Umum** | Tokopedia, Shopee, TikTok Shop. | • **Harga Kaku & Monoton:** Tidak mendukung negosiasi variabel kain kustom manual.<br>• **Didominasi Produk Pabrik:** Batik cetak/sablon pabrik Rp 30 ribuan menenggelamkan karya asli pengrajin canting.<br>• **Tanpa Fitur Desain:** Pembeli tidak bisa memodifikasi warna atau layout motif. |
| **Platform Print-on-Demand (PoD)** | Tees.co.id, Custom.co.id. | • **Bukan Kain Wastra Asli:** Hanya sablon gambar bitmap di atas kaos katun atau poliester sintetis.<br>• **Menghilangkan Nilai Kriya:** Tidak melibatkan pengrajin tradisional; produksi dilakukan oleh mesin cetak otomatis pabrik.<br>• **Nir-Filosofi:** Tidak ada edukasi atau perlindungan terhadap pakem motif. |
| **Butik Batik & Galeri Fisik** | Danar Hadi, Batik Keris, Galeri Pasar Klewer. | • **Biaya Sangat Tinggi:** *Overhead* sewa toko mewah membebankan markup 300% ke konsumen.<br>• **Desain Statis Jadi:** Hanya menjual baju yang sudah jadi dijahit; tidak ada personalisasi warna/motif.<br>• **Pengrajin Terisolasi:** Perajin di desa hanya menerima upah jahit borongan tanpa pengakuan merek. |
| **Solusi RekaBatik (Platform Kami)** | **RekaBatik Web Ecosystem** | • **Kustomisasi Vektor Web Interaktif:** Mesin Fabric.js memungkinkan ubah warna per layer motif secara *real-time*.<br>• **Fair-Trade Direct Bidding:** Komunikasi & negosiasi harga langsung via WebSocket.<br>• **Pemberdayaan Sentra Desa:** Etalase resmi toko pengrajin Jetis dengan verifikasi mutu.<br>• **Zero Deadstock:** Manufaktur presisi *Made-to-Order* ramah lingkungan. |

---

## 4. Profil Target Pelanggan (Ideal Customer Profile)

### 4.1 Spesifikasi Konsumen & Mitra UMKM
* **Segmen B2C (Konsumen Perorangan):** Pria & Wanita usia 19 – 35 tahun (Gen Z & Milenial), berdomisili di perkotaan (Surabaya, Jakarta, Bandung, Malang), aktif di media sosial, menyukai tren *berkain modern*, memiliki kesadaran terhadap keberlanjutan (*conscious consumer*).
* **Segmen B2B (Instansi / Komunitas):** Perusahaan, sekolah, kepanitiaan event, dan BUMN yang membutuhkan seragam batik eksklusif dalam jumlah 20 – 500 potong dengan motif representatif instansi.
* **Segmen Mitra UMKM (Artisan):** Pemilik bengkel batik tulis/cap tradisional di sentra kriya Jawa Timur, mengoperasikan 3 – 20 pembatik, memiliki kapasitas produksi terukur, dan membutuhkan kanal penjualan digital mandiri.

### 4.2 Pengambil Keputusan Utama (Economic Buyer)
* **B2C Buyer:** Individu yang menginginkan baju batik yang tidak pasaran (*unique bespoke design*) untuk acara wisuda, pernikahan, atau busana kerja harian.
* **B2B Decision Maker:** *Human Resources (HR) Director*, *Corporate Communications Manager*, atau Ketua Panitia Pengadaan Seragam yang bertanggung jawab atas anggaran seragam dan kepatuhan pengadaan lokal (TKDN).

### 4.3 Pengguna Operasional Harian (Champion / End-User)
* **Konsumen Kreatif:** Pengguna yang mengeksplorasi studio kanvas, mencoba kombinasi palet warna modern, dan mengajukan pesanan kustom.
* **Artisan Shop Manager:** Pemilik atau staf toko pengrajin di desa yang mengoperasikan ponsel pintar untuk merespons tawaran harga di fitur obrolan, mengonfirmasi stok kain mori, dan menginput nomor resi ekspedisi kurir.

---

## 5. Model Finansial & Proyeksi Unit Economics

### 5.1 Rincian Paket Harga & Monetisasi

| Komponen | Nilai / Tarif | Deskripsi & Cakupan Layanan |
|---|---|---|
| **Marketplace Take-Rate (Platform Fee)** | **8% – 10%** per transaksi sukses | Dikenakan pada setiap pesanan kustom B2C yang selesai dibayar. Termasuk biaya penjaminan pembayaran (*escrow*), bandwidth WebSocket, dan akses canvas. |
| **Paket Kustomisasi B2B Korporat** | **Rp 5.000.000 – Rp 35.000.000** per kontrak | Layanan asistensi motif khusus institusi, pembuatan sampel kain fisik, hak komersial motif eksklusif, dan kurasi pengrajin berkapasitas besar. |
| **Opsi Premium Eco-Dye & Natural Fabric** | **Markup 15% – 25%** dari nilai kain | Fitur tambahan (*add-on*) bagi pemesan yang memilih pewarna alami ramah lingkungan (daun indigo, kulit soga) dan kain sutra ATBM tenun tangan. |
| **Lencana Mitra Resmi & Fitur Prioritas** | **Rp 150.000 / bulan** (Opsional) | Penempatan profil toko pengrajin di daftar teratas (*Featured Artisan*) pada direktori Desa Jetis dan halaman beranda. |

### 5.2 Proyeksi Finansial 3 Tahun (2026 – 2028)

| Metrik Finansial | Tahun 1 (2026) | Tahun 2 (2027) | Tahun 3 (2028) |
|---|---|---|---|
| **Jumlah Mitra Pengrajin Aktif** | 25 Toko | 80 Toko | 250 Toko |
| **Volume Transaksi Kain Selesai** | 2.400 Pesanan | 9.600 Pesanan | 32.000 Pesanan |
| **Gross Merchandise Value (GMV)** | **Rp 1,08 Miliar** | **Rp 4,51 Miliar** | **Rp 16,00 Miliar** |
| **Annual Platform Revenue (Take-Rate & Fee)** | **Rp 129,6 Juta** | **Rp 541,2 Juta** | **Rp 1,92 Miliar** |
| **Pendapatan Kontrak B2B Korporat** | **Rp 150,0 Juta** | **Rp 420,0 Juta** | **Rp 1,25 Miliar** |
| **Total Gross Revenue Platform** | **Rp 279,6 Juta** | **Rp 961,2 Juta** | **Rp 3,17 Miliar** |
| **Biaya Operasional (Server, Cloud, Tim)** | **Rp 145,0 Juta** | **Rp 380,0 Juta** | **Rp 980,0 Juta** |
| **Gross Margin (%)** | **74%** | **79%** | **83%** |
| **Net EBITDA Margin (%)** | **18%** | **31%** | **45%** |

---

## 6. Strategi Go-To-Market (GTM) & Pertahanan Bisnis (Moats)

* **Lead Magnet: "Desain Batik Anda Sendiri Gratis & Unduh Resolusi Tinggi":** Membuka akses penuh editor kanvas Fabric.js kepada seluruh pengunjung web tanpa biaya. Pengguna dapat merancang motif dan mengunduh berkas gambar secara gratis, menciptakan viralitas di media sosial (*organic TikTok & Instagram shares*).
* **Kemitraan Strategis Paguyuban Sentra Kriya:** Menjalin kerja sama institusional dengan Paguyuban Batik Jetis Sidoarjo dan Dekranasda Kabupaten Sidoarjo untuk onboarding resmi bengkel pengrajin generasi pertama.
* **Moat #1: Basis Data Aset Vektor SVG Terkurasi Berdasarkan Pakem:** Memiliki pustaka aset vektor SVG motif klasik nusantara yang telah dipecah menjadi lapisan warna (*layers*) yang dapat diubah warnanya (*recolorable*), suatu aset intelektual yang sulit ditiru oleh e-commerce umum.
* **Moat #2: Efek Jaringan Rantai Nilai (*Artisan Network Effect*):** Semakin banyak sanggar pengrajin terdaftar, semakin variatif spesifikasi bahan dan teknik (tulis, cap, kombinasi) yang tersedia, mengunci pembeli untuk selalu kembali ke RekaBatik.
* **Moat #3: Kurasi Keaslian Super Admin (Anti-Counterfeit Protection):** Standar verifikasi pendaftaran toko oleh Super Admin menjamin bahwa hanya pembatik asli yang dapat berjualan, melindungi konsumen dari penipuan kain printing tekstil tiruan.

---

# BAGIAN II: PRODUCT REQUIREMENT DOCUMENT (PRD) — MVP EDITION

---

## 1. Ikhtisar Rekayasa Produk

| Parameter Teknis | Spesifikasi Detail |
|---|---|
| **Tipe Aplikasi** | Mobile-Responsive Single Page Application (B2C & B2B Web App) |
| **Jangka Waktu Eksekusi** | 3 – 4 Minggu (Rapid Lean Development Sprint) |
| **Target Browser** | Google Chrome >= v115, Safari iOS >= v16, Mozilla Firefox >= v118, Microsoft Edge >= v115 |
| **Resolusi Target** | Adaptif penuh: 360 × 640 (ponsel) hingga 1920 × 1080 / 4K (desktop monitor) |
| **Arsitektur Inti** | Client-Side SPA (React 18.3, TypeScript 5, Vite 6) + BaaS PostgreSQL (Supabase) |

---

## 2. Metrik Kinerja Produk (Engineering & Product KPIs)

* **Canvas Smoothness (FPS):** Menjaga frame rate rendering kanvas stabil pada **≥ 55 – 60 FPS** saat memanipulasi layer objek vektor SVG dan sapuan kuas.
* **Realtime Chat WebSocket Latency:** Waktu pengiriman dan penerimaan pesan serta pembaruan tawaran harga **≤ 300 ms**.
* **High-Res Export Generation:** Waktu penggabungan (*flattening*) Dual-Canvas ke file PNG beresolusi tinggi **≤ 2,5 detik**.
* **Crash-Free Session:** **≥ 99,5%** pada sesi kustomisasi kanvas di peramban seluler.

---

## 3. Batasan Ruang Lingkup MVP (In-Scope vs. Out-of-Scope)

| Status | Fitur / Kapabilitas | Justifikasi Rekayasa |
|---|---|---|
| **IN-SCOPE** | **Interactive Dual-Canvas Studio** | Inti nilai produk: manipulasi objek SVG dan coretan kuas bebas secara simultan. |
| **IN-SCOPE** | **Dynamic Multi-Layer Recoloring** | Memungkinkan personalisasi warna primer, sekunder, dan latar belakang motif batik secara instan. |
| **IN-SCOPE** | **Real-Time WebSocket Negotiation** | Memfasilitasi kesepakatan harga adil antara pembeli dan pengrajin secara langsung. |
| **IN-SCOPE** | **Artisan Directory & Profile** | Membuka visibilitas sentra Desa Jetis Sidoarjo dan etalase karya bengkel pengrajin. |
| **IN-SCOPE** | **Ensiklopedia Filosofi "Belajar Batik"** | Edukasi kultural untuk menjaga pakem budaya dan memperkuat aspek SDG 11 & SDG 4. |
| **IN-SCOPE** | **End-to-End Order Lifecycle & Resi** | Alur transaksi transparan dari `negotiating` hingga `delivered` dengan nomor resi kurir. |
| **IN-SCOPE** | **Multi-Tier RBAC Governance** | Pemisahan hak akses aman antara `customer`, `artisan`, dan `super_admin`. |
| **OUT-OF-SCOPE** | **Model 3D Three.js Virtual Fitting Room** | Menghindari beban GPU perangkat menengah bawah dan inakurasi proyeksi bidang datar kain kriya. |
| **OUT-OF-SCOPE** | **AI Generative Text-to-Image Motif** | Dihindari pada MVP guna menjaga keaslian filosofi sakral pakem batik nusantara dari halusinasi AI. |
| **OUT-OF-SCOPE** | **Aplikasi Mobile Native (Android APK / iOS IPA)** | Format web PWA/SPA lebih mudah diakses instan tanpa hambatan instalasi di toko aplikasi. |

---

## 4. Alur Perjalanan Pengguna Lengkap (Detailed User Journey)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALUR PENGGUNA REKABATIK                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
   1. Eksplorasi Filosofi (Belajar Batik) / Katalog Motif Nusantara
                                    │
                                    ▼
   2. Desain di Studio Kanvas (Ubah Warna, Skala, Teks, Kuas Bebas)
                                    │
                                    ▼
   3. Simpan Desain & Pilih Spesifikasi Kain (Mori, Dobby, Sutra)
                                    │
                                    ▼
   4. Alokasi Pesanan ke Toko Pengrajin Mitra (Desa Jetis)
                                    │
                                    ▼
   5. Komunikasi Real-Time & Negosiasi Tawaran Harga via Chat WebSocket
                                    │
                                    ▼
   6. Konfirmasi Kesepakatan Harga & Pembayaran Terverifikasi
                                    │
                                    ▼
   7. Pengrajin Memproses Kain Fisik (On-Demand) -> Input Nomor Resi Kirim
```

1. **Eksplorasi Budaya & Pemilihan Motif:** Pengguna membuka halaman [BelajarBatikPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/BelajarBatikPage.tsx) atau [CatalogPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/CatalogPage.tsx) untuk memahami makna filosofis motif klasik. Pengguna menekan tombol "Buat Batik Saya".
2. **Kustomisasi Kanvas Interaktif:** Pada [CustomBatikPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/CustomBatikPage.tsx), pengguna memilih warna primer/sekunder/latar, mengatur ukuran pola, memutar sudut motif, menambahkan teks inisial, atau menggambar aksen manual dengan kuas bebas.
3. **Penyimpanan Desain & Spesifikasi Tekstil:** Pengguna menekan "Simpan Desain". Konfigurasi vektor dan gambar thumbnail tersimpan ke tabel database `custom_designs`. Pengguna memilih dimensi kain, jenis serat (Mori Primissima / Katun Dobby / Sutra ATBM), dan memilih bengkel pengrajin tujuan.
4. **Pembukaan Pesanan Kustom:** Sistem menerbitkan entri pesanan baru di tabel `orders` dengan status awal `negotiating`.
5. **Negosiasi Penawaran Harga (*Price Bidding*):** Pengguna dan pengrajin terhubung dalam ruang obrolan [ChatPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/ChatPage.tsx). Pengrajin mengajukan kartu penawaran harga (*price offer*) berdasarkan kerumitan pengerjaan.
6. **Kesepakatan & Pembayaran:** Pengguna menyetujui tawaran harga. Status pesanan berubah menjadi `processing` (In-Production). Dana ditampung aman dalam sistem.
7. **Produksi On-Demand & Pengiriman:** Pengrajin memproduksi kain batik fisik di sanggar. Setelah selesai, pengrajin memasukkan nama ekspedisi dan nomor resi pengiriman melalui dasbor [AdminPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/AdminPage.tsx). Status diperbarui menjadi `shipping` hingga akhirnya `delivered`.

---

## 5. Spesifikasi Kebutuhan Fungsional Detail (Functional Specs)

### Modul 1: Mesin Studio Kanvas Kustomisasi (Canvas Studio Engine)
* **F-101 (Dual-Canvas Architecture):** Sistem memisahkan elemen vektor (motif SVG, bentuk, teks) pada *Fabric.js Canvas* dan goresan kuas bitmap pada *Offscreen HTML5 Canvas* untuk menjaga performa rendering di 60 FPS.
* **F-102 (Dynamic Multi-Layer Recoloring):** Sistem membaca struktur DOM dari berkas vektor SVG grayscale, memetakan stop gradient/warna abu-abu ke 3 variabel warna pilihan pengguna:
  $$\text{Primary Color} \leftarrow \text{Dark Gray (\#333333)}$$
  $$\text{Secondary Color} \leftarrow \text{Medium Gray (\#888888)}$$
  $$\text{Background Color} \leftarrow \text{Light Gray / White (\#FFFFFF)}$$
* **F-103 (Object Transformations):** Manipulasi objek mencakup rotasi ($0^\circ - 360^\circ$), penskalaan proporsional, pembalikan horizontal/vertikal (*flip*), dan susunan layer (*send to back / bring to front*).
* **F-104 (Export & Save Guard):** Penggabungan kedua canvas secara asinkron menjadi satu berkas PNG resolusi tinggi dengan proteksi `useBlocker` React Router untuk mencegah hilangnya karya pengguna yang belum disimpan.

### Modul 2: Negosiasi Harga & Obrolan Real-Time (WebSocket Chat Engine)
* **F-201 (WebSocket Channel Subscription):** Menghubungkan browser pengguna dan pengrajin ke kanal `supabase.channel('messages:order_id')` secara terisolasi.
* **F-202 (Price Offer Custom Component):** Pengiriman pesan terstruktur yang memuat field `price_offer: number` dan `negotiation_status: 'pending' | 'accepted' | 'rejected'`.
* **F-203 (Atomic State Transition):** Ketika tombol "Setujui Tawaran" ditekan, sistem menjalankan transaksi basis data yang otomatis memperbarui `orders.total`, menyetel status penawaran menjadi `accepted`, dan memicu notifikasi toast konfirmasi.

### Modul 3: Direktori Sentra Pengrajin & Edukasi Warisan (Artisan & Culture Modules)
* **F-301 (Artisan Storefront Profiling):** Menampilkan nama toko, tahun berdiri, nama maestro/pemilik, alamat fisik, koordinat, nomor kontak terverifikasi, galeri foto sanggar, dan ulasan bintang.
* **F-302 (Motif Philosophy Encyclopedia):** Menampilkan profil 6 motif sakral nusantara lengkap dengan asal daerah, makna simbolis spiritual, konteks busana keraton, dan visualizer SVG dinamis.
* **F-303 (Cross-Navigation Action):** Setiap kartu motif menyediakan tombol pintas yang langsung membuka editor kanvas dengan motif tersebut terpasang otomatis di kanvas kerja.

### Modul 4: Manajemen Pesanan, Logistik, & Ulasan (Order Lifecycle Management)
* **F-401 (Lifecycle Status Progression):** Mendukung 6 status transaksi resmi:
  $$\text{negotiating} \longrightarrow \text{processing} \longrightarrow \text{shipping} \longrightarrow \text{delivered}$$
  $$\text{dengan opsi pembatalan: } \text{cancelled}$$
* **F-402 (Logistics Dispatch Tracking):** Input nomor resi pengiriman kurir (JNE, J&T, SiCepat, Pos Indonesia) oleh pengrajin yang otomatis memunculkan tombol pelacakan di akun pelanggan.
* **F-403 (Review & Rating System):** Pelanggan yang telah menerima pesanan dapat memberikan rating 1 – 5 bintang dan testimoni ulasan tekstil fisik.

### Modul 5: Tata Kelola Peran & Kurasi Super Admin (Governance & RBAC)
* **F-501 (Role Authorization):** Membatasi akses rute `/super-admin` hanya untuk entitas bertanda `role = 'super_admin'`, dan rute `/admin` untuk `role = 'artisan'`.
* **F-502 (Store Verification Pipeline):** Super Admin dapat menginspeksi legalitas sanggar baru dan mengubah status pendaftaran toko dari `pending` menjadi `approved` atau `rejected`.

---

## 6. Desain Skema Basis Data Lengkap (PostgreSQL / Supabase DDL)

Berikut adalah definisi skema basis data produksi RekaBatik:

```sql
-- 1. TABEL PROFIL PENGGUNA TERINTEGRASI AUTH
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'artisan', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL TOKO PENGRAJIN (STORES)
CREATE TABLE stores (
    id BIGSERIAL PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    established VARCHAR(50),
    specialty VARCHAR(255),
    address TEXT NOT NULL,
    phone VARCHAR(50),
    hours VARCHAR(100),
    rating NUMERIC(3,2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    price_range VARCHAR(50),
    tags TEXT[],
    image TEXT,
    featured BOOLEAN DEFAULT FALSE,
    description TEXT,
    motifs TEXT[],
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_profile_complete BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL MASTER KATALOG BATIK NUSANTARA (BATIK_ITEMS)
CREATE TABLE batik_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    description TEXT,
    origin VARCHAR(100),
    primary_color VARCHAR(50),
    secondary_color VARCHAR(50),
    bg_color VARCHAR(50),
    rating INT DEFAULT 5,
    sold INT DEFAULT 0,
    style_type VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL DESAIN KUSTOM KANVAS (CUSTOM_DESIGNS)
CREATE TABLE custom_designs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_id VARCHAR(100),
    colors JSONB NOT NULL, -- { primary: '#...', secondary: '#...', bg: '#...' }
    scale NUMERIC(6,3) DEFAULT 1.0,
    rotation INT DEFAULT 0,
    drawing_data JSONB NOT NULL, -- layer array, objects, bitmap brush paths
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL TRANSAKSI PESANAN KRIYA (ORDERS)
CREATE TABLE orders (
    id TEXT PRIMARY KEY, -- kode pesanan misal: RB-2026-XXXX
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estimated_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'negotiating' CHECK (status IN ('negotiating', 'processing', 'shipping', 'delivered', 'cancelled')),
    total NUMERIC(14,2) NOT NULL,
    type VARCHAR(50) DEFAULT 'custom',
    artisan VARCHAR(255) NOT NULL, -- nama toko tujuan
    payment_method VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    shipping_address JSONB NOT NULL,
    quantity INT DEFAULT 1,
    notes TEXT,
    tracking_number VARCHAR(100),
    courier VARCHAR(100),
    review_rating INT CHECK (review_rating >= 1 AND review_rating <= 5),
    review_comment TEXT,
    custom_design_id BIGINT REFERENCES custom_designs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL OBROLAN & NEGOSIASI REAL-TIME (MESSAGES)
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'artisan')),
    message TEXT NOT NULL,
    price_offer NUMERIC(14,2),
    negotiation_status VARCHAR(20) CHECK (negotiation_status IN ('pending', 'accepted', 'rejected')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    attachment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL BUKU ALAMAT PENGIRIMAN (USER_ADDRESSES)
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABEL FAVORIT BATIK & TOKO
CREATE TABLE favorite_batik (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    batik_id BIGINT REFERENCES batik_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, batik_id)
);

CREATE TABLE favorite_stores (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, store_id)
);
```

---

## 7. Spesifikasi Antarmuka API Inti (API Contracts)

### 7.1 Endpoint Penyimpanan Desain Kanvas Kustom
`POST /rest/v1/custom_designs`

* **Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`, `Prefer: return=representation`
* **Request Body:**
```json
{
  "pattern_id": "parang",
  "colors": {
    "primary": "#8B4513",
    "secondary": "#D4B88B",
    "bg": "#FAF8F5"
  },
  "scale": 1.25,
  "rotation": 45,
  "drawing_data": {
    "objects": [
      { "type": "path", "path": "M 0 0 L 100 100", "stroke": "#8B4513" }
    ],
    "layersCount": 3
  },
  "preview_url": "https://storage.rekabatik.com/designs/design-8821.png"
}
```
* **Response (201 Created):**
```json
{
  "id": 142,
  "user_id": "8fa19e02-44ca-4122-b912-8821adbc9901",
  "pattern_id": "parang",
  "created_at": "2026-10-12T12:00:00Z"
}
```

### 7.2 Endpoint Pengiriman Tawaran Harga Bidding (WebSocket & REST)
`POST /rest/v1/messages`

* **Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "order_id": "RB-2026-8812",
  "sender_role": "artisan",
  "message": "Halo Kak, untuk motif Parang kustom kombinasi pada kain katun primissima 2,5 meter, kami tawarkan harga Rp 420.000 dengan proses canting tulis 5 hari.",
  "price_offer": 420000.00,
  "negotiation_status": "pending"
}
```
* **Response (201 Created):**
```json
{
  "id": 9812,
  "order_id": "RB-2026-8812",
  "price_offer": 420000.00,
  "negotiation_status": "pending",
  "status": "sent",
  "created_at": "2026-10-12T12:05:30Z"
}
```

### 7.3 Endpoint Pembaruan Status Tawaran Harga & Tagihan Pesanan
`PATCH /rest/v1/messages?id=eq.9812`

* **Request Body:**
```json
{
  "negotiation_status": "accepted"
}
```
* **Trigger Otomatis di Database:** Saat status tawaran diset menjadi `accepted`, nilai tagihan `orders.total` diperbarui menjadi `420000.00`, dan status `orders.status` siap untuk tahap pembayaran.

---

## 8. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Kepatuhan Privasi Data & Keamanan (UU PDP No. 27/2022):** Alamat pengiriman pengguna, nomor telepon, dan riwayat obrolan negosiasi dilindungi dengan enkripsi transmisi TLS 1.3 dan enkripsi penyimpanan AES-256. Akses basis data diisolasi ketat menggunakan **Row-Level Security (RLS) PostgreSQL**, mencegah pembeli maupun penjual lain mengintip transaksi yang bukan haknya.
* **Kecepatan Kanvas & Toleransi Latensi:** Manipulasi layer vektor SVG pada kanvas wajib beroperasi lancar pada frame rate minimal **55 FPS**. Latensi pertukaran pesan obrolan real-time via WebSocket di bawah **300 ms**.
* **Ketersediaan Sistem (SLA Availability):** Target ketersediaan layanan minimum **99,8%** pada jam transaksi aktif nasional (07.00 – 22.00 WIB).
* **Aksesibilitas & Inklusivitas Antarmuka:** Memenuhi standar aksesibilitas internasional **WAI-ARIA** dan **WCAG 2.1 Level AA** dengan rasio kontras teks minimal 4.5:1 untuk teks normal dan 3:1 untuk teks tebal.

---

## 9. Rencana Kerja Sprint MVP 4 Minggu (Roadmap Eksekusi)

| Periode | Fokus Modul Rekayasa | Hasil Keluaran Nyata (Deliverables) |
|---|---|---|
| **Minggu 1: Arsitektur Inti, Database & Autentikasi** | • Penyiapan repositori React 18, Vite 6, Tailwind CSS v4, dan Radix UI.<br>• Eksekusi skema basis data PostgreSQL di Supabase lengkap dengan kebijakan RLS.<br>• Implementasi sistem Autentikasi Multi-Role (`customer`, `artisan`, `super_admin`). | Sistem autentikasi berjalan aman, database terkonfigurasi, dan layout shell antarmuka siap digunakan. |
| **Minggu 2: Mesin Kanvas Dual-Canvas & Ensiklopedia Budaya** | • Integrasi Fabric.js retained-mode dan Offscreen HTML5 Canvas.<br>• Pustaka SVG motif pakem nusantara dengan algoritma dynamic recoloring.<br>• Pembangunan halaman ensiklopedia filosofi [BelajarBatikPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/BelajarBatikPage.tsx). | Pengguna dapat merancang pola batik, mengubah warna per layer, dan mengekspor desain resolusi tinggi. |
| **Minggu 3: Modul Negosiasi WebSocket & Direktori Sentra** | • Implementasi kanal obrolan real-time Supabase Realtime.<br>• Kartu interaktif tawaran harga (*custom price bidding*).<br>• Showcase profil sentra dan toko pengrajin di [DesaJetisPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/DesaJetisPage.tsx). | Pembeli dan pengrajin dapat bernegosiasi harga secara langsung dengan pembaruan status instan. |
| **Minggu 4: Alur Checkout, Tata Kelola Admin, & UAT Lapangan** | • Integrasi keranjang, checkout, dan manajemen resi kirim di [OrdersPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/OrdersPage.tsx).<br>• Dasbor kurasi Super Admin dan panel mitra [AdminPage.tsx](file:///c:/Users/nadem/Downloads/Batik%20Customization%20Website/src/app/pages/AdminPage.tsx).<br>• Uji coba lapangan (*User Acceptance Testing*) bersama mitra sentra kriya. | Siklus transaksi penuh berjalan lancar, seluruh bug terselesaikan, siap rilis produksi (*production-ready*). |

---

## 10. Manajemen Risiko Teknis & Rencana Kontingensi

| Skenario Risiko | Tingkat | Rencana Kontingensi Teknis |
|---|:---:|---|
| **Penurunan FPS Kanvas pada Ponsel Spesifikasi Rendah** | Tinggi | Terapkan isolasi render: goresan kuas bebas dialirkan murni ke *Offscreen Bitmap Canvas*, sementara Fabric.js hanya mengelola *bounding box* vektor tanpa membuat objek node berlebih. |
| **Gangguan Jaringan Internet Pengrajin di Desa** | Sedang | Terapkan *Optimistic UI Updates* pada obrolan dan antrean sinkronisasi lokal (*Local Queue Persistence*) menggunakan IndexedDB sehingga pesan otomatis terkirim begitu koneksi pulih. |
| **Injeksi Berkas SVG Berbahaya (Stored XSS Attack)** | Tinggi | Terapkan sanitasi DOM ketat (*DOMPurify*) pada seluruh berkas SVG motif kustom sebelum dieksekusi oleh mesin `fabric.loadSVGFromString()`, menolak script tag dan event inline. |
| **Kerusakan Kain atau Ketidaksesuaian Warna Fisik** | Sedang | Terapkan modul konfirmasi spesifikasi digital di chat dan penafian toleransi warna monitor (5-10% variasi estetika celup malam alami) sebelum status pesanan beralih ke `processing`. |

---

> **Dokumen ini merupakan spesifikasi induk resmi (*Master Specification*) platform RekaBatik, mengintegrasikan visi bisnis, kelayakan pasar, kepatuhan SDGs, dan arsitektur rekayasa perangkat lunak.**
