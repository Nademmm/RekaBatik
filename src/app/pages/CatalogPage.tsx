import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, Heart, ShoppingBag, Star, MapPin, X, ChevronRight, Minus, Plus, Loader2, BadgeCheck } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";
import { supabase } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router";

const categories = [
  { value: "all", label: "Semua" },
  { value: "traditional", label: "Tradisional" },
  { value: "modern", label: "Modern" },
  { value: "regional", label: "Regional" },
  { value: "wedding", label: "Pernikahan" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className="w-3.5 h-3.5" fill={s <= rating ? "#D4B88B" : "none"} color={s <= rating ? "#D4B88B" : "#E8E1DA"} />
      ))}
    </div>
  );
}

// ── Pattern Renderer ────────────────────────────────────────────────────────
function PatternMini({ primary, secondary, bg, type }: { primary: string; secondary: string; bg: string; type: string }) {
  const id = `cat-${type}-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="40" height="40" />
          {type === "diagonal" && (<><path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2.5" fill="none" /><path d="M0,30 Q10,20 20,30 Q30,40 40,30" stroke={secondary} strokeWidth="1.5" fill="none" /><path d="M0,10 Q10,0 20,10 Q30,20 40,10" stroke={secondary} strokeWidth="1.5" fill="none" /></>)}
          {type === "kawung" && (<><ellipse cx="20" cy="11" rx="5" ry="8" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="20" cy="29" rx="5" ry="8" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="11" cy="20" rx="8" ry="5" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="29" cy="20" rx="8" ry="5" fill="none" stroke={primary} strokeWidth="1.5" /><circle cx="20" cy="20" r="2.5" fill={secondary} /></>)}
          {type === "cloud" && (<><path d="M0,20 Q10,8 20,20 Q30,32 40,20" stroke={primary} strokeWidth="3" fill="none" /><path d="M0,20 Q10,8 20,20 Q30,32 40,20" stroke={secondary} strokeWidth="1.5" fill="none" transform="translate(0,-7)" /></>)}
          {type === "star" && (<polygon points="20,6 23,14 32,14 25,20 28,28 20,22 12,28 15,20 8,14 17,14" fill={primary} stroke={secondary} strokeWidth="1" />)}
          {type === "flower" && (<><circle cx="20" cy="20" r="3.5" fill={secondary} /><circle cx="20" cy="9" r="5" fill={primary} opacity="0.85" /><circle cx="31" cy="20" r="5" fill={primary} opacity="0.85" /><circle cx="20" cy="31" r="5" fill={primary} opacity="0.85" /><circle cx="9" cy="20" r="5" fill={primary} opacity="0.85" /></>)}
          {type === "geo" && (<><rect x="8" y="8" width="24" height="24" fill="none" stroke={primary} strokeWidth="2" /><rect x="14" y="14" width="12" height="12" fill="none" stroke={secondary} strokeWidth="1.5" /><rect x="17" y="17" width="6" height="6" fill={secondary} opacity="0.6" /></>)}
          {type === "default" && (<><path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2" fill="none" /><circle cx="10" cy="20" r="3" fill={secondary} opacity="0.6" /><circle cx="30" cy="20" r="3" fill={secondary} opacity="0.6" /></>)}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function getPatternType(category: string, id: number): string {
  const map: Record<number, string> = { 1: "diagonal", 2: "kawung", 3: "cloud", 4: "star", 5: "flower", 6: "geo", 7: "geo", 8: "diagonal", 9: "diagonal", 10: "flower", 11: "kawung", 12: "flower" };
  return map[id] || "default";
}

// ── Detail Modal Component ──────────────────────────────────────────────────
function BatikDetailModal({ 
  item, 
  onClose,
  onAddToCart,
  isAdding 
}: { 
  item: BatikItem; 
  onClose: () => void;
  onAddToCart: (item: BatikItem, qty: number) => void;
  isAdding: boolean;
}) {
  const [qty, setQty] = useState(1);
  const patternType = getPatternType(item.category, item.id);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(30, 20, 10, 0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative"
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button Mobile (Absolute Top Right) */}
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm">
          <X className="w-4 h-4 text-gray-800" />
        </button>

        {/* Left Side: Big Pattern Visual */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative flex-shrink-0" style={{ background: item.bg_color }}>
          <PatternMini primary={item.primary_color} secondary={item.secondary_color} bg={item.bg_color} type={patternType} />
          
          {/* Overlay Gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Tag Best Seller (Mock) */}
          {item.rating >= 4.8 && (
            <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-2 shadow-lg">
              <BadgeCheck className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">Best Seller</span>
            </div>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 overflow-hidden bg-white relative">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Header / Close (Desktop) */}
            <div className="hidden md:flex justify-end mb-4">
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-gray-400 group-hover:text-gray-800" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#A89B8F" }}>
                  {categories.find(c => c.value === item.category)?.label || item.category}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  {item.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5" style={{ color: "#D4B88B" }}>
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-gray-800">{item.rating}</span>
                    <span className="text-gray-400">({item.sold} Terjual)</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {item.origin}
                  </div>
                </div>
              </div>

              <div className="w-full h-px" style={{ background: "rgba(212,184,139,0.2)" }} />

              <div>
                <h3 className="font-semibold mb-2" style={{ color: "#3D2B1F" }}>Deskripsi Filosofi</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {item.description}
                  <br/><br/>
                  Dibuat oleh pengrajin terbaik dari {item.origin}, motif ini membawa doa dan harapan bagi pemakainya. Perpaduan warna yang dipilih ({item.primary_color} dan {item.secondary_color}) menggambarkan keseimbangan dan harmoni.
                </p>
              </div>

              {/* Color Palette Display */}
              <div>
                <h3 className="font-semibold mb-3 text-sm" style={{ color: "#3D2B1F" }}>Palet Warna Utama</h3>
                <div className="flex gap-3">
                  {[
                    { c: item.primary_color, l: "Utama" },
                    { c: item.secondary_color, l: "Aksen" },
                    { c: item.bg_color, l: "Dasar" }
                  ].map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full border shadow-sm flex items-center justify-center" style={{ backgroundColor: color.c, borderColor: "rgba(0,0,0,0.1)" }}>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 mix-blend-overlay" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{color.l}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Sticky Footer: Price & Add to Cart */}
          <div className="p-5 md:p-6 bg-white border-t z-10 flex-shrink-0" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              <div className="min-w-[120px]">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#A89B8F" }}>Total Harga</p>
                <p className="text-xl md:text-2xl font-bold whitespace-nowrap" style={{ color: "#3D2B1F" }}>
                  Rp {(item.price * qty).toLocaleString("id-ID")}
                </p>
              </div>

              <div className="flex items-center gap-3 md:gap-4 flex-1 sm:flex-none justify-end">
                {/* Qty Control */}
                <div className="flex items-center rounded-xl bg-gray-50 border border-gray-200">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2.5 md:p-3 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30" disabled={qty <= 1}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 md:w-8 text-center font-bold text-gray-800">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(10, q + 1))} className="p-2.5 md:p-3 text-gray-500 hover:text-gray-800 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add Button */}
                <motion.button
                  whileHover={{ scale: isAdding ? 1 : 1.02 }}
                  whileTap={{ scale: isAdding ? 1 : 0.98 }}
                  onClick={() => onAddToCart(item, qty)}
                  disabled={isAdding}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3.5 rounded-xl font-semibold text-white shadow-lg disabled:opacity-70 text-sm md:text-base whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingBag className="w-4 h-4 md:w-5 md:h-5" /> Masukkan Keranjang</>}
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function CatalogPage() {
  const { user } = useAuth();
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
        setItems((data as BatikItem[]) || []);
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
      // Check if item already in cart
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
                const pType = getPatternType(item.category, item.id);
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
