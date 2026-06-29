import { Link } from "react-router";
import { motion } from "motion/react";

const MotionLink = motion(Link);
import {
  Palette, Sparkles, Clock, Award, Star, ChevronRight,
  Users, Package, MapPin, TrendingUp, ShoppingBag, Heart, Grid3x3, BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem, Review } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import heroImg from "../../imports/heroSection.png";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { BatikDetailModal } from "../components/BatikDetailModal";
import { AnimatePresence } from "motion/react";
import { fallbackCatalogItems, normalizeBatikName, resolveCatalogItems } from "../constants/batikCatalog";

const learningPreviewOrder = ["Parang", "Kawung", "Mega Mendung", "Truntum"] as const;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBatik, setSelectedBatik] = useState<BatikItem | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [activeReview, setActiveReview] = useState(0);
  const [likedPatterns, setLikedPatterns] = useState<number[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchFavorites = async () => {
    if (!user) {
      setLikedPatterns([]);
      setLoadingFavorites(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorite_batik")
        .select("batik_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setLikedPatterns(data?.map(f => f.batik_id) || []);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleLikePattern = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) {
      toast.error("Silakan masuk (login) untuk menambahkan favorit.");
      navigate("/auth");
      return;
    }

    const isFavorite = likedPatterns.includes(id);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_batik")
          .delete()
          .eq("user_id", user.id)
          .eq("batik_id", id);

        if (error) throw error;
        setLikedPatterns(prev => prev.filter(i => i !== id));
        toast.success("Dihapus dari favorit");
      } else {
        const { error } = await supabase
          .from("favorite_batik")
          .insert([{ user_id: user.id, batik_id: id }]);

        if (error) throw error;
        setLikedPatterns(prev => [...prev, id]);
        toast.success("Ditambahkan ke favorit");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui favorit.");
    }
  };

  const [popularPatterns, setPopularPatterns] = useState<BatikItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [trendingItems, setTrendingItems] = useState<{ name: string; sold: number; growth: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: patternsData, error: pError } = await supabase
          .from("batik_items")
          .select("*")
          .order("sold", { ascending: false })
          .limit(6);
        
        let safePatterns: BatikItem[] = [];
        if (pError || !patternsData || patternsData.length === 0) {
          safePatterns = [...fallbackCatalogItems];
        } else {
          safePatterns = resolveCatalogItems(patternsData as BatikItem[]);
        }

        setPopularPatterns(safePatterns);

        const { data: reviewsData, error: rError } = await supabase
          .from("reviews")
          .select("*")
          .limit(4);
        
        if (rError) throw rError;
        const safeReviews = reviewsData || [];
        if (safeReviews.length > 0) {
          setReviews(safeReviews);
        } else {
          setReviews([]);
        }

        setTrendingItems(safePatterns.slice(0, 5).map((p: any) => ({
          name: p.name || "Batik",
          sold: p.sold || 0,
          growth: `+${Math.floor(Math.random() * 30) + 10}%`
        })));

      } catch (err: any) {
        handleSupabaseError(err, "HomePage.fetchData");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchFavorites();
  }, [user]);

  const handleAddToCart = async (batik: BatikItem, quantity: number) => {
    if (!user) {
      toast.error("Silakan masuk (login) untuk berbelanja.");
      navigate("/auth");
      return;
    }

    setIsAddingToCart(true);
    try {
      const { data: existingCart } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("batik_id", batik.id)
        .single();

      if (existingCart) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingCart.quantity + quantity })
          .eq("id", existingCart.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert([{ user_id: user.id, batik_id: batik.id, quantity }]);
        if (error) throw error;
      }
      
      toast.success(`${quantity}x ${batik.name} ditambahkan ke keranjang!`);
      setSelectedBatik(null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan ke keranjang.");
    } finally {
      setIsAddingToCart(false);
    }
  };

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

  const learningPreviewPatterns = learningPreviewOrder
    .map((name) => {
      const dynamicMatch = popularPatterns.find(
        (item) => normalizeBatikName(item.name) === normalizeBatikName(name),
      );
      if (dynamicMatch) return dynamicMatch;

      return fallbackCatalogItems.find(
        (item) => normalizeBatikName(item.name) === normalizeBatikName(name),
      );
    })
    .filter((item): item is BatikItem => Boolean(item));

  const learningPreviewHeights = [
    "aspect-[1.18/1]",
    "aspect-[0.92/1]",
    "aspect-[0.92/1]",
    "aspect-[1.18/1]",
  ];

  const learningPreviewColumns = [
    {
      offsetClass: "",
      items: [
        { motif: learningPreviewPatterns[0], aspectClass: learningPreviewHeights[0] },
        { motif: learningPreviewPatterns[1], aspectClass: learningPreviewHeights[1] },
      ],
    },
    {
      offsetClass: "pt-6 sm:pt-8 lg:pt-10",
      items: [
        { motif: learningPreviewPatterns[2], aspectClass: learningPreviewHeights[2] },
        { motif: learningPreviewPatterns[3], aspectClass: learningPreviewHeights[3] },
      ],
    },
  ]
    .map((column) => ({
      ...column,
      items: column.items.filter(
        (item): item is { motif: BatikItem; aspectClass: string } => Boolean(item.motif),
      ),
    }))
    .filter((column) => column.items.length > 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ======================== HERO SECTION ======================== */}
      <section className="relative min-h-[26.5rem] sm:min-h-[76vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#f5efe6]">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Batik"
            className="w-full h-full object-cover object-[72%_center] sm:object-cover sm:object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f0e7]/94 via-[#f6f0e7]/72 to-white/10 sm:bg-transparent" />

        <div className="container mx-auto px-6 sm:px-6 md:px-12 lg:px-24 relative z-10 py-7 sm:py-14 md:py-20">
          <div className="max-w-[17rem] sm:max-w-3xl">
            <h1
              className="mb-3 sm:mb-5 max-w-[16rem] sm:max-w-2xl lg:max-w-3xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.6rem, 6vw, 4rem)",
                lineHeight: "1.08",
                color: "#000000ff",
                fontWeight: "bold",
              }}
            >
              Wujudkan Ide Batik
              <br />
              Menjadi Karya Indah
              <br />
              Bersama <span style={{ color: "#a4834dff" }}>RekaBatik</span>
            </h1>
            <p
              className="mb-5 max-w-[15.25rem] sm:mb-5 sm:max-w-xl"
              style={{ color: "rgba(0, 0, 0, 0.8)", lineHeight: "1.55", fontSize: "clamp(0.88rem, 2.8vw, 1.1rem)" }}
            >
              Desain batik sendiri dengan mudah, pilih motif, warna, dan
              wujudkan karya unilkmu sekarang!
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-4 w-full sm:w-auto max-w-[15.25rem] sm:max-w-none">
              <MotionLink
                to="/custom"
                className="flex items-center justify-center gap-2 px-4 py-3 text-[0.82rem] font-medium sm:text-base sm:px-8 sm:py-4 rounded-lg w-full sm:w-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  background: "#3D2B1F",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 30px rgba(139,111,71,0.3)",
                }}
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                Mulai Kustomisasi
              </MotionLink>
              <MotionLink
                to="/catalog"
                className="flex items-center justify-center gap-2 px-4 py-3 text-[0.82rem] font-medium sm:text-base sm:px-8 sm:py-4 rounded-lg w-full sm:w-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  background: "rgba(255, 255, 255, 0)",
                  color: "#000000ff",
                  border: "2px solid rgba(87, 87, 87, 0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
                Lihat Katalog
              </MotionLink>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== STATS BAR ======================== */}
      {/*
        Mobile: 2×2 grid — lebih rapi dan proporsional
        Tablet+: 4 kolom sejajar
      */}
      <section className="relative py-6 sm:py-8 overflow-hidden" style={{ background: "#FFFFFF" }}>
        <BatikBackground opacity={0.03} patternType="kawung" />
        <div className="container px-4 relative z-10 mx-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-8 lg:gap-30 max-w-6xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-2 p-2 sm:p-3 md:flex-row md:items-center md:text-left md:gap-4 md:p-4 rounded-2xl bg-white/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
                >
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(212,184,139,0.15)" }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: stat.color }} />
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontWeight: "bold", color: "#3D2B1F", fontSize: "clamp(0.82rem, 3vw, 1.7rem)", fontFamily: "'Playfair Display', serif", lineHeight: "1.1" }}>
                      {stat.value}
                    </div>
                    <div style={{ color: "#7A6B5E", fontSize: "clamp(0.5rem, 1.9vw, 0.8rem)", lineHeight: "1.2" }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== FEATURES ======================== */}
      {/*
        Mobile: 2×2 grid (card vertikal compact)
        Desktop: 2×2 grid (card horizontal dengan icon di sisi kiri)
      */}
      <section className="py-10 sm:py-16 lg:py-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #5A3E2A 50%, #3D2B1F 100%)" }}>
        <BatikBackground opacity={0.08} patternType="parang" />
        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 style={{ fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "0.75rem" }}>
              Pengalaman Batik Digital Terbaik
            </h2>
            <p className="max-w-[18rem] sm:max-w-xl md:max-w-2xl mx-auto" style={{ color: "rgba(250,248,245,0.7)", fontSize: "clamp(0.82rem, 2.5vw, 1rem)", lineHeight: "1.7" }}>
              Kami menggabungkan warisan budaya batik tradisional dengan inovasi teknologi digital modern untuk memberikan pengalaman terbaik
            </p>
          </div>

          {/* Features Grid — 2 kolom di mobile, 2 kolom di desktop */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:gap-8 max-w-6xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  className="group relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div
                    className="h-full p-3 sm:p-6 lg:p-8 rounded-xl sm:rounded-3xl transition-all duration-500"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {/* Mobile: vertikal stack. Desktop: horizontal row */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 lg:gap-6 items-start">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-9 h-9 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center"
                          style={{ 
                            background: `linear-gradient(135deg, rgba(212,184,139,0.3), rgba(212,184,139,0.15))`,
                            border: `1px solid rgba(212,184,139,0.4)`
                          }}
                        >
                          <Icon className="w-4 h-4 sm:w-7 sm:h-7 lg:w-8 lg:h-8" style={{ color: "#D4B88B" }} />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-3">
                          <span className="text-sm sm:text-2xl font-bold hidden sm:block" style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif" }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-xs sm:text-lg lg:text-xl font-semibold leading-tight" style={{ color: "#FAF8F5", fontFamily: "'Playfair Display', serif" }}>
                            {f.title}
                          </h3>
                        </div>
                        <p style={{ color: "rgba(250,248,245,0.65)", fontSize: "clamp(0.7rem, 2.2vw, 0.95rem)", lineHeight: "1.65" }}>
                          {f.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="mt-3 sm:mt-6 h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-500" style={{ background: "#D4B88B" }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== BELAJAR BATIK ======================== */}
      <section className="py-12 sm:py-20 lg:py-24 relative overflow-hidden" style={{ background: "#FAF8F5" }}>
        <BatikBackground opacity={0.03} patternType="floral" />
        <div className="container mx-auto px-6 sm:px-6 relative z-10 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-6"
            >
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.6rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "1rem", lineHeight: "1.2" }}>
                Pelajari Makna<br/>
                <span style={{ color: "#8B6F47" }}>Motif Batik Indonesia</span>
              </h2>
              <p style={{ color: "#7A6B5E", fontSize: "clamp(0.88rem, 2.5vw, 1.05rem)", lineHeight: "1.8", marginBottom: "1.5rem" }}>
                Setiap motif batik bukan hanya sekadar hiasan, melainkan simbol budaya yang sarat makna filosofis dan cerita nenek moyang.
              </p>
              <MotionLink
                to="/belajar-batik"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full text-sm sm:text-base whitespace-nowrap"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ 
                  background: "linear-gradient(135deg, #8B6F47, #A88967)", 
                  color: "#FFFFFF",
                  boxShadow: "0 4px 20px rgba(139,111,71,0.25)"
                }}
              >
                <span>Mau Belajar</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </MotionLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:col-span-6 relative"
            >
              {/* 2x2 katalog motif belajar */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {learningPreviewColumns.map((column, columnIndex) => (
                  <div
                    key={`learning-column-${columnIndex}`}
                    className={`space-y-3 sm:space-y-4 ${column.offsetClass}`}
                  >
                    {column.items.map(({ motif, aspectClass }) => (
                      <div
                        key={motif.id}
                        className={`${aspectClass} w-full rounded-2xl sm:rounded-3xl overflow-hidden relative group`}
                        style={{ background: "white", boxShadow: "0 4px 24px rgba(61,43,31,0.1)", border: "1px solid #E8E1DA" }}
                      >
                        <div className="absolute inset-0" style={{ background: motif.bg_color }}>
                          {motif.image_url ? (
                            <img
                              src={motif.image_url}
                              alt={motif.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <BatikPatternPreview
                              type={motif.style_type || "parang"}
                              primary={motif.primary_color}
                              secondary={motif.secondary_color}
                              bg={motif.bg_color}
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B1F]/60 via-[#3D2B1F]/10 to-transparent" />
                        <div className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-4 sm:bottom-4">
                          <div
                            className="inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] sm:text-xs font-semibold"
                            style={{ background: "rgba(255,255,255,0.92)", color: "#6F573E" }}
                          >
                            {motif.origin}
                          </div>
                          <h3
                            className="mt-2 text-sm sm:text-base font-semibold leading-tight"
                            style={{ color: "#FFFFFF", fontFamily: "'Playfair Display', serif" }}
                          >
                            {motif.name.replace(/^Batik\s+/i, "")}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#95613eff" }} />

      {/* ======================== POPULAR PATTERNS ======================== */}
      {/*
        Mobile: 2 kolom grid — card compact dengan gambar lebih pendek
        Tablet: 2 kolom
        Desktop: 3 kolom
      */}
      <section className="py-12 sm:py-20 lg:py-24 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
        <BatikBackground opacity={0.02} patternType="mega" />
        
        <div className="absolute top-10 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "linear-gradient(135deg, #8B6F47, #D4B88B)" }} />
        <div className="absolute bottom-10 left-0 w-48 h-48 rounded-full opacity-5" style={{ background: "#D4B88B" }} />
        
        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-[185vh]">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-12 lg:mb-16 gap-4">
            <div className="max-w-xl">
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.4rem, 4vw, 2.8rem)", fontWeight: 700, marginBottom: "0.5rem", lineHeight: 1.2 }}>
                Katalog Batik <span style={{ color: "#8B6F47" }}>Pilihan Rekabatik</span>
              </h2>
              <p style={{ color: "#7A6B5E", fontSize: "clamp(0.8rem, 2.3vw, 1rem)", lineHeight: 1.7 }}>
                Jelajahi beragam motif batik eksklusif siap pakai dengan kualitas premium dari pengrajin terbaik
              </p>
            </div>
            <MotionLink
              to="/catalog"
              className="group flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full text-sm sm:text-base whitespace-nowrap"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ 
                background: "linear-gradient(135deg, #8B6F47, #A88967)", 
                color: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(139,111,71,0.25)"
              }}
            >
              Lihat Semua
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </MotionLink>
          </div>

          {/* Patterns Grid — Scrollable horizontal di mobile, grid di desktop */}
          <div className="flex overflow-x-auto overflow-y-hidden pb-6 -mx-6 px-6 gap-4 snap-x snap-mandatory sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-8 sm:overflow-x-visible sm:pb-0 scrollbar-hide">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex-shrink-0 w-[62vw] sm:w-auto snap-center"
                >
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(61,43,31,0.04)" }}>
                    <Skeleton className="h-30 sm:h-44 lg:h-52 w-full rounded-none" />
                    <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-4 w-2/5" />
                      <div className="flex justify-between items-center pt-1">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-8 rounded-xl" />
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
                whileHover={{ y: -6 }}
                className="group flex-shrink-0 w-[62vw] sm:w-auto snap-center"
              >
                <div
                  onClick={() => setSelectedBatik(p)}
                  className="h-full rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transition-all duration-400"
                  style={{ 
                    background: "#FFFFFF", 
                    boxShadow: "0 4px 24px rgba(61,43,31,0.04)", 
                    border: "1px solid #E8E1DA"
                  }}
                >
                  {/* Pattern Preview */}
                  <div className="relative h-28 sm:h-44 lg:h-52 overflow-hidden" style={{ background: p.bg_color }}>
                    {p.image_url ? (
                      <motion.div 
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ) : (
                      <BatikPatternPreview type={p.style_type || "parang"} primary={p.primary_color} secondary={p.secondary_color} bg={p.bg_color} />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    
                    {/* Like button — lebih kecil di mobile */}
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                      <motion.button
                        onClick={(e) => toggleLikePattern(p.id, e)}
                        whileHover={{ scale: 1.15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                        style={{ 
                          background: "rgba(255,255,255,0.95)", 
                          boxShadow: "0 4px 12px rgba(61,43,31,0.15)",
                          backdropFilter: "blur(8px)"
                        }}
                      >
                        <Heart
                          className="w-3.5 h-3.5 sm:w-5 sm:h-5"
                          fill={likedPatterns.includes(p.id) ? "#EF4444" : "none"}
                          color={likedPatterns.includes(p.id) ? "#EF4444" : "#7A6B5E"}
                        />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-3 sm:p-5 lg:p-6 flex flex-col">
                    <h3 className="font-bold mb-1 leading-tight" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)" }}>
                      {p.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-3 sm:mb-5" style={{ color: "#A89B8F" }}>
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span style={{ fontSize: "clamp(0.7rem, 2vw, 0.85rem)" }}>{p.origin}</span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-2 sm:pt-4 border-t" style={{ borderColor: "#E8E1DA" }}>
                      <span style={{ color: "#8B6F47", fontWeight: 700, fontSize: "clamp(0.82rem, 2.5vw, 1.2rem)", fontFamily: "'Playfair Display', serif" }}>
                        Rp {(p.price / 1000).toFixed(0)}rb
                      </span>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); setSelectedBatik(p); }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-auto lg:h-auto lg:px-5 lg:py-2.5 rounded-xl text-sm font-semibold shadow-md"
                        style={{ 
                          background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)", 
                          color: "#FFFFFF"
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== ARTISAN + DESA JETIS PROMO ======================== */}
      <section className="py-12 sm:py-20 lg:py-24 relative overflow-hidden" style={{ background: "#3b2516ff" }}>
        <BatikBackground opacity={0.06} patternType="parang" />
        
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(-50%, -50%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(50%, 50%)" }} />
        
        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-[185vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            > 
              <h2
                className="mb-5 sm:mb-8"
                style={{ fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "clamp(1.6rem, 4vw, 3rem)", lineHeight: "1.25" }}
              >
                Kisah dari<br/>
                <span style={{ color: "#D4B88B" }}>Desa Batik Jetis</span>
              </h2>
              
              <p className="mb-6 sm:mb-10" style={{ color: "rgba(250,248,245,0.75)", lineHeight: "1.9", fontSize: "clamp(0.85rem, 2.3vw, 1.05rem)" }}>
                Desa Batik Jetis di Sidoarjo, Jawa Timur adalah salah satu sentra batik tulis tertua di Indonesia. 
                Dikenal dengan motif khas "Beras Utah" dan flora fauna, para pengrajin di sini mewarisi 
                keahlian turun-temurun yang tak ternilai harganya.
              </p>
              
              {/* Stats Grid — selalu 3 kolom */}
              <div className="grid grid-cols-3 gap-2 sm:gap-5 mb-7 sm:mb-10">
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
                    className="text-center p-3 sm:p-5 rounded-xl sm:rounded-2xl" 
                    style={{ 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid rgba(212,184,139,0.2)",
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    <div className="mb-1" style={{ color: "#D4B88B", fontSize: "clamp(1.1rem, 3.5vw, 2rem)", fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: "rgba(250,248,245,0.7)", fontSize: "clamp(0.6rem, 1.8vw, 0.85rem)", fontWeight: 500 }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>
              
              <MotionLink
                to="/desa-jetis"
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ 
                  background: "linear-gradient(135deg, #D4B88B, #E8DCC8)", 
                  color: "#3D2B1F", 
                  fontWeight: 600,
                }}
              >
                Jelajahi Desa Jetis
                <ChevronRight className="w-4 h-4" />
              </MotionLink>
            </motion.div>

            {/* Right - Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10">
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden mb-4" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
                  <img src={villageImg} alt="Pengrajin batik" className="w-full h-56 sm:h-72 lg:h-80 object-cover" />
                </div>
              </div>
              
              {/* Floating image — only on md+ */}
              <div className="absolute -left-8 top-1/4 z-20 hidden md:block">
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 15px 40px rgba(0,0,0,0.25)" }}
                >
                  <img src={womanBatikImg} alt="Batik fashion" className="w-36 lg:w-44 h-48 lg:h-56 object-cover" />
                </motion.div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
                <div className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-full" style={{ 
                  background: "rgba(61,43,31,0.9)", 
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,184,139,0.3)"
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "#D4B88B" }} />
                  <span style={{ color: "#FAF8F5", fontSize: "clamp(0.6rem, 1.8vw, 0.75rem)", fontWeight: 600, letterSpacing: "0.08em" }}>SINCE 1920</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== TRENDING ======================== */}
      {/*
        Mobile: header di atas, list di bawah (stack vertikal)
        Desktop: 2-col grid (5/12 + 7/12)
        List items: kompak di mobile, full di desktop
      */}
      <section className="py-12 sm:py-20 lg:py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)" }}>
        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-[185vh]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            > 
              <h2 className="mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.4rem, 4vw, 2.8rem)", lineHeight: "1.2", fontWeight: "bold" }}>
                Batik Paling Diminati Bulan Ini
              </h2>
              
              <p className="mb-6 sm:mb-8" style={{ color: "#7A6B5E", fontSize: "clamp(0.85rem, 2.3vw, 1.05rem)", lineHeight: "1.8" }}>
                Temukan koleksi batik yang sedang trending dan diminati oleh ribuan pelanggan dari seluruh Indonesia.
              </p>
              
              <MotionLink
                to="/catalog"
                className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  background: "linear-gradient(135deg, #8B6F47, #A88967)",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  boxShadow: "0 10px 30px rgba(139,111,71,0.3)"
                }}
              >
                <span>Jelajahi Katalog</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </MotionLink>
            </motion.div>

            {/* Right Trending List */}
            <div className="lg:col-span-7">
              <div className="space-y-2.5 sm:space-y-4">
                {loading ? (
                  <div className="space-y-2.5 sm:space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Skeleton className="h-16 sm:h-24 w-full rounded-xl sm:rounded-2xl" />
                      </motion.div>
                    ))}
                  </div>
                ) : trendingItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                  >
                    <div
                      className="flex items-center gap-3 sm:gap-5 p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer"
                      style={{
                        background: i === 0 ? "linear-gradient(135deg, rgba(139,111,71,0.08), rgba(212,184,139,0.05))" : "#FFFFFF",
                        border: i === 0 ? "2px solid rgba(139,111,71,0.2)" : "1px solid #E8E1DA",
                      }}
                    >
                      {/* Rank */}
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: i === 0
                            ? "linear-gradient(135deg, #D4B88B, #8B6F47)"
                            : "rgba(212,184,139,0.15)",
                          color: i === 0 ? "#FFFFFF" : "#8B6F47",
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                          fontWeight: 700
                        }}
                      >
                        {i + 1}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-0.5 sm:mb-1.5 truncate" style={{ color: "#3D2B1F", fontSize: "clamp(0.85rem, 2.3vw, 1.1rem)", fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
                          {item.name}
                        </div>
                        <div style={{ color: "#A89B8F", fontSize: "clamp(0.7rem, 1.8vw, 0.9rem)" }}>{item.sold.toLocaleString('id-ID')} terjual</div>
                      </div>
                      
                      {/* Growth Badge */}
                      <div
                        className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full flex-shrink-0"
                        style={{
                          background: i === 0 ? "rgba(93,156,89,0.12)" : "rgba(93,156,89,0.08)",
                          color: "#5D9C59",
                          fontWeight: 600,
                          fontSize: "clamp(0.68rem, 1.8vw, 0.85rem)"
                        }}
                      >
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        {item.growth}
                      </div>
                      
                      {/* Arrow — hidden on mobile */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:block">
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
      {/*
        Mobile: header + featured review + selector list stacked
        Desktop: 7/12 + 5/12 grid
      */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-[#1A110B]">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D4B88B] rounded-full mix-blend-overlay filter blur-[150px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8B6F47] rounded-full mix-blend-overlay filter blur-[120px] opacity-10 pointer-events-none" />
        
        <BatikBackground opacity={0.03} patternType="parang" />

        <div className="container mx-auto px-6 sm:px-6 lg:px-12 xl:px-24 relative z-10">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12 sm:mb-16 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-[1px] w-10 bg-[#D4B88B]" />
                <span className="text-[#D4B88B] font-semibold uppercase tracking-[0.2em] text-xs sm:text-sm">Testimoni Klien</span>
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#FAF8F5] leading-tight font-bold">
                Karya Kami di Mata <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4B88B] to-[#A88967]">Pelanggan Setia</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-row sm:flex-col sm:items-end gap-2 sm:gap-0"
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 sm:w-5 sm:h-5 fill-[#D4B88B] text-[#D4B88B]" />
                ))}
              </div>
              <p className="text-white/60 text-sm sm:text-base sm:mt-1">
                <span className="text-white font-bold">4.9/5</span> dari 1.240+ ulasan
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24 items-start">
            {/* Left - Main Featured Review */}
            <div className="lg:col-span-7 relative">
              {loading ? (
                <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
                  <Skeleton className="w-16 h-16 rounded-full mb-5" />
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-20 w-full mb-5" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : reviews.length > 0 && (
                <div className="relative">
                  <div className="absolute -top-10 -left-4 sm:-top-16 sm:-left-8 text-[100px] sm:text-[160px] leading-none font-serif text-[#D4B88B] opacity-10 pointer-events-none select-none">
                    "
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeReview}
                      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="relative z-10"
                    >
                      <p className="text-xl sm:text-2xl lg:text-3xl xl:text-[2.5rem] text-[#FAF8F5] font-['Playfair_Display'] leading-[1.6] mb-8 sm:mb-12 italic">
                        "{reviews[activeReview]?.comment}"
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#D4B88B]/30 p-1">
                            <img 
                              src={reviews[activeReview]?.image} 
                              alt={reviews[activeReview]?.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-0 right-0 bg-gradient-to-br from-[#D4B88B] to-[#8B6F47] w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-4 border-[#1A110B]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#1A110B" />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[#FAF8F5] text-xl sm:text-2xl font-bold font-['Playfair_Display'] tracking-wide mb-1">
                            {reviews[activeReview]?.name}
                          </h4>
                          <p className="text-[#D4B88B] text-xs uppercase tracking-widest font-semibold mb-2">
                            {reviews[activeReview]?.role}
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-medium">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#D4B88B]" />
                            {reviews[activeReview]?.product}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right - Review Selectors & Stats */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div className="flex flex-col gap-2 sm:gap-3 relative">
                <div className="absolute left-7 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-[#D4B88B]/20 to-transparent hidden sm:block" />

                {reviews.map((r, i) => (
                  <motion.button
                    key={r.id}
                    onClick={() => setActiveReview(i)}
                    whileHover={{ x: 4 }}
                    className={`relative flex items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 text-left ${
                      i === activeReview 
                        ? "bg-gradient-to-r from-[#D4B88B]/10 to-transparent border border-[#D4B88B]/20" 
                        : "hover:bg-white/5 border border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <div className="relative z-10 flex-shrink-0">
                      <img 
                        src={r.image} 
                        alt={r.name}
                        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover transition-all duration-500 ${
                          i === activeReview ? "border-2 border-[#D4B88B] scale-110" : "filter grayscale opacity-70 border border-white/10"
                        }`}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-['Playfair_Display'] font-semibold truncate text-sm sm:text-base ${i === activeReview ? "text-[#D4B88B]" : "text-white"}`}>
                          {r.name}
                        </span>
                        <div className="flex gap-0.5 flex-shrink-0 ml-2">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${idx < r.rating ? "fill-[#D4B88B] text-[#D4B88B]" : "text-white/20"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-white/60 text-xs line-clamp-1">
                        "{r.comment}"
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Stats — selalu 3 kolom */}
              {!loading && (
                <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 sm:pt-8 border-t border-white/10">
                  {[
                    { value: "1.2K+", label: "Ulasan" },
                    { value: "98%", label: "Kepuasan" },
                    { value: "4.9", label: "Rating" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="text-left"
                    >
                      <div className="text-[#D4B88B] font-bold font-['Playfair_Display'] mb-1" style={{ fontSize: "clamp(1.2rem, 3vw, 1.75rem)" }}>
                        {stat.value}
                      </div>
                      <div className="text-white/50 font-medium uppercase tracking-wider" style={{ fontSize: "clamp(0.55rem, 1.5vw, 0.7rem)" }}>
                        {stat.label}
                      </div>
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
      <section className="py-12 sm:py-20 md:py-32 relative overflow-hidden bg-[#FAF8F5]">
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-[#3D2B1F] p-7 sm:p-12 md:p-20 text-center shadow-2xl"
          >
            <div className="absolute inset-0 z-0">
              <BatikBackground opacity={0.06} patternType="floral" />
            </div>
            <div className="absolute top-0 right-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-[#D4B88B] rounded-full mix-blend-overlay filter blur-[100px] md:blur-[150px] opacity-20 pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-[#8B6F47] rounded-full mix-blend-overlay filter blur-[100px] md:blur-[150px] opacity-20 pointer-events-none transform -translate-x-1/4 translate-y-1/4" />
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="font-['Playfair_Display'] text-[#FAF8F5] font-bold leading-[1.1] mb-5" style={{ fontSize: "clamp(1.8rem, 6vw, 4rem)" }}>
                Siap Membuat Batik <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4B88B] to-[#A88967] italic">Impian Anda?</span>
              </h2>
              
              <p className="text-white/80 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto font-light" style={{ fontSize: "clamp(0.88rem, 2.5vw, 1.15rem)" }}>
                Bergabunglah dengan <span className="font-semibold text-[#D4B88B]">12.500+</span> pelanggan yang telah merasakan pengalaman kustomisasi batik digital terbaik di Indonesia.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center items-center">
                <MotionLink
                  to="/custom"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-3 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-[#D4B88B] to-[#8B6F47] text-white font-bold shadow-[0_10px_30px_rgba(212,184,139,0.25)] w-full sm:w-auto"
                  style={{ fontSize: "clamp(0.88rem, 2.5vw, 1.05rem)" }}
                >
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                  Mulai Kustomisasi Gratis
                </MotionLink>
                
                <MotionLink
                  to="/desa-jetis"
                  whileHover={{ scale: 1.03, y: -2, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-3 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full border border-[#D4B88B]/40 text-[#D4B88B] font-bold w-full sm:w-auto transition-colors"
                  style={{ fontSize: "clamp(0.88rem, 2.5vw, 1.05rem)" }}
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kunjungi Desa Jetis
                </MotionLink>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      
      <AnimatePresence>
        {selectedBatik && (
          <BatikDetailModal
            item={selectedBatik}
            onClose={() => setSelectedBatik(null)}
            onAddToCart={handleAddToCart}
            isAdding={isAddingToCart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
