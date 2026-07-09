import { Link } from "react-router";
import { motion } from "motion/react";

const MotionLink = motion(Link);
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
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { BatikDetailModal } from "../components/BatikDetailModal";
import { AnimatePresence } from "motion/react";
import { fallbackCatalogItems, normalizeBatikName, resolveCatalogItems } from "../constants/batikCatalog";

const learningPreviewOrder = ["Parang", "Kawung", "Mega Mendung", "Truntum"] as const;
const womanBatikImg = "https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJbmRvbmVzaWFuJTIwd29tYW4lMjB3ZWFyaW5nJTIwYmF0aWslMjBwb3J0cmFpdHxlbnwxfHx8fDE3Nzc1MjAyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080";
const villageImg = "https://images.unsplash.com/photo-1661011612361-4e0704509a58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMEphdmFuZXNlJTIwaG91c2UlMjB2aWxsYWdlJTIwc3RyZWV0fGVufDF8fHx8MTc3NzUyMDI0MHww&ixlib=rb-4.1.0&q=80&w=1080";

// ─── Design tokens ──────────────────────────────────────────────────────────
// One accent, one dark tone, one light tone — reused everywhere instead of a
// different gradient per section.

const T = {
  paper: "#FAF8F5",
  paperAlt: "#FFFFFF",
  ink: "#2A1D14",
  inkRaised: "#33251A",
  charcoal: "#3D2B1F",
  charcoalSoft: "rgba(61,43,31,0.62)",
  charcoalFaint: "rgba(61,43,31,0.4)",
  cream: "#FAF8F5",
  creamSoft: "rgba(250,248,245,0.66)",
  creamFaint: "rgba(250,248,245,0.4)",
  gold: "#B8935F",
  goldSoft: "rgba(184,147,95,0.14)",
  goldLine: "rgba(184,147,95,0.45)",
  border: "#E7DFD4",
  borderDark: "rgba(250,248,245,0.1)",
  green: "#5D9C59",
};

const display = "'Playfair Display', serif";
const body = "'Inter', sans-serif";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-4 h-4"
          fill={s <= rating ? T.gold : "none"}
          color={s <= rating ? T.gold : T.border}
        />
      ))}
    </div>
  );
}

// Section eyebrow — the one recurring structural device on the page.
function Eyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  const color = tone === "dark" ? T.gold : T.charcoalSoft;
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-8" style={{ background: T.goldLine }} />
      <span
        className="text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: tone === "dark" ? T.gold : "#8B6F47", fontFamily: body }}
      >
        {children}
      </span>
    </div>
  );
}

// Buttons — exactly two variants, reused across the whole page.
function PrimaryButton({
  to, children, tone = "light",
}: { to: string; children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <MotionLink
      to={to}
      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-sm sm:text-base font-semibold w-full sm:w-auto"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={
        tone === "dark"
          ? { background: T.gold, color: T.ink }
          : { background: T.charcoal, color: T.cream }
      }
    >
      {children}
    </MotionLink>
  );
}

function OutlineButton({
  to, children, tone = "light",
}: { to: string; children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <MotionLink
      to={to}
      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-sm sm:text-base font-semibold border w-full sm:w-auto"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={
        tone === "dark"
          ? { borderColor: "rgba(250,248,245,0.24)", color: T.cream }
          : { borderColor: "rgba(61,43,31,0.22)", color: T.charcoal }
      }
    >
      {children}
    </MotionLink>
  );
}

// Batik SVG pattern preview components — tied directly to catalog content.
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
    if (!user) {
      setLikedPatterns([]);
      setLoadingFavorites(false);
      return;
    }

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: patternsData, error: pError }, { data: reviewsData, error: rError }] = await Promise.all([
          supabase
            .from("batik_items")
            .select("*")
            .order("sold", { ascending: false })
            .limit(6),
          supabase
            .from("reviews")
            .select("*")
            .limit(4),
        ]);

        let safePatterns: BatikItem[] = [];
        if (pError || !patternsData || patternsData.length === 0) {
          safePatterns = [...fallbackCatalogItems];
        } else {
          safePatterns = resolveCatalogItems(patternsData as BatikItem[]);
        }

        setPopularPatterns(safePatterns);

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
  }, []);

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
    { icon: Users, value: "12.500+", label: "Pelanggan Puas" },
    { icon: Package, value: "48.200+", label: "Pesanan Selesai" },
    { icon: Palette, value: "200+", label: "Motif Tersedia" },
    { icon: MapPin, value: "35+", label: "Pengrajin Mitra" },
  ];

  const features = [
    {
      icon: Palette,
      title: "Kustomisasi Penuh",
      description: "Pilih motif, warna, ukuran pola, dan gunakan kuas digital untuk sentuhan personal",
    },
    {
      icon: Sparkles,
      title: "Motif Premium",
      description: "Koleksi motif batik tradisional dan kontemporer dari pengrajin berpengalaman",
    },
    {
      icon: Clock,
      title: "Proses Cepat",
      description: "Desain digital instan, produksi dalam 3-7 hari kerja dengan pengiriman ke seluruh Indonesia",
    },
    {
      icon: Award,
      title: "Kualitas Terjamin",
      description: "Material premium, pewarna alami ramah lingkungan, dan garansi kepuasan pelanggan",
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
    <div style={{ fontFamily: body }}>
      {/* ======================== HERO ======================== */}
      <section className="relative min-h-[26.5rem] sm:min-h-[76vh] lg:min-h-[90vh] flex items-center overflow-hidden" style={{ background: T.paper }}>
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Batik"
            className="w-full h-full object-cover object-[72%_center] sm:object-cover sm:object-center"
          />
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(250,248,245,0.95) 0%, rgba(250,248,245,0.74) 55%, rgba(250,248,245,0.1) 100%)" }} />

        <div className="container mx-auto px-6 sm:px-6 md:px-12 lg:px-24 relative z-10 py-7 sm:py-14 md:py-20">
          <div className="max-w-[17rem] sm:max-w-3xl">
            <h1
              className="mb-3 sm:mb-5 max-w-[16rem] sm:max-w-2xl lg:max-w-3xl font-bold"
              style={{
                fontFamily: display,
                fontSize: "clamp(1.6rem, 6vw, 4rem)",
                lineHeight: "1.08",
                color: T.charcoal,
              }}
            >
              Wujudkan Ide Batik
              <br />
              Menjadi Karya Indah
              <br />
              Bersama <span style={{ color: T.gold }}>RekaBatik</span>
            </h1>
            <p
              className="mb-5 max-w-[15.25rem] sm:mb-8 sm:max-w-xl"
              style={{ color: T.charcoalSoft, lineHeight: "1.55", fontSize: "clamp(0.88rem, 2.8vw, 1.1rem)" }}
            >
              Desain batik sendiri dengan mudah, pilih motif, warna, dan
              wujudkan karya unikmu sekarang.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-4 w-full sm:w-auto max-w-[15.25rem] sm:max-w-none">
              <PrimaryButton to="/custom">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                Mulai Kustomisasi
              </PrimaryButton>
              <OutlineButton to="/catalog">
                <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
                Lihat Katalog
              </OutlineButton>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== STATS BAR ======================== */}
      <section className="relative py-8 sm:py-10 overflow-hidden border-b" style={{ background: T.paperAlt, borderColor: T.border }}>
        <BatikBackground opacity={0.03} patternType="kawung" />
        <div className="container px-4 relative z-10 mx-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-8 max-w-5xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-2 p-2 sm:p-3 md:flex-row md:items-center md:text-left md:gap-4"
                >
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: T.goldSoft }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: T.gold }} />
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontWeight: 700, color: T.charcoal, fontSize: "clamp(0.82rem, 3vw, 1.55rem)", fontFamily: display, lineHeight: "1.1" }}>
                      {stat.value}
                    </div>
                    <div style={{ color: T.charcoalFaint, fontSize: "clamp(0.5rem, 1.9vw, 0.8rem)", lineHeight: "1.2" }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== FEATURES ======================== */}
      <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden" style={{ background: T.ink }}>
        <BatikBackground opacity={0.06} patternType="parang" />
        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
          <div className="max-w-xl mb-10 sm:mb-14">
            <Eyebrow tone="dark">Kenapa RekaBatik</Eyebrow>
            <h2 style={{ fontWeight: 700, fontFamily: display, color: T.cream, fontSize: "clamp(1.5rem, 5vw, 2.6rem)", lineHeight: 1.2 }}>
              Warisan batik, dijahit dengan alat digital yang tepat
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div
                    className="h-full p-3 sm:p-7 rounded-2xl border transition-colors duration-300"
                    style={{ background: T.inkRaised, borderColor: T.borderDark }}
                  >
                    <div
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5"
                      style={{ background: T.goldSoft }}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: T.gold }} />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: T.cream, fontFamily: display }}>
                      {f.title}
                    </h3>
                    <p style={{ color: T.creamSoft, fontSize: "0.9rem", lineHeight: "1.65" }}>
                      {f.description}
                    </p>
                    <div className="mt-5 h-px w-8 group-hover:w-full transition-all duration-500" style={{ background: T.goldLine }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== BELAJAR BATIK ======================== */}
      <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden" style={{ background: T.paper }}>
        <BatikBackground opacity={0.03} patternType="floral" />
        <div className="container mx-auto px-6 sm:px-6 relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <Eyebrow>Belajar Batik</Eyebrow>
              <h2 style={{ fontFamily: display, color: T.charcoal, fontSize: "clamp(1.6rem, 4vw, 2.75rem)", fontWeight: 700, marginBottom: "1rem", lineHeight: "1.2" }}>
                Pelajari makna
                <br />
                motif batik Indonesia
              </h2>
              <p style={{ color: T.charcoalSoft, fontSize: "clamp(0.88rem, 2.5vw, 1.02rem)", lineHeight: "1.8", marginBottom: "1.75rem" }}>
                Setiap motif batik bukan hanya sekadar hiasan, melainkan simbol
                budaya yang sarat makna filosofis dan cerita nenek moyang.
              </p>
              <OutlineButton to="/belajar-batik">
                Pelajari lebih lanjut
                <ChevronRight className="w-4 h-4" />
              </OutlineButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-7 relative"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {learningPreviewColumns.map((column, columnIndex) => (
                  <div
                    key={`learning-column-${columnIndex}`}
                    className={`space-y-3 sm:space-y-4 ${column.offsetClass}`}
                  >
                    {column.items.map(({ motif, aspectClass }) => (
                      <div
                        key={motif.id}
                        className={`${aspectClass} w-full rounded-2xl overflow-hidden relative group`}
                        style={{ background: T.paperAlt, border: `1px solid ${T.border}` }}
                      >
                        <div className="absolute inset-0" style={{ background: motif.bg_color }}>
                          {motif.image_url ? (
                            <img
                              src={motif.image_url}
                              alt={motif.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(42,29,20,0.65), rgba(42,29,20,0.08) 55%, transparent)" }} />
                        <div className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-4 sm:bottom-4">
                          <div
                            className="inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] sm:text-xs font-semibold"
                            style={{ background: "rgba(250,248,245,0.92)", color: T.charcoalSoft }}
                          >
                            {motif.origin}
                          </div>
                          <h3
                            className="mt-2 text-sm sm:text-base font-semibold leading-tight"
                            style={{ color: T.cream, fontFamily: display }}
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

      <div className="h-1.5" style={{ background: "#8d621dff" }} />

      {/* ======================== KATALOG PRODUCT ======================== */}
      <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden border-t" style={{ background: T.paperAlt, borderColor: T.border }}>
        <BatikBackground opacity={0.02} patternType="mega" />

        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 sm:mb-14 gap-4">
            <div className="max-w-xl">
              <Eyebrow>Katalog</Eyebrow>
              <h2 style={{ fontFamily: display, color: T.charcoal, fontSize: "clamp(1.4rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2 }}>
                Motif pilihan RekaBatik
              </h2>
            </div>
            <OutlineButton to="/catalog">
              Lihat semua
              <ChevronRight className="w-4 h-4" />
            </OutlineButton>
          </div>

          <div className="flex overflow-x-auto overflow-y-hidden pb-6 -mx-6 px-6 gap-4 snap-x snap-mandatory sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-x-visible sm:pb-0 scrollbar-hide">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[62vw] sm:w-auto snap-center">
                  <div className="rounded-2xl overflow-hidden bg-white border" style={{ borderColor: T.border }}>
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
                </div>
              ))
            ) : popularPatterns.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group flex-shrink-0 w-[62vw] sm:w-auto snap-center"
              >
                <div
                  onClick={() => setSelectedBatik(p)}
                  className="h-full rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-lg"
                  style={{ background: T.paperAlt, border: `1px solid ${T.border}` }}
                >
                  <div className="relative h-28 sm:h-44 lg:h-52 overflow-hidden" style={{ background: p.bg_color }}>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <BatikPatternPreview type={p.style_type || "parang"} primary={p.primary_color} secondary={p.secondary_color} bg={p.bg_color} />
                    )}

                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <button
                        onClick={(e) => toggleLikePattern(p.id, e)}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-105"
                        style={{ background: "rgba(255,255,255,0.94)" }}
                      >
                        <Heart
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                          fill={likedPatterns.includes(p.id) ? "#D3453B" : "none"}
                          color={likedPatterns.includes(p.id) ? "#D3453B" : T.charcoalFaint}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 sm:p-5 flex flex-col">
                    <h3 className="font-semibold mb-1 leading-tight" style={{ color: T.charcoal, fontFamily: display, fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)" }}>
                      {p.name}
                    </h3>

                    <div className="flex items-center gap-1 mb-3 sm:mb-4" style={{ color: T.charcoalFaint }}>
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span style={{ fontSize: "clamp(0.7rem, 2vw, 0.82rem)" }}>{p.origin}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t" style={{ borderColor: T.border }}>
                      <span style={{ color: T.gold, fontWeight: 700, fontSize: "clamp(0.82rem, 2.5vw, 1.3rem)", fontFamily: display }}>
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBatik(p); }}
                        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-transform duration-150 hover:scale-105"
                        style={{ background: T.charcoal, color: T.cream }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== DESA JETIS ======================== */}
      <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden" style={{ background: T.ink }}>
        <BatikBackground opacity={0.06} patternType="parang" />

        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Eyebrow tone="dark">Sejak 1920</Eyebrow>
              <h2
                className="mb-5 sm:mb-7"
                style={{ fontFamily: display, color: T.cream, fontSize: "clamp(1.6rem, 4vw, 2.75rem)", lineHeight: "1.25", fontWeight: 700 }}
              >
                Kisah dari
                <br />
                Desa Batik Jetis
              </h2>

              <p className="mb-7 sm:mb-9" style={{ color: T.creamSoft, lineHeight: "1.85", fontSize: "clamp(0.85rem, 2.3vw, 1.02rem)" }}>
                Desa Batik Jetis di Sidoarjo, Jawa Timur adalah salah satu sentra
                batik tulis tertua di Indonesia. Dikenal dengan motif khas
                "Beras Utah" dan flora fauna, para pengrajin di sini mewarisi
                keahlian turun-temurun yang tak ternilai harganya.
              </p>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-8 sm:mb-10">
                {[
                  { value: "100+", label: "Tahun Tradisi" },
                  { value: "350+", label: "Pengrajin Aktif" },
                  { value: "500+", label: "Motif Unik" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="text-center p-3 sm:p-4 rounded-xl border"
                    style={{ background: T.inkRaised, borderColor: T.borderDark }}
                  >
                    <div className="mb-1" style={{ color: T.gold, fontSize: "clamp(1.1rem, 3.5vw, 1.85rem)", fontFamily: display, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: T.creamFaint, fontSize: "clamp(0.6rem, 1.8vw, 0.8rem)", fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <PrimaryButton to="/desa-jetis" tone="dark">
                Jelajahi Desa Jetis
                <ChevronRight className="w-4 h-4" />
              </PrimaryButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.borderDark}` }}>
                <img src={villageImg} alt="Pengrajin batik" className="w-full h-56 sm:h-72 lg:h-80 object-cover" />
              </div>

              <div
                className="hidden md:block absolute -left-8 -bottom-8 w-36 lg:w-44 rounded-2xl overflow-hidden"
                style={{ border: `4px solid ${T.ink}`, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}
              >
                <img src={womanBatikImg} alt="Batik fashion" className="w-full h-48 lg:h-56 object-cover" />
              </div>

              <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full" style={{ background: T.ink, border: `1px solid ${T.goldLine}` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.gold }} />
                  <span style={{ color: T.cream, fontSize: "clamp(0.6rem, 1.8vw, 0.7rem)", fontWeight: 600, letterSpacing: "0.08em" }}>SEJAK 1920</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== TRENDING ======================== */}
      <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden" style={{ background: T.paper }}>
        <div className="container mx-auto px-6 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <Eyebrow>Sedang Diminati</Eyebrow>
              <h2 className="mb-4 sm:mb-6" style={{ fontFamily: display, color: T.charcoal, fontSize: "clamp(1.4rem, 4vw, 2.5rem)", lineHeight: "1.2", fontWeight: 700 }}>
                Batik paling diminati bulan ini
              </h2>

              <p className="mb-7 sm:mb-9" style={{ color: T.charcoalSoft, fontSize: "clamp(0.85rem, 2.3vw, 1.02rem)", lineHeight: "1.8" }}>
                Temukan koleksi batik yang sedang trending dan diminati oleh
                ribuan pelanggan dari seluruh Indonesia.
              </p>

              <OutlineButton to="/catalog">
                Jelajahi katalog
                <ChevronRight className="w-4 h-4" />
              </OutlineButton>
            </motion.div>

            <div className="lg:col-span-7">
              <div className="space-y-2.5 sm:space-y-3">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-xl" />
                  ))
                ) : trendingItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    viewport={{ once: true }}
                  >
                    <div
                      className="flex items-center gap-3 sm:gap-5 p-3 sm:p-4 lg:p-5 rounded-xl border transition-colors duration-200"
                      style={{
                        background: i === 0 ? T.goldSoft : T.paperAlt,
                        borderColor: i === 0 ? T.goldLine : T.border,
                      }}
                    >
                      <div
                        className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: i === 0 ? T.gold : T.goldSoft,
                          color: i === 0 ? T.ink : T.gold,
                          fontFamily: display,
                          fontSize: "clamp(0.95rem, 2.5vw, 1.3rem)",
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="mb-0.5 truncate" style={{ color: T.charcoal, fontSize: "clamp(0.85rem, 2.3vw, 1.05rem)", fontWeight: 600, fontFamily: display }}>
                          {item.name}
                        </div>
                        <div style={{ color: T.charcoalFaint, fontSize: "clamp(0.7rem, 1.8vw, 0.85rem)" }}>{item.sold.toLocaleString('id-ID')} terjual</div>
                      </div>

                      <div
                        className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(93,156,89,0.1)", color: T.green, fontWeight: 600, fontSize: "clamp(0.68rem, 1.8vw, 0.8rem)" }}
                      >
                        <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {item.growth}
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
      <section className="py-16 sm:py-24 lg:py-28 relative overflow-hidden" style={{ background: T.ink }}>
        <BatikBackground opacity={0.03} patternType="parang" />

        <div className="container mx-auto px-6 sm:px-6 lg:px-12 relative z-10 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12 sm:mb-16">
            <div>
              <Eyebrow tone="dark">Testimoni Klien</Eyebrow>
              <h2 style={{ fontFamily: display, color: T.cream, fontSize: "clamp(1.7rem, 4.5vw, 3rem)", lineHeight: "1.2", fontWeight: 700 }}>
                Karya kami di mata
                <br className="hidden sm:block" />
                pelanggan setia
              </h2>
            </div>

            <div className="flex flex-row sm:flex-col sm:items-end gap-2 sm:gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4" fill={T.gold} color={T.gold} />
                ))}
              </div>
              <p style={{ color: T.creamSoft, fontSize: "0.9rem" }}>
                <span style={{ color: T.cream, fontWeight: 700 }}>4.9/5</span> dari 1.240+ ulasan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start">
            <div className="lg:col-span-7 relative">
              {loading ? (
                <div className="p-8 rounded-2xl border" style={{ borderColor: T.borderDark }}>
                  <Skeleton className="w-16 h-16 rounded-full mb-5" />
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-20 w-full mb-5" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : reviews.length > 0 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReview}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <p className="text-xl sm:text-2xl lg:text-3xl text-[#FAF8F5] leading-[1.6] mb-8 sm:mb-10" style={{ fontFamily: display, fontStyle: "italic" }}>
                      "{reviews[activeReview]?.comment}"
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                      <img
                        src={reviews[activeReview]?.image}
                        alt={reviews[activeReview]?.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                        style={{ border: `1px solid ${T.goldLine}` }}
                      />

                      <div>
                        <h4 className="text-lg sm:text-xl font-semibold" style={{ color: T.cream, fontFamily: display }}>
                          {reviews[activeReview]?.name}
                        </h4>
                        <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: T.gold }}>
                          {reviews[activeReview]?.role}
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: T.inkRaised, color: T.creamSoft, border: `1px solid ${T.borderDark}` }}>
                          <ShoppingBag className="w-3.5 h-3.5" style={{ color: T.gold }} />
                          {reviews[activeReview]?.product}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                {reviews.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveReview(i)}
                    className="relative flex items-center gap-3 sm:gap-4 p-3 rounded-xl text-left transition-colors duration-200 border"
                    style={
                      i === activeReview
                        ? { background: T.inkRaised, borderColor: T.goldLine }
                        : { background: "transparent", borderColor: "transparent", opacity: 0.55 }
                    }
                  >
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      style={{ border: i === activeReview ? `2px solid ${T.gold}` : `1px solid ${T.borderDark}` }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold truncate text-sm sm:text-base" style={{ color: i === activeReview ? T.gold : T.cream, fontFamily: display }}>
                          {r.name}
                        </span>
                        <div className="flex gap-0.5 flex-shrink-0 ml-2">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill={idx < r.rating ? T.gold : "none"} color={idx < r.rating ? T.gold : "rgba(250,248,245,0.2)"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs line-clamp-1" style={{ color: T.creamFaint }}>
                        "{r.comment}"
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {!loading && (
                <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 sm:pt-8 border-t" style={{ borderColor: T.borderDark }}>
                  {[
                    { value: "1.2K+", label: "Ulasan" },
                    { value: "98%", label: "Kepuasan" },
                    { value: "4.9", label: "Rating" }
                  ].map((stat, i) => (
                    <div key={i} className="text-left">
                      <div className="font-bold mb-1" style={{ color: T.gold, fontFamily: display, fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
                        {stat.value}
                      </div>
                      <div className="font-medium uppercase tracking-wider" style={{ color: T.creamFaint, fontSize: "clamp(0.55rem, 1.5vw, 0.7rem)" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="h-1.5" style={{ background: "#e19d2eff" }} />

      {/* ======================== FINAL CTA ======================== */}
      <section className="py-14 sm:py-20 md:py-28 relative overflow-hidden" style={{ background: T.paper }}>
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative rounded-[2rem] overflow-hidden p-8 sm:p-12 md:p-16 text-center"
            style={{ background: T.ink, border: `1px solid ${T.goldLine}` }}
          >
            <div className="absolute inset-0 z-0">
              <BatikBackground opacity={0.06} patternType="floral" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="font-bold leading-[1.15] mb-5" style={{ fontFamily: display, color: T.cream, fontSize: "clamp(1.8rem, 6vw, 3.2rem)" }}>
                Siap membuat batik
                <br className="hidden sm:block" />
                <span style={{ color: T.gold, fontStyle: "italic" }}>impian Anda?</span>
              </h2>

              <p className="leading-relaxed mb-8 sm:mb-10 max-w-xl mx-auto" style={{ color: T.creamSoft, fontSize: "clamp(0.88rem, 2.5vw, 1.05rem)" }}>
                Bergabunglah dengan <span style={{ color: T.gold, fontWeight: 600 }}>12.500+</span> pelanggan yang telah merasakan pengalaman kustomisasi batik digital terbaik di Indonesia.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <PrimaryButton to="/custom" tone="dark">
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                  Mulai Kustomisasi Gratis
                </PrimaryButton>
                <OutlineButton to="/desa-jetis" tone="dark">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kunjungi Desa Jetis
                </OutlineButton>
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