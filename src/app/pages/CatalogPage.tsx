import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Heart, ShoppingBag, Star, MapPin, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";

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
        <Star
          key={s}
          className="w-3.5 h-3.5"
          fill={s <= rating ? "#D4B88B" : "none"}
          color={s <= rating ? "#D4B88B" : "#E8E1DA"}
        />
      ))}
    </div>
  );
}

function PatternMini({ primary, secondary, bg, type }: { primary: string; secondary: string; bg: string; type: string }) {
  const id = `cat-${type}-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="40" height="40" />
          {type === "diagonal" && (
            <>
              <path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2.5" fill="none" />
              <path d="M0,30 Q10,20 20,30 Q30,40 40,30" stroke={secondary} strokeWidth="1.5" fill="none" />
              <path d="M0,10 Q10,0 20,10 Q30,20 40,10" stroke={secondary} strokeWidth="1.5" fill="none" />
            </>
          )}
          {type === "kawung" && (
            <>
              <ellipse cx="20" cy="11" rx="5" ry="8" fill="none" stroke={primary} strokeWidth="1.5" />
              <ellipse cx="20" cy="29" rx="5" ry="8" fill="none" stroke={primary} strokeWidth="1.5" />
              <ellipse cx="11" cy="20" rx="8" ry="5" fill="none" stroke={primary} strokeWidth="1.5" />
              <ellipse cx="29" cy="20" rx="8" ry="5" fill="none" stroke={primary} strokeWidth="1.5" />
              <circle cx="20" cy="20" r="2.5" fill={secondary} />
            </>
          )}
          {type === "cloud" && (
            <>
              <path d="M0,20 Q10,8 20,20 Q30,32 40,20" stroke={primary} strokeWidth="3" fill="none" />
              <path d="M0,20 Q10,8 20,20 Q30,32 40,20" stroke={secondary} strokeWidth="1.5" fill="none" transform="translate(0,-7)" />
            </>
          )}
          {type === "star" && (
            <polygon points="20,6 23,14 32,14 25,20 28,28 20,22 12,28 15,20 8,14 17,14" fill={primary} stroke={secondary} strokeWidth="1" />
          )}
          {type === "flower" && (
            <>
              <circle cx="20" cy="20" r="3.5" fill={secondary} />
              <circle cx="20" cy="9" r="5" fill={primary} opacity="0.85" />
              <circle cx="31" cy="20" r="5" fill={primary} opacity="0.85" />
              <circle cx="20" cy="31" r="5" fill={primary} opacity="0.85" />
              <circle cx="9" cy="20" r="5" fill={primary} opacity="0.85" />
            </>
          )}
          {type === "geo" && (
            <>
              <rect x="8" y="8" width="24" height="24" fill="none" stroke={primary} strokeWidth="2" />
              <rect x="14" y="14" width="12" height="12" fill="none" stroke={secondary} strokeWidth="1.5" />
              <rect x="17" y="17" width="6" height="6" fill={secondary} opacity="0.6" />
            </>
          )}
          {type === "default" && (
            <>
              <path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2" fill="none" />
              <circle cx="10" cy="20" r="3" fill={secondary} opacity="0.6" />
              <circle cx="30" cy="20" r="3" fill={secondary} opacity="0.6" />
            </>
          )}
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

export function CatalogPage() {
  const [batikItems, setBatikItems] = useState<BatikItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [minPriceStr, setMinPriceStr] = useState("0");
  const [maxPriceStr, setMaxPriceStr] = useState("5.000.000");

  // Format number to Indonesian thousand separator
  const formatNumber = (num: number): string => {
    return num.toLocaleString("id-ID");
  };

  // Parse formatted string back to number
  const parseNumber = (str: string): number => {
    return Number(str.replace(/\./g, ""));
  };

  // Handle min price change
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, "");
    if (/^\d*$/.test(value)) {
      const num = value ? Number(value) : 0;
      setMinPriceStr(formatNumber(num));
      setPriceRange([num, priceRange[1]]);
    }
  };

  // Handle max price change
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, "");
    if (/^\d*$/.test(value)) {
      const num = value ? Number(value) : 0;
      setMaxPriceStr(formatNumber(num));
      setPriceRange([priceRange[0], num]);
    }
  };

  // Reset filter
  const resetPriceFilter = () => {
    setPriceRange([0, 5000000]);
    setMinPriceStr("0");
    setMaxPriceStr("5.000.000");
  };

  // Fuzzy search helper - Levenshtein distance
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[b.length][a.length];
  };

  // Check if string matches with fuzzy logic
  const fuzzyMatch = (itemStr: string, queryStr: string): boolean => {
    const item = itemStr.toLowerCase();
    const query = queryStr.toLowerCase().trim();
    
    if (!query) return true;
    
    // Exact match - highest priority
    if (item.includes(query)) return true;
    
    // Query is contained within any word of the item
    const itemWords = item.split(/\s+/);
    const queryWords = query.split(/\s+/);
    
    for (const qWord of queryWords) {
      let foundMatch = false;
      for (const iWord of itemWords) {
        // Check if query word is contained in item word
        if (iWord.includes(qWord)) {
          foundMatch = true;
          break;
        }
        // Check fuzzy match for short words (typo tolerance)
        const maxDistance = Math.max(1, Math.floor(qWord.length * 0.3));
        const distance = levenshteinDistance(qWord, iWord);
        if (distance <= maxDistance && qWord.length >= 3) {
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) return false;
    }
    return true;
  };

  // Get similarity score for sorting
  const getSimilarityScore = (item: BatikItem, queryStr: string): number => {
    const query = queryStr.toLowerCase().trim();
    if (!query) return 0;
    
    let score = 0;
    const name = item.name.toLowerCase();
    const origin = item.origin.toLowerCase();
    const desc = item.description?.toLowerCase() || "";
    
    // Exact matches get highest score
    if (name.includes(query)) score += 100;
    if (origin.includes(query)) score += 50;
    if (desc.includes(query)) score += 25;
    
    // Word matches
    const queryWords = query.split(/\s+/);
    for (const qWord of queryWords) {
      if (name.includes(qWord)) score += 20;
      if (origin.includes(qWord)) score += 10;
    }
    
    return score;
  };

  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from("batik_items")
          .select("*");

        if (error) throw error;
        if (data && data.length > 0) {
          setBatikItems(data);
        } else {
          setBatikItems([]);
        }
      } catch (err: any) {
        handleSupabaseError(err, "CatalogPage.fetchItems");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const toggleLike = (id: number) => setLikedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = batikItems
    .filter(item => {
      const matchSearch = fuzzyMatch(item.name, searchQuery) || 
        fuzzyMatch(item.origin, searchQuery) ||
        (item.description && fuzzyMatch(item.description, searchQuery));
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      return matchSearch && matchCat && matchPrice;
    })
    .sort((a, b) => {
      // Jika ada search query, urutkan berdasarkan similarity score terlebih dahulu
      if (searchQuery.trim()) {
        const scoreA = getSimilarityScore(a, searchQuery);
        const scoreB = getSimilarityScore(b, searchQuery);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      
      if (sortBy === "popular") return b.sold - a.sold;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="mega" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-3" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
      <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full opacity-2" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)" }} />

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, marginBottom: "0.5rem" }}>
            Katalog Batik
          </h1>
          <p style={{ color: "#7A6B5E", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>
            {filtered.length} produk batik pilihan dari pengrajin terbaik Desa Jetis & seluruh Indonesia
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#A89B8F" }} />
                <input
                  type="text"
                  placeholder="Cari batik, motif, atau asal daerah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 rounded-2xl outline-none transition-all focus:ring-2"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(212, 184, 139, 0.3)",
                    color: "#3D2B1F",
                    fontSize: "0.95rem",
                    boxShadow: "0 2px 12px rgba(61, 43, 31, 0.04)"
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-100" style={{ color: "#7A6B5E" }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-5 py-4 rounded-2xl outline-none appearance-none pr-12 cursor-pointer"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(212, 184, 139, 0.3)",
                    color: "#3D2B1F",
                    fontSize: "0.9rem",
                    minWidth: "180px",
                    boxShadow: "0 2px 12px rgba(61, 43, 31, 0.04)"
                  }}
                >
                  <option value="popular">Terpopuler</option>
                  <option value="rating">Rating Tertinggi</option>
                  <option value="price-low">Harga ↑</option>
                  <option value="price-high">Harga ↓</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B6F47" }} />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl transition-all"
                style={{
                  background: showFilters ? "linear-gradient(135deg, #8B6F47, #A88967)" : "#FFFFFF",
                  border: showFilters ? "none" : "1px solid rgba(212, 184, 139, 0.3)",
                  color: showFilters ? "#FFFFFF" : "#8B6F47",
                  boxShadow: showFilters ? "0 4px 16px rgba(139, 111, 71, 0.25)" : "0 2px 12px rgba(61, 43, 31, 0.04)"
                }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-medium">Filter</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-6 rounded-2xl bg-white border border-[rgba(212,184,139,0.3)]" style={{ boxShadow: "0 2px 12px rgba(61, 43, 31, 0.04)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#3D2B1F]" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem" }}>
                    Filter Harga
                  </h4>
                  <button
                    onClick={resetPriceFilter}
                    className="text-sm text-[#8B6F47] hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#7A6B5E] mb-2">Harga Minimum</label>
                      <input
                        type="text"
                        value={minPriceStr}
                        onChange={handleMinPriceChange}
                        className="w-full px-4 py-3 rounded-xl outline-none"
                        style={{
                          background: "#FAF8F5",
                          border: "1px solid rgba(212, 184, 139, 0.3)",
                          color: "#3D2B1F",
                          fontSize: "0.9rem"
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#7A6B5E] mb-2">Harga Maximum</label>
                      <input
                        type="text"
                        value={maxPriceStr}
                        onChange={handleMaxPriceChange}
                        className="w-full px-4 py-3 rounded-xl outline-none"
                        style={{
                          background: "#FAF8F5",
                          border: "1px solid rgba(212, 184, 139, 0.3)",
                          color: "#3D2B1F",
                          fontSize: "0.9rem"
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#A89B8F] text-center">
                    Rentang harga: Rp {priceRange[0].toLocaleString("id-ID")} - Rp {priceRange[1].toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-full text-sm transition-all font-medium"
                style={{
                  background: selectedCategory === cat.value ? "linear-gradient(135deg, #8B6F47, #A88967)" : "#FFFFFF",
                  color: selectedCategory === cat.value ? "#FFFFFF" : "#7A6B5E",
                  border: selectedCategory === cat.value ? "none" : "1px solid rgba(212, 184, 139, 0.3)",
                  boxShadow: selectedCategory === cat.value ? "0 4px 16px rgba(139, 111, 71, 0.25)" : "none"
                }}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-3xl overflow-hidden bg-white border border-gray-100"
                style={{ borderColor: "rgba(212, 184, 139, 0.2)" }}
              >
                <Skeleton className="h-52 w-full rounded-none" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-9 w-20 rounded-xl" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="group rounded-3xl overflow-hidden transition-all"
                style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(61,43,31,0.05)", border: "1px solid rgba(212,184,139,0.2)" }}
              >
                {/* Pattern Preview */}
                <div className="h-52 relative overflow-hidden" style={{ background: item.bg_color }}>
                  <PatternMini primary={item.primary_color} secondary={item.secondary_color} bg={item.bg_color} type={getPatternType(item.category, item.id)} />
                  <button
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
                    style={{ background: "rgba(255,255,255,0.98)", boxShadow: "0 4px 12px rgba(61,43,31,0.12)" }}
                    onClick={() => toggleLike(item.id)}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={likedItems.includes(item.id) ? "#8B6F47" : "none"}
                      color={likedItems.includes(item.id) ? "#8B6F47" : "#7A6B5E"}
                    />
                  </button>
                  {item.id === 9 && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(139,111,71,0.3)" }}>
                        🏠 Jetis Asli
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: "rgba(61,43,31,0.5)" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                      style={{ background: "#FFFFFF", color: "#8B6F47", boxShadow: "0 4px 16px rgba(255,255,255,0.3)" }}
                    >
                      Lihat Detail
                    </motion.button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="mb-2 line-clamp-1" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600 }}>
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#D4B88B" }} />
                    <span style={{ color: "#A89B8F", fontSize: "0.8rem" }}>{item.origin}</span>
                  </div>
                  <p className="mb-4 line-clamp-2" style={{ color: "#7A6B5E", fontSize: "0.85rem", lineHeight: "1.6" }}>
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={item.rating} />
                    <span style={{ color: "#A89B8F", fontSize: "0.75rem" }}>({item.sold} terjual)</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
                    <span style={{ color: "#8B6F47", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700 }}>
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        toast.success(`${item.name} telah ditambahkan ke keranjang!`);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: "linear-gradient(135deg, #8B6F47, #A88967)",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 8px rgba(139,111,71,0.25)"
                      }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Beli
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="py-24 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: "rgba(212,184,139,0.15)" }}>
              <Search className="w-10 h-10" style={{ color: "#D4B88B" }} />
            </div>
            <p style={{ color: "#3D2B1F", fontSize: "1.3rem", fontFamily: "'Playfair Display', serif", fontWeight: 600, marginBottom: "0.5rem" }}>
              Tidak ada batik ditemukan
            </p>
            <p style={{ color: "#7A6B5E", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Coba kata kunci atau kategori lain
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="px-8 py-3 rounded-full text-sm font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(139,111,71,0.25)" }}
            >
              Reset Filter
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
