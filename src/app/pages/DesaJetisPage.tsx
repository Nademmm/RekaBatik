import { useState, useEffect } from "react";
import {
  MapPin, Phone, Clock, Star, ChevronRight, Users, Award,
  ShoppingBag, Heart, ExternalLink, Camera, Info
} from "lucide-react";
import { Link } from "react-router";
import { BatikBackground, BatikDivider } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { Store } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{
            fill: i < Math.floor(rating) ? "#D4AF37" : "transparent",
            color: i < Math.floor(rating) ? "#D4AF37" : "rgba(212, 175, 55, 0.3)",
          }}
        />
      ))}
    </div>
  );
}

const villageImg = "https://images.unsplash.com/photo-1661011612361-4e0704509a58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMEphdmFuZXNlJTIwaG91c2UlMjB2aWxsYWdlJTIwc3RyZWV0fGVufDF8fHx8MTc3NzUyMDI0MHww&ixlib=rb-4.1.0&q=80&w=1080";
const artisanImg = "https://images.unsplash.com/photo-1527650003412-4c330a38fdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGFydGlzYW4lMjBjcmFmdHNtYW4lMjBwYWludGluZyUyMHdheHxlbnwxfHx8fDE3Nzc1MjAyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const workshopImg = "https://images.unsplash.com/photo-1759655058313-3f29dbf686ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMHdvcmtzaG9wJTIwcHJvZHVjdGlvbiUyMGR5ZWluZyUyMGNsb3RofGVufDF8fHx8MTc3NzUyMDI0MXww&ixlib=rb-4.1.0&q=80&w=1080";
const storeImg = "https://images.unsplash.com/photo-1776000680547-8f301e8d07b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGNsb3RoZXMlMjBmYXNoaW9uJTIwZGlzcGxheSUyMHN0b3JlfGVufDF8fHx8MTc3NzUyMDIzNnww&ixlib=rb-4.1.0&q=80&w=1080";
const batikFabricImg = "https://images.unsplash.com/photo-1761516659902-2994696b362e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRpayUyMGZhYnJpYyUyMHRleHRpbGUlMjBJbmRvbmVzaWFuJTIwdHJhZGl0aW9uYWx8ZW58MXx8fHwxNzc3NTIwMjI2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const shopImg = "https://images.unsplash.com/photo-1530603103472-faaa353d8ab0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMEluZG9uZXNpYW4lMjB2aWxsYWdlJTIwdGV4dGlsZSUyMHNob3B8ZW58MXx8fHwxNzc3NTIwMjMwfDA&ixlib=rb-4.1.0&q=80&w=1080";

const timeline = [
  { year: "1920", event: "Awal mula produksi batik di Jetis oleh para perantau pedagang kain dari Surakarta" },
  { year: "1950", event: "Desa Jetis mulai dikenal sebagai sentra batik cap Sidoarjo dengan puluhan pengrajin aktif" },
  { year: "1978", event: "Berdirinya Batik Amri, toko batik tulis pertama yang mempopulerkan motif Beras Utah" },
  { year: "1990", event: "Kampung Batik Jetis resmi ditetapkan sebagai kampung wisata batik oleh Pemda Sidoarjo" },
  { year: "2010", event: "Ekspansi ke pasar online; produk Batik Jetis mulai merambah pasar mancanegara" },
  { year: "2018", event: "Motif Beras Utah Jetis mendapatkan Hak Kekayaan Intelektual (HAKI) dari Kemenkumham RI" },
  { year: "2024", event: "Desa Batik Jetis masuk Top 10 Desa Wisata Indonesia oleh Kementerian Pariwisata" },
];

export function DesaJetisPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");

  useEffect(() => {
    async function fetchStores() {
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*");
        if (error) throw error;
        if (data && data.length > 0) {
          setStores(data);
        } else {
          setStores([]);
        }
      } catch (err: any) {
        handleSupabaseError(err, "DesaJetisPage.fetchStores");
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  const allTags = ["all", ...Array.from(new Set(stores.flatMap(s => s.tags || [])))];
  const filteredStores = filterTag === "all" ? stores : stores.filter(s => s.tags?.includes(filterTag));

  const [likedStores, setLikedStores] = useState<number[]>([]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ======================== HERO ======================== */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={villageImg} alt="Desa Jetis" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(61,28,2,0.95) 0%, rgba(61,28,2,0.7) 100%)" }} />
        </div>
        <BatikBackground opacity={0.08} patternType="kawung" className="z-10" />
        <div className="container mx-auto px-4 relative z-20 py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" style={{ color: "#D4AF37" }} />
              <span style={{ color: "#D4AF37", fontSize: "0.8rem", letterSpacing: "0.12em" }}>
                SIDOARJO, JAWA TIMUR, INDONESIA
              </span>
            </div>
            <h1
              className="mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#FBF5E6", lineHeight: "1.2" }}
            >
              Desa Batik Jetis
              <span style={{ color: "#D4AF37", display: "block" }}>Warisan Budaya Nusantara</span>
            </h1>
            <p className="mb-8 max-w-2xl" style={{ color: "rgba(251, 245, 230, 0.8)", lineHeight: "1.8", fontSize: "1rem" }}>
              Lebih dari 100 tahun, Desa Jetis menjadi jantung produksi batik Sidoarjo. Dengan ratusan pengrajin
              terampil, motif-motif khas seperti <em>"Beras Utah"</em>, flora, fauna, dan lukisan alam menjadi
              identitas budaya yang tak ternilai.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#toko"
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
              >
                <ShoppingBag className="w-4 h-4" />
                Jelajahi Toko
              </a>
              <a
                href="#sejarah"
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all"
                style={{ color: "#FBF5E6", border: "1px solid rgba(251,245,230,0.3)" }}
              >
                <Info className="w-4 h-4" />
                Sejarah Desa
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== STATS ======================== */}
      <section style={{ background: "linear-gradient(135deg, #6B3A1F, #3D1C02)" }} className="relative overflow-hidden">
        <BatikBackground opacity={0.1} patternType="parang" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "100+", label: "Tahun Tradisi", icon: Award },
              { value: "350+", label: "Pengrajin Aktif", icon: Users },
              { value: "30+", label: "Toko & Sanggar", icon: ShoppingBag },
              { value: "500+", label: "Motif Unik", icon: Heart },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201, 150, 12, 0.15)", border: "1px solid rgba(201, 150, 12, 0.3)" }}>
                    <Icon className="w-5 h-5" style={{ color: "#D4AF37" }} />
                  </div>
                  <div>
                    <div style={{ color: "#D4AF37", fontSize: "1.4rem", fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                    <div style={{ color: "rgba(251,245,230,0.6)", fontSize: "0.75rem" }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================== ABOUT ======================== */}
      <section className="py-20 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(201, 150, 12, 0.1)", color: "#9A6B0A" }}>
                <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>TENTANG DESA JETIS</span>
              </div>
              <h2 className="mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2rem", lineHeight: "1.3" }}>
                Sentra Batik Sidoarjo yang Mendunia
              </h2>
              <div className="space-y-4" style={{ color: "#4A2A0A", lineHeight: "1.8", fontSize: "0.95rem" }}>
                <p>
                  Berlokasi di Kelurahan Jetis, Kecamatan Sidoarjo, Kabupaten Sidoarjo, Jawa Timur, kampung batik ini
                  merupakan salah satu pusat produksi batik tertua di kawasan Jawa Timur. Sejak awal abad ke-20,
                  warga Jetis telah menggeluti seni membatik secara turun-temurun.
                </p>
                <p>
                  Ciri khas batik Jetis adalah penggunaan motif <strong>Beras Utah</strong> (butiran beras berserakan),
                  yang terinspirasi dari kelimpahan hasil pertanian setempat. Motif ini telah terdaftar sebagai
                  kekayaan intelektual daerah dan menjadi simbol kebanggaan Sidoarjo.
                </p>
                <p>
                  Selain Beras Utah, pengrajin Jetis juga mengembangkan motif flora-fauna khas Jawa Timur, seperti
                  burung merak, kupu-kupu, bunga kenongo, dan ikan kerapu — mencerminkan kekayaan alam dan budaya setempat.
                </p>
              </div>

              {/* Motif highlights */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["Beras Utah", "Burung Merak", "Kenongo", "Kembang Setaman", "Sisik Ikan", "Kupu-kupu"].map((m, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm"
                    style={{ background: "rgba(201, 150, 12, 0.1)", color: "#7C3D12", border: "1px solid rgba(201, 150, 12, 0.25)" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-56 rounded-2xl overflow-hidden shadow-lg">
                  <img src={artisanImg} alt="Pengrajin batik" className="w-full h-full object-cover" />
                </div>
                <div className="h-36 rounded-2xl overflow-hidden shadow-lg">
                  <img src={storeImg} alt="Toko batik" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <div className="h-36 rounded-2xl overflow-hidden shadow-lg">
                  <img src={workshopImg} alt="Workshop batik" className="w-full h-full object-cover" />
                </div>
                <div className="h-56 rounded-2xl overflow-hidden shadow-lg">
                  <img src={batikFabricImg} alt="Kain batik" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BatikDivider />

      {/* ======================== SEJARAH / TIMELINE ======================== */}
      <section id="sejarah" className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FBF5E6, #F0E6C8)" }}>
        <BatikBackground opacity={0.05} patternType="kawung" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(61, 28, 2, 0.08)", color: "#6B3A1F" }}>
              <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>SEJARAH & PERJALANAN</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2.2rem" }}>
              Jejak Waktu Batik Jetis
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5"
                style={{ background: "linear-gradient(to bottom, #C9960C, rgba(201,150,12,0.2))" }} />

              <div className="space-y-6">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all group-hover:scale-110"
                        style={{ background: i === 0 || i === timeline.length - 1 ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "white", border: "2px solid #C9960C" }}>
                        <span style={{ fontSize: "0.6rem", color: i === 0 || i === timeline.length - 1 ? "#3D1C02" : "#9A6B0A", fontFamily: "'Playfair Display', serif" }}>
                          {item.year.slice(-2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="p-4 rounded-xl transition-all group-hover:shadow-lg"
                        style={{ background: "white", border: "1px solid rgba(201, 150, 12, 0.15)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: "#C9960C", fontFamily: "'Playfair Display', serif", fontSize: "1rem" }}>
                            {item.year}
                          </span>
                        </div>
                        <p style={{ color: "#4A2A0A", fontSize: "0.875rem", lineHeight: "1.7" }}>{item.event}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== TOKO-TOKO ======================== */}
      <section id="toko" className="py-20 relative overflow-hidden">
        <BatikBackground opacity={0.04} patternType="floral" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(201, 150, 12, 0.1)", color: "#9A6B0A" }}>
              <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>DIREKTORI TOKO</span>
            </div>
            <h2 className="mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2.2rem" }}>
              Toko Batik di Desa Jetis
            </h2>
            <p style={{ color: "#6B4226", fontSize: "0.9rem" }}>
              Temukan pengrajin dan toko batik terbaik di jantung sentra batik Sidoarjo
            </p>
          </div>

          {/* Filter tags */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className="px-4 py-1.5 rounded-full text-sm transition-all capitalize"
                style={{
                  background: filterTag === tag ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "rgba(201, 150, 12, 0.08)",
                  color: filterTag === tag ? "#3D1C02" : "#6B4226",
                  border: `1px solid ${filterTag === tag ? "#C9960C" : "rgba(201, 150, 12, 0.2)"}`,
                }}
              >
                {tag === "all" ? "Semua Toko" : tag}
              </button>
            ))}
          </div>

          {/* Featured stores */}
          {loading ? (
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-amber-100 p-0">
                  <Skeleton className="h-52 w-full rounded-none" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-10 w-32 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {filteredStores.filter(s => s.featured).map((store) => (
                  <div
                    key={store.id}
                    className="rounded-2xl overflow-hidden shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                    style={{ border: "1px solid rgba(201, 150, 12, 0.25)" }}
                    onClick={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
                  >
                    <div className="h-52 relative overflow-hidden">
                      <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(61,28,2,0.9) 0%, transparent 60%)" }} />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs"
                          style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}>
                          ⭐ Toko Unggulan
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 style={{ color: "#FBF5E6", fontFamily: "'Playfair Display', serif", fontSize: "1.3rem" }}>
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={store.rating} />
                          <span style={{ color: "rgba(251,245,230,0.7)", fontSize: "0.75rem" }}>
                            ({store.review_count} ulasan)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5" style={{ background: "white" }}>
                      <p className="mb-3 line-clamp-2" style={{ color: "#4A2A0A", fontSize: "0.875rem", lineHeight: "1.7" }}>
                        {store.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {store.tags?.map((t, ti) => (
                          <span key={ti} className="px-2.5 py-1 rounded-full text-xs"
                            style={{ background: "rgba(201, 150, 12, 0.08)", color: "#7C3D12", border: "1px solid rgba(201, 150, 12, 0.2)" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2" style={{ color: "#6B4226" }}>
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#C9960C" }} />
                          <span className="line-clamp-1" style={{ fontSize: "0.8rem" }}>{store.address}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: "#6B4226" }}>
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#C9960C" }} />
                          <span style={{ fontSize: "0.8rem" }}>{store.hours}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: "#6B4226" }}>
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#C9960C" }} />
                          <span style={{ fontSize: "0.8rem" }}>{store.phone}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: "#6B4226" }}>
                          <Award className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#C9960C" }} />
                          <span style={{ fontSize: "0.8rem" }}>Est. {store.established}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "#7C3D12", fontFamily: "'Playfair Display', serif" }}>{store.priceRange}</span>
                        <Link
                          to="/catalog"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all hover:shadow-md"
                          style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Lihat Produk
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Other stores grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredStores.filter(s => !s.featured).map((store) => (
                  <div
                    key={store.id}
                    className="rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    style={{ background: "white", border: "1px solid rgba(201, 150, 12, 0.15)" }}
                    onClick={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
                  >
                    <div className="h-36 relative overflow-hidden">
                      <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(61,28,2,0.8) 0%, transparent 60%)" }} />
                      <div className="absolute bottom-2 left-3 right-3">
                        <h3 style={{ color: "#FBF5E6", fontSize: "0.875rem", fontFamily: "'Playfair Display', serif" }}>
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <StarRating rating={store.rating} />
                          <span style={{ color: "rgba(251,245,230,0.7)", fontSize: "0.65rem" }}>
                            ({store.review_count})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {store.tags?.slice(0, 2).map((t, ti) => (
                          <span key={ti} className="px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(201, 150, 12, 0.08)", color: "#7C3D12", fontSize: "0.65rem" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="line-clamp-2 mb-3" style={{ color: "#6B4226", fontSize: "0.8rem", lineHeight: "1.6" }}>
                        {store.description}
                      </p>
                      <div className="flex items-center gap-1.5 mb-2" style={{ color: "#9A6B4B", fontSize: "0.75rem" }}>
                        <Clock className="w-3 h-3" />
                        {store.hours}
                      </div>
                      <div style={{ color: "#7C3D12", fontSize: "0.8rem", fontFamily: "'Playfair Display', serif" }}>
                        {store.priceRange}
                      </div>
                    </div>

                    {/* Expandable detail */}
                    {selectedStore === store.id && (
                      <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid rgba(201, 150, 12, 0.1)" }}>
                        <div className="pt-3 space-y-2">
                          <div className="flex items-center gap-2" style={{ color: "#6B4226", fontSize: "0.8rem" }}>
                            <MapPin className="w-3.5 h-3.5" style={{ color: "#C9960C" }} />
                            {store.address}
                          </div>
                          <div className="flex items-center gap-2" style={{ color: "#6B4226", fontSize: "0.8rem" }}>
                            <Phone className="w-3.5 h-3.5" style={{ color: "#C9960C" }} />
                            {store.phone}
                          </div>
                          <div>
                            <div className="mb-1" style={{ color: "#9A6B4B", fontSize: "0.75rem" }}>Motif Unggulan:</div>
                            <div className="flex flex-wrap gap-1">
                              {store.motifs?.map((m, mi) => (
                                <span key={mi} className="px-2 py-0.5 rounded"
                                  style={{ background: "rgba(61,28,2,0.06)", color: "#3D1C02", fontSize: "0.7rem" }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ======================== WISATA INFO ======================== */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#3D1C02" }}>
        <BatikBackground opacity={0.12} patternType="mega" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cara sampai */}
            <div className="p-6 rounded-2xl" style={{ background: "rgba(201, 150, 12, 0.1)", border: "1px solid rgba(201, 150, 12, 0.2)" }}>
              <MapPin className="w-8 h-8 mb-4" style={{ color: "#D4AF37" }} />
              <h3 className="mb-3" style={{ color: "#D4AF37", fontFamily: "'Playfair Display', serif" }}>
                Cara Menuju Desa Jetis
              </h3>
              <ul className="space-y-2" style={{ color: "rgba(251,245,230,0.75)", fontSize: "0.875rem" }}>
                <li>🚗 Dari Surabaya: ±30 menit via Tol Waru-Sidoarjo</li>
                <li>🚌 Bus Surabaya-Sidoarjo, turun Terminal Purabaya lalu naik angkot</li>
                <li>🛵 Ojek online dari Alun-alun Sidoarjo: ±10 menit</li>
                <li>📍 Koordinat: -7.4458°S, 112.7168°E</li>
              </ul>
            </div>

            {/* Tips berkunjung */}
            <div className="p-6 rounded-2xl" style={{ background: "rgba(201, 150, 12, 0.1)", border: "1px solid rgba(201, 150, 12, 0.2)" }}>
              <Camera className="w-8 h-8 mb-4" style={{ color: "#D4AF37" }} />
              <h3 className="mb-3" style={{ color: "#D4AF37", fontFamily: "'Playfair Display', serif" }}>
                Tips Berkunjung
              </h3>
              <ul className="space-y-2" style={{ color: "rgba(251,245,230,0.75)", fontSize: "0.875rem" }}>
                <li>⏰ Waktu terbaik: Pagi hari (08.00–11.00) saat pengrajin aktif</li>
                <li>📸 Tanyakan izin sebelum memotret proses membatik</li>
                <li>🎒 Bawa uang tunai; beberapa toko belum menerima kartu</li>
                <li>🎓 Tersedia paket workshop batik mulai Rp 75.000/orang</li>
              </ul>
            </div>

            {/* Pesan via RekaBatik */}
            <div className="p-6 rounded-2xl relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(201,150,12,0.2), rgba(212,175,55,0.1))", border: "1px solid rgba(201, 150, 12, 0.35)" }}>
              <ExternalLink className="w-8 h-8 mb-4" style={{ color: "#D4AF37" }} />
              <h3 className="mb-3" style={{ color: "#D4AF37", fontFamily: "'Playfair Display', serif" }}>
                Pesan via RekaBatik
              </h3>
              <p className="mb-4" style={{ color: "rgba(251,245,230,0.75)", fontSize: "0.875rem", lineHeight: "1.7" }}>
                Tidak bisa datang langsung? Kustomisasi batik impian Anda secara online dan kami akan menghubungkan
                Anda dengan pengrajin terbaik di Desa Jetis.
              </p>
              <Link
                to="/custom"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
              >
                <ChevronRight className="w-4 h-4" />
                Mulai Kustomisasi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
