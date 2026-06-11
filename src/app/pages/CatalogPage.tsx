import { useState, useEffect } from "react";
import { Search, Filter, Heart, ShoppingBag, Star, MapPin, SlidersHorizontal, X } from "lucide-react";
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
          className="w-3 h-3"
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);

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
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.origin.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      return matchSearch && matchCat && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.sold - a.sold;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.02} patternType="kawung" />

      <div className="container mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1.5 rounded-full mb-3" style={{ background: "rgba(212,184,139,0.12)", color: "#8B6F47" }}>
            <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>KOLEKSI LENGKAP</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "2rem" }}>
            Katalog Batik
          </h1>
          <p style={{ color: "#7A6B5E", fontSize: "0.9rem" }}>
            {filtered.length} produk batik pilihan dari pengrajin terbaik Indonesia
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#7A6B5E" }} />
            <input
              type="text"
              placeholder="Cari batik, motif, atau asal daerah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E1DA",
                color: "#3D2B1F",
                fontSize: "0.9rem",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#7A6B5E" }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl outline-none"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E1DA",
              color: "#3D2B1F",
              fontSize: "0.875rem",
              minWidth: "160px",
            }}
          >
            <option value="popular">Terpopuler</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl transition-all"
            style={{
              background: showFilters ? "#8B6F47" : "#FFFFFF",
              border: "1px solid #E8E1DA",
              color: showFilters ? "#FFFFFF" : "#8B6F47",
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className="px-4 py-2 rounded-full text-sm transition-all"
              style={{
                background: selectedCategory === cat.value ? "#8B6F47" : "#FFFFFF",
                color: selectedCategory === cat.value ? "#FFFFFF" : "#7A6B5E",
                border: `1px solid ${selectedCategory === cat.value ? "#8B6F47" : "#E8E1DA"}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100 p-0">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
                style={{ background: "#FFFFFF", boxShadow: "0 4px 16px rgba(61,43,31,0.04)", border: "1px solid #E8E1DA" }}
              >
                {/* Pattern Preview */}
                <div className="h-44 relative overflow-hidden" style={{ background: item.bg_color }}>
                  <PatternMini primary={item.primary_color} secondary={item.secondary_color} bg={item.bg_color} type={getPatternType(item.category, item.id)} />
                  <button
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
                    style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 8px rgba(61,43,31,0.08)" }}
                    onClick={() => toggleLike(item.id)}
                  >
                    <Heart
                      className="w-4 h-4"
                      fill={likedItems.includes(item.id) ? "#8B6F47" : "none"}
                      color={likedItems.includes(item.id) ? "#8B6F47" : "#7A6B5E"}
                    />
                  </button>
                  {item.category === "wedding" && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(61,43,31,0.85)", color: "#FAF8F5" }}>
                        Pernikahan
                      </span>
                    </div>
                  )}
                  {item.id === 9 && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#8B6F47", color: "#FFFFFF" }}>
                        Jetis Asli
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ background: "rgba(61,43,31,0.4)" }}>
                    <button className="px-4 py-2 rounded-full text-sm transition-all" style={{ background: "#FFFFFF", color: "#8B6F47" }}>
                      Lihat Detail
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-1" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.05rem" }}>
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#D4B88B" }} />
                    <span style={{ color: "#A89B8F", fontSize: "0.75rem" }}>{item.origin}</span>
                  </div>
                  <p className="mb-3 line-clamp-2" style={{ color: "#7A6B5E", fontSize: "0.8rem", lineHeight: "1.6" }}>
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={item.rating} />
                    <span style={{ color: "#A89B8F", fontSize: "0.7rem" }}>{item.sold} terjual</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#8B6F47", fontFamily: "'Playfair Display', serif", fontSize: "1.05rem" }}>
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                    <button
                      onClick={() => {
                        toast.success(`${item.name} telah ditambahkan ke keranjang!`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all"
                      style={{
                        background: "#8B6F47",
                        color: "#FFFFFF",
                      }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Beli
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(212,184,139,0.12)" }}>
              <Search className="w-8 h-8" style={{ color: "#D4B88B" }} />
            </div>
            <p style={{ color: "#3D2B1F", fontSize: "1.1rem", fontFamily: "'Playfair Display', serif" }}>
              Tidak ada batik ditemukan
            </p>
            <p style={{ color: "#7A6B5E", fontSize: "0.875rem" }}>
              Coba kata kunci atau kategori lain
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="mt-4 px-5 py-2.5 rounded-full text-sm transition-all"
              style={{ background: "#8B6F47", color: "#FFFFFF" }}
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
