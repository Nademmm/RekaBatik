import { motion } from "motion/react";
import { Link } from "react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";

export function TermsOfServicePage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8"
      style={{ background: "#FAF8F5", fontFamily: "'Inter', sans-serif" }}
    >
      <BatikBackground opacity={0.03} patternType="mega" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", pointerEvents: "none" }} />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors mb-8 group"
          style={{ color: "#8B6F47" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Kembali ke Beranda
        </Link>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgba(61,43,31,0.06)] border"
          style={{ borderColor: "rgba(139,111,71,0.12)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b" style={{ borderColor: "rgba(139,111,71,0.1)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.08)", color: "#8B6F47" }}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1
                style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}
                className="text-2xl sm:text-3xl font-bold"
              >
                Syarat & Ketentuan
              </h1>
              <p className="text-xs mt-1" style={{ color: "#9E8E82" }}>Terakhir diperbarui: 29 Juni 2026</p>
            </div>
          </div>

          {/* Body Text */}
          <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#5A4A3E" }}>
            <p>
              Selamat datang di <strong>RekaBatik</strong>. Dengan mengakses atau menggunakan platform kustomisasi batik kami, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini. Harap baca halaman ini secara saksama sebelum melanjutkan penggunaan situs kami.
            </p>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              1. Penerimaan Layanan
            </h2>
            <p>
              Layanan kami meliputi akses ke platform web RekaBatik, studio editor kustomisasi motif batik secara digital, pemesanan produk kustomisasi dari pengrajin mitra di Desa Jetis, dan transaksi pembayaran produk. Jika Anda tidak menyetujui salah satu poin dalam ketentuan ini, Anda dilarang menggunakan platform kami.
            </p>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              2. Akun Pengguna & Pendaftaran
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Anda harus berumur minimal 17 tahun atau di bawah pengawasan orang tua untuk membuat akun di RekaBatik.</li>
              <li>Anda setuju untuk memberikan informasi pendaftaran yang akurat, lengkap, dan terbaru, baik melalui email maupun otentikasi Google.</li>
              <li>Anda bertanggung jawab penuh atas keamanan kredensial login akun Anda dan segala aktivitas yang terjadi di bawah akun Anda.</li>
            </ul>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              3. Ketentuan Desain & Hak Kekayaan Intelektual (HAKI)
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Hak Milik Motif Tradisional:</strong> Hak cipta motif batik tradisional nusantara tetap dihormati sebagai milik warisan budaya bangsa Indonesia dan pengrajin lokal.</li>
              <li><strong>Hak Desain Kustom:</strong> Desain kustomisasi yang Anda buat menggunakan editor digital kami adalah milik Anda. Namun, Anda memberikan lisensi bebas royalti kepada RekaBatik dan mitra pengrajin untuk memvisualisasikan, mencetak, dan memproduksi fisik kain batik tersebut berdasarkan pesanan Anda.</li>
              <li><strong>Konten yang Dilarang:</strong> Anda dilarang keras mengunggah gambar atau mendesain elemen yang melanggar hak cipta pihak lain, melanggar hukum, berbau pornografi, sara, atau kekerasan.</li>
            </ul>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              4. Pemesanan, Pembayaran, & Pembatalan
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Sifat Pembuatan Kustom:</strong> Produk batik kustom dikerjakan secara manual oleh pengrajin lokal. Oleh karena itu, ada potensi perbedaan kecil dalam warna, detail goresan lilin (malam), atau detail pewarnaan dibandingkan visual digital.</li>
              <li><strong>Pembayaran:</strong> Pembayaran harus diselesaikan melalui metode resmi yang disediakan platform kami sebelum produksi dimulai.</li>
              <li><strong>Kebijakan Pembatalan:</strong> Karena produk bersifat kustomisasi personal (*made-to-order*), pesanan yang sudah masuk ke tahap produksi oleh pengrajin tidak dapat dibatalkan atau dikembalikan uangnya, kecuali terjadi kesalahan cacat produksi fisik yang parah dari pihak pengrajin.</li>
            </ul>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              5. Batasan Tanggung Jawab
            </h2>
            <p>
              RekaBatik tidak bertanggung jawab atas kerugian tidak langsung, kerugian insidental, atau hilangnya data yang timbul akibat ketidakmampuan Anda menggunakan platform kami secara optimal, kerusakan teknis dari browser pihak ketiga, atau force majeure yang mengganggu proses logistik pengiriman.
            </p>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              6. Perubahan Ketentuan
            </h2>
            <p>
              Kami berhak mengubah atau memperbarui Syarat & Ketentuan ini sewaktu-waktu. Pembaruan akan berlaku segera setelah diposting di halaman ini dengan memperbarui tanggal "Terakhir diperbarui" di bagian atas halaman.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
