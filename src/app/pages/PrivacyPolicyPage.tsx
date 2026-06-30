import { motion } from "motion/react";
import { Link } from "react-router";
import { Shield, ArrowLeft } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";

export function PrivacyPolicyPage() {
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
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1
                style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}
                className="text-2xl sm:text-3xl font-bold"
              >
                Kebijakan Privasi
              </h1>
              <p className="text-xs mt-1" style={{ color: "#9E8E82" }}>Terakhir diperbarui: 29 Juni 2026</p>
            </div>
          </div>

          {/* Body Text */}
          <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#5A4A3E" }}>
            <p>
              Selamat datang di <strong>RekaBatik</strong>. Kami berkomitmen untuk melindungi informasi pribadi Anda dan hak privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan menjaga informasi Anda ketika Anda mengunjungi situs web kami dan menggunakan layanan kami.
            </p>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p>
              Kami mengumpulkan informasi pribadi yang Anda berikan secara sukarela kepada kami saat Anda mendaftar di situs web, melakukan kustomisasi batik, melakukan transaksi, atau menghubungi kami. Informasi tersebut mencakup:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Data Identitas Pribadi:</strong> Nama lengkap, alamat email, nomor telepon, dan alamat pengiriman.</li>
              <li><strong>Data Akun Media Sosial:</strong> Jika Anda memilih untuk masuk menggunakan Google atau akun pihak ketiga lainnya, kami menerima informasi profil dasar dari penyedia tersebut (seperti email dan nama).</li>
              <li><strong>Data Transaksi:</strong> Detail pembayaran (diproses melalui gerbang pembayaran aman), detail pesanan, dan histori kustomisasi desain batik Anda.</li>
            </ul>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              2. Bagaimana Kami Menggunakan Informasi Anda
            </h2>
            <p>
              Kami menggunakan informasi yang dikumpulkan untuk tujuan-tujuan berikut:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Menyediakan, mengoperasikan, dan memelihara platform kustomisasi RekaBatik.</li>
              <li>Memproses transaksi pembayaran Anda dan mengirimkan pesanan batik ke alamat Anda.</li>
              <li>Menghubungkan Anda dengan pengrajin batik terbaik di Desa Jetis dalam proses produksi.</li>
              <li>Mengirimkan email administratif, informasi pelacakan pesanan, serta pembaruan layanan.</li>
              <li>Menganalisis penggunaan situs web menggunakan layanan analitik (seperti Vercel Analytics) untuk meningkatkan performa dan pengalaman pengguna.</li>
            </ul>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              3. Pengungkapan Informasi Anda
            </h2>
            <p>
              Kami tidak akan menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga untuk tujuan pemasaran mereka tanpa persetujuan Anda. Kami hanya membagikan data Anda kepada:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Pengrajin Batik (Mitra):</strong> Informasi pesanan dan alamat pengiriman diberikan kepada pengrajin yang memproses pembuatan batik Anda.</li>
              <li><strong>Penyedia Layanan:</strong> Pihak ketiga yang membantu operasi kami, seperti kurir pengiriman dan gerbang pembayaran (payment gateway).</li>
              <li><strong>Kepatuhan Hukum:</strong> Jika diwajibkan oleh hukum atau untuk melindungi hak-hak hukum platform kami.</li>
            </ul>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              4. Keamanan Informasi Anda
            </h2>
            <p>
              Kami menggunakan tindakan keamanan administratif, teknis, dan fisik yang wajar untuk membantu melindungi informasi pribadi Anda. Namun, mohon diingat bahwa tidak ada transmisi data melalui internet atau metode penyimpanan elektronik yang 100% aman, sehingga kami tidak dapat menjamin keamanan mutlaknya.
            </p>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              5. Hak-Hak Anda
            </h2>
            <p>
              Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda yang kami simpan. Anda dapat melakukannya secara mandiri melalui halaman profil akun Anda atau dengan menghubungi layanan pelanggan kami.
            </p>

            <h2 className="text-lg font-bold pt-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
              6. Hubungi Kami
            </h2>
            <p>
              Jika Anda memiliki pertanyaan atau komentar tentang Kebijakan Privasi ini, silakan hubungi kami di:
            </p>
            <p className="bg-[#FAF8F5] p-4 rounded-xl border border-dashed text-xs">
              <strong>Tim Dukungan RekaBatik</strong><br />
              Email: rekabatik@gmail.com<br />
              Alamat: Desa Jetis, Sidoarjo, Jawa Timur, Indonesia
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
