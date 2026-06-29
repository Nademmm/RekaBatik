import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Star, MapPin, Heart } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";
import { supabase } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import { useNavigate } from "react-router";
import { fallbackCatalogItems, resolveCatalogItems } from "../constants/batikCatalog";





import { BatikDetailModal, PatternMini, getPatternType } from "../components/BatikDetailModal";

// ── Main Page ──────────────────────────────────────────────────────────────
export function CatalogPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [items, setItems] = useState<BatikItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedBatik, setSelectedBatik] = useState<BatikItem | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [favoriteBatikIds, setFavoriteBatikIds] = useState<number[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchFavorites = async () => {
    if (!user) {
      setFavoriteBatikIds([]);
      setLoadingFavorites(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorite_batik")
        .select("batik_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setFavoriteBatikIds(data?.map(f => f.batik_id) || []);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleFavoriteBatik = async (batikId: number) => {
    console.log("Toggling favorite for batikId:", batikId);
    if (!user) {
      toast.error("Silakan masuk (login) untuk menambahkan favorit.");
      navigate("/auth");
      return;
    }

    const isFavorite = favoriteBatikIds.includes(batikId);

    try {
      if (isFavorite) {
        // Remove from favorites
        console.log("Removing from favorites...");
        const { error } = await supabase
          .from("favorite_batik")
          .delete()
          .eq("user_id", user.id)
          .eq("batik_id", batikId);

        if (error) throw error;

        setFavoriteBatikIds(prev => prev.filter(id => id !== batikId));
        toast.success("Dihapus dari favorit");
      } else {
        // Add to favorites
        console.log("Adding to favorites...");
        const { error } = await supabase
          .from("favorite_batik")
          .insert([{ user_id: user.id, batik_id: batikId }]);

        if (error) throw error;

        setFavoriteBatikIds(prev => [...prev, batikId]);
        toast.success("Ditambahkan ke favorit");
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Gagal memperbarui favorit.");
    }
  };

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        let query = supabase.from("batik_items").select("*");
        if (search) query = query.ilike("name", `%${search}%`);

        const { data, error } = await query;
        
        let itemsToShow: BatikItem[] = [];
        
        if (error || !data || data.length === 0) {
          // Jika database error/kosong, gunakan fallback data
          itemsToShow = [...fallbackCatalogItems];
        } else {
          // Map image_url dari database ke import gambar lokal
          itemsToShow = resolveCatalogItems(data as BatikItem[]);
        }
        
        // Filter by search untuk fallback juga
        let filteredItems = [...itemsToShow];
        if (search) {
          filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        setItems(filteredItems);
      } catch (err) {
        toast.error("Gagal memuat katalog batik.");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
    fetchFavorites();
  }, [search, user]);

  const handleAddToCart = async (batik: BatikItem, quantity: number) => {
    if (!user) {
      toast.error("Silakan masuk (login) untuk berbelanja.");
      navigate("/auth");
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart({ batikId: batik.id, quantity });
      toast.success(`${quantity}x ${batik.name} ditambahkan ke keranjang!`);
      setSelectedBatik(null); // Close modal on success
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan ke keranjang.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="floral" />

      <div className="container mx-auto px-4 md:px-6 pt-10 relative z-10 max-w-7xl">
        {/* Header Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700 }}>
            Koleksi <span style={{ color: "#8B6F47" }}>Mahakarya</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm md:text-base" style={{ color: "#7A6B5E" }}>
            Temukan kekayaan motif batik nusantara dari para pengrajin terbaik.
          </p>
        </motion.div>

        {/* Sticky Search Bar */}
        <div className="sticky top-20 md:top-24 max-w-2xl mx-auto bg-white/80 backdrop-blur-xl p-2 md:p-3 rounded-2xl mb-8 transition-all shadow-[0_4px_20px_rgba(61,43,31,0.04)] border" style={{ borderColor: "rgba(212,184,139,0.35)" }}>
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: "#7A6B5E" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari batik (contoh: Mega Mendung)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
              style={{ background: "#FAF8F5", border: "1px solid rgba(212,184,139,0.5)", color: "#3D2B1F", "--tw-ring-color": "#8B6F47" } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Grid Katalog */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-[320px] sm:h-[400px] w-full rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: "#3D2B1F" }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: "#3D2B1F" }}>Batik Tidak Ditemukan</h3>
            <p style={{ color: "#7A6B5E" }} className="text-sm">Coba kata kunci pencarian lain.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            <AnimatePresence>
              {items.map((item, idx) => {
                const pType = getPatternType(item.style_type);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5) }}
                    className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden relative"
                    style={{
                      border: "1px solid rgba(212,184,139,0.2)",
                      boxShadow: "0 2px 10px rgba(61,43,31,0.03)",
                    }}
                    onClick={() => setSelectedBatik(item)}
                    whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(61,43,31,0.08)" }}
                  >
                    {/* Image Area */}
                    <div className="h-44 sm:h-60 w-full relative overflow-hidden" style={{ background: item.bg_color }}>
                      <motion.div 
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PatternMini primary={item.primary_color} secondary={item.secondary_color} bg={item.bg_color} type={pType} />
                        )}
                      </motion.div>
                      
                      {/* Overlay Gradient Soft */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/8 to-transparent pointer-events-none" />

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteBatik(item.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 sm:top-3 sm:right-3 sm:p-2 rounded-full bg-white/95 shadow hover:scale-110 transition-all z-10"
                        title={favoriteBatikIds.includes(item.id) ? "Hapus dari favorit" : "Tambah ke favorit"}
                      >
                        <Heart
                          className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5"
                          fill={favoriteBatikIds.includes(item.id) ? "#EF4444" : "none"}
                          style={{ color: favoriteBatikIds.includes(item.id) ? "#EF4444" : "#3D2B1F" }}
                        />
                      </button>

                      {/* Quick Action Overlay (Visible on Hover - Desktop only) */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center pointer-events-none">
                        <span className="bg-white text-gray-900 px-5 py-2 rounded-xl font-semibold text-sm transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                          Lihat Detail
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-3 sm:p-5 flex flex-col flex-1 relative bg-white">
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium" style={{ color: "#5A4A3E" }}>
                          <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-[#D4B88B] text-[#D4B88B]" />
                          <span>{item.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 truncate" style={{ color: "#3D2B1F" }}>{item.name}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 flex items-center gap-1" style={{ color: "#7A6B5E" }}>
                        <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3" />{item.origin}
                      </p>
                      
                      <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="font-bold text-sm sm:text-lg" style={{ color: "#8B6F47" }}>Rp {item.price.toLocaleString("id-ID")}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, 1);
                          }}
                          className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl hover:bg-[#8B6F47] hover:text-white transition-all"
                          style={{ background: "#FAF8F5", color: "#8B6F47" }}
                          title="Tambah ke Keranjang"
                        >
                          <ShoppingBag className="w-3.5 sm:w-4.5 h-3.5 sm:h-4.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Render Modal */}
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
