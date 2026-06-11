import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Palette, Sparkles, Clock, Award, Star, ChevronRight,
  Users, Package, MapPin, TrendingUp, ShoppingBag, Heart, Grid3x3
} from "lucide-react";
import { useState, useEffect } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem, Review } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import heroImg from "../../imports/heroSection.png";

interface PopularPatternMapped extends BatikItem {
  tag: string;
}
const artisanImg = "https://images.unsplash.com/photo-1527650003412-4c3a0a38fdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGFydGlzYW4lMjBjcmFmdHNtYW4lMjBwYWludGluZyUyMHdheHxlbnwxfHx8fDE3Nzc1MjAyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const reviewImg1 = "https://images.unsplash.com/photo-1758600587815-b654d1405e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGN1c3RvbWVyJTIwcmV2aWV3JTIwcG9ydHJhaXQlMjBBc2lhbiUyMHdvbWFufGVufDF8fHx8MTc3NzUyMDIzNnww&ixlib=rb-4.1.0&q=80&w=400";
const reviewImg2 = "https://images.unsplash.com/photo-1545696968-1a5245650b36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBc2lhbiUyMG1hbiUyMHNtaWxpbmclMjBwb3J0cmFpdCUyMGN1c3RvbWVyfGVufDF8fHx8MTc3NzUyMDIzNnww&ixlib=rb-4.1.0&q=80&w=400";
const womanBatikImg = "https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJbmRvbmVzaWFuJTIwd29tYW4lMjB3ZWFyaW5nJTIwYmF0aWslMjBwb3J0cmFpdHxlbnwxfHx8fDE3Nzc1MjAyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080";
const villageImg = "https://images.unsplash.com/photo-1661011612361-4e0704509a58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMEphdmFuZXNlJTIwaG91c2UlMjB2aWxsYWdlJTIwc3RyZWV0fGVufDF8fHx8MTc3NzUyMDI0MHww&ixlib=rb-4.1.0&q=80&w=1080";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-4 h-4"
          fill={s <= rating ? "#D4B88B" : "none"}
          color={s <= rating ? "#D4B88B" : "#E8E1DA"}
        />
      ))}
    </div>
  );
}

// Batik SVG pattern preview components
function BatikPatternPreview({ type, primary, secondary, bg }: { type: string; primary: string; secondary: string; bg: string }) {
  const id = `prev-${type}-${Math.random().toString(36).substr(2, 5)}`;
  const renderPat = () => {
    if (type === "parang") return (
      <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect fill={bg} width="40" height="40"/>
        <path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2.5" fill="none"/>
        <path d="M0,30 Q10,20 20,30 Q30,40 40,30" stroke={secondary} strokeWidth="1.5" fill="none"/>
        <path d="M0,10 Q10,0 20,10 Q30,20 40,10" stroke={secondary} strokeWidth="1.5" fill="none"/>
      </pattern>
    );
    if (type === "kawung") return (
      <pattern id={id} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect fill={bg} width="50" height="50"/>
        <ellipse cx="25" cy="14" rx="6" ry="10" fill="none" stroke={primary} strokeWidth="1.5"/>
        <ellipse cx="25" cy="36" rx="6" ry="10" fill="none" stroke={primary} strokeWidth="1.5"/>
        <ellipse cx="14" cy="25" rx="10" ry="6" fill="none" stroke={primary} strokeWidth="1.5"/>
        <ellipse cx="36" cy="25" rx="10" ry="6" fill="none" stroke={primary} strokeWidth="1.5"/>
        <circle cx="25" cy="25" r="3" fill={secondary}/>
      </pattern>
    );
    if (type === "mega") return (
      <pattern id={id} x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
        <rect fill={bg} width="80" height="40"/>
        <path d="M0,20 Q10,8 20,20 Q30,32 40,20 Q50,8 60,20 Q70,32 80,20" stroke={primary} strokeWidth="3" fill="none"/>
        <path d="M0,20 Q10,8 20,20 Q30,32 40,20 Q50,8 60,20 Q70,32 80,20" stroke={secondary} strokeWidth="1.5" fill="none" transform="translate(0,-7)"/>
      </pattern>
    );
    if (type === "truntum") return (
      <pattern id={id} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect fill={bg} width="50" height="50"/>
        <polygon points="25,8 28,18 38,18 30,24 33,34 25,28 17,34 20,24 12,18 22,18" fill={primary} stroke={secondary} strokeWidth="1"/>
        <circle cx="25" cy="25" r="3" fill={secondary}/>
      </pattern>
    );
    if (type === "sekar") return (
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
    // sido mukti geometric
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
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>{renderPat()}</defs>
      <rect width="100%" height="100%" fill={`url(#${id})`}/>
    </svg>
  );
}

export function HomePage() {
  const [activeReview, setActiveReview] = useState(0);
  const [likedPatterns, setLikedPatterns] = useState<number[]>([]);

  const toggleLikePattern = (id: number) => {
    setLikedPatterns((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const [popularPatterns, setPopularPatterns] = useState<PopularPatternMapped[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [trendingItems, setTrendingItems] = useState<{ name: string; sold: number; growth: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch popular patterns
        const { data: patternsData, error: pError } = await supabase
          .from("batik_items")
          .select("*")
          .order("sold", { ascending: false })
          .limit(6);
        
        if (pError) throw pError;
        if (patternsData && patternsData.length > 0) {
          setPopularPatterns(patternsData.map((p: any) => ({
            ...p,
            tag: p.sold > 200 ? "Terlaris" : "Populer"
          })));
        } else {
          setPopularPatterns([]);
        }

        // Fetch reviews
        const { data: reviewsData, error: rError } = await supabase
          .from("reviews")
          .select("*")
          .limit(4);
        
        if (rError) throw rError;
        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData);
        } else {
          setReviews([]);
        }

        // Trending items (mocking growth for now)
        if (patternsData) {
          setTrendingItems(patternsData.slice(0, 5).map((p: any) => ({
            name: p.name,
            sold: p.sold,
            growth: `+${Math.floor(Math.random() * 30) + 10}%`
          })));
        }

      } catch (err: any) {
        handleSupabaseError(err, "HomePage.fetchData");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { icon: Users, value: "12.500+", label: "Pelanggan Puas", color: "#D4B88B" },
    { icon: Package, value: "48.200+", label: "Pesanan Selesai", color: "#8B6F47" },
    { icon: Palette, value: "200+", label: "Motif Tersedia", color: "#D4B88B" },
    { icon: MapPin, value: "35+", label: "Pengrajin Mitra", color: "#8B6F47" },
  ];

  const features = [
    {
      icon: Palette,
      title: "Kustomisasi Penuh",
      description: "Pilih motif, warna, ukuran pola, dan gunakan kuas digital untuk sentuhan personal",
      color: "#D4B88B",
    },
    {
      icon: Sparkles,
      title: "Motif Premium",
      description: "Koleksi motif batik tradisional dan kontemporer dari pengrajin berpengalaman",
      color: "#8B6F47",
    },
    {
      icon: Clock,
      title: "Proses Cepat",
      description: "Desain digital instan, produksi dalam 3-7 hari kerja dengan pengiriman ke seluruh Indonesia",
      color: "#D4B88B",
    },
    {
      icon: Award,
      title: "Kualitas Terjamin",
      description: "Material premium, pewarna alami ramah lingkungan, dan garansi kepuasan pelanggan",
      color: "#8B6F47",
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ======================== HERO SECTION ======================== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImg} alt="Batik" className="w-full h-full object-cover" />
        </div>

        <div className="container mx-10 px-4 relative z-10 py-10 ml-30">
          <div className="max-w-3xl">
            <h1
              className="mb-5"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                lineHeight: "1.2",
                color: "#000000ff",
                fontWeight: "bold",
              }}
            >
              Wujudkan Ide Batik
              Menjadi Karya Indah 
              Bersama <span style={{ color: "#a4834dff" }}>RekaBatik</span>
            </h1>
            <p className="mb-5 max-w-xl" style={{ color: "rgba(0, 0, 0, 0.75)", lineHeight: "1.7", fontSize: "1.1rem" }}>
              Desain batik sendiri dengan mudah, pilih motif, warna, dan
              wujudkan karya unilkmu sekarang!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/custom"
                className="flex items-center gap-2 px-8 py-4 rounded-md transition-all hover:scale-105"
                style={{
                  background: "#3D2B1F ",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 30px rgba(139,111,71,0.3)",
                }}
              >
                <Palette className="w-5 h-5" />
                Mulai Kustomisasi
              </Link>
              <Link
                to="/catalog"
                className="flex items-center gap-2 px-8 py-4 rounded-md transition-all hover:scale-105"
                style={{
                  background: "rgba(255, 255, 255, 0)",
                  color: "#000000ff",
                  border: "2px solid rgba(87, 87, 87, 0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Grid3x3 className="w-5 h-5" />
                Lihat Katalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== STATS BAR ======================== */}
      <section className="relative py-8 overflow-hidden" style={{ background: "#FFFFFF" }}>
        <BatikBackground opacity={0.03} patternType="kawung" />
        <div className="container flex justify-around px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-50">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(212,184,139,0.15)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#3D2B1F", fontSize: "1.7rem", fontFamily: "'Playfair Display', serif" }}>
                      {stat.value}
                    </div>
                    <div style={{ color: "#7A6B5E", fontSize: "0.8rem" }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== FEATURES ======================== */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #5A3E2A 50%, #3D2B1F 100%)" }}>
        <BatikBackground opacity={0.08} patternType="parang" />
        <div className="container mx-auto px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 style={{ fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "1rem" }}>
              Pengalaman Batik Digital Terbaik
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: "rgba(250,248,245,0.7)", fontSize: "1rem", lineHeight: "1.8" }}>
              Kami menggabungkan warisan budaya batik tradisional dengan inovasi teknologi digital modern untuk memberikan pengalaman terbaik
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  className="group relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div
                    className="p-8 rounded-3xl transition-all duration-500"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="flex gap-6 items-start">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
                          style={{ 
                            background: `linear-gradient(135deg, rgba(212,184,139,0.3), rgba(212,184,139,0.15))`,
                            border: `1px solid rgba(212,184,139,0.4)`
                          }}
                        >
                          <Icon className="w-8 h-8" style={{ color: "#D4B88B" }} />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl font-bold" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif" }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-xl font-semibold" style={{ color: "#FAF8F5", fontFamily: "'Playfair Display', serif" }}>
                            {f.title}
                          </h3>
                        </div>
                        <p style={{ color: "rgba(250,248,245,0.65)", fontSize: "0.95rem", lineHeight: "1.8" }}>
                          {f.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="mt-6 h-1 rounded-full w-0 group-hover:w-full transition-all duration-500" style={{ background: "#D4B88B" }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== POPULAR PATTERNS ======================== */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
        <BatikBackground opacity={0.02} patternType="mega" />
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "linear-gradient(135deg, #8B6F47, #D4B88B)" }} />
        <div className="absolute bottom-10 left-0 w-48 h-48 rounded-full opacity-5" style={{ background: "#D4B88B" }} />
        
        <div className="container mx-auto px-8 relative z-10 max-w-[185vh]">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 700, marginBottom: "0.75rem", lineHeight: 1.2 }}>
                Motif Batik <span style={{ color: "#8B6F47" }}>Paling Diminati</span>
              </h2>
              <p style={{ color: "#7A6B5E", fontSize: "1rem", lineHeight: 1.7 }}>
                Jelajahi koleksi motif batik pilihan yang sudah dipakai dan dicintai oleh ribuan pelanggan
              </p>
            </div>
            <Link
              to="/catalog"
              className="group mb-5 flex items-center gap-2 px-7 py-3 rounded-full transition-all "
              style={{ 
                background: "linear-gradient(135deg, #8B6F47, #A88967)", 
                color: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(139,111,71,0.25)"
              }}
            >
              Lihat Semua Koleksi
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Patterns Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <div className="rounded-3xl overflow-hidden bg-white border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(61,43,31,0.04)" }}>
                    <Skeleton className="h-52 w-full rounded-none" />
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-6 w-3/5" />
                      <Skeleton className="h-4 w-2/5" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-10 w-28 rounded-full" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : popularPatterns.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div
                  className="h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-400"
                  style={{ 
                    background: "#FFFFFF", 
                    boxShadow: "0 4px 24px rgba(61,43,31,0.04)", 
                    border: "1px solid #E8E1DA"
                  }}
                >
                  {/* Pattern Preview */}
                  <div className="relative h-52 overflow-hidden" style={{ background: p.bg_color }}>
                    <BatikPatternPreview type={p.tag || "parang"} primary={p.primary_color} secondary={p.secondary_color} bg={p.bg_color} />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    
                    {/* Like button */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => toggleLikePattern(p.id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-115"
                        style={{ 
                          background: "rgba(255,255,255,0.95)", 
                          boxShadow: "0 4px 12px rgba(61,43,31,0.15)",
                          backdropFilter: "blur(8px)"
                        }}
                      >
                        <Heart
                          className="w-5 h-5"
                          fill={likedPatterns.includes(p.id) ? "#8B6F47" : "none"}
                          color={likedPatterns.includes(p.id) ? "#8B6F47" : "#7A6B5E"}
                        />
                      </button>
                    </div>
                    
                    {/* Tag badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm"
                        style={{ 
                          background: "rgba(255,255,255,0.95)", 
                          color: "#8B6F47",
                          backdropFilter: "blur(8px)"
                        }}
                      >
                        {p.tag}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
                        {p.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-5" style={{ color: "#A89B8F", fontSize: "0.85rem" }}>
                      <MapPin className="w-4 h-4" />
                      <span>{p.origin}</span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t" style={{ borderColor: "#E8E1DA" }}>
                      <span style={{ color: "#8B6F47", fontWeight: 700, fontSize: "1.25rem", fontFamily: "'Playfair Display', serif" }}>
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                      <button
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 group-hover:scale-105"
                        style={{ 
                          background: "linear-gradient(135deg, #8B6F47, #A88967)", 
                          color: "#FFFFFF"
                        }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Pesan
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Golden Divider */}
      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== ARTISAN + DESA JETIS PROMO ======================== */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#3b2516ff" }}>
        <BatikBackground opacity={0.06} patternType="parang" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(-50%, -50%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(50%, 50%)" }} />
        
        <div className="container mx-auto px-8 relative z-10 max-w-[185vh]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            > 
              <h2
                className="mb-8"
                style={{ fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(2.2rem, 4vw, 3rem)", lineHeight: "1.25" }}
              >
                Kisah dari<br/>
                <span style={{ color: "#D4B88B" }}>Desa Batik Jetis</span>
              </h2>
              
              <p className="mb-10" style={{ color: "rgba(250,248,245,0.75)", lineHeight: "1.9", fontSize: "1.05rem" }}>
                Desa Batik Jetis di Sidoarjo, Jawa Timur adalah salah satu sentra batik tulis tertua di Indonesia. 
                Dikenal dengan motif khas "Beras Utah" dan flora fauna, para pengrajin di sini mewarisi 
                keahlian turun-temurun yang tak ternilai harganya.
              </p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-5 mb-10">
                {[
                  { value: "100+", label: "Tahun Tradisi" },
                  { value: "350+", label: "Pengrajin Aktif" },
                  { value: "500+", label: "Motif Unik" },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center p-5 rounded-2xl" 
                    style={{ 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid rgba(212,184,139,0.2)",
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    <div className="mb-2" style={{ color: "#D4B88B", fontSize: "2rem", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: "rgba(250,248,245,0.7)", fontSize: "0.85rem", fontWeight: 500 }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/desa-jetis"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full transition-all"
                  style={{ 
                    background: "linear-gradient(135deg, #D4B88B, #E8DCC8)", 
                    color: "#3D2B1F", 
                    fontWeight: 600,
                  }}
                >
                  Jelajahi Desa Jetis
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform " />
                </Link>
              </div>
            </motion.div>

            {/* Right - Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Main image */}
              <div className="relative z-10">
                <div className="rounded-3xl overflow-hidden mb-4" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
                  <img src={artisanImg} alt="Pengrajin batik" className="w-full h-80 object-cover" />
                </div>
              </div>
              
              {/* Floating image 1 */}
              <div className="absolute -left-8 top-1/4 z-20">
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 15px 40px rgba(0,0,0,0.25)" }}
                >
                  <img src={womanBatikImg} alt="Batik fashion" className="w-44 h-56 object-cover" />
                </motion.div>
              </div>
              
              {/* Floating image 2 */}
              <div className="absolute -right-6 bottom-10 z-20">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 15px 40px rgba(0,0,0,0.25)" }}
                >
                  <img src={villageImg} alt="Desa Jetis" className="w-40 h-48 object-cover" />
                </motion.div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute top-6 right-6 z-30">
                <div className="flex items-center gap-2 px-5 py-3 rounded-full" style={{ 
                  background: "rgba(61,43,31,0.9)", 
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,184,139,0.3)"
                }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#D4B88B" }} />
                  <span style={{ color: "#FAF8F5", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em" }}>SINCE 1920</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== TRENDING ======================== */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)" }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-3" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        
        <div className="container mx-auto px-8 relative z-10 max-w-[185vh]">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            > 
              <h2 className="mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: "1.2", fontWeight: "bold" }}>
                Batik Paling Diminati Bulan Ini
              </h2>
              
              <p className="mb-8" style={{ color: "#7A6B5E", fontSize: "1.05rem", lineHeight: "1.8" }}>
                Temukan koleksi batik yang sedang trending dan diminati oleh ribuan pelanggan dari seluruh Indonesia.
              </p>
              
              <Link
                to="/catalog"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all"
                style={{
                  background: "linear-gradient(135deg, #8B6F47, #A88967)",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "1rem",
                  boxShadow: "0 10px 30px rgba(139,111,71,0.3)"
                }}
              >
                <span>Jelajahi Katalog</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Right Trending List */}
            <div className="lg:col-span-7">
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2}}
                      >
                        <Skeleton className="h-24 w-full rounded-2xl" />
                      </motion.div>
                    ))}
                  </div>
                ) : trendingItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2}}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02}}
                    className="group"
                  >
                    <div
                      className="flex items-center gap-5 p-6 rounded-2xl transition-all duration-300 cursor-pointer"
                      style={{
                        background: i === 0 ? "linear-gradient(135deg, rgba(139,111,71,0.08), rgba(212,184,139,0.05))" : "#FFFFFF",
                        border: i === 0 ? "2px solid rgba(139,111,71,0.2)" : "1px solid #E8E1DA",
                      }}
                    >
                      {/* Rank */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: i === 0
                            ? "linear-gradient(135deg, #D4B88B, #8B6F47)"
                            : "rgba(212,184,139,0.15)",
                          color: i === 0 ? "#FFFFFF" : "#8B6F47",
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "1.5rem",
                          fontWeight: 700
                        }}
                      >
                        {i + 1}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="mb-1.5" style={{ color: "#3D2B1F", fontSize: "1.1rem", fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
                          {item.name}
                        </div>
                        <div style={{ color: "#A89B8F", fontSize: "0.9rem" }}>{item.sold.toLocaleString('id-ID')} terjual bulan ini</div>
                      </div>
                      
                      {/* Growth Badge */}
                      <div
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                        style={{
                          background: i === 0 ? "rgba(93,156,89,0.12)" : "rgba(93,156,89,0.08)",
                          color: "#5D9C59",
                          fontWeight: 600,
                          fontSize: "0.85rem"
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                        {item.growth}
                      </div>
                      
                      {/* Arrow */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <ChevronRight className="w-5 h-5" style={{ color: "#8B6F47" }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== REVIEWS ======================== */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #3D2B1F 0%, #5A3E2A 50%, #3D2B1F 100%)" }}>
        <BatikBackground opacity={0.06} patternType="parang" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(-50%, -50%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(50%, 50%)" }} />

        <div className="container mx-auto px-8 relative z-10 max-w-[185vh]">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "1rem" }}>
                Cerita Kepuasan <span style={{ color: "#D4B88B" }}>Mereka</span>
              </h2>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-6 h-6" fill="#D4B88B" color="#D4B88B" />
                    ))}
                  </div>
                  <span style={{ color: "#FAF8F5", fontWeight: 700, fontSize: "1.5rem", fontFamily: "'Playfair Display', serif" }}>4.9</span>
                </div>
                <span style={{ color: "rgba(250,248,245,0.6)", fontSize: "1rem" }}>/5 dari 1.240 ulasan</span>
              </div>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left - Main Featured Review */}
            <div className="lg:col-span-7">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-10 rounded-3xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,184,139,0.2)" }}
                >
                  <div className="flex gap-6 items-start">
                    <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-5">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </div>
                </motion.div>
              ) : reviews.length > 0 && (
                <motion.div
                  key={activeReview}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-10 rounded-3xl relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(212,184,139,0.25)",
                    backdropFilter: "blur(10px)"
                  }}
                >
                  {/* Quote decoration */}
                  <div className="absolute top-6 right-6 opacity-20">
                    <svg width="80" height="80" viewBox="0 0 100 100">
                      <text x="0" y="80" style={{ fontSize: "100px", fill: "#D4B88B", fontFamily: "serif" }}>"</text>
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            src={reviews[activeReview]?.image}
                            alt={reviews[activeReview]?.name}
                            className="w-20 h-20 rounded-full object-cover"
                            style={{ border: "4px solid rgba(212,184,139,0.5)" }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#D4B88B" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#3D2B1F" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <StarRating rating={reviews[activeReview]?.rating} />
                          <span style={{ color: "rgba(250,248,245,0.6)", fontSize: "0.85rem" }}>
                            {reviews[activeReview]?.rating}.0
                          </span>
                        </div>
                        
                        <p
                          className="mb-8 leading-relaxed"
                          style={{ color: "#FAF8F5", fontSize: "clamp(1.1rem, 2vw, 1.25rem)", fontStyle: "italic", lineHeight: "1.9" }}
                        >
                          "{reviews[activeReview]?.comment}"
                        </p>
                        
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <div style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700 }}>
                              {reviews[activeReview]?.name}
                            </div>
                            <div style={{ color: "rgba(250,248,245,0.6)", fontSize: "0.9rem" }}>{reviews[activeReview]?.role}</div>
                          </div>
                          
                          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: "rgba(212,184,139,0.12)", border: "1px solid rgba(212,184,139,0.3)" }}>
                            <span style={{ color: "#D4B88B", fontWeight: 600, fontSize: "0.9rem" }}>
                              {reviews[activeReview]?.product}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right - Review Cards */}
            <div className="lg:col-span-5">
              <div className="space-y-4">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="p-6 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,184,139,0.15)" }}
                    >
                      <div className="flex gap-4 items-start">
                        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  reviews.map((r, i) => (
                    <motion.button
                      key={r.id}
                      onClick={() => setActiveReview(i)}
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      whileHover={{ x: -4 }}
                      className={`w-full p-6 rounded-2xl text-left transition-all duration-300`}
                      style={{
                        background: i === activeReview ? "linear-gradient(135deg, rgba(212,184,139,0.15) 0%, rgba(139,111,71,0.08) 100%)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${i === activeReview ? "rgba(212,184,139,0.5)" : "rgba(212,184,139,0.15)"}`,
                        backdropFilter: "blur(8px)"
                      }}
                    >
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0">
                          <img src={r.image} alt={r.name} className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid rgba(212,184,139,0.4)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span style={{ color: i === activeReview ? "#D4B88B" : "#FAF8F5", fontWeight: 600, fontSize: "1rem", fontFamily: "'Playfair Display', serif" }}>
                              {r.name}
                            </span>
                            {i === activeReview && (
                              <div className="w-2 h-2 rounded-full" style={{ background: "#D4B88B" }} />
                            )}
                          </div>
                          <div className="mb-3">
                            <StarRating rating={r.rating} />
                          </div>
                          <p 
                            className="line-clamp-3"
                            style={{ color: "rgba(250,248,245,0.7)", fontSize: "0.9rem", lineHeight: "1.7" }}
                          >
                            "{r.comment}"
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Stats Cards */}
              {!loading && (
                <div className="grid grid-cols-3 gap-3 mt-8">
                  {[
                    { value: "1.2K+", label: "Ulasan" },
                    { value: "98%", label: "Positif" },
                    { value: "4.9", label: "Rating" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="p-4 rounded-xl text-center"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,184,139,0.15)" }}
                    >
                      <div style={{ color: "#D4B88B", fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
                      <div style={{ color: "rgba(250,248,245,0.6)", fontSize: "0.8rem" }}>{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== CTA ======================== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#84643969" }}>
        <BatikBackground opacity={0.05} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2
            className="mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: "#684412ff", fontSize: "2.8rem", lineHeight: "1.3", fontWeight: "bold" }}
          >
            Siap Membuat Batik
            <span style={{ color: "#4a2d00ff", display: "block" }}>Impian Anda?</span>
          </h2>
          <p className="mb-10 max-w-xl mx-auto" style={{ color: "rgba(67, 44, 8, 0.85)", lineHeight: "1.7", fontSize: "1.10rem", fontWeight: "400" }}>
            Bergabunglah dengan 12.500+ pelanggan yang telah merasakan pengalaman kustomisasi batik digital terbaik Indonesia.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/custom"
              className="flex items-center gap-2 px-8 py-4 rounded-full transition-all"
              style={{
                background: "#9b6b22ff",
                color: "#eae1dcff",
                fontWeight: "bold"
              }}
            >
              <Palette className="w-5 h-5" />
              Mulai Kustomisasi Gratis
            </Link>
            <Link
              to="/desa-jetis"
              className="flex items-center gap-2 px-8 py-4 rounded-full transition-all"
              style={{
                color: "#3D2B1F",
                border: "2px solid #3D2B1F",
                background: "transparent",
                fontWeight: "bold",
              }}
            >
              <MapPin className="w-5 h-5" />
              Kunjungi Desa Jetis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
