import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, ShoppingBag, Star, MapPin } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";
import { supabase } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import { useNavigate } from "react-router";

const categories = [
  { value: "all", label: "Semua" },
  { value: "tradisional", label: "Tradisional" },
  { value: "modern", label: "Modern" },
  { value: "regional", label: "Regional" },
  { value: "wedding", label: "Pernikahan" },
];

const validStyleTypes = [
  "parang",
  "parang-new",
  "mega",
  "sido-mukti",
  "bunga1",
  "bunga2",
  "ceplok",
];



import { BatikDetailModal, PatternMini, getPatternType } from "../components/BatikDetailModal";

// ── Main Page ──────────────────────────────────────────────────────────────
export function CatalogPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [items, setItems] = useState<BatikItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  
  const [selectedBatik, setSelectedBatik] = useState<BatikItem | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        let query = supabase.from("batik_items").select("*");
        if (category !== "all") query = query.eq("category", category);
        if (search) query = query.ilike("name", `%${search}%`);

        const { data, error } = await query;
        if (error) throw error;
        // Filter only valid items
        const validItems = (data as BatikItem[]).filter(item => item.style_type && validStyleTypes.includes(item.style_type));
        setItems(validItems || []);
      } catch (err) {
        toast.error("Gagal memuat katalog batik.");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [category, search]);

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

      <div className="container mx-auto px-4 md:px-6 pt-12 relative z-10 max-w-7xl">
        {/* Header Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700 }}>
            Koleksi <span style={{ color: "#8B6F47" }}>Mahakarya</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg" style={{ color: "#7A6B5E" }}>
            Temukan kekayaan motif batik nusantara dari para pengrajin terbaik kami. Setiap goresan malam membawa cerita dan filosofi mendalam.
          </p>
        </motion.div>

        {/* Sticky Filter & Search Bar */}
        <div className="sticky top-20 md:top-24 z-30 bg-white/80 backdrop-blur-xl p-3 md:p-4 rounded-3xl mb-8 transition-all shadow-[0_8px_30px_rgba(61,43,31,0.04)] border" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari motif batik (contoh: Mega Mendung)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none transition-all shadow-sm focus:shadow-md"
                style={{ background: "#FFFFFF", border: "1px solid rgba(212,184,139,0.3)", color: "#3D2B1F" }}
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
              {categories.map((c) => {
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className="whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: active ? "#8B6F47" : "white",
                      color: active ? "white" : "#5A4A3E",
                      border: `1px solid ${active ? "#8B6F47" : "rgba(212,184,139,0.3)"}`,
                      boxShadow: active ? "0 4px 12px rgba(139, 111, 71, 0.25)" : "none",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid Katalog */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-[450px] w-full rounded-3xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
            <Filter className="w-16 h-16 mx-auto mb-6 opacity-20" style={{ color: "#3D2B1F" }} />
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#3D2B1F" }}>Batik Tidak Ditemukan</h3>
            <p style={{ color: "#7A6B5E" }}>Coba ubah kata kunci atau kategori pencarian Anda.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
                    className="group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden relative"
                    style={{
                      border: "1px solid rgba(212,184,139,0.15)",
                      boxShadow: "0 10px 40px rgba(61,43,31,0.04)",
                    }}
                    onClick={() => setSelectedBatik(item)}
                    whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(61,43,31,0.1)" }}
                  >
                    {/* Image Area */}
                    <div className="h-64 sm:h-72 w-full relative overflow-hidden" style={{ background: item.bg_color }}>
                      <motion.div 
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <PatternMini primary={item.primary_color} secondary={item.secondary_color} bg={item.bg_color} type={pType} />
                      </motion.div>
                      
                      {/* Overlay Gradient Soft */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

                      {/* Quick Action Overlay (Visible on Hover) */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <span className="bg-white/90 text-gray-900 px-6 py-2.5 rounded-full font-semibold text-sm backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          Lihat Detail
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 md:p-6 flex flex-col flex-1 relative bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#A89B8F" }}>
                          {categories.find((c) => c.value === item.category)?.label || item.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#5A4A3E" }}>
                          <Star className="w-3.5 h-3.5 fill-[#D4B88B] text-[#D4B88B]" />
                          {item.rating}
                        </div>
                      </div>

                      <h3 className="font-bold text-lg mb-1 truncate" style={{ color: "#3D2B1F" }}>{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{item.origin}</p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-lg" style={{ color: "#8B6F47" }}>Rp {item.price.toLocaleString("id-ID")}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, 1);
                          }}
                          className="p-2.5 rounded-full bg-[#FAF8F5] text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                          title="Tambah ke Keranjang"
                        >
                          <ShoppingBag className="w-4 h-4" />
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
