import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, Sparkles, MapPin, ScrollText, ArrowRightCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
const MotionLink = motion(Link);
import { BatikBackground } from "../components/BatikBackground";
import { useState } from "react";

const batikMotifs = [
  {
    id: 1,
    name: "Parang",
    origin: "Yogyakarta & Surakarta",
    meaning: `Batik Parang adalah salah satu motif batik tertua asal Keraton Mataram (Solo dan Yogyakarta). Motifnya berbentuk jalinan huruf S yang mengalir secara diagonal tanpa putus.

Berikut adalah esensi utama dari Batik Parang:
- Makna Filosofis: Terinspirasi dari ombak samudra, motif ini melambangkan kegigihan, semangat yang tak pernah padam, dan kesinambungan dalam berjuang memperbaiki diri.
- Batik Larangan: Di zaman dulu, batik ini bersifat sakral dan hanya boleh dipakai oleh raja, keluarga kerajaan, dan para kesatria sebagai simbol kekuasaan dan kewibawaan.
- Variasi Ukuran: Memiliki beberapa jenis, seperti Parang Barong yang berukuran besar untuk raja, hingga Parang Klitik yang kecil dan halus untuk para putri keraton.

Secara singkat, Batik Parang adalah simbol perjuangan, kepemimpinan, dan kesetiaan yang terus mengalir.`,
    colors: { primary: "#8B4513", secondary: "#D4B88B", bg: "#FAF8F5" },
    patternType: "parang",
  },
  {
    id: 2,
    name: "Kawung",
    origin: "Yogyakarta",
    meaning: `Batik Kawung adalah motif batik klasik berbentuk bulatan oval yang tersusun rapi secara geometris. Motif ini menyerupai buah aren atau kolang-kaling yang dibelah empat, dengan titik pusat di tengahnya.

Berikut adalah esensi utama dari Batik Kawung:
- Makna Filosofis: Lambang kesucian, keadilan, dan kejujuran. Bentuknya yang teratur mencerminkan pengendalian diri yang kuat dan hati yang bersih tanpa prasangka.
- Asal-usul: Termasuk salah satu motif tertua asal Keraton Jawa (Yogyakarta dan Solo) yang dulunya merupakan Batik Larangan, khusus dipakai oleh pejabat kerajaan dan keluarga keraton.
- Simbol Struktur: Empat lingkaran yang mengelilingi satu pusat melambangkan konsep persaudaraan dan keseimbangan alam (kiblat papat lima pancer).

Secara singkat, Batik Kawung adalah simbol kesucian hati, kebijaksanaan, dan keseimbangan hidup.`,
    colors: { primary: "#5D4037", secondary: "#A1887F", bg: "#FFF8E1" },
    patternType: "kawung",
  },
  {
    id: 3,
    name: "Mega Mendung",
    origin: "Cirebon",
    meaning: `Batik Mega Mendung adalah motif batik khas dari daerah Cirebon, Jawa Barat. Berbeda dengan motif keraton Jawa yang geometris, Mega Mendung memiliki bentuk menyerupai awan-awan yang bergulung dengan gradasi warna yang indah.

Berikut adalah esensi utama dari Batik Mega Mendung:
- Makna Filosofis: Melambangkan kesabaran, ketenangan, dan pengendalian diri. Seperti awan yang membawa hujan, motif ini membawa pesan bahwa seorang pemimpin harus bisa mengayomi dan mendinginkan suasana dalam situasi apa pun.
- Akulturasi Budaya: Motif ini kental dengan pengaruh budaya Tiongkok yang masuk melalui jalur perdagangan. Bentuk awannya mengadopsi seni rupa Tiongkok, namun divariasi dengan sentuhan lokal Cirebon yang lebih dinamis.
- Ciri Khas Warna: Tradisionalnya menggunakan gradasi warna biru (mulai dari biru muda hingga biru tua) yang melambangkan warna langit dan kesuburan, meski sekarang sudah banyak dikembangkan dengan warna-warna cerah lainnya.

Secara singkat, Batik Mega Mendung adalah simbol kedamaian, kesabaran yang luas, dan perlindungan.`,
    colors: { primary: "#1565C0", secondary: "#90CAF9", bg: "#E3F2FD" },
    patternType: "mega",
  },
  {
    id: 4,
    name: "Truntum",
    origin: "Yogyakarta",
    meaning: `Batik Truntum adalah motif batik klasik asal Surakarta (Solo) yang diciptakan oleh Kanjeng Ratu Kencana (Permaisuri Sunan Pakubuwana III). Motifnya berbentuk taburan bintang-bintang kecil atau kuntum bunga melati yang mekar di latar belakang yang gelap.

Berikut adalah esensi utama dari Batik Truntum:
- Makna Filosofis: Melambangkan cinta yang tumbuh kembali, kesetiaan, dan ketulusan. Kata "truntum" sendiri berasal dari bahasa Jawa tumaruntum yang berarti tumbuh kembali atau bersemi kembali.
- Simbol Pernikahan: Karena maknanya yang sarat akan cinta, batik ini sangat sakral dalam upacara pernikahan adat Jawa. Biasanya dikenakan oleh orang tua pengantin sebagai simbol doa agar cinta kedua mempelai terus bersemi dan mereka bisa menuntun anaknya memasuki lembaran hidup yang baru.
- Tampilan Visual: Memiliki pola yang sangat rapi, halus, dan geometris, menggambarkan ketenangan hati dan keanggunan.

Secara singkat, Batik Truntum adalah simbol kesetiaan, cinta yang abadi, dan bimbingan orang tua.`,
    colors: { primary: "#C2185B", secondary: "#F8BBD9", bg: "#FCE4EC" },
    patternType: "truntum",
  },
  {
    id: 5,
    name: "Sidomukti",
    origin: "Surakarta",
    meaning: `Batik Sidomukti adalah motif batik klasik yang berasal dari Surakarta dan Yogyakarta. Nama "Sidomukti" berasal dari kata sido yang berarti jadi atau terus-menerus, dan mukti yang berarti mulia, makmur, atau sejahtera.

Berikut adalah esensi utama dari Batik Sidomukti:

- Makna Filosofis: Melambangkan harapan akan kehidupan yang makmur, mulia, dan penuh kebahagiaan yang berkesinambungan. Motif ini membawa doa agar pemakainya mencapai masa depan yang cerah dan berkecukupan.
- Simbol Pernikahan: Batik ini merupakan kain sakral yang wajib dikenakan oleh sepasang pengantin dalam upacara pernikahan adat Jawa (prosesi panggih). Penggunaan motif ini menjadi simbol doa restu agar rumah tangga baru mereka selalu diliputi kemakmuran dan kedudukan yang terhormat.
- Tampilan Visual: Umumnya memiliki warna dasar soga (cokelat kekuningan) dengan ornamen utama berupa gambar kupu-kupu (simbol pencerahan), bangunan atau singgasana (simbol kedudukan), dan tumbuhan (simbol kemakmuran).

Secara singkat, Batik Sidomukti adalah simbol kemakmuran, kemuliaan hidup, dan masa depan yang bahagia.`,
    colors: { primary: "#2E7D32", secondary: "#A5D6A7", bg: "#E8F5E9" },
    patternType: "sidomukti",
  },
  {
    id: 6,
    name: "Sekar Jagad",
    origin: "Yogyakarta",
    meaning: `Batik Sekar Jagad adalah salah satu motif batik klasik yang sangat populer di Jawa, terutama berasal dari Yogyakarta dan Solo. Nama "Sekar" berarti bunga atau keindahan, sedangkan "Jagad" berarti dunia.

Berikut adalah esensi utama dari Batik Sekar Jagad:

- Makna Filosofis: Melambangkan keindahan keluhuran dan keragaman dunia. Motif ini menggambarkan peta dunia yang penuh dengan kedamaian, kebahagiaan, dan harmoni di tengah berbagai perbedaan.
- Tampilan Visual: Memiliki pola yang unik karena berbentuk seperti kumpulan pulau atau pecahan-pecahan motif yang disatukan (seperti teknik patchwork). Di dalam setiap sekatnya, terdapat berbagai macam motif batik yang berbeda-beda dan bervariasi.
- Penggunaan: Karena maknanya yang universal tentang keindahan dunia, batik ini sering digunakan untuk pakaian formal, acara adat, maupun busana sehari-hari yang melambangkan keanggunan.

Secara singkat, Batik Sekar Jagad adalah simbol keindahan yang beragam, kedamaian, dan keharmonisan hidup.`,
    colors: { primary: "#FF8F00", secondary: "#FFE082", bg: "#FFF3E0" },
    patternType: "sekar",
  }
];

function BatikPatternPreview({ 
  type, 
  primary, 
  secondary, 
  bg, 
  isHovered 
}: { 
  type: string; 
  primary: string; 
  secondary: string; 
  bg: string;
  isHovered: boolean;
}) {
  const id = `preview-${type}-${Math.random().toString(36).substr(2, 5)}`;
  
  const renderPattern = () => {
    if (type === "parang") {
      return (
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="40" height="40"/>
          <path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2.5" fill="none"/>
          <path d="M0,30 Q10,20 20,30 Q30,40 40,30" stroke={secondary} strokeWidth="1.5" fill="none"/>
          <path d="M0,10 Q10,0 20,10 Q30,20 40,10" stroke={secondary} strokeWidth="1.5" fill="none"/>
        </pattern>
      );
    }
    if (type === "kawung") {
      return (
        <pattern id={id} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="50" height="50"/>
          <ellipse cx="25" cy="14" rx="6" ry="10" fill="none" stroke={primary} strokeWidth="1.5"/>
          <ellipse cx="25" cy="36" rx="6" ry="10" fill="none" stroke={primary} strokeWidth="1.5"/>
          <ellipse cx="14" cy="25" rx="10" ry="6" fill="none" stroke={primary} strokeWidth="1.5"/>
          <ellipse cx="36" cy="25" rx="10" ry="6" fill="none" stroke={primary} strokeWidth="1.5"/>
          <circle cx="25" cy="25" r="3" fill={secondary}/>
        </pattern>
      );
    }
    if (type === "mega") {
      return (
        <pattern id={id} x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="80" height="40"/>
          <path d="M0,20 Q10,8 20,20 Q30,32 40,20 Q50,8 60,20 Q70,32 80,20" stroke={primary} strokeWidth="3" fill="none"/>
          <path d="M0,20 Q10,8 20,20 Q30,32 40,20 Q50,8 60,20 Q70,32 80,20" stroke={secondary} strokeWidth="1.5" fill="none" transform="translate(0,-7)"/>
        </pattern>
      );
    }
    if (type === "truntum") {
      return (
        <pattern id={id} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="50" height="50"/>
          <polygon points="25,8 28,18 38,18 30,24 33,34 25,28 17,34 20,24 12,18 22,18" fill={primary} stroke={secondary} strokeWidth="1"/>
          <circle cx="25" cy="25" r="3" fill={secondary}/>
        </pattern>
      );
    }
    if (type === "sekar") {
      return (
        <pattern id={id} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="60" height="60"/>
          <circle cx="30" cy="30" r="5" fill={secondary}/>
          <circle cx="30" cy="14" r="7" fill={primary} opacity="0.8"/>
          <circle cx="46" cy="30" r="7" fill={primary} opacity="0.8"/>
          <circle cx="30" cy="46" r="7" fill={primary} opacity="0.8"/>
          <circle cx="14" cy="30" r="7" fill={primary} opacity="0.8"/>
          <circle cx="18" cy="18" r="4" fill={secondary} opacity="0.7"/>
          <circle cx="42" cy="18" r="4" fill={secondary} opacity="0.7"/>
          <circle cx="18" cy="42" r="4" fill={secondary} opacity="0.7"/>
          <circle cx="42" cy="42" r="4" fill={secondary} opacity="0.7"/>
        </pattern>
      );
    }
    return (
      <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect fill={bg} width="40" height="40"/>
        <rect x="8" y="8" width="24" height="24" fill="none" stroke={primary} strokeWidth="2"/>
        <rect x="14" y="14" width="12" height="12" fill="none" stroke={secondary} strokeWidth="1.5"/>
        <rect x="17" y="17" width="6" height="6" fill={secondary} opacity="0.7"/>
        <line x1="8" y1="8" x2="14" y2="14" stroke={primary} strokeWidth="1"/>
        <line x1="32" y1="8" x2="26" y2="14" stroke={primary} strokeWidth="1"/>
        <line x1="8" y1="32" x2="14" y2="26" stroke={primary} strokeWidth="1"/>
        <line x1="32" y1="32" x2="26" y2="26" stroke={primary} strokeWidth="1"/>
      </pattern>
    );
  };
  
  return (
    <motion.svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ scale: isHovered ? 1.1 : 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <defs>{renderPattern()}</defs>
      <rect width="100%" height="100%" fill={`url(#${id})`}/>
    </motion.svg>
  );
}

function MotifModal({ motif, onClose }: { motif: typeof batikMotifs[0]; onClose: () => void }) {
  const renderMeaning = (text: string) => {
    return text.split('\n\n').map((para, paraIdx) => {
      const lines = para.split('\n').filter(line => line.trim());
      const elements: React.ReactNode[] = [];
      let currentListItems: string[] = [];

      lines.forEach((line, lineIdx) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ')) {
          currentListItems.push(trimmedLine.replace(/^- /, ''));
        } else {
          if (currentListItems.length > 0) {
            elements.push(
              <ul key={`list-${paraIdx}-${lineIdx}`} style={{ marginLeft: '1.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                {currentListItems.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ marginBottom: '0.75rem', listStyleType: 'disc' }}>
                    {item}
                  </li>
                ))}
              </ul>
            );
            currentListItems = [];
          }
          elements.push(
            <p key={`p-${paraIdx}-${lineIdx}`} style={{ marginBottom: '1rem' }}>
              {trimmedLine}
            </p>
          );
        }
      });

      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-end-${paraIdx}`} style={{ marginLeft: '1.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
            {currentListItems.map((item, itemIdx) => (
              <li key={itemIdx} style={{ marginBottom: '0.75rem', listStyleType: 'disc' }}>
                {item}
              </li>
            ))}
          </ul>
        );
      }

      return <div key={paraIdx}>{elements}</div>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.3)", maxHeight: "90vh" }}
      >
        <div className="relative h-64 flex-shrink-0" style={{ background: motif.colors.bg }}>
          <BatikPatternPreview
            type={motif.patternType}
            primary={motif.colors.primary}
            secondary={motif.colors.secondary}
            bg={motif.colors.bg}
            isHovered={true}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.9)" }}
          >
            ✕
          </motion.button>
        </div>
        <div 
          className="p-8 overflow-y-auto flex-1 no-scrollbar"
          style={{ 
            scrollbarWidth: "none", 
            msOverflowStyle: "none"
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}} />
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                {motif.name}
              </h2>
              <div className="flex items-center gap-2 mt-1" style={{ color: "#8B6F47" }}>
                <MapPin className="w-4 h-4" />
                <span>{motif.origin}</span>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "#3D2B1F" }}>
              <ScrollText className="w-5 h-5" style={{ color: "#D4B88B" }} />
              Makna Filosofis
            </h3>
            <div style={{ color: "#5A4A3A", lineHeight: "1.8", fontSize: "1.05rem" }}>
              {renderMeaning(motif.meaning)}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function BelajarBatikPage() {
  const [selectedMotif, setSelectedMotif] = useState<typeof batikMotifs[0] | null>(null);
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", margin: "0 auto"}}>
      {/* ======================== HERO ======================== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #2D1B14 0%, #3D2B1F 50%, #4A372A 100%)" }} />
        <BatikBackground opacity={0.12} patternType="parang" className="z-10" />
        
        {/* Decorative Elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }}
        />
        
        <div className="container mx-auto px-6 relative z-20 py-24 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              
              <h1
                className="mb-6"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(2.8rem, 6vw, 5rem)",
                  color: "#FAF8F5",
                  lineHeight: "1.1",
                  fontWeight: 700
                }}
              >
                Makna di Balik<br/>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #D4B88B, #E8D4B8)" }}>
                  Setiap Motif Batik
                </span>
              </h1>
              <p className="mb-10 max-w-2xl mx-auto" style={{ color: "rgba(250, 248, 245, 0.8)", lineHeight: "1.9", fontSize: "1.15rem" }}>
                Batik bukan hanya kain, tapi sebuah bahasa budaya Indonesia. Setiap goresan dan pola menyimpan nilai-nilai luhur nenek moyang kita.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <MotionLink
                  to="/custom"
                  className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: "linear-gradient(135deg, #D4B88B, #C9AB7F)",
                    color: "#3D2B1F",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    boxShadow: "0 15px 40px rgba(212, 184, 139, 0.4)"
                  }}
                >
                  <Sparkles className="w-6 h-6" />
                  Buat Batik Saya
                </MotionLink>
                <motion.button
                  onClick={() => {
                    document.getElementById("motifs")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: "transparent",
                    color: "#FAF8F5",
                    fontWeight: 600,
                    border: "2px solid rgba(212, 184, 139, 0.5)"
                  }}
                >
                  Lihat Semua Motif
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== MOTIFS LIST ======================== */}
      <section id="motifs" className="py-27 relative overflow-hidden max-w-7xl mx-auto">
        <BatikBackground opacity={0.05} patternType="mega" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 700, marginBottom: "1rem" }}>
              Eksplorasi Motif Batik
            </h2>
            <p style={{ color: "#7A6B5E", fontSize: "1.15rem", maxWidth: "600px", margin: "0 auto" }}>
              Klik pada motif untuk melihat detail makna dan filosofinya
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {batikMotifs.map((motif, index) => (
              <motion.div
                key={motif.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => setSelectedMotif(motif)}
              >
                <div
                  className="h-full rounded-3xl overflow-hidden"
                  style={{
                    background: "white",
                    boxShadow: "0 8px 30px rgba(61, 43, 31, 0.08)",
                    border: "1px solid #E8E1DA"
                  }}
                >
                  {/* Pattern Preview */}
                  <div className="relative h-64 overflow-hidden" style={{ background: motif.colors.bg }}>
                    <BatikPatternPreview
                      type={motif.patternType}
                      primary={motif.colors.primary}
                      secondary={motif.colors.secondary}
                      bg={motif.colors.bg}
                      isHovered={false}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-7">
                    <h3 className="mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.75rem", fontWeight: 700 }}>
                      {motif.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Modal for selected motif */}
      <AnimatePresence>
        {selectedMotif && (
          <MotifModal
            motif={selectedMotif}
            onClose={() => setSelectedMotif(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
