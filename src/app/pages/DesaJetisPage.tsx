import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MapPin, Clock, Star, ChevronRight, Users, Award,
  ShoppingBag, Heart, ExternalLink, Camera, Info, Car, Bus, Bike, Watch, Wallet, Sparkles, Store
} from "lucide-react";
import { Link, useNavigate } from "react-router";

const MotionLink = motion(Link);
import { BatikBackground, BatikDivider } from "../components/BatikBackground";
import { supabase } from "../../lib/supabase";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<BatikStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string>("all");
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<number[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("status", "approved");
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Gagal memuat toko");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) {
      setFavoriteStoreIds([]);
      setLoadingFavorites(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("favorite_stores")
        .select("store_id")
        .eq("user_id", user.id);
      if (error) throw error;
      setFavoriteStoreIds(data?.map(f => f.store_id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleFavoriteStore = async (storeId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast.error("Silakan masuk (login) untuk menambahkan favorit");
      navigate("/auth");
      return;
    }
    const isFavorite = favoriteStoreIds.includes(storeId);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_stores")
          .delete()
          .eq("user_id", user.id)
          .eq("store_id", storeId);
        if (error) throw error;
        setFavoriteStoreIds(prev => prev.filter(id => id !== storeId));
        toast.success("Dihapus dari favorit");
      } else {
        const { error } = await supabase
          .from("favorite_stores")
          .insert([{ user_id: user.id, store_id: storeId }]);
        if (error) throw error;
        setFavoriteStoreIds(prev => [...prev, storeId]);
        toast.success("Ditambahkan ke favorit");
      }
    } catch (error) {
      toast.error("Gagal memperbarui favorit");
    }
  };

  useEffect(() => {
    fetchStores();
    fetchFavorites();
  }, [user]);

  const allTags = ["all", ...Array.from(new Set(stores.flatMap(s => s.tags || [])))];
  const filteredStores = filterTag === "all" ? stores : stores.filter(s => s.tags?.includes(filterTag));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5" }}>
      {/* ======================== HERO ======================== */}
      <section className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img src={villageImg} alt="Desa Jetis" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(61, 43, 31, 0.98) 0%, rgba(61, 43, 31, 0.85) 50%, rgba(61, 43, 31, 0.75) 100%)" }} />
        </div>
        
        {/* Decorative Batik Background */}
        <BatikBackground opacity={0.07} patternType="kawung" className="z-10" />
        
        <div className="container mx-auto px-6 relative z-20 py-16 sm:py-24 max-w-7xl">
          <div className="max-w-4xl">
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-5 sm:mb-7"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 8vw, 4.2rem)", color: "#FAF8F5", lineHeight: "1.1", fontWeight: 700 }}
            >
              Hubungkan dengan<br/>
              <span style={{ color: "#D4B88B" }}>Pengrajin Batik Terbaik</span>
            </motion.h1>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8 sm:mb-10 max-w-2xl"
              style={{ color: "rgba(250, 248, 245, 0.85)", lineHeight: "1.7", fontSize: "clamp(1rem, 2.5vw, 1.15rem)" }}
            >
              RekaBatik adalah platform yang menghubungkan Anda langsung dengan pengrajin batik berpengalaman di Desa Batik Jetis. Kustomisasi batik sesuai keinginan, bicarakan langsung dengan pembuatnya.
            </motion.p>
            
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 mb-10 sm:mb-11"
            >
              {[
                { value: "35+", label: "Pengrajin Mitra" },
                { value: "12k+", label: "Pelanggan" },
                { value: "48k+", label: "Pesanan" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className="p-4 sm:p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212, 184, 139, 0.25)" }}
                >
                  <div style={{ fontFamily: "'Playfair Display', serif", color: "#D4B88B", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, marginBottom: "0.25rem" }}>{stat.value}</div>
                  <div style={{ color: "rgba(250,248,245,0.7)", fontSize: "0.8rem", fontWeight: 500 }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
            
            {/* CTA Buttons - Full width on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <MotionLink
                to="/custom"
                className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-full w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "linear-gradient(135deg, #D4B88B, #C9AB7F)",
                  color: "#3D2B1F",
                  fontWeight: 700,
                  fontSize: "1rem",
                  boxShadow: "0 8px 24px rgba(212, 184, 139, 0.35)"
                }}
              >
                <Sparkles className="w-5 h-5" />
                Mulai Kustomisasi
              </MotionLink>
              <motion.a
                href="#toko"
                className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-full w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => {
                  e.preventDefault();
                  const section = document.getElementById("toko");
                  if (section) section.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  color: "#FAF8F5",
                  border: "2px solid rgba(250, 248, 245, 0.4)",
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(4px)",
                  fontSize: "1rem"
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
      <section style={{ background: "#3D2B1F" }} className="relative py-6 sm:py-8 overflow-hidden">
        <BatikBackground opacity={0.08} patternType="parang" />
        <div className="container px-4 relative z-10 mx-auto">
          <div className="grid grid-cols-4 gap-1 sm:gap-3 md:gap-8 lg:gap-30 max-w-6xl mx-auto">
            {[
              { value: "100+", label: "Tahun Tradisi", icon: Award },
              { value: "350+", label: "Pengrajin Aktif", icon: Users },
              { value: "30+", label: "Toko & Sanggar", icon: ShoppingBag },
              { value: "500+", label: "Motif Unik", icon: Heart },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-2 p-2 sm:p-3 md:flex-row md:items-center md:text-left md:gap-4 md:p-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(212, 184, 139, 0.15)", border: "1px solid rgba(212, 184, 139, 0.25)" }}>
                    <Icon className="w-6 h-6" style={{ color: "#D4B88B" }} />
                  </div>
                  <div>
                    <div style={{ color: "#D4B88B", fontSize: "clamp(1.2rem, 3vw, 1.5rem)", fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{s.value}</div>
                    <div style={{ color: "rgba(250, 248, 245, 0.7)", fontSize: "0.75rem", marginTop: "0.1rem" }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== ABOUT ======================== */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        
        <div className="container mx-auto px-6 relative z-10 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative order-2 lg:order-1"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div className="space-y-3 sm:space-y-5">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-48 sm:h-64 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={artisanImg} alt="Pengrajin batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-32 sm:h-44 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={storeImg} alt="Toko batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                </div>
                <div className="space-y-3 sm:space-y-5 pt-6 sm:pt-10">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-32 sm:h-44 rounded-3xl overflow-hidden shadow-xl"
                    style={{ border: "1px solid rgba(212, 184, 139, 0.3)" }}
                  >
                    <img src={workshopImg} alt="Workshop batik" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="h-48 sm:h-64 rounded-3xl overflow-hidden shadow-xl"
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
              className="order-1 lg:order-2"
            >
              <div className="inline-block px-3 py-1 rounded-lg mb-4" style={{ background: "rgba(212, 184, 139, 0.15)", border: "1px solid rgba(212, 184, 139, 0.25)" }}>
                <span className="text-[10px] font-bold tracking-widest text-[#8B6F47] uppercase">Warisan Budaya</span>
              </div>
              <h2 className="mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)", lineHeight: "1.2", fontWeight: 700 }}>
                Mengapa RekaBatik<br className="hidden sm:block" /> Memilih Desa Jetis?
              </h2>
              
              <div className="space-y-5 mb-10 text-[13px] sm:text-base" style={{ color: "#7A6B5E", lineHeight: "1.8" }}>
                <p>
                  Desa Batik Jetis di Sidoarjo, Jawa Timur, adalah salah satu sentra batik tertua dan terbaik di Indonesia. 
                  Sejak awal abad ke-20, pengrajin di sini telah mewarisi keahlian membatik secara turun-temurun.
                </p>
                <p>
                  Ciri khas batik Jetis adalah motif <span style={{ color: "#3D2B1F", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Beras Utah</span> — butiran beras berserakan yang terinspirasi dari kelimpahan pertanian setempat. 
                </p>
              </div>

              {/* Features Grid - 2x2 on mobile */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: Award, text: "Premium", desc: "Kualitas terbaik" },
                  { icon: Users, text: "Lokal", desc: "Asli Desa Jetis" },
                  { icon: Heart, text: "Handmade", desc: "Dibuat manual" },
                  { icon: Sparkles, text: "HAKI", desc: "Motif Terdaftar" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E8E1DA] hover:border-[#D4B88B] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212, 184, 139, 0.15)" }}>
                          <Icon className="w-4 h-4" style={{ color: "#8B6F47" }} />
                        </div>
                        <span style={{ color: "#3D2B1F", fontWeight: 700, fontSize: "0.85rem" }}>{item.text}</span>
                      </div>
                      <p style={{ color: "#7A6B5E", fontSize: "0.7rem", fontWeight: 500 }}>{item.desc}</p>
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
      <section id="sejarah" className="py-16 sm:py-20 relative overflow-hidden"
        style={{ background: "#FAF8F5" }}>
        <BatikBackground opacity={0.04} patternType="kawung" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(212, 184, 139, 0.2)", color: "#8B6F47" }}>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", fontWeight: "bold" }}>SEJARAH & PERJALANAN</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 5vw, 2.7rem)", fontWeight: 700 }}>
              Jejak Waktu Batik Jetis
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5"
                style={{ background: "linear-gradient(to bottom, #D4B88B, rgba(212, 184, 139, 0.2))" }} />

              <div className="space-y-4 sm:space-y-6">
                {timeline.map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 sm:gap-6 group"
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center relative z-10 transition-all group-hover:scale-110 bg-white border-2 border-[#D4B88B] shadow-sm">
                        <span style={{ fontSize: "0.8rem", color: "#8B6F47", fontFamily: "'Playfair Display', serif", fontWeight: "bold" }}>
                          {item.year.slice(-2)}
                        </span>
                      </div>
                    </div>
                    {/* Item Year Content */}
                    <div className="flex-1 pb-2">
                      <div className="p-4 sm:p-5 rounded-2xl transition-all group-hover:shadow-md overflow-hidden bg-white border border-[#E8E1DA]">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <span style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.1rem sm:1.3rem", fontWeight: "bold" }}>
                            {item.year}
                          </span>
                        </div>
                        <p style={{ color: "#7A6B5E", fontSize: "0.85rem sm:0.95rem", lineHeight: "1.6" }}>{item.event}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== TOKO-TOKO ======================== */}
      <section id="toko" className="py-16 sm:py-20 relative overflow-hidden max-w-[185vh] mx-auto">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.8rem, 5vw, 2.55rem)", fontWeight: 700 }}>
              Toko Batik di Desa Jetis
            </h2>
            <p style={{ color: "#7A6B5E", fontSize: "0.9rem sm:0.975rem" }}>
              Temukan pengrajin dan toko batik terbaik di jantung sentra batik Sidoarjo
            </p>
          </div>

          {/* Filter tags - Edge-to-edge scrollable on mobile */}
          <div className="-mx-6 px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-8 sm:mb-10">
            <div className="flex gap-2 min-w-max sm:justify-center">
              {allTags.map((tag) => (
                <motion.button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-sm whitespace-nowrap"
                  animate={{
                    background: filterTag === tag ? "linear-gradient(135deg, #8B6F47, #A88967)" : "rgba(212, 184, 139, 0.12)",
                    color: filterTag === tag ? "#FFFFFF" : "#7A6B5E",
                    borderWidth: filterTag === tag ? 0 : 1,
                    borderColor: filterTag === tag ? "transparent" : "rgba(212, 184, 139, 0.2)",
                    scale: filterTag === tag ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ fontWeight: 600 }}
                >
                  {tag === "all" ? "Semua Toko" : tag}
                </motion.button>
              ))}
            </div>
          </div>

          {/* All stores grid - Shopee style grid 2 kolom di mobile */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-[#E8E1DA]">
                  <Skeleton className="h-32 sm:h-48 w-full rounded-none" style={{ background: "#FAF8F5" }} />
                  <div className="p-3 sm:p-5 space-y-3">
                    <Skeleton className="h-4 w-3/4" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-3 w-full" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-3 w-full" style={{ background: "#FAF8F5" }} />
                    <Skeleton className="h-8 w-full rounded-xl" style={{ background: "#FAF8F5" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredStores.map((store) => (
                <MotionLink
                  key={store.id}
                  to={`/desa-jetis/${store.id}`}
                  className="rounded-2xl overflow-hidden transition-all flex flex-col h-full"
                  whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(61, 43, 31, 0.1)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ background: "white", border: "1px solid #E8E1DA", boxShadow: "0 2px 8px rgba(61, 43, 31, 0.04)" }}
                >
                  <div className="h-36 sm:h-48 relative overflow-hidden flex-shrink-0">
                    <img src={store.image} alt={store.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    <button
                      onClick={(e) => toggleFavoriteStore(store.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm hover:scale-110 transition-all z-10"
                    >
                      <Heart
                        className="w-3.5 h-3.5"
                        fill={favoriteStoreIds.includes(store.id) ? "#EF4444" : "none"}
                        style={{ color: favoriteStoreIds.includes(store.id) ? "#EF4444" : "#3D2B1F" }}
                      />
                    </button>
                    {store.featured && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#D4B88B] text-white text-[9px] font-bold tracking-wider shadow-sm">
                        PREMIUM
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {store.tags?.slice(0, 1).map((t, ti) => (
                        <span key={ti} className="px-2 py-0.5 rounded-md"
                          style={{ background: "rgba(212, 184, 139, 0.12)", color: "#8B6F47", fontSize: "0.65rem", fontWeight: 700, border: "1px solid rgba(212, 184, 139, 0.2)" }}>
                          {t}
                        </span>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-2.5 h-2.5 fill-[#D4B88B] text-[#D4B88B]" />
                        <span style={{ color: "#3D2B1F", fontSize: "0.7rem", fontWeight: 700 }}>{store.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-[#3D2B1F] text-xs sm:text-sm mb-1.5 line-clamp-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {store.name}
                    </h3>
                    
                    <p className="line-clamp-2 mb-3 text-[10px] sm:text-[11px] leading-relaxed" style={{ color: "#7A6B5E" }}>
                      {store.description}
                    </p>

                    <div className="flex items-center justify-between pt-2.5 mt-auto border-t border-[#F0EBE5]">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#A89B8F] font-semibold uppercase tracking-wider">Mulai</span>
                        <span className="text-[#8B6F47] text-[11px] sm:text-xs font-bold">
                          {store.price_range ? store.price_range.split("-")[0].trim() : "Hubungi Kami"}
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FAF8F5] group-hover:bg-[#8B6F47] group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
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
      <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "#3D2B1F" }}>
        <BatikBackground opacity={0.08} patternType="parang" />
        
        <div className="container mx-auto px-6 relative z-10 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(1.8rem, 5vw, 2.75rem)", marginBottom: "0.75rem" }}>
              Jelajahi Desa Jetis
            </h2>
            <p style={{ color: "rgba(250, 248, 245, 0.75)", fontSize: "0.95rem sm:1.05rem", maxWidth: "600px", margin: "0 auto" }}>
              Nikmati pengalaman wisata budaya batik yang tak terlupakan
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-5 sm:gap-8">
            {/* Cara sampai */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 sm:p-8 rounded-3xl"
              style={{
                background: "linear-gradient(145deg, rgba(212, 184, 139, 0.12), rgba(212, 184, 139, 0.05))",
                border: "1px solid rgba(212, 184, 139, 0.2)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 sm:mb-6" style={{ background: "rgba(212,184,139,0.2)" }}>
                <MapPin className="w-6 h-6" style={{ color: "#D4B88B" }} />
              </div>
              <h3 className="mb-4 sm:mb-5" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem sm:1.3rem", fontWeight: 700 }}>
                Menuju Desa Jetis
              </h3>
              <ul className="space-y-3.5 sm:space-y-4">
                {[
                  { icon: Car, text: "±30 menit via Tol Sidoarjo" },
                  { icon: Bus, text: "Turun di Terminal Purabaya" },
                  { icon: Bike, text: "Ojek online dari pusat kota" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212, 184, 139, 0.1)" }}>
                      <item.icon className="w-3 h-3" style={{ color: "#D4B88B" }} />
                    </div>
                    <span style={{ color: "rgba(250, 248, 245, 0.8)", fontSize: "0.85rem", fontWeight: 500 }}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Tips berkunjung */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 sm:p-8 rounded-3xl"
              style={{
                background: "linear-gradient(145deg, rgba(212, 184, 139, 0.12), rgba(212, 184, 139, 0.05))",
                border: "1px solid rgba(212, 184, 139, 0.2)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="w-12 rounded-2xl flex items-center justify-center mb-5 sm:mb-6" style={{ height: "3rem", background: "rgba(212,184,139,0.2)" }}>
                <Camera className="w-6 h-6" style={{ color: "#D4B88B" }} />
              </div>
              <h3 className="mb-4 sm:mb-5" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem sm:1.3rem", fontWeight: 700 }}>
                Tips Berkunjung
              </h3>
              <ul className="space-y-3.5 sm:space-y-4">
                {[
                  { icon: Watch, text: "Datang pagi saat pengrajin aktif" },
                  { icon: Camera, text: "Minta izin sebelum memotret" },
                  { icon: Wallet, text: "Siapkan uang tunai secukupnya" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212, 184, 139, 0.1)" }}>
                      <item.icon className="w-3 h-3" style={{ color: "#D4B88B" }} />
                    </div>
                    <span style={{ color: "rgba(250, 248, 245, 0.8)", fontSize: "0.85rem", fontWeight: 500 }}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Pesan via RekaBatik */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-6 sm:p-8 rounded-3xl relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(212, 184, 139, 0.25), rgba(139, 111, 71, 0.1))",
                border: "2px solid rgba(212, 184, 139, 0.4)",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-5 sm:mb-6" style={{ background: "rgba(212,184,139,0.3)" }}>
                  <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: "#D4B88B" }} />
                </div>
                <h3 className="mb-3 sm:mb-4" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem sm:1.35rem", fontWeight: 700 }}>
                  Pesan Online
                </h3>
                <p className="mb-6 sm:mb-7" style={{ color: "rgba(250, 248, 245, 0.88)", fontSize: "0.85rem sm:0.98rem", lineHeight: "1.6" }}>
                  Kustomisasi batik impian Anda secara online dan kami hubungkan dengan pengrajin Desa Jetis.
                </p>
                <MotionLink
                  to="/custom"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    background: "linear-gradient(135deg, #D4B88B, #C9AB7F)",
                    color: "#3D2B1F",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    boxShadow: "0 8px 20px rgba(212, 184, 139, 0.3)"
                  }}
                >
                  <span>Mulai Sekarang</span>
                  <ChevronRight className="w-4 h-4" />
                </MotionLink>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
