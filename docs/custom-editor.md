# Custom Editor Guide

Dokumen ini menjelaskan arsitektur dan perilaku halaman editor batik kustom di RekaBatik. Referensi utamanya adalah implementasi `src/app/pages/CustomBatikPage.tsx`.

## Tujuan Editor

Editor memungkinkan pengguna:

- memilih motif batik dasar
- mengatur warna motif
- menyusun banyak layer
- menggambar bebas di atas desain
- menambah shape dan teks
- menyimpan desain
- memasukkan desain ke keranjang
- mengunduh hasil akhir sebagai gambar

## Konsep Arsitektur

Editor memakai dua permukaan gambar yang berjalan bersamaan:

### 1. Fabric canvas

Dipakai untuk objek yang terstruktur:

- motif/pattern
- gambar yang diunggah
- shape
- teks
- manipulasi objek seperti drag, rotate, scale, grouping, duplicating

### 2. Offscreen canvas

Dipakai untuk raster drawing:

- brush
- eraser
- flood fill
- sapuan yang lebih cocok diproses sebagai bitmap

### Kenapa dipisah

Pemisahan ini memberi keuntungan:

- objek terstruktur tetap mudah dimanipulasi melalui Fabric
- coretan bebas tidak membebani object tree Fabric secara berlebihan
- hasil akhir dapat digabung saat save/download

## Sumber Data Editor

Editor membaca data dari beberapa sumber:

### Database

- tabel `batik_items` untuk daftar motif dasar
- tabel `custom_designs` untuk simpan/muat desain

### Aset lokal

- `src/assets/batik-svgs` untuk SVG motif batik

### Context global

- `useAuth()` untuk status login
- `useCart()` untuk menambah item ke keranjang
- `useFullscreen()` untuk mode layar penuh

## Model Data Internal

Editor punya state besar, tetapi ada beberapa yang paling penting:

| State | Fungsi |
| --- | --- |
| `patterns` | daftar motif yang tersedia |
| `layers` | daftar layer yang tampil di panel layer |
| `selectedLayerId` | layer aktif |
| `activeTool` | tool aktif seperti select, brush, eraser, fill, shape, text |
| `brushSize`, `brushColor`, `brushOpacity` | konfigurasi kuas |
| `projectInfo` | metadata proyek seperti nama, deskripsi, kain |
| `savedDesignId` | id desain yang sudah pernah disimpan |
| `hasUnsavedChanges` | penanda perubahan belum disimpan |

Tipe tool yang digunakan:

- `select`
- `brush`
- `eraser`
- `fill`
- `shape`
- `text`

## Layer System

Layer di editor mewakili objek yang bisa dikelola dari panel samping.

Kemampuan layer yang sudah ada:

- pilih layer aktif
- ubah urutan layer naik/turun
- toggle visibility
- lock/unlock
- duplikasi object
- hapus object
- flip horizontal
- flip vertical

Jenis layer yang muncul di UI:

- motif/pattern
- drawing
- text
- shape
- custom image

Catatan:

- drawing berbasis offscreen tidak sepenuhnya sama dengan object Fabric biasa
- panel layer berfungsi sebagai jembatan UI agar semua elemen tetap konsisten dipahami user

## Warna dan Recolor Motif

Editor memiliki sistem recolor untuk SVG motif batik.

Konsepnya:

- SVG motif dimuat dari aset lokal
- warna grayscale di dalam SVG dipetakan ke preset warna desain
- pemetaan dilakukan untuk nilai hex maupun rgb

Implikasi praktis:

- motif dengan banyak tingkat abu-abu bisa berubah mengikuti preset warna
- motif kompleks seperti `Truntum` tetap bisa ikut menyesuaikan warna

Preset warna yang disimpan ke desain biasanya merepresentasikan:

- background
- light
- mid
- dark
- primary

## Tool yang Tersedia

### Select

Dipakai untuk:

- memilih object aktif
- memindahkan object
- resize/rotate object
- grouping atau select banyak object

### Brush

Dipakai untuk menggambar bebas di offscreen canvas.

Parameter:

- warna brush
- ukuran brush
- opacity brush

### Eraser

Mirip brush, tetapi memakai mode hapus di offscreen canvas.

### Fill

Dipakai untuk flood fill pada area bitmap tertentu.

### Shape

Dipakai untuk menambah bentuk seperti:

- rectangle
- circle/ellipse
- star
- line

### Text

Dipakai untuk menambah teks ke desain.

Konfigurasi yang tampak di kode:

- warna teks
- ukuran font
- keluarga font

## Interaksi Objek

Editor mendukung interaksi berikut:

- drag and drop object
- scale object
- rotate object
- delete via custom control Fabric
- copy/paste object
- duplicate selection
- group dan ungroup object
- multi-selection

Ada juga logika khusus untuk:

- menjaga panel edit tetap sinkron dengan object aktif
- mengembalikan selected object setelah perubahan tertentu
- membatasi transform agar pengalaman edit tetap stabil

## Zoom, Pan, dan Viewport

Editor memiliki pengelolaan viewport yang cukup kompleks.

Tujuannya:

- menjaga rasio tampilan desain
- menghindari kombinasi pan/zoom yang membuat object keluar konteks
- mengontrol fit-to-container scale

Fungsi praktis yang tersedia:

- zoom in
- zoom out
- reset zoom
- clamp viewport agar tidak liar

## Undo/Redo

Editor memiliki mekanisme histori untuk dua sumber perubahan:

- histori object/canvas utama
- histori offscreen drawing

Terdapat stack internal seperti:

- snapshot Fabric
- snapshot offscreen
- action stack
- redo stack

Manfaatnya:

- perubahan object dan coretan bisa di-undo secara lebih konsisten
- perubahan background juga ikut dilacak

## Upload Gambar Kustom

User dapat mengunggah gambar referensi atau elemen visual lain.

Batasan yang terlihat di UI:

- format: JPG, PNG
- ukuran maksimal: 5MB

Setelah diunggah:

- gambar masuk sebagai object/layer baru
- pengguna dapat memindah, resize, flip, dan mengelolanya seperti layer lain

## Simpan Desain

Saat user menyimpan desain:

1. editor membangun final canvas gabungan
2. Fabric canvas dirender ke data URL
3. offscreen canvas dipotong ke region final
4. thumbnail hasil jadi dibuat
5. payload diserialisasi ke `drawing_data`
6. data disimpan ke tabel `custom_designs`

Payload save saat ini mencakup hal-hal seperti:

- JSON Fabric
- bitmap offscreen
- warna background
- thumbnail canvas
- metadata `projectInfo`

Jika desain sebelumnya sudah pernah disimpan:

- editor melakukan `UPDATE` ke `custom_designs`

Jika belum:

- editor melakukan `INSERT` dan menyimpan `savedDesignId`

## Output Final

Ukuran final canvas yang dirender:

- `800 x 600`

Sumber compositing:

- layer object dari Fabric
- coretan dari offscreen canvas
- warna background aktif

Catatan penting:

- editor menambahkan watermark `RekaBatik` ke hasil akhir
- watermark ada dalam versi besar diagonal dan kecil di pojok

## Download Desain

Flow download:

1. panggil builder final canvas
2. ubah hasil menjadi PNG data URL
3. trigger download file lokal

Nama file output:

- `desain-batik-<timestamp>.png`

## Tambah ke Keranjang

Flow tambah ke keranjang:

1. user harus login
2. desain harus tersimpan atau melewati flow simpan
3. hasil desain dihubungkan ke `custom_designs`
4. `useCart()` dipakai untuk menambah item ke `cart_items`

## Proteksi Unsaved Changes

Editor memakai `useBlocker` dari React Router.

Tujuannya:

- mencegah user keluar halaman ketika ada perubahan yang belum disimpan

Kapan flag aktif:

- saat object berubah
- saat brush/eraser/fill dipakai
- saat layer atau background berubah

Kapan flag dimatikan:

- saat simpan berhasil
- saat clear all
- saat desain berhasil dimuat ulang tanpa perubahan baru

## Load Desain dari Histori

Editor dapat membuka desain yang sebelumnya sudah disimpan.

Proses umumnya:

1. ambil `drawing_data`
2. parse JSON payload
3. restore object Fabric
4. restore bitmap offscreen
5. rebuild layer list
6. reset `hasUnsavedChanges`

Catatan:

- karena payload `drawing_data` bersifat fleksibel, perubahan format payload perlu backward compatibility

## Metadata Proyek

Sebelum aksi penting seperti save/cart/order, editor dapat meminta metadata proyek:

- nama proyek
- deskripsi
- jenis kain

Default kain yang tampak di kode:

- `Katun Primisima`

Metadata ini ikut disimpan di payload desain, bukan kolom terpisah.

## Clear All

Fitur clear all akan:

- menghapus seluruh object Fabric
- membersihkan offscreen canvas
- mereset history stack
- mereset background
- mengosongkan layers
- mereset `savedDesignId`
- mematikan flag perubahan belum disimpan

## Batasan Implementasi Saat Ini

### Payload save sangat fleksibel

`drawing_data` menyimpan data berformat long text JSON.

Kelebihan:

- mudah evolusi cepat

Kekurangan:

- tidak ketat secara skema
- rawan mismatch antar versi editor

### Watermark selalu ditambahkan ke hasil final

Ini perlu diperhatikan jika nanti ada kebutuhan ekspor master tanpa watermark.

### Dependensi ke nama motif dan aset lokal

Motif editor bergantung pada:

- isi `batik_items`
- file SVG di `src/assets/batik-svgs`
- logika pemetaan `style_type` dan recolor

### Kompleksitas file sangat tinggi

`CustomBatikPage.tsx` saat ini menangani:

- UI toolbar
- panel layer
- state editor
- serialisasi
- drawing engine
- save/load
- integrasi keranjang

Saran jangka menengah:

- pecah menjadi hook dan komponen terpisah

## Rekomendasi Refactor

Jika editor akan dikembangkan lebih jauh, urutan refactor yang disarankan:

1. ekstrak engine Fabric/offscreen ke hook terpisah
2. pisahkan layer panel dan tool panel menjadi komponen mandiri
3. buat format payload desain yang terversi
4. tambahkan schema validator untuk `drawing_data`
5. tambahkan test untuk save/load dan transform object

## Checklist Saat Menambah Fitur Editor

Saat menambah tool atau behavior baru:

1. tentukan apakah data masuk ke Fabric atau offscreen
2. update layer model bila perlu
3. hubungkan ke undo/redo
4. tandai `hasUnsavedChanges`
5. pastikan save/load mendukung format baru
6. cek dampak ke final canvas builder
7. cek dampak ke add-to-cart flow
