import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MapPin, Phone, Clock, Star, ChevronLeft, Users, Award,
  ShoppingBag, Heart, Share2, Edit
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
          className="w-4 h-4"
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
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
          <div className="h-[50vh] bg-gray-200"></div>
          <div className="container mx-auto px-6 py-12">
            <Skeleton className="h-8 w-1/3 rounded mb-4" />
            <Skeleton className="h-4 w-1/2 rounded mb-2" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🏠</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", marginBottom: "0.75rem", fontSize: "2rem" }}>
            Toko Tidak Ditemukan
          </h1>
          <p style={{ color: "#7A6B5E", marginBottom: "2rem", fontSize: "1rem", lineHeight: "1.6" }}>
            Maaf, toko yang Anda cari tidak dapat ditemukan.
          </p>
          <button 
            onClick={() => navigate("/desa-jetis")}
            className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold mx-auto transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FAF8F5", boxShadow: "0 4px 16px rgba(139, 111, 71, 0.25)" }}
          >
            <ChevronLeft className="w-5 h-5" />
            Kembali ke Desa Jetis
          </button>
        </motion.div>
      </div>
    );
  }

  const heroImage = store.hero_image || store.image || defaultImages.hero;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 max-h-[71vh]">
          <img 
            src={heroImage} 
            alt={store.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(61, 43, 31, 0.3), rgba(61, 43, 31, 0.9))" }}></div>
        </div>
        <BatikBackground opacity={0.05} patternType="parang" className="relative z-10" />
        
        <div className="container max-w-[185vh] mx-auto px-6 relative z-20 pb-50">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate("/desa-jetis")}
            className="flex items-center gap-2 mb-8 text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span style={{ fontWeight: 500 }}>Kembali ke Desa Jetis</span>
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", color: "#FAF8F5", marginBottom: "1rem", lineHeight: "1.1" }}>
                {store.name}
              </h1>
              {isOwner && (
                <Link 
                  to="/profile?tab=store" 
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Edit className="w-5 h-5 text-white" />
                </Link>
              )}
            </div>
            <p style={{ color: "rgba(250, 248, 245, 0.85)", fontSize: "1.25rem", marginBottom: "1.5rem" }}>
              {store.specialty}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <StarRating rating={store.rating} />
                <span style={{ color: "#FAF8F5", fontWeight: 600 }}>{store.rating}</span>
                <span style={{ color: "rgba(250, 248, 245, 0.7)" }}>({store.review_count} ulasan)</span>
              </div>
              <div style={{ width: "4px", height: "4px", background: "rgba(250, 248, 245, 0.5)", borderRadius: "50%" }}></div>
              <span style={{ color: "rgba(250, 248, 245, 0.85)" }}>Est. {store.established}</span>
            </div>
          </motion.div>
        </div>

        {/* Floating Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-0.3rem">
          <div className="container max-w-[185vh] mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-5xl mx-auto border border-gray-100">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.15)" }}>
                    <MapPin className="w-5 h-5" style={{ color: "#D4B88B" }} />
                  </div>
                  <div>
                    <div style={{ color: "#A89B8F", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Alamat</div>
                    <div style={{ color: "#3D2B1F", fontSize: "0.875rem", fontWeight: 500 }}>{store.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.15)" }}>
                    <Phone className="w-5 h-5" style={{ color: "#D4B88B" }} />
                  </div>
                  <div>
                    <div style={{ color: "#A89B8F", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Telepon</div>
                    <div style={{ color: "#3D2B1F", fontSize: "0.875rem", fontWeight: 500 }}>{store.phone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.15)" }}>
                    <Clock className="w-5 h-5" style={{ color: "#D4B88B" }} />
                  </div>
                  <div>
                    <div style={{ color: "#A89B8F", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Jam Buka</div>
                    <div style={{ color: "#3D2B1F", fontSize: "0.875rem", fontWeight: 500 }}>{store.hours}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.15)" }}>
                    <Award className="w-5 h-5" style={{ color: "#D4B88B" }} />
                  </div>
                  <div>
                    <div style={{ color: "#A89B8F", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Pemilik</div>
                    <div style={{ color: "#3D2B1F", fontSize: "0.875rem", fontWeight: 500 }}>{store.owner}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pt-20 pb-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.75rem", marginBottom: "1rem" }}>
                  Tentang Toko
                </h2>
                <p style={{ color: "#7A6B5E", lineHeight: "1.8", fontSize: "1rem" }}>
                  {store.description}
                </p>
              </motion.div>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.25rem", marginBottom: "1rem" }}>
                  Kategori
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(store.tags || []).map((tag, i) => (
                    <span key={i} className="px-4 py-2 rounded-full text-sm"
                      style={{ background: "rgba(212, 184, 139, 0.15)", color: "#8B6F47", border: "1px solid rgba(212, 184, 139, 0.3)", fontWeight: 600 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Motifs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.25rem", marginBottom: "1rem" }}>
                  Motif Unggulan
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {(store.motifs || []).map((motif, i) => (
                    <motion.span
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="px-5 py-3 rounded-xl text-sm"
                      style={{ background: "linear-gradient(135deg, rgba(61, 43, 31, 0.05), rgba(212, 184, 139, 0.1))", color: "#3D2B1F", fontWeight: 600, border: "1px solid rgba(212, 184, 139, 0.2)" }}>
                      {motif}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Gallery */}
              {(store.gallery || []).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.25rem", marginBottom: "1rem" }}>
                    Galeri Toko
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(store.gallery || []).map((img, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="rounded-2xl overflow-hidden shadow-lg"
                      >
                        <img src={img} alt={`Galeri ${i + 1}`} className="w-full h-48 object-cover" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Team */}
              {(store.team || []).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.25rem", marginBottom: "1rem" }}>
                    Tim Kami
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {(store.team || []).map((member, i) => (
                      <span key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                        style={{ background: "white", color: "#3D2B1F", border: "1px solid #E8E1DA", fontWeight: 500 }}>
                        <Users className="w-4 h-4" style={{ color: "#D4B88B" }} />
                        {member}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6">
                  <div>
                    <div style={{ color: "#A89B8F", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem" }}>Rentang Harga</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", color: "#8B6F47", fontSize: "1.5rem", fontWeight: 700 }}>
                      {store.price_range}
                    </div>
                  </div>

                  <div className="h-px" style={{ background: "#E8E1DA" }}></div>

                  <div className="space-y-3">
                    <MotionLink
                      to="/catalog"
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold transition-all"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(61, 43, 31, 0.25)" }}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Lihat Produk
                    </MotionLink>
                    <button
                      onClick={toggleFavorite}
                      disabled={loadingFavorite}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold transition-all border-2"
                      style={{ borderColor: isFavorite ? "#EF4444" : "#3D2B1F", color: isFavorite ? "#EF4444" : "#3D2B1F", background: isFavorite ? "rgba(239, 68, 68, 0.05)" : "transparent" }}
                    >
                      <Heart className="w-5 h-5" fill={isFavorite ? "#EF4444" : "none"} />
                      {isFavorite ? "Hapus dari Favorit" : "Simpan Toko"}
                    </button>
                  </div>

                  <div className="h-px" style={{ background: "#E8E1DA" }}></div>

                  <div className="text-center">
                    <div style={{ color: "#A89B8F", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                      Bagikan toko ini
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(212, 184, 139, 0.15)" }}
                      >
                        <Share2 className="w-5 h-5" style={{ color: "#8B6F47" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
