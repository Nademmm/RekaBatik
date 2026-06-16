import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MapPin, Phone, Clock, Star, ChevronRight, Users, Award,
  ShoppingBag, Heart, ExternalLink, Camera, Info, Car, Bus, Bike, Watch, Wallet, Sparkles, Store
} from "lucide-react";
import { Link } from "react-router";

const MotionLink = motion(Link);
import { BatikBackground, BatikDivider } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { Skeleton } from "../components/ui/skeleton";

type BatikStore = {
  id: number;
  name: string;
  owner: string;
  established: string;
  specialty: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  review_count: number;
  price_range: string;
  tags: string[];
  image: string;
  featured: boolean;
  description: string;
  motifs: string[];
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{
            fill: i < Math.floor(rating) ? "#D4B88B" : "transparent",
            color: i < Math.floor(rating) ? "#D4B88B" : "rgba(212, 184, 139, 0.3)",
          }}
        />
      ))}
    </div>
  );
}

const villageImg = "https://images.unsplash.com/photo-1661011612361-4e0704509a58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMEphdmFuZXNlJTIwaG91c2UlMjB2aWxsYWdlJTIwc3RyZWV0fGVufDF8fHx8MTc3NzUyMDI0MHww&ixlib=rb-4.1.0&q=80&w=1080";
const artisanImg = "https://images.unsplash.com/photo-1527650003412-4c330a38fdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGFydGlzYW4lMjBjcmFmdHNtYW4lMjBwYWludGluZyUyMHdheHxlbnwxfHx8fDE3Nzc1MjAyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const workshopImg = "https://images.unsplash.com/photo-1759655058313-3f29dbf686ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMHdvcmtzaG9wJTIwcHJvZHVjdGlvbiUyMGR5ZWluZyUyMGNsb3RoefGVufDF8fHx8MTc3NzUyMDI0MXww&ixlib=rb-4.1.0&q=80&w=1080";
const storeImg = "https://images.unsplash.com/photo-1776000680547-8f301e8d07b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyY2xvdGhlcyUyMGZhc2hpb24lMjBkaXNwbGF5JTIwc3RvcmV8GVufDF8fHx8MTc3NzUyMDIzNnww&ixlib=rb-4.1.0&q=80&w=1080";
const batikFabricImg = "https://images.unsplash.com/photo-1761516659902-2994696b362e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyZmFicmljJTIwdGV4dGlsZSUyMEluZG9uZXNpYW4lMjB0cmFkaXRpb25hbHwGVufDF8fHx8MTc3NzUyMDIyNnw=&ixlib=rb-4.1.0&q=80&w=1080";
const shopImg = "https://images.unsplash.com/photo-1530603103472-faaa353d8ab0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMEluZG9uZXNpYW4lMjB2aWxsYWdlJTIwdGV4dGlsZSUyMHNob3B8GVufDF8fHx8MTc3NzUyMDIzMHww&ixlib=rb-4.1.0&q=80&w=1080";

const timeline = [
  { year: "1920", event: "Awal mula produksi batik di Jetis oleh para perantau pedagang kain dari Surakarta" },
  { year: "1950", event: "Desa Jetis mulai dikenal sebagai sentra batik cap Sidoarjo dengan puluhan pengrajin aktif" },
  { year: "1978", event: "Berdirinya Batik Amri, toko batik tulis pertama yang mempopulerkan motif Beras Utah" },
  { year: "1990", event: "Kampung Batik Jetis resmi ditetapkan sebagai kampung wisata batik oleh Pemda Sidoarjo" },
  { year: "2010", event: "Ekspansi ke pasar online; produk Batik Jetis mulai merambah pasar mancanegara" },
  { year: "2018", event: "Motif Beras Utah Jetis mendapatkan Hak Kekayaan Intelektual (HAKI) dari Kemenkumham RI" },
  { year: "2024", event: "Desa Batik Jetis masuk Top 10 Desa Wisata Indonesia oleh Kementerian Pariwisata" },
];

export function DesaJetisPage() {
  const [stores, setStores] = useState<BatikStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string>("all");

  useEffect(() => {
    // Gunakan mock data secara langsung untuk memastikan konten muncul
    const mockStores: BatikStore[] = [
      {
        id: 1,
        name: "Batik Amri Jetis",
        owner: "Pak Amri",
        established: "1978",
        specialty: "Batik Tulis Beras Utah",
        address: "Jl. Raya Jetis No. 12",
        phone: "+62 812-3456-7890",
        hours: "08:00 - 17:00",
        rating: 4.9,
        review_count: 256,
        price_range: "Rp 500.000 - Rp 3.000.000",
        tags: ["Batik Tulis", "Custom", "Tradisional"],
        image: artisanImg,
        featured: true,
        description: "Toko batik tertua di Jetis yang terkenal dengan motif Beras Utah asli, dibuat dengan tangan oleh pengrajin berpengalaman.",
        motifs: ["Beras Utah", "Kawung", "Sidomukti"],
      },
      {
        id: 2,
        name: "Batik Siti Collection",
        owner: "Bu Siti",
        established: "1995",
        specialty: "Batik Cap Modern",
        address: "Jl. Batik Jetis No. 45",
        phone: "+62 821-9876-5432",
        hours: "07:30 - 18:00",
        rating: 4.8,
        review_count: 189,
        price_range: "Rp 250.000 - Rp 1.500.000",
        tags: ["Batik Cap", "Modern", "Wedding"],
        image: shopImg,
        featured: false,
        description: "Koleksi batik cap modern dengan motif flora dan fauna yang fresh dan cocok untuk fashion sehari-hari.",
        motifs: ["Mega Mendung", "Bunga Melati", "Burung Merak"],
      },
      {
        id: 3,
        name: "Rumah Batik Hartono",
        owner: "Pak Hartono",
        established: "1985",
        specialty: "Batik Tulis Premium",
        address: "Jl. Jetis Barat No. 28",
        phone: "+62 819-8765-4321",
        hours: "09:00 - 20:00",
        rating: 5.0,
        review_count: 312,
        price_range: "Rp 1.000.000 - Rp 10.000.000",
        tags: ["Batik Tulis", "Premium", "Custom"],
        image: workshopImg,
        featured: false,
        description: "Studio batik premium yang menerima pesanan custom dengan detail dan kualitas terbaik untuk koleksi pribadi.",
        motifs: ["Sido Mulyo", "Lereng", "Semen Gedhe"],
      },
      {
        id: 4,
        name: "Batik Jetis Muda",
        owner: "Kak Dian",
        established: "2015",
        specialty: "Batik Kontemporer",
        address: "Jl. Raya Jetis No. 67",
        phone: "+62 856-7890-1234",
        hours: "10:00 - 21:00",
        rating: 4.7,
        review_count: 98,
        price_range: "Rp 300.000 - Rp 2.000.000",
        tags: ["Modern", "Kontemporer", "Young"],
        image: batikFabricImg,
        featured: false,
        description: "Wajah baru batik Indonesia dengan desain kontemporer yang cocok untuk anak muda dan fashion forward.",
        motifs: ["Geometric", "Abstract", "Modern Kawung"],
      },
    ];
    
    setTimeout(() => {
      setStores(mockStores);
      setLoading(false);
    }, 500);
  }, []);

  const allTags = ["all", ...Array.from(new Set(stores.flatMap(s => s.tags || [])))];
  const filteredStores = filterTag === "all" ? stores : stores.filter(s => s.tags?.includes(filterTag));

  const [likedStores, setLikedStores] = useState<number[]>([]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5" }}>
      {/* ======================== HERO ======================== */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img src={villageImg} alt="Desa Jetis" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(61, 43, 31, 0.98) 0%, rgba(61, 43, 31, 0.80) 50%, rgba(61, 43, 31, 0.65) 100%)" }} />
        </div>
        
        {/* Decorative Batik Background */}
        <BatikBackground opacity={0.07} patternType="kawung" className="z-10" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full opacity-12" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        
        <div className="container mx-auto px-6 relative z-20 py-24 max-w-7xl">
          <div className="max-w-4xl">
            
            
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-7"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 6vw, 4.2rem)", color: "#FAF8F5", lineHeight: "1.15", fontWeight: 700 }}
            >
              Hubungkan dengan<br/>
              <span style={{ color: "#D4B88B" }}>Pengrajin Batik Terbaik</span>
            </motion.h1>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-10 max-w-2xl"
              style={{ color: "rgba(250, 248, 245, 0.85)", lineHeight: "1.9", fontSize: "1.15rem" }}
            >
              RekaBatik adalah platform yang menghubungkan Anda langsung dengan pengrajin batik berpengalaman di Desa Batik Jetis. Kustomisasi batik sesuai keinginan, bicarakan langsung dengan pembuatnya, dan dapatkan karya budaya berkualitas tinggi.
            </motion.p>
            
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-11"
            >
              {[
                { value: "35+", label: "Pengrajin Mitra" },
                { value: "12.500+", label: "Pelanggan Puas" },
                { value: "48.200+", label: "Pesanan Selesai" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className="p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212, 184, 139, 0.25)" }}
                >
                  <div style={{ fontFamily: "'Playfair Display', serif", color: "#D4B88B", fontSize: "2rem", fontWeight: 700, marginBottom: "0.25rem" }}>{stat.value}</div>
                  <div style={{ color: "rgba(250,248,245,0.7)", fontSize: "0.9rem", fontWeight: 500 }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <MotionLink
                to="/custom"
                className="flex items-center gap-2.5 px-9 py-4 rounded-2xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "linear-gradient(135deg, #D4B88B, #C9AB7F)",
                  color: "#3D2B1F",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  boxShadow: "0 8px 24px rgba(212, 184, 139, 0.35)"
                }}
              >
                <Sparkles className="w-5 h-5" />
                Mulai Kustomisasi
              </MotionLink>
              <motion.a
                href="#toko"
                className="flex items-center gap-2.5 px-9 py-4 rounded-2xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => {
                  e.preventDefault();
                  const section = document.getElementById("toko");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                style={{
                  color: "#FAF8F5",
                  border: "2px solid rgba(250, 248, 245, 0.45)",
                  fontWeight: 600,
                  background: "transparent",
                  fontSize: "1.05rem"
                }}
              >
                <Store className="w-5 h-5" />
                Lihat Pengrajin
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== STATS ======================== */}
      <section style={{ background: "#3D2B1F" }} className="relative py-8 overflow-hidden">
        <BatikBackground opacity={0.08} patternType="parang" />
        <div className="container flex justify-around px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
            {[
              { value: "100+", label: "Tahun Tradisi", icon: Award },
              { value: "350+", label: "Pengrajin Aktif", icon: Users },
              { value: "30+", label: "Toko & Sanggar", icon: ShoppingBag },
              { value: "500+", label: "Motif Unik", icon: Heart },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(212, 184, 139, 0.15)", border: "1px solid rgba(212, 184, 139, 0.25)" }}>
                    <Icon className="w-6 h-6" style={{ color: "#D4B88B" }} />
                  </div>
                  <div>
                    <div style={{ color: "#D4B88B", fontSize: "1.5rem", fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{s.value}</div>
                    <div style={{ color: "rgba(250, 248, 245, 0.7)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== ABOUT ======================== */}
      <section className="py-24 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        
        {/* Decorative Elements */}
        <div className="absolute top-40 right-0 w-96 h-96 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)" }} />
        
        <div className="container mx-auto px-6 relative z-10 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              {/* Decorative Corner Elements */}
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-2xl" style={{ border: "2px solid rgba(212, 184, 139, 0.35)", borderRight: "none", borderBottom: "none" }} />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-2xl" style={{ border: "2px solid rgba(212, 184, 139, 0.35)", borderLeft: "none", borderTop: "none" }} />
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-5">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-64 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={artisanImg} alt="Pengrajin batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-44 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={storeImg} alt="Toko batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                </div>
                <div className="space-y-5 pt-10">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-44 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={workshopImg} alt="Workshop batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-64 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={batikFabricImg} alt="Kain batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Content Side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h2 className="mb-7" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: "1.2", fontWeight: 700 }}>
                Mengapa RekaBatik Memilih Desa Jetis?
              </h2>
              
              <div className="space-y-5 mb-8" style={{ color: "#7A6B5E", lineHeight: "1.9", fontSize: "1rem" }}>
                <p>
                  Desa Batik Jetis di Sidoarjo, Jawa Timur, adalah salah satu sentra batik tertua dan terbaik di Indonesia. 
                  Sejak awal abad ke-20, pengrajin di sini telah mewarisi keahlian membatik secara turun-temurun.
                </p>
                <p>
                  Ciri khas batik Jetis adalah motif <span style={{ color: "#3D2B1F", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Beras Utah</span> — butiran beras berserakan yang terinspirasi dari kelimpahan pertanian setempat. 
                  Motif ini sudah mendapatkan Hak Kekayaan Intelektual (HAKI) dan menjadi ikon batik Sidoarjo.
                </p>
                <p>
                  Di RekaBatik, kami percaya bahwa batik terbaik dibuat dengan tangan yang penuh cinta dan pengalaman. 
                  Oleh karena itu, kami bekerja sama langsung dengan pengrajin lokal terbaik di Desa Jetis untuk memastikan setiap karya memiliki kualitas premium.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Award, text: "Kualitas Premium", desc: "Bahan dan pewarna terbaik" },
                  { icon: Users, text: "Pengrajin Berpengalaman", desc: "Pengalaman turun temurun" },
                  { icon: Heart, text: "Cinta & Dedikasi", desc: "Setiap karya dibuat dengan hati" },
                  { icon: Sparkles, text: "Motif Tradisional", desc: "Motif khas Jawa Timur" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      className="p-5 rounded-2xl"
                      style={{ background: "rgba(212, 184, 139, 0.1)", border: "1px solid rgba(212, 184, 139, 0.25)" }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.25)" }}>
                          <Icon className="w-5 h-5" style={{ color: "#8B6F47" }} />
                        </div>
                        <span style={{ color: "#3D2B1F", fontWeight: 600, fontSize: "1.05rem" }}>{item.text}</span>
                      </div>
                      <p style={{ color: "#7A6B5E", fontSize: "0.9rem" }}>{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <BatikDivider />

      {/* ======================== SEJARAH / TIMELINE ======================== */}
      <section id="sejarah" className="py-20 relative overflow-hidden"
        style={{ background: "#FAF8F5" }}>
        <BatikBackground opacity={0.04} patternType="kawung" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(212, 184, 139, 0.2)", color: "#8B6F47" }}>
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.12em", fontWeight: "bold" }}>SEJARAH & PERJALANAN</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "2.7rem", fontWeight: 600 }}>
              Jejak Waktu Batik Jetis
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5"
                style={{ background: "linear-gradient(to bottom, #D4B88B, rgba(212, 184, 139, 0.2))" }} />

              <div className="space-y-6">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all group-hover:scale-110"
                        style={{ background: i === 0 || i === timeline.length - 1 ? "#D4B88B" : "white", border: "2px solid #D4B88B" }}>
                        <span style={{ fontSize: "1rem", color: i === 0 || i === timeline.length - 1 ? "#3D2B1F" : "#8B6F47", fontFamily: "'Playfair Display', serif", fontWeight: "bold" }}>
                          {item.year.slice(-2)}
                        </span>
                      </div>
                    </div>
                    {/* Item Year Content */}
                    <div className="flex-1 pb-1">
                      <div className="p-5 rounded-2xl transition-all group-hover:shadow-md overflow-hidden"
                        style={{ background: "white", border: "1px solid #E8E1DA" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: "bold" }}>
                            {item.year}
                          </span>
                        </div>
                        <p style={{ color: "#7A6B5E", fontSize: "1rem", lineHeight: "1.75" }}>{item.event}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== TOKO-TOKO ======================== */}
      <section id="toko" className="py-20 relative overflow-hidden max-w-[185vh] mx-auto">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <h2 className="mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "2.55rem", fontWeight: 700 }}>
              Toko Batik di Desa Jetis
            </h2>
            <p style={{ color: "#7A6B5E", fontSize: "0.975rem" }}>
              Temukan pengrajin dan toko batik terbaik di jantung sentra batik Sidoarjo
            </p>
          </div>

          {/* Filter tags */}
          <div className="flex flex-wrap gap-2 justify-center mb-9">
            {allTags.map((tag) => (
              <motion.button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className="px-5 py-2.5 rounded-full text-sm"
                animate={{
                  background: filterTag === tag ? "linear-gradient(135deg, #8B6F47, #A88967)" : "rgba(212, 184, 139, 0.15)",
                  color: filterTag === tag ? "#FFFFFF" : "#7A6B5E",
                  borderWidth: filterTag === tag ? 0 : 1,
                  borderColor: filterTag === tag ? "transparent" : "rgba(212, 184, 139, 0.3)",
                  scale: filterTag === tag ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  fontWeight: 600,
                }}
              >
                {tag === "all" ? "Semua Toko" : tag}
              </motion.button>
            ))}
          </div>

          {/* All stores grid - semua card sama besar */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-[#E8E1DA]">
                  <Skeleton className="h-48 w-full rounded-none" style={{ background: "#FAF8F5" }} />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-4 w-full" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-4 w-full" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-4 w-1/2" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-9 w-full rounded-xl" style={{ background: "#FAF8F5" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStores.map((store) => (
                <MotionLink
                  key={store.id}
                  to={`/desa-jetis/${store.id}`}
                  className="rounded-2xl overflow-hidden transition-all"
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(61, 43, 31, 0.15)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ background: "white", border: "1px solid #E8E1DA", boxShadow: "0 2px 12px rgba(61, 43, 31, 0.06)" }}
                >
                  <div className="h-48 relative overflow-hidden">
                    <img src={store.image} alt={store.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(61, 43, 31, 0.9) 0%, rgba(61, 43, 31, 0.4) 60%, transparent 80%)" }} />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 style={{ color: "#FAF8F5", fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700 }}>
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <StarRating rating={store.rating} />
                        <span style={{ color: "rgba(250, 248, 245, 0.8)", fontSize: "0.75rem", fontWeight: 500 }}>
                          ({store.review_count} ulasan)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {store.tags?.slice(0, 2).map((t, ti) => (
                        <span key={ti} className="px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(212, 184, 139, 0.18)", color: "#8B6F47", fontSize: "0.725rem", fontWeight: 600, border: "1px solid rgba(212, 184, 139, 0.3)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="line-clamp-2 mb-4" style={{ color: "#7A6B5E", fontSize: "0.875rem", lineHeight: "1.7" }}>
                      {store.description}
                    </p>
                    <div className="flex items-center gap-1.5 mb-3" style={{ color: "#A89B8F", fontSize: "0.775rem" }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: "#D4B88B" }} />
                      {store.hours}
                    </div>
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(212, 184, 139, 0.25)" }}>
                      <span style={{ color: "#3D2B1F", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {store.price_range}
                      </span>
                      <ChevronRight className="w-4 h-4" style={{ color: "#D4B88B" }} />
                    </div>
                  </div>
                </MotionLink>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== WISATA INFO ======================== */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#3D2B1F" }}>
        <BatikBackground opacity={0.08} patternType="parang" />
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        
        <div className="container mx-auto px-6 relative z-10 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(2rem, 4vw, 2.75rem)", marginBottom: "1rem" }}>
              Jelajahi Keajaiban Desa Jetis
            </h2>
            <p style={{ color: "rgba(250, 248, 245, 0.75)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>
              Nikmati pengalaman wisata budaya batik yang tak terlupakan
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cara sampai */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="group p-8 rounded-3xl"
              style={{
                background: "linear-gradient(145deg, rgba(212, 184, 139, 0.15), rgba(212, 184, 139, 0.05))",
                border: "1px solid rgba(212, 184, 139, 0.25)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(212,184,139,0.2)" }}>
                <MapPin className="w-8 h-8" style={{ color: "#D4B88B" }} />
              </div>
              <h3 className="mb-5" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>
                Menuju Desa Jetis
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: Car, text: "Dari Surabaya: ±30 menit via Tol Waru-Sidoarjo" },
                  { icon: Bus, text: "Bus Surabaya-Sidoarjo, turun Terminal Purabaya" },
                  { icon: Bike, text: "Ojek online dari Alun-alun: ±10 menit" },
                  { icon: MapPin, text: "Koordinat: -7.4458°S, 112.7168°E" }
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-4"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#D4B88B" }} />
                    <span style={{ color: "rgba(250, 248, 245, 0.85)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                      {item.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Tips berkunjung */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -8 }}
              className="group p-8 rounded-3xl"
              style={{
                background: "linear-gradient(145deg, rgba(212, 184, 139, 0.15), rgba(212, 184, 139, 0.05))",
                border: "1px solid rgba(212, 184, 139, 0.25)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(212,184,139,0.2)" }}>
                <Camera className="w-8 h-8" style={{ color: "#D4B88B" }} />
              </div>
              <h3 className="mb-5" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>
                Tips Berkunjung
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: Watch, text: "Pagi hari (08.00–11.00) saat pengrajin aktif" },
                  { icon: Camera, text: "Tanyakan izin sebelum memotret proses" },
                  { icon: Wallet, text: "Bawa uang tunai untuk transaksi mudah" },
                  { icon: Sparkles, text: "Workshop batik mulai Rp 75.000/orang" }
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-4"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#D4B88B" }} />
                    <span style={{ color: "rgba(250, 248, 245, 0.85)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                      {item.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Pesan via RekaBatik */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8 }}
              className="group p-8 rounded-3xl relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(212, 184, 139, 0.25), rgba(139, 111, 71, 0.1))",
                border: "2px solid rgba(212, 184, 139, 0.4)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20" style={{ transform: "translate(30%, -30%)" }}>
                <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(212,184,139,0.3)" }}>
                  <ExternalLink className="w-8 h-8" style={{ color: "#D4B88B" }} />
                </div>
                <h3 className="mb-4" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>
                  Pesan via RekaBatik
                </h3>
                <p className="mb-7" style={{ color: "rgba(250, 248, 245, 0.88)", fontSize: "0.98rem", lineHeight: "1.75" }}>
                  Tidak bisa datang langsung? Kustomisasi batik impian Anda secara online dan kami hubungkan dengan pengrajin terbaik di Desa Jetis.
                </p>
                <MotionLink
                  to="/custom"
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl w-full"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ 
                    background: "linear-gradient(135deg, #D4B88B, #C9AB7F)",
                    color: "#3D2B1F",
                    fontWeight: 700,
                    boxShadow: "0 8px 24px rgba(212, 184, 139, 0.35)"
                  }}
                >
                  <span>Mulai Kustomisasi</span>
                  <ChevronRight className="w-5 h-5" />
                </MotionLink>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
