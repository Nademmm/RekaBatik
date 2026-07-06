import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Clock, Star, ChevronLeft, Users, Award,
  ShoppingBag, Heart, Share2, Edit, Info, Sparkles,
  Camera, ArrowRight, CheckCircle2, Bookmark
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "sonner";
import type { Store } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";

// Default fallback images
const defaultImages = {
  hero: "https://images.unsplash.com/photo-1661011612361-4e0704509a58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  store: "https://images.unsplash.com/photo-1776000680547-8f301e8d07b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          style={{
            fill: i < Math.floor(rating) ? "#D4B88B" : "transparent",
            color: i < Math.floor(rating) ? "#D4B88B" : "rgba(212, 184, 139, 0.3)",
          }}
        />
      ))}
    </div>
  );
}

const MotionLink = motion(Link);

// Fallback store data
const fallbackStore: Store = {
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
  image: defaultImages.store,
  featured: true,
  description: "Toko batik tertua di Jetis yang terkenal dengan motif Beras Utah asli, dibuat dengan tangan oleh pengrajin berpengalaman.",
  motifs: ["Beras Utah", "Kawung", "Sidomukti", "Parang", "Gurda"],
  gallery: [
    "https://images.unsplash.com/photo-1527650003412-4c330a38fdf5?w=1080",
    defaultImages.store,
    "https://images.unsplash.com/photo-1759655058313-3f29dbf686ff?w=1080"
  ],
  team: ["Pak Amri (Pemilik)", "Bu Siti (Pengrajin)", "Pak Budi (Pengrajin)"]
};

export function DesaJetisStoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch store from Supabase
  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const id = parseInt(storeId || "0");
        const { data, error } = await supabase
          .from("stores")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        if (!data) {
          setStore(fallbackStore);
        } else {
          setStore({
            ...data,
            tags: data.tags || [],
            motifs: data.motifs || [],
            gallery: data.gallery || [],
            team: data.team || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch store:", error);
        setStore(fallbackStore);
        toast.error("Gagal memuat data toko");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId]);

  // Check if current user is the owner
  useEffect(() => {
    if (user && store) {
      setIsOwner(user.id === store.owner_id);
    }
  }, [user, store]);

  // Fetch favorite status
  useEffect(() => {
    const fetchFavorite = async () => {
      if (!user || !store) {
        setIsFavorite(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("favorite_stores")
          .select("id")
          .eq("user_id", user.id)
          .eq("store_id", store.id);

        if (error) throw error;
        setIsFavorite(data && data.length > 0);
      } catch (error) {
        console.error("Failed to check favorite:", error);
      }
    };
    if (storeId && user) {
      fetchFavorite();
    }
  }, [storeId, user, store]);

  // Toggle favorite
  const toggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast.error("Silakan login untuk menambahkan favorit");
      navigate("/auth");
      return;
    }

    setLoadingFavorite(true);
    try {
      const id = store?.id;
      if (!id) return;
      
      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_stores")
          .delete()
          .eq("user_id", user.id)
          .eq("store_id", id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("Dihapus dari favorit");
      } else {
        const { error } = await supabase
          .from("favorite_stores")
          .insert([{ user_id: user.id, store_id: id }]);

        if (error) throw error;
        setIsFavorite(true);
        toast.success("Ditambahkan ke favorit");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Gagal memperbarui favorit");
    } finally {
      setLoadingFavorite(false);
    }
  };

  // Share function
  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const shareData = {
        title: `${store?.name} - RekaBatik`,
        text: `Lihat toko batik ${store?.name} di RekaBatik!`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link disalin ke clipboard!");
      }
    } catch (error) {
      console.error("Failed to share:", error);
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link disalin ke clipboard!");
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>
        <div className="animate-pulse">
          <div className="h-[60vh] bg-gray-200"></div>
          <div className="container mx-auto px-6 -mt-32 relative z-10">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl max-w-4xl mx-auto">
              <Skeleton className="h-10 w-2/3 rounded-xl mb-6" />
              <div className="grid grid-cols-3 gap-6 mb-10">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
              <Skeleton className="h-4 w-full rounded mb-3" />
              <Skeleton className="h-4 w-full rounded mb-3" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-[#E8E1DA]"
        >
          <div className="w-24 h-24 rounded-full bg-[#FAF8F5] flex items-center justify-center mx-auto mb-6 border border-[#E8E1DA]">
            <Info className="w-10 h-10 text-[#D4B88B]" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", marginBottom: "1rem", fontSize: "2rem", fontWeight: 700 }}>
            Toko Tidak Ditemukan
          </h1>
          <p style={{ color: "#7A6B5E", marginBottom: "2.5rem", fontSize: "1rem", lineHeight: "1.7" }}>
            Maaf, toko yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <button 
            onClick={() => navigate("/desa-jetis")}
            className="group flex items-center gap-3 px-8 py-4 rounded-full text-sm font-bold mx-auto transition-all bg-[#3D2B1F] text-white hover:shadow-2xl hover:translate-y-[-2px]"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Kembali ke Desa Jetis
          </button>
        </motion.div>
      </div>
    );
  }

  const heroImage = store.hero_image || defaultImages.hero;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh" }} className="pb-24 sm:pb-10">
      {/* Header Overlay - Sticky on Scroll */}
      <AnimatePresence>
        {scrolled && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-[#E8E1DA] py-3 px-6 shadow-sm hidden sm:block"
          >
            <div className="container max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate("/desa-jetis")} className="p-2 rounded-full hover:bg-[#FAF8F5] transition-colors">
                  <ChevronLeft className="w-5 h-5 text-[#3D2B1F]" />
                </button>
                <h2 className="font-bold text-[#3D2B1F]" style={{ fontFamily: "'Playfair Display', serif" }}>{store.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#8B6F47] font-bold text-sm">{store.price_range}</span>
                <MotionLink to="/catalog" className="px-5 py-2 rounded-full bg-[#3D2B1F] text-white text-xs font-bold">Katalog</MotionLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Immersive Parallax */}
      <section className="relative h-[55vh] sm:h-[75vh] overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img src={heroImage} alt={store.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#FAF8F5]"></div>
        </motion.div>

        <div className="absolute inset-0 flex flex-col justify-end pb-32 sm:pb-40 px-6 sm:px-10">
          <div className="container max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <button 
                onClick={() => navigate("/desa-jetis")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold mb-6 border border-white/20 hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Desa Batik Jetis
              </button>
              
              <div className="flex items-start gap-4 sm:gap-6 mb-4">
                <h1 className="leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 10vw, 5rem)", color: "#FAF8F5", fontWeight: 800 }}>
                  {store.name}
                </h1>
                {isOwner && (
                  <Link to="/my-store" className="mt-4 p-3 rounded-full bg-[#D4B88B] text-[#3D2B1F] shadow-lg hover:scale-110 transition-transform">
                    <Edit className="w-5 h-5" />
                  </Link>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90">
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <StarRating rating={store.rating} />
                  <span className="font-bold">{store.rating}</span>
                  <span className="opacity-60 text-xs">({store.review_count} ulasan)</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Award className="w-4 h-4 text-[#D4B88B]" />
                  <span className="text-sm font-semibold">Est. {store.established}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Modern Info Bar */}
      <div className="container max-w-7xl mx-auto px-6 -mt-16 sm:-mt-24 relative z-30">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-[2.5rem] shadow-2xl shadow-brown-900/10 border border-[#E8E1DA] p-6 sm:p-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="flex items-start gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8E1DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3D2B1F] group-hover:border-[#3D2B1F] transition-all duration-300">
                <MapPin className="w-6 h-6 text-[#D4B88B] group-hover:text-white" />
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-widest text-[#A89B8F] uppercase mb-1">Lokasi Sanggar</span>
                <p className="text-[#3D2B1F] font-semibold leading-relaxed text-sm sm:text-base">{store.address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8E1DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3D2B1F] group-hover:border-[#3D2B1F] transition-all duration-300">
                <Clock className="w-6 h-6 text-[#D4B88B] group-hover:text-white" />
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-widest text-[#A89B8F] uppercase mb-1">Jam Operasional</span>
                <p className="text-[#3D2B1F] font-semibold text-sm sm:text-base">{store.hours}</p>
                <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Buka Sekarang
                </span>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8E1DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3D2B1F] group-hover:border-[#3D2B1F] transition-all duration-300">
                <Users className="w-6 h-6 text-[#D4B88B] group-hover:text-white" />
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-widest text-[#A89B8F] uppercase mb-1">Pemilik & Pengelola</span>
                <p className="text-[#3D2B1F] font-semibold text-sm sm:text-base">{store.owner}</p>
                <div className="flex items-center gap-1 mt-1 text-[#8B6F47] text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Artisan
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Layout */}
      <main className="container max-w-7xl mx-auto px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          
          {/* Left Content (8 Columns) */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* About Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[2px] bg-[#D4B88B]"></div>
                <h2 className="text-[#3D2B1F] font-bold text-2xl sm:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>Kisah Dibalik Karya</h2>
              </div>
              <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-[#E8E1DA] relative overflow-hidden">
                <Sparkles className="absolute -top-6 -right-6 w-32 h-32 text-[#FAF8F5] -z-0" />
                <p className="text-[#7A6B5E] text-base sm:text-lg leading-[2] relative z-10 text-justify sm:text-left italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                  "{store.description}"
                </p>
                <div className="mt-8 flex flex-wrap gap-2 relative z-10">
                  {store.tags?.map((tag, i) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#E8E1DA] text-[#8B6F47] text-xs font-bold">
                      # {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Motifs Grid - 2 columns on mobile (Shopee style) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[2px] bg-[#D4B88B]"></div>
                  <h2 className="text-[#3D2B1F] font-bold text-2xl sm:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>Motif Khas</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {store.motifs?.map((motif, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group bg-white p-5 rounded-[2rem] border border-[#E8E1DA] text-center transition-all hover:border-[#D4B88B] hover:shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] flex items-center justify-center mx-auto mb-4 group-hover:bg-[#D4B88B]/10 transition-colors">
                      <Sparkles className="w-6 h-6 text-[#D4B88B]" />
                    </div>
                    <h3 className="text-[#3D2B1F] font-bold text-sm sm:text-base">{motif}</h3>
                    <span className="text-[10px] text-[#A89B8F] font-bold uppercase mt-1 block">Masterpiece</span>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Gallery Section - Masonry-like grid */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[2px] bg-[#D4B88B]"></div>
                  <h2 className="text-[#3D2B1F] font-bold text-2xl sm:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>Koleksi Sanggar</h2>
                </div>
                <button className="text-[#8B6F47] font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                  Lihat Semua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                {store.gallery?.map((img, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    className={`rounded-[2rem] overflow-hidden shadow-lg aspect-square sm:aspect-auto ${i === 0 ? 'sm:col-span-2 sm:row-span-2 sm:h-[600px]' : 'sm:h-[288px]'}`}
                  >
                    <img src={img} alt={`Koleksi ${i}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Team Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[2px] bg-[#D4B88B]"></div>
                <h2 className="text-[#3D2B1F] font-bold text-2xl sm:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>Tim Pengrajin</h2>
              </div>
              <div className="flex flex-wrap gap-4">
                {store.team?.map((member, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white px-6 py-4 rounded-[1.5rem] border border-[#E8E1DA] shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E8E1DA] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#D4B88B]" />
                    </div>
                    <div>
                      <h4 className="text-[#3D2B1F] font-bold text-sm">{member.split("(")[0]}</h4>
                      <p className="text-[#A89B8F] text-[10px] font-bold uppercase tracking-widest">{member.includes("(") ? member.split("(")[1].replace(")", "") : "Expert"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Right Sidebar (4 Columns) - Desktop Only Sticky */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              {/* Pricing Card */}
              <div className="bg-[#3D2B1F] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
                <BatikBackground opacity={0.05} patternType="parang" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4B88B] uppercase mb-2 block">Investment Value</span>
                  <h3 className="text-white text-3xl font-extrabold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {store.price_range || "Contact for Price"}
                  </h3>
                  
                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#D4B88B]" />
                      <span>Sertifikat Keaslian (HAKI)</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#D4B88B]" />
                      <span>Custom Motif Tersedia</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#D4B88B]" />
                      <span>Packaging Premium</span>
                    </div>
                  </div>

                  <MotionLink 
                    to="/catalog"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#D4B88B] text-[#3D2B1F] font-bold text-sm shadow-xl shadow-black/20 hover:bg-[#C9AB7F] transition-colors mb-4"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Katalog Koleksi
                  </MotionLink>
                  
                  <div className="flex gap-3">
                    <motion.button
                      onClick={toggleFavorite}
                      disabled={loadingFavorite}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-xs"
                    >
                      <Bookmark className="w-4 h-4" fill={isFavorite ? "white" : "none"} />
                      {isFavorite ? "Saved" : "Save"}
                    </motion.button>
                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Newsletter / Promo Mini Card */}
              <div className="bg-[#D4B88B]/10 p-8 rounded-[2rem] border border-[#D4B88B]/20 text-center">
                <h4 className="text-[#8B6F47] font-bold text-sm mb-2">Ingin Motif Khusus?</h4>
                <p className="text-[#7A6B5E] text-xs mb-6 leading-relaxed">Konsultasikan desain impian Anda langsung dengan pengrajin kami.</p>
                <Link to="/custom" className="inline-flex items-center gap-2 text-[#3D2B1F] font-bold text-xs hover:gap-3 transition-all underline decoration-2 underline-offset-4">
                  Mulai Kustomisasi <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:hidden">
        <div className="bg-[#3D2B1F]/90 backdrop-blur-xl p-3 rounded-full border border-white/10 flex items-center justify-between shadow-2xl">
          <div className="pl-4">
            <span className="block text-[8px] text-[#D4B88B] font-bold uppercase tracking-widest">Start from</span>
            <span className="text-white font-bold text-xs">{store.price_range?.split("-")[0].trim()}</span>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-full flex items-center justify-center border ${isFavorite ? 'bg-red-500 border-red-500 text-white' : 'bg-white/10 border-white/20 text-white'}`}
            >
              <Heart className="w-5 h-5" fill={isFavorite ? "white" : "none"} />
            </motion.button>
            <Link 
              to="/catalog"
              className="px-8 py-3.5 rounded-full bg-[#D4B88B] text-[#3D2B1F] font-bold text-xs shadow-lg"
            >
              Lihat Katalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
