import { Link } from "react-router";
import {
  Palette, Sparkles, Clock, Award, Star, ChevronRight,
  Users, Package, MapPin, TrendingUp, ShoppingBag, ArrowRight, Heart, Grid3x3
} from "lucide-react";
import { useState, useEffect } from "react";
import { BatikBackground, BatikDivider } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem, Review } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";

interface PopularPatternMapped extends BatikItem {
  tag: string;
}

// Image imports via Unsplash
const heroImg = "https://images.unsplash.com/photo-1761516659902-2994696b362e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGZhYnJpYyUyMHRleHRpbGUlMjBJbmRvbmVzaWFuJTIwdHJhZGl0aW9uYWx8ZW58MXx8fHwxNzc3NTIwMjI2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const artisanImg = "https://images.unsplash.com/photo-1527650003412-4c330a38fdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGFydGlzYW4lMjBjcmFmdHNtYW4lMjBwYWludGluZyUyMHdheHxlbnwxfHx8fDE3Nzc1MjAyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
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
          fill={s <= rating ? "#C9960C" : "none"}
          color={s <= rating ? "#C9960C" : "#D1A860"}
        />
      ))}
    </div>
  );
}

// Batik SVG pattern preview components
function BatikPatternPreview({ type, primary, secondary, bg }: { type: string; primary: string; secondary: string; bg: string }) {
  const id = `prev-${type}-${Math.random().toString(36).substr(2,5)}`;
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
        <path d="M0,20 Q10,8 20,20 Q30,32 40,20 Q50,8 60,20 Q70,32 80,20" stroke={secondary} strokeWidth="1.5" fill="none" transform="translate(0,7)"/>
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
    { icon: Users, value: "12.500+", label: "Pelanggan Puas", color: "#C9960C" },
    { icon: Package, value: "48.200+", label: "Pesanan Selesai", color: "#8B4513" },
    { icon: Palette, value: "200+", label: "Motif Tersedia", color: "#C9960C" },
    { icon: MapPin, value: "35+", label: "Pengrajin Mitra", color: "#8B4513" },
  ];

  const features = [
    {
      icon: Palette,
      title: "Kustomisasi Penuh",
      description: "Pilih motif, warna, ukuran pola, dan gunakan kuas digital untuk sentuhan personal",
      color: "#C9960C",
    },
    {
      icon: Sparkles,
      title: "Motif Premium",
      description: "Koleksi motif batik tradisional dan kontemporer dari pengrajin berpengalaman",
      color: "#8B4513",
    },
    {
      icon: Clock,
      title: "Proses Cepat",
      description: "Desain digital instan, produksi dalam 3-7 hari kerja dengan pengiriman ke seluruh Indonesia",
      color: "#C9960C",
    },
    {
      icon: Award,
      title: "Kualitas Terjamin",
      description: "Material premium, pewarna alami ramah lingkungan, dan garansi kepuasan pelanggan",
      color: "#8B4513",
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ======================== HERO SECTION ======================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImg} alt="Batik" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(105deg, rgba(61,28,2,0.92) 0%, rgba(61,28,2,0.75) 50%, rgba(61,28,2,0.4) 100%)" }}
          />
        </div>
        <BatikBackground opacity={0.07} patternType="parang" className="z-10" />

        <div className="container mx-auto px-4 relative z-20 py-20">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: "rgba(201, 150, 12, 0.2)", border: "1px solid rgba(201, 150, 12, 0.4)" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#D4AF37" }} />
              <span style={{ color: "#D4AF37", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
                PLATFORM KUSTOMISASI BATIK #1 INDONESIA
              </span>
            </div>
            <h1
              className="mb-6"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                lineHeight: "1.2",
                color: "#FBF5E6",
              }}
            >
              Wujudkan Ide Batik
              <span style={{ color: "#D4AF37", display: "block" }}>Menjadi Karya Indah</span>
              Penuh Makna
            </h1>
            <p className="mb-8 max-w-xl" style={{ color: "rgba(251, 245, 230, 0.8)", lineHeight: "1.8", fontSize: "1.05rem" }}>
              Rancang batik impian Anda dengan teknologi digital terkini. Pilih dari 200+ motif tradisional,
              kustomisasi warna, dan gunakan kuas digital untuk sentuhan artistik yang personal.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/custom"
                className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #C9960C, #D4AF37)",
                  color: "#3D1C02",
                  boxShadow: "0 8px 30px rgba(201, 150, 12, 0.4)",
                }}
              >
                <Palette className="w-5 h-5" />
                Mulai Kustomisasi
              </Link>
              <Link
                to="/catalog"
                className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#FBF5E6",
                  border: "1px solid rgba(251, 245, 230, 0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Grid3x3 className="w-5 h-5" />
                Lihat Katalog
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-12" style={{ background: "linear-gradient(to bottom, rgba(201, 150, 12, 0), #C9960C)" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "#C9960C" }} />
        </div>
      </section>

      {/* ======================== STATS BAR ======================== */}
      <section className="relative py-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #6B3A1F, #3D1C02)" }}>
        <BatikBackground opacity={0.1} patternType="kawung" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201, 150, 12, 0.15)", border: "1px solid rgba(201, 150, 12, 0.3)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "#D4AF37" }} />
                  </div>
                  <div>
                    <div style={{ color: "#D4AF37", fontSize: "1.5rem", fontFamily: "'Playfair Display', serif" }}>
                      {stat.value}
                    </div>
                    <div style={{ color: "rgba(251, 245, 230, 0.6)", fontSize: "0.75rem" }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <BatikDivider />

      {/* ======================== FEATURES ======================== */}
      <section className="py-20 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(201, 150, 12, 0.1)", color: "#9A6B0A" }}
            >
              <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>MENGAPA REKABATIK</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2.2rem" }}>
              Pengalaman Batik Digital
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ color: "#6B4226", fontSize: "0.95rem" }}>
              Kami menggabungkan keahlian pengrajin batik tradisional dengan teknologi digital modern
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1"
                  style={{
                    background: "white",
                    borderColor: "rgba(201, 150, 12, 0.15)",
                    boxShadow: "0 2px 20px rgba(61, 28, 2, 0.06)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `linear-gradient(135deg, ${f.color}20, ${f.color}10)`, border: `1px solid ${f.color}30` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: f.color }} />
                  </div>
                  <h3 className="mb-2" style={{ color: "#3D1C02", fontFamily: "'Playfair Display', serif" }}>
                    {f.title}
                  </h3>
                  <p style={{ color: "#6B4226", fontSize: "0.875rem", lineHeight: "1.7" }}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================== POPULAR PATTERNS ======================== */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FBF5E6, #F5E6C0)" }}
      >
        <BatikBackground opacity={0.05} patternType="kawung" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-14 gap-4">
            <div>
              <div
                className="inline-block px-4 py-1.5 rounded-full mb-3"
                style={{ background: "rgba(61, 28, 2, 0.08)", color: "#6B3A1F" }}
              >
                <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>KOLEKSI PILIHAN</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2.2rem" }}>
                Motif Batik Terpopuler
              </h2>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
              style={{ color: "#7C3D12", border: "1px solid #C9960C" }}
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-amber-100 p-0">
                  <Skeleton className="h-40 w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))
            ) : popularPatterns.map((p) => (
              <div
                key={p.id}
                className="group rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1"
                style={{ background: "white", boxShadow: "0 4px 20px rgba(61, 28, 2, 0.1)" }}
              >
                {/* Pattern preview */}
                <div className="h-40 relative overflow-hidden" style={{ background: p.bg_color }}>
                  <BatikPatternPreview type={p.type || "parang"} primary={p.primary_color} secondary={p.secondary_color} bg={p.bg_color} />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                      onClick={() => toggleLikePattern(p.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={likedPatterns.includes(p.id) ? "#C9960C" : "none"}
                        color={likedPatterns.includes(p.id) ? "#C9960C" : "#6B4226"}
                      />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
                      style={{ background: "rgba(255,255,255,0.95)", color: "#7C3D12" }}
                    >
                      {p.tag}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 style={{ color: "#3D1C02", fontFamily: "'Playfair Display', serif", fontSize: "1.05rem" }}>
                      {p.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3" style={{ color: "#9A6B4B", fontSize: "0.75rem" }}>
                    <MapPin className="w-3 h-3" /> {p.origin}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span style={{ color: "#7C3D12", fontWeight: "600", fontSize: "1rem" }}>
                      Rp {p.price.toLocaleString("id-ID")}
                    </span>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
                      style={{ background: "rgba(201, 150, 12, 0.1)", color: "#7C3D12", border: "1px solid rgba(201, 150, 12, 0.3)" }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Beli
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== ARTISAN + DESA JETIS PROMO ======================== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#3D1C02" }}>
        <BatikBackground opacity={0.1} patternType="mega" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div
                className="inline-block px-4 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(201, 150, 12, 0.2)", color: "#D4AF37" }}
              >
                <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>✦ WARISAN BUDAYA</span>
              </div>
              <h2
                className="mb-6"
                style={{ fontFamily: "'Playfair Display', serif", color: "#FBF5E6", fontSize: "2.2rem", lineHeight: "1.3" }}
              >
                Dari Tangan Pengrajin
                <span style={{ color: "#D4AF37", display: "block" }}>Desa Batik Jetis</span>
              </h2>
              <p className="mb-6" style={{ color: "rgba(251, 245, 230, 0.75)", lineHeight: "1.8", fontSize: "0.95rem" }}>
                Desa Batik Jetis di Sidoarjo, Jawa Timur adalah salah satu sentra batik tulis tertua di Indonesia.
                Dikenal dengan motif khas "Beras Utah" dan flora fauna, para pengrajin di sini mewarisi
                keahlian turun-temurun yang tak ternilai.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { value: "100+", label: "Tahun Tradisi" },
                  { value: "350+", label: "Pengrajin Aktif" },
                  { value: "500+", label: "Motif Unik" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-4 rounded-xl" style={{ background: "rgba(201, 150, 12, 0.1)", border: "1px solid rgba(201, 150, 12, 0.2)" }}>
                    <div style={{ color: "#D4AF37", fontSize: "1.6rem", fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                    <div style={{ color: "rgba(251, 245, 230, 0.65)", fontSize: "0.75rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <Link
                to="/desa-jetis"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
              >
                Jelajahi Desa Jetis
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right - image grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 rounded-2xl overflow-hidden">
                  <img src={artisanImg} alt="Pengrajin batik" className="w-full h-full object-cover" />
                </div>
                <div className="h-32 rounded-2xl overflow-hidden">
                  <img src={villageImg} alt="Desa Jetis" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="h-32 rounded-2xl overflow-hidden">
                  <img src={womanBatikImg} alt="Batik fashion" className="w-full h-full object-cover" />
                </div>
                <div className="h-48 rounded-2xl overflow-hidden">
                  <img src={heroImg} alt="Batik collection" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== TRENDING ======================== */}
      <section className="py-20 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2">
              <div
                className="inline-block px-4 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(201, 150, 12, 0.1)", color: "#9A6B0A" }}
              >
                <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>TREN TERKINI</span>
              </div>
              <h2 className="mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2rem" }}>
                Batik Paling Diminati Bulan Ini
              </h2>
              <p style={{ color: "#6B4226", fontSize: "0.9rem", lineHeight: "1.8" }}>
                Temukan koleksi batik yang sedang trending dan diminati oleh ribuan pelanggan dari seluruh Indonesia.
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
              >
                Jelajahi Katalog <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:col-span-3 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : trendingItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-lg cursor-pointer"
                  style={{ background: "white", border: "1px solid rgba(201, 150, 12, 0.15)", boxShadow: "0 2px 12px rgba(61, 28, 2, 0.05)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      background: i === 0 ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "rgba(201, 150, 12, 0.1)",
                      color: i === 0 ? "#3D1C02" : "#9A6B0A",
                      fontFamily: "'Playfair Display', serif",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div style={{ color: "#3D1C02" }}>{item.name}</div>
                    <div style={{ color: "#9A6B4B", fontSize: "0.8rem" }}>{item.sold} terjual bulan ini</div>
                  </div>
                  <div
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                    style={{ background: "rgba(34, 130, 34, 0.1)", color: "#226B22" }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {item.growth}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BatikDivider />

      {/* ======================== REVIEWS ======================== */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FBF5E6, #F0E6C8)" }}
      >
        <BatikBackground opacity={0.05} patternType="kawung" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(61, 28, 2, 0.08)", color: "#6B3A1F" }}
            >
              <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>ULASAN PELANGGAN</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2.2rem" }}>
              Apa Kata Mereka?
            </h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <StarRating rating={5} />
              <span style={{ color: "#9A6B0A" }}>4.9/5 dari 1.240 ulasan</span>
            </div>
          </div>

          {/* Featured Review */}
          <div className="max-w-4xl mx-auto mb-8">
            {loading ? (
              <div className="p-8 rounded-2xl bg-white border border-amber-100 flex gap-6 items-start">
                <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ) : reviews.length > 0 && (
              <div
                className="p-8 rounded-2xl relative overflow-hidden transition-all"
                style={{
                  background: "white",
                  boxShadow: "0 8px 40px rgba(61, 28, 2, 0.12)",
                  border: "1px solid rgba(201, 150, 12, 0.2)",
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <text x="0" y="90" style={{ fontSize: "120px", fill: "#7C3D12", fontFamily: "serif" }}>"</text>
                  </svg>
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    <img
                      src={reviews[activeReview]?.image}
                      alt={reviews[activeReview]?.name}
                      className="w-16 h-16 rounded-full object-cover"
                      style={{ border: "3px solid #C9960C" }}
                    />
                  </div>
                  <div className="flex-1">
                    <StarRating rating={reviews[activeReview]?.rating} />
                    <p
                      className="mt-3 mb-5"
                      style={{ color: "#4A2A0A", lineHeight: "1.8", fontStyle: "italic", fontSize: "1.05rem" }}
                    >
                      "{reviews[activeReview]?.comment}"
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div style={{ color: "#3D1C02", fontFamily: "'Playfair Display', serif" }}>
                          {reviews[activeReview]?.name}
                        </div>
                        <div style={{ color: "#9A6B4B", fontSize: "0.8rem" }}>{reviews[activeReview]?.role}</div>
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: "rgba(201, 150, 12, 0.1)", color: "#9A6B0A" }}
                      >
                        {reviews[activeReview]?.product}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review navigation dots */}
          <div className="flex justify-center gap-3">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveReview(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === activeReview ? "2.5rem" : "0.75rem",
                  height: "0.75rem",
                  background: i === activeReview ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "rgba(201, 150, 12, 0.3)",
                }}
              />
            ))}
          </div>

          {/* Mini review cards */}
          <div className="grid md:grid-cols-4 gap-4 mt-10">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setActiveReview(i)}
                className="p-4 rounded-xl text-left transition-all hover:shadow-lg"
                style={{
                  background: i === activeReview ? "white" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${i === activeReview ? "#C9960C" : "rgba(201, 150, 12, 0.15)"}`,
                  boxShadow: i === activeReview ? "0 4px 20px rgba(61, 28, 2, 0.12)" : "none",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <img src={r.image} alt={r.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <div style={{ color: "#3D1C02", fontSize: "0.8rem" }}>{r.name}</div>
                    <StarRating rating={r.rating} />
                  </div>
                </div>
                <p style={{ color: "#6B4226", fontSize: "0.75rem", lineHeight: "1.6" }} className="line-clamp-2">
                  "{r.comment}"
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== CTA ======================== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #6B3A1F, #3D1C02, #1A0A00)" }}>
        <BatikBackground opacity={0.12} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div
            className="inline-block px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(201, 150, 12, 0.2)", color: "#D4AF37" }}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>MULAI HARI INI</span>
          </div>
          <h2
            className="mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: "#FBF5E6", fontSize: "2.8rem", lineHeight: "1.3" }}
          >
            Siap Membuat Batik
            <span style={{ color: "#D4AF37", display: "block" }}>Impian Anda?</span>
          </h2>
          <p className="mb-10 max-w-xl mx-auto" style={{ color: "rgba(251, 245, 230, 0.7)", lineHeight: "1.8" }}>
            Bergabunglah dengan 12.500+ pelanggan yang telah merasakan pengalaman kustomisasi batik digital terbaik Indonesia.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/custom"
              className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #C9960C, #D4AF37)",
                color: "#3D1C02",
                boxShadow: "0 8px 30px rgba(201, 150, 12, 0.3)",
              }}
            >
              <Palette className="w-5 h-5" />
              Mulai Kustomisasi Gratis
            </Link>
            <Link
              to="/desa-jetis"
              className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all"
              style={{
                color: "#D4AF37",
                border: "1px solid rgba(201, 150, 12, 0.4)",
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