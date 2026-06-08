import { useState } from "react";
import { Search, Filter, Heart, ShoppingCart, Star, MapPin, SlidersHorizontal, X } from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";

const batikItems = [
  { id: 1, name: "Batik Parang Rusak", category: "traditional", price: 250000, description: "Motif klasik diagonal dengan makna kekuatan dan keberanian hidup", origin: "Solo, Jawa Tengah", primary: "#8B4513", secondary: "#D2691E", bg: "#FFF8DC", rating: 5, sold: 234 },
  { id: 2, name: "Batik Kawung Premium", category: "traditional", price: 280000, description: "Simbol kesucian dan keadilan, motif empat kelopak melingkar", origin: "Yogyakarta", primary: "#8B6914", secondary: "#C9A227", bg: "#FEFDF5", rating: 5, sold: 189 },
  { id: 3, name: "Batik Megamendung Cirebon", category: "regional", price: 300000, description: "Motif awan berlapis yang melambangkan kesabaran hati", origin: "Cirebon, Jawa Barat", primary: "#1E4A8C", secondary: "#4A90C2", bg: "#EEF4FF", rating: 4, sold: 128 },
  { id: 4, name: "Batik Truntum Solo", category: "traditional", price: 270000, description: "Melambangkan cinta yang tumbuh kembali, motif bintang kecil", origin: "Solo, Jawa Tengah", primary: "#8B4513", secondary: "#C9960C", bg: "#FFFAF0", rating: 5, sold: 156 },
  { id: 5, name: "Batik Sekar Jagad", category: "traditional", price: 320000, description: "Motif peta dunia dalam kain batik, penuh filosofi alam semesta", origin: "Yogyakarta", primary: "#2D6B1C", secondary: "#7CB342", bg: "#F4FBF0", rating: 4, sold: 97 },
  { id: 6, name: "Batik Sido Mukti", category: "wedding", price: 350000, description: "Batik pernikahan penuh makna kebahagiaan dan kemakmuran", origin: "Solo, Jawa Tengah", primary: "#6B1FAA", secondary: "#C68AE0", bg: "#FAF0FF", rating: 5, sold: 203 },
  { id: 7, name: "Batik Modern Geometris", category: "modern", price: 240000, description: "Desain kontemporer memadukan motif tradisional dan estetika modern", origin: "Jakarta", primary: "#3A3A5C", secondary: "#6B6BCC", bg: "#F5F5FF", rating: 4, sold: 143 },
  { id: 8, name: "Batik Lasem Tulis", category: "regional", price: 450000, description: "Perpaduan budaya Tionghoa dan Jawa dengan warna merah khas", origin: "Lasem, Rembang", primary: "#8B0000", secondary: "#DC3545", bg: "#FFF5F5", rating: 5, sold: 88 },
  { id: 9, name: "Batik Jetis Beras Utah", category: "regional", price: 380000, description: "Motif khas Sidoarjo — butiran beras berserakan penuh makna kelimpahan", origin: "Desa Jetis, Sidoarjo", primary: "#8B4513", secondary: "#C9960C", bg: "#FFF8DC", rating: 5, sold: 312 },
  { id: 10, name: "Batik Pekalongan Pesisir", category: "regional", price: 290000, description: "Motif pesisir yang cerah dengan warna-warna berani khas pantura", origin: "Pekalongan", primary: "#C03A1A", secondary: "#F08C30", bg: "#FFF5EE", rating: 4, sold: 74 },
  { id: 11, name: "Batik Parang Kusumo", category: "wedding", price: 420000, description: "Batik sakral untuk upacara adat, simbol keteguhan hati dan kebijaksanaan", origin: "Yogyakarta", primary: "#2C1B47", secondary: "#7B5EA7", bg: "#F8F5FF", rating: 5, sold: 67 },
  { id: 12, name: "Batik Semen Romo", category: "traditional", price: 360000, description: "Motif flora-fauna alam semesta, penuh dengan simbolisme kehidupan", origin: "Solo, Jawa Tengah", primary: "#1A5C1A", secondary: "#4CAF50", bg: "#F2FBF2", rating: 4, sold: 92 },
];

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
        <Star key={s} className="w-3 h-3"
          fill={s <= rating ? "#C9960C" : "none"}
          color={s <= rating ? "#C9960C" : "#D1A860"} />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);

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
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #FBF5E6, #F5E6C0)" }}>
      <BatikBackground opacity={0.04} patternType="kawung" />

      <div className="container mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1.5 rounded-full mb-3"
            style={{ background: "rgba(201, 150, 12, 0.15)", color: "#9A6B0A" }}>
            <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>KOLEKSI LENGKAP</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2rem" }}>
            Katalog Batik
          </h1>
          <p style={{ color: "#6B4226", fontSize: "0.9rem" }}>
            {filtered.length} produk batik pilihan dari pengrajin terbaik Indonesia
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9A6B4B" }} />
            <input
              type="text"
              placeholder="Cari batik, motif, atau asal daerah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all"
              style={{
                background: "white",
                border: "1px solid rgba(201, 150, 12, 0.25)",
                color: "#3D1C02",
                fontSize: "0.9rem",
                boxShadow: "0 2px 12px rgba(61, 28, 2, 0.06)",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#9A6B4B" }}>
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
              background: "white",
              border: "1px solid rgba(201, 150, 12, 0.25)",
              color: "#3D1C02",
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
              background: showFilters ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "white",
              border: "1px solid rgba(201, 150, 12, 0.25)",
              color: showFilters ? "#3D1C02" : "#6B4226",
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
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{
                background: selectedCategory === cat.value ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "white",
                color: selectedCategory === cat.value ? "#3D1C02" : "#6B4226",
                border: `1px solid ${selectedCategory === cat.value ? "#C9960C" : "rgba(201, 150, 12, 0.2)"}`,
                boxShadow: selectedCategory === cat.value ? "0 4px 12px rgba(201, 150, 12, 0.25)" : "none",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
                style={{ background: "white", boxShadow: "0 4px 16px rgba(61, 28, 2, 0.08)", border: "1px solid rgba(201, 150, 12, 0.1)" }}
              >
                {/* Pattern Preview */}
                <div className="h-44 relative overflow-hidden" style={{ background: item.bg }}>
                  <PatternMini primary={item.primary} secondary={item.secondary} bg={item.bg} type={getPatternType(item.category, item.id)} />
                  <button
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
                    style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(61,28,2,0.15)" }}
                    onClick={() => toggleLike(item.id)}
                  >
                    <Heart className="w-4 h-4"
                      fill={likedItems.includes(item.id) ? "#C9960C" : "none"}
                      color={likedItems.includes(item.id) ? "#C9960C" : "#6B4226"} />
                  </button>
                  {item.category === "wedding" && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: "rgba(61, 28, 2, 0.8)", color: "#D4AF37" }}>
                        Pernikahan
                      </span>
                    </div>
                  )}
                  {item.id === 9 && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}>
                        Jetis Asli
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: "rgba(61, 28, 2, 0.45)" }}>
                    <button className="px-4 py-2 rounded-xl text-sm transition-all"
                      style={{ background: "white", color: "#7C3D12" }}>
                      Lihat Detail
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-1" style={{ color: "#3D1C02", fontFamily: "'Playfair Display', serif" }}>
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#C9960C" }} />
                    <span style={{ color: "#9A6B4B", fontSize: "0.75rem" }}>{item.origin}</span>
                  </div>
                  <p className="mb-3 line-clamp-2" style={{ color: "#6B4226", fontSize: "0.8rem", lineHeight: "1.6" }}>
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={item.rating} />
                    <span style={{ color: "#9A6B4B", fontSize: "0.7rem" }}>{item.sold} terjual</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#7C3D12", fontFamily: "'Playfair Display', serif", fontSize: "1.05rem" }}>
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
                      style={{
                        background: "linear-gradient(135deg, #C9960C, #D4AF37)",
                        color: "#3D1C02",
                        boxShadow: "0 2px 8px rgba(201, 150, 12, 0.3)",
                      }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Beli
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(201, 150, 12, 0.1)" }}>
              <Search className="w-8 h-8" style={{ color: "#C9960C" }} />
            </div>
            <p style={{ color: "#3D1C02", fontSize: "1.1rem", fontFamily: "'Playfair Display', serif" }}>
              Tidak ada batik ditemukan
            </p>
            <p style={{ color: "#9A6B4B", fontSize: "0.875rem" }}>
              Coba kata kunci atau kategori lain
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
