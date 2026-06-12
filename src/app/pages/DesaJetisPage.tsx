import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MapPin, Phone, Clock, Star, ChevronRight, Users, Award,
  ShoppingBag, Heart, ExternalLink, Camera, Info
} from "lucide-react";
import { Link } from "react-router";
import { BatikBackground, BatikDivider } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { Store } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";

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
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");

  useEffect(() => {
    // Gunakan mock data secara langsung untuk memastikan konten muncul
    const mockStores: Store[] = [
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
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img src={villageImg} alt="Desa Jetis" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(61, 43, 31, 0.95) 0%, rgba(61, 43, 31, 0.75) 55%, rgba(61, 43, 31, 0.6) 100%)" }} />
        </div>
        
        {/* Decorative Batik Background */}
        <BatikBackground opacity={0.08} patternType="kawung" className="z-10" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-0 w-72 h-72 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        
        <div className="container mx-auto px-6 relative z-20 py-20 max-w-[185vh]">
          <div className="max-w-4xl">
            {/* Location Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-2 mb-6"
            >
            </motion.div>
            
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#FAF8F5", lineHeight: "1.15", fontWeight: 700 }}
            >
              Desa Batik Jetis
              <span style={{ color: "#D4B88B", display: "block", marginTop: "0.5rem" }}>Warisan Budaya Nusantara</span>
            </motion.h1>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-10 max-w-2xl"
              style={{ color: "rgba(250, 248, 245, 0.88)", lineHeight: "1.9", fontSize: "1.1rem" }}
            >
              Lebih dari 100 tahun, Desa Jetis menjadi jantung produksi batik Sidoarjo. Dengan ratusan pengrajin
              terampil, motif-motif khas seperti <em style={{ color: "#D4B88B", fontStyle: "normal", fontWeight: 600 }}>"Beras Utah"</em>, flora, fauna, dan lukisan alam menjadi
              identitas budaya yang tak ternilai.
            </motion.p>
            
            {/* Stats Mini */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-7 mb-9"
            >
              {[
                { value: "100+", label: "Tahun Sejarah" },
                { value: "350+", label: "Pengrajin" },
                { value: "30+", label: "Toko Batik" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-15 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.15)", border: "1px solid rgba(212, 184, 139, 0.3)" }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", color: "#D4B88B", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", marginLeft: "0.2rem" }}>{`${stat.value}`}</span>
                  </div>
                  <div>
                    <div style={{ color: "#FAF8F5", fontWeight: 600 }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="#toko"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #D4B88B, #C9AB7F)", color: "#3D2B1F", fontWeight: 600 }}
              >
                <ShoppingBag className="w-5 h-5" />
                Jelajahi Toko
              </a>
              <a
                href="#sejarah"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl transition-all hover:bg-white/10 hover:scale-105"
                style={{ color: "#FAF8F5", border: "2px solid rgba(250, 248, 245, 0.4)", fontWeight: 600, background: "transparent" }}
              >
                <Info className="w-5 h-5" />
                Sejarah Desa
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================== STATS ======================== */}
      <section style={{ background: "#3D2B1F" }} className="relative py-8 overflow-hidden">
        <BatikBackground opacity={0.08} patternType="parang" />
        <div className="container flex justify-around px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-50">
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
        
        <div className="container mx-auto px-6 relative z-10 max-w-[185vh]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content Side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
           
              <h2 className="mb-7" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: "1.2", fontWeight: 700 }}>
                Sentra Batik Sidoarjo yang Mendunia
              </h2>
              
              <div className="space-y-5 mb-8" style={{ color: "#7A6B5E", lineHeight: "1.9", fontSize: "1rem" }}>
                <p>
                  Berlokasi di Kelurahan Jetis, Kecamatan Sidoarjo, Kabupaten Sidoarjo, Jawa Timur, kampung batik ini
                  merupakan salah satu pusat produksi batik tertua di kawasan Jawa Timur. Sejak awal abad ke-20,
                  warga Jetis telah menggeluti seni membatik secara turun-temurun.
                </p>
                <p>
                  Ciri khas batik Jetis adalah penggunaan motif <span style={{ color: "#3D2B1F", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Beras Utah</span> (butiran beras berserakan),
                  yang terinspirasi dari kelimpahan hasil pertanian setempat. Motif ini telah terdaftar sebagai
                  kekayaan intelektual daerah dan menjadi simbol kebanggaan Sidoarjo.
                </p>
                <p>
                  Selain Beras Utah, pengrajin Jetis juga mengembangkan motif flora-fauna khas Jawa Timur, seperti
                  burung merak, kupu-kupu, bunga kenongo, dan ikan kerapu — mencerminkan kekayaan alam dan budaya setempat.
                </p>
              </div>

              {/* Motif highlights */}
              <div className="mb-2" style={{ color: "#7A6B5E", fontSize: "0.875rem", fontWeight: 600 }}>
                Motif Unggulan Desa Jetis:
              </div>
              <div className="flex flex-wrap gap-2.5">
                {["Beras Utah", "Burung Merak", "Kenongo", "Kembang Setaman", "Sisik Ikan", "Kupu-kupu"].map((m, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2.5 rounded-full text-sm"
                    style={{ background: "rgba(212, 184, 139, 0.15)", color: "#8B6F47", border: "1px solid rgba(212, 184, 139, 0.3)", fontWeight: 600 }}>
                    {m}
                  </motion.span>
                ))}
              </div>
            </motion.div>
            
            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
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
      <section id="toko" className="py-20 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(212, 184, 139, 0.2)", color: "#8B6F47" }}>
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.12em", fontWeight: 500 }}>DIREKTORI TOKO</span>
            </div>
            <h2 className="mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "2.25rem", fontWeight: 700 }}>
              Toko Batik di Desa Jetis
            </h2>
            <p style={{ color: "#7A6B5E", fontSize: "0.975rem" }}>
              Temukan pengrajin dan toko batik terbaik di jantung sentra batik Sidoarjo
            </p>
          </div>

          {/* Filter tags */}
          <div className="flex flex-wrap gap-2 justify-center mb-9">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className="px-5 py-2.5 rounded-full text-sm transition-all"
                style={{
                  background: filterTag === tag ? "linear-gradient(135deg, #8B6F47, #A88967)" : "rgba(212, 184, 139, 0.15)",
                  color: filterTag === tag ? "#FFFFFF" : "#7A6B5E",
                  border: filterTag === tag ? "none" : "1px solid rgba(212, 184, 139, 0.3)",
                  fontWeight: 600,
                  boxShadow: filterTag === tag ? "0 4px 16px rgba(139, 111, 71, 0.3)" : "none"
                }}
              >
                {tag === "all" ? "Semua Toko" : tag}
              </button>
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
                <div
                  key={store.id}
                  className="rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  style={{ background: "white", border: "1px solid #E8E1DA", boxShadow: "0 2px 12px rgba(61, 43, 31, 0.06)" }}
                  onClick={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
                >
                  <div className="h-48 relative overflow-hidden">
                    <img src={store.image} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(61, 43, 31, 0.9) 0%, rgba(61, 43, 31, 0.4) 60%, transparent 80%)" }} />
                    {/* Badge untuk featured store */}
                    {store.featured && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                          style={{ background: "linear-gradient(135deg, #D4B88B, #C9AB7F)", color: "#3D2B1F", fontWeight: 600 }}>
                          ⭐ Unggulan
                        </span>
                      </div>
                    )}
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
                    </div>
                  </div>

                  {/* Expandable detail - semua toko punya ini */}
                  {selectedStore === store.id && (
                    <div className="px-5 pb-5 pt-0" style={{ borderTop: "1px solid #E8E1DA" }}>
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2" style={{ color: "#7A6B5E", fontSize: "0.875rem" }}>
                          <MapPin className="w-4 h-4" style={{ color: "#D4B88B" }} />
                          <span style={{ fontWeight: 500 }}>{store.address}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: "#7A6B5E", fontSize: "0.875rem" }}>
                          <Phone className="w-4 h-4" style={{ color: "#D4B88B" }} />
                          <span style={{ fontWeight: 500 }}>{store.phone}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: "#7A6B5E", fontSize: "0.875rem" }}>
                          <Award className="w-4 h-4" style={{ color: "#D4B88B" }} />
                          <span style={{ fontWeight: 500 }}>Est. {store.established}</span>
                        </div>
                        <div>
                          <div className="mb-2" style={{ color: "#A89B8F", fontSize: "0.8rem", fontWeight: 600 }}>Motif Unggulan:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {store.motifs?.map((m, mi) => (
                              <span key={mi} className="px-2.5 py-1.5 rounded-xl"
                                style={{ background: "rgba(61, 43, 31, 0.08)", color: "#3D2B1F", fontSize: "0.775rem", fontWeight: 600 }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2">
                          <Link
                            to="/catalog"
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm w-full transition-all hover:shadow-md hover:scale-105"
                            style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FFFFFF", fontWeight: 700, boxShadow: "0 4px 16px rgba(139, 111, 71, 0.25)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            Lihat Produk
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================== WISATA INFO ======================== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#3D2B1F" }}>
        <BatikBackground opacity={0.1} patternType="mega" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cara sampai */}
            <div className="p-6 rounded-2xl" style={{ background: "rgba(212, 184, 139, 0.12)", border: "1px solid rgba(212, 184, 139, 0.22)" }}>
              <MapPin className="w-8 h-8 mb-4" style={{ color: "#D4B88B" }} />
              <h3 className="mb-3" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600 }}>
                Cara Menuju Desa Jetis
              </h3>
              <ul className="space-y-2.5" style={{ color: "rgba(250, 248, 245, 0.8)", fontSize: "0.9rem", lineHeight: "1.7" }}>
                <li>🚗 Dari Surabaya: ±30 menit via Tol Waru-Sidoarjo</li>
                <li>🚌 Bus Surabaya-Sidoarjo, turun Terminal Purabaya lalu naik angkot</li>
                <li>🛵 Ojek online dari Alun-alun Sidoarjo: ±10 menit</li>
                <li>📍 Koordinat: -7.4458°S, 112.7168°E</li>
              </ul>
            </div>

            {/* Tips berkunjung */}
            <div className="p-6 rounded-2xl" style={{ background: "rgba(212, 184, 139, 0.12)", border: "1px solid rgba(212, 184, 139, 0.22)" }}>
              <Camera className="w-8 h-8 mb-4" style={{ color: "#D4B88B" }} />
              <h3 className="mb-3" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600 }}>
                Tips Berkunjung
              </h3>
              <ul className="space-y-2.5" style={{ color: "rgba(250, 248, 245, 0.8)", fontSize: "0.9rem", lineHeight: "1.7" }}>
                <li>⏰ Waktu terbaik: Pagi hari (08.00–11.00) saat pengrajin aktif</li>
                <li>📸 Tanyakan izin sebelum memotret proses membatik</li>
                <li>🎒 Bawa uang tunai; beberapa toko belum menerima kartu</li>
                <li>🎓 Tersedia paket workshop batik mulai Rp 75.000/orang</li>
              </ul>
            </div>

            {/* Pesan via RekaBatik */}
            <div className="p-6 rounded-2xl relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(212, 184, 139, 0.18), rgba(212, 184, 139, 0.08))", border: "1px solid rgba(212, 184, 139, 0.32)" }}>
              <ExternalLink className="w-8 h-8 mb-4" style={{ color: "#D4B88B" }} />
              <h3 className="mb-3" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600 }}>
                Pesan via RekaBatik
              </h3>
              <p className="mb-5" style={{ color: "rgba(250, 248, 245, 0.82)", fontSize: "0.9rem", lineHeight: "1.75" }}>
                Tidak bisa datang langsung? Kustomisasi batik impian Anda secara online dan kami akan menghubungkan
                Anda dengan pengrajin terbaik di Desa Jetis.
              </p>
              <Link
                to="/custom"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:scale-105"
                style={{ background: "#D4B88B", color: "#3D2B1F", fontWeight: 500 }}
              >
                <ChevronRight className="w-4 h-4" />
                Mulai Kustomisasi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
