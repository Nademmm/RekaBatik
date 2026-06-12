import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Package, Clock, CheckCircle, Truck, Plus, Search, Star, RotateCcw, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { Order } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";

type OrderStatus = "all" | "delivered" | "shipping" | "processing";

function PatternMini({ primary, secondary, bg, type }: { primary: string; secondary: string; bg: string; type: string }) {
  const id = `ord-${type}-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <svg width="100%" height="100%">
      <defs>
        <pattern id={id} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="30" height="30" />
          {type === "parang" && <path d="M0,15 Q7.5,7.5 15,15 Q22.5,22.5 30,15" stroke={primary} strokeWidth="2" fill="none" />}
          {type === "kawung" && (
            <>
              <ellipse cx="15" cy="8" rx="4" ry="6" fill="none" stroke={primary} strokeWidth="1.5" />
              <ellipse cx="15" cy="22" rx="4" ry="6" fill="none" stroke={primary} strokeWidth="1.5" />
              <ellipse cx="8" cy="15" rx="6" ry="4" fill="none" stroke={primary} strokeWidth="1.5" />
              <ellipse cx="22" cy="15" rx="6" ry="4" fill="none" stroke={primary} strokeWidth="1.5" />
              <circle cx="15" cy="15" r="2" fill={secondary} />
            </>
          )}
          {type === "mega" && <path d="M0,15 Q7.5,6 15,15 Q22.5,24 30,15" stroke={primary} strokeWidth="2.5" fill="none" />}
          {type === "sidomukti" && (
            <>
              <rect x="6" y="6" width="18" height="18" fill="none" stroke={primary} strokeWidth="1.5" />
              <rect x="10" y="10" width="10" height="10" fill="none" stroke={secondary} strokeWidth="1.5" />
              <rect x="13" y="13" width="4" height="4" fill={secondary} opacity="0.6" />
            </>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const statusConfig = {
  delivered: {
    label: "Terkirim",
    icon: CheckCircle,
    color: "#16A34A",
    bg: "rgba(22, 163, 74, 0.12)",
    border: "rgba(22, 163, 74, 0.3)",
    steps: [true, true, true, true],
  },
  shipping: {
    label: "Dalam Pengiriman",
    icon: Truck,
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.3)",
    steps: [true, true, true, false],
  },
  processing: {
    label: "Sedang Diproses",
    icon: Clock,
    color: "#D4B88B",
    bg: "rgba(212, 184, 139, 0.18)",
    border: "rgba(212, 184, 139, 0.4)",
    steps: [true, true, false, false],
  },
};

const stepLabels = ["Pesanan Diterima", "Pengrajin Membatik", "Siap Kirim", "Terkirim"];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus>("all");
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    // Mock data untuk orders karena tabel orders tidak ada di Supabase
    const mockOrders: Order[] = [
      {
        id: "ORD-2024-001",
        item: "Batik Parang Kusumo",
        description: "Batik tradisional dengan motif parang khas Yogyakarta, warna biru tua dan emas",
        date: "2024-06-05",
        delivered_date: "2024-06-10",
        status: "delivered",
        total: 850000,
        type: "parang",
        primary_color: "#8B4513",
        secondary_color: "#DAA520",
        bg_color: "#F5F5DC",
        artisan: "Pak Suherman",
        can_review: true,
        reviewed: false,
      },
      {
        id: "ORD-2024-002",
        item: "Batik Mega Mendung",
        description: "Batik motif mega mendung khas Cirebon, warna biru muda dan putih",
        date: "2024-06-08",
        estimated_date: "2024-06-15",
        status: "shipping",
        total: 720000,
        type: "mega",
        primary_color: "#4682B4",
        secondary_color: "#FFFFFF",
        bg_color: "#E6E6FA",
        artisan: "Bu Siti",
        can_review: false,
        reviewed: false,
      },
      {
        id: "ORD-2024-003",
        item: "Batik Kawung Modern",
        description: "Kombinasi motif kawung tradisional dengan sentuhan modern",
        date: "2024-06-10",
        estimated_date: "2024-06-18",
        status: "processing",
        total: 950000,
        type: "kawung",
        primary_color: "#8B6F47",
        secondary_color: "#D4B88B",
        bg_color: "#FAF8F5",
        artisan: "Pak Hartono",
        can_review: false,
        reviewed: false,
      },
      {
        id: "ORD-2024-004",
        item: "Batik Sidomukti",
        description: "Motif sidomukti yang simbolkan kebahagiaan dan kemakmuran",
        date: "2024-05-20",
        delivered_date: "2024-05-28",
        status: "delivered",
        total: 1200000,
        type: "sidomukti",
        primary_color: "#B22222",
        secondary_color: "#FFD700",
        bg_color: "#FFFACD",
        artisan: "Bu Maryati",
        can_review: true,
        reviewed: true,
      },
    ];
    
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 800);
  }, []);

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchSearch = !searchId || o.id.toLowerCase().includes(searchId.toLowerCase()) || o.item.toLowerCase().includes(searchId.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCounts = {
    all: orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    shipping: orders.filter(o => o.status === "shipping").length,
    processing: orders.filter(o => o.status === "processing").length,
  };

  const totalSpent = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="mega" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full opacity-3" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
      <div className="absolute bottom-20 right-0 w-80 h-80 rounded-full opacity-2" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)" }} />

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2.25rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "0.5rem" }}>
                Pesanan Saya
              </h1>
              <p style={{ color: "#7A6B5E", fontSize: "1rem", maxWidth: "600px" }}>
                Lacak dan kelola semua pesanan batik Anda dengan mudah dan transparan
              </p>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl transition-all hover:shadow-xl hover:scale-105"
              style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FFFFFF", fontWeight: 600, boxShadow: "0 4px 16px rgba(139, 111, 71, 0.3)" }}
            >
              <Plus className="w-5 h-5" />
              Pesan Baru
            </Link>
          </div>
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10"
        >
          {[
            { label: "Total Pesanan", value: orders.length, icon: Package, color: "#8B6F47" },
            { label: "Terkirim", value: statusCounts.delivered, icon: CheckCircle, color: "#16A34A" },
            { label: "Dikirim", value: statusCounts.shipping, icon: Truck, color: "#3B82F6" },
            { label: "Total Belanja", value: `Rp ${totalSpent.toLocaleString("id-ID")}`, icon: Star, color: "#D4B88B" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-3xl"
                style={{
                  background: "white",
                  border: "1px solid rgba(212, 184, 139, 0.25)",
                  boxShadow: "0 4px 20px rgba(61, 43, 31, 0.06)"
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${s.color}15, ${s.color}10)`,
                      border: `1px solid ${s.color}25`
                    }}>
                    <Icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: "#7A6B5E", fontSize: "0.85rem", marginTop: "0.35rem", fontWeight: 500 }}>{s.label}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#A89B8F" }} />
                <input
                  type="text"
                  placeholder="Cari nomor pesanan atau nama produk..."
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl outline-none transition-all focus:ring-2 focus:ring-offset-0"
                  style={{
                    background: "white",
                    border: "1px solid rgba(212, 184, 139, 0.3)",
                    color: "#3D2B1F",
                    fontSize: "0.95rem",
                    boxShadow: "0 2px 12px rgba(61, 43, 31, 0.04)"
                  }}
                />
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2.5 flex-wrap">
              {(["all", "processing", "shipping", "delivered"] as OrderStatus[]).map((s, i) => {
                const labels: Record<OrderStatus, string> = { all: "Semua", processing: "Diproses", shipping: "Dikirim", delivered: "Terkirim" };
                return (
                  <motion.button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-4 rounded-2xl text-sm transition-all"
                    style={{
                      background: filterStatus === s ? "linear-gradient(135deg, #8B6F47, #A88967)" : "white",
                      color: filterStatus === s ? "#FFFFFF" : "#7A6B5E",
                      border: filterStatus === s ? "none" : "1px solid rgba(212, 184, 139, 0.3)",
                      fontWeight: 600,
                      boxShadow: filterStatus === s ? "0 4px 16px rgba(139, 111, 71, 0.3)" : "none"
                    }}
                  >
                    {labels[s]}
                    {statusCounts[s] > 0 && (
                      <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs"
                        style={{
                          background: filterStatus === s ? "rgba(255, 255, 255, 0.25)" : "rgba(212, 184, 139, 0.2)",
                          color: filterStatus === s ? "#FFFFFF" : "#8B6F47"
                        }}>
                        {statusCounts[s]}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-7 rounded-3xl bg-white border border-[rgba(212,184,139,0.25)] space-y-5"
                style={{ boxShadow: "0 4px 20px rgba(61, 43, 31, 0.05)" }}
              >
                <div className="flex gap-6">
                  <Skeleton className="w-36 h-36 rounded-2xl" style={{ background: "#FAF8F5" }} />
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-7 w-1/3" style={{ background: "#FAF8F5" }} />
                      <Skeleton className="h-10 w-36 rounded-full" style={{ background: "#FAF8F5" }} />
                    </div>
                    <Skeleton className="h-5 w-1/2" style={{ background: "#FAF8F5" }} />
                    <div className="flex gap-6">
                      <Skeleton className="h-5 w-28" style={{ background: "#FAF8F5" }} />
                      <Skeleton className="h-5 w-28" style={{ background: "#FAF8F5" }} />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full" style={{ background: "#FAF8F5" }} />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-36" style={{ background: "#FAF8F5" }} />
                  <Skeleton className="h-12 w-44 rounded-2xl" style={{ background: "#FAF8F5" }} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="py-24 text-center rounded-3xl"
            style={{
              background: "white",
              border: "1px solid rgba(212, 184, 139, 0.25)",
              boxShadow: "0 4px 20px rgba(61, 43, 31, 0.05)"
            }}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: "rgba(212, 184, 139, 0.15)" }}>
              <Package className="w-10 h-10" style={{ color: "#D4B88B" }} />
            </div>
            <h2 className="mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.6rem", fontWeight: 700 }}>
              Tidak Ada Pesanan
            </h2>
            <p className="mb-8" style={{ color: "#7A6B5E", fontSize: "1rem" }}>
              {searchId ? "Pesanan tidak ditemukan, coba kata kunci lain" : "Belum ada pesanan dengan status ini"}
            </p>
            <Link to="/catalog"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl transition-all hover:shadow-xl hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #8B6F47, #A88967)",
                color: "#FFFFFF",
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(139, 111, 71, 0.3)"
              }}>
              <ShoppingBag className="w-5 h-5" />
              Mulai Belanja
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filtered.map((order, i) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                  whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(61, 43, 31, 0.1)" }}
                  className="rounded-3xl overflow-hidden transition-all"
                  style={{
                    background: "white",
                    border: "1px solid rgba(212, 184, 139, 0.25)",
                    boxShadow: "0 4px 20px rgba(61, 43, 31, 0.05)"
                  }}
                >
                  <div className="p-7">
                    <div className="flex flex-col lg:flex-row gap-7">
                      {/* Pattern preview */}
                      <div className="w-full lg:w-40 h-32 lg:h-40 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner"
                        style={{ background: order.bg_color }}>
                        <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color} type={order.type} />
                      </div>

                      {/* Order info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                          <div>
                            <h3 className="mb-2" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700 }}>
                              {order.item}
                            </h3>
                            <p style={{ color: "#7A6B5E", fontSize: "0.95rem", lineHeight: "1.6" }}>{order.description}</p>
                          </div>
                          <span
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm flex-shrink-0 self-start"
                            style={{
                              background: config.bg,
                              color: config.color,
                              border: `1px solid ${config.border}`,
                              fontWeight: 600
                            }}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {config.label}
                          </span>
                        </div>

                        {/* Order details */}
                        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-6">
                          <div style={{ color: "#A89B8F", fontSize: "0.9rem" }}>
                            <span style={{ color: "#7A6B5E", fontWeight: 600 }}>No:</span> <span style={{ color: "#3D2B1F", fontWeight: 500 }}>{order.id}</span>
                          </div>
                          <div style={{ color: "#A89B8F", fontSize: "0.9rem" }}>
                            <span style={{ color: "#7A6B5E", fontWeight: 600 }}>Tanggal:</span> <span style={{ color: "#3D2B1F", fontWeight: 500 }}>{order.date}</span>
                          </div>
                          <div style={{ color: "#A89B8F", fontSize: "0.9rem" }}>
                            <span style={{ color: "#7A6B5E", fontWeight: 600 }}>Pengrajin:</span> <span style={{ color: "#3D2B1F", fontWeight: 500 }}>{order.artisan}</span>
                          </div>
                          {order.status === "delivered" && (
                            <div style={{ color: "#16A34A", fontSize: "0.9rem", fontWeight: 600 }}>
                              ✓ Diterima: {(order as any).delivered_date}
                            </div>
                          )}
                          {order.status !== "delivered" && (
                            <div style={{ color: "#A89B8F", fontSize: "0.9rem" }}>
                              <span style={{ color: "#7A6B5E", fontWeight: 600 }}>Estimasi:</span> <span style={{ color: "#3D2B1F", fontWeight: 500 }}>{(order as any).estimated_date}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress steps */}
                        <div className="mb-6">
                          <div className="flex items-center gap-3">
                            {config.steps.map((done, j) => (
                              <div key={j} className="flex items-center gap-1.5">
                                <motion.div
                                  className="w-14 h-14 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all"
                                  style={{
                                    background: done ? "linear-gradient(135deg, #8B6F47, #A88967)" : "rgba(212, 184, 139, 0.18)",
                                    color: done ? "#FFFFFF" : "#A89B8F",
                                    border: `2px solid ${done ? "#8B6F47" : "rgba(212, 184, 139, 0.35)"}`,
                                    fontWeight: done ? 700 : 600,
                                    boxShadow: done ? "0 4px 12px rgba(139, 111, 71, 0.3)" : "none"
                                  }}
                                >
                                  {done ? "✓" : j + 1}
                                </motion.div>
                                {j < config.steps.length - 1 && (
                                  <div
                                    className="h-1 flex-1"
                                    style={{
                                      width: "2rem",
                                      background: done && config.steps[j + 1] ? "linear-gradient(90deg, #8B6F47, #A88967)" : "rgba(212, 184, 139, 0.25)",
                                      borderRadius: "9999px"
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4 mt-3">
                            {stepLabels.map((label, j) => (
                              <span key={j} style={{
                                color: config.steps[j] ? "#7A6B5E" : "#A89B8F",
                                fontSize: "0.75rem",
                                width: "6rem",
                                lineHeight: "1.5",
                                textAlign: "center",
                                fontWeight: config.steps[j] ? 600 : 500
                              }}>
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5" style={{ borderTop: "1px solid rgba(212, 184, 139, 0.2)" }}>
                          <div style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700 }}>
                            Rp {order.total.toLocaleString("id-ID")}
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            <button
                              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm transition-all hover:bg-[#FAF8F5]"
                              style={{
                                background: "transparent",
                                color: "#7A6B5E",
                                border: "1px solid rgba(212, 184, 139, 0.3)",
                                fontWeight: 600
                              }}
                            >
                              <ChevronRight className="w-4 h-4" />
                              Detail Pesanan
                            </button>
                            {order.status === "delivered" && !order.reviewed && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm transition-all hover:shadow-lg"
                                style={{
                                  background: "linear-gradient(135deg, #8B6F47, #A88967)",
                                  color: "#FFFFFF",
                                  fontWeight: 600,
                                  boxShadow: "0 4px 16px rgba(139, 111, 71, 0.3)"
                                }}
                              >
                                <Star className="w-4 h-4" />
                                Beri Ulasan
                              </motion.button>
                            )}
                            {order.status === "delivered" && order.reviewed && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm transition-all hover:shadow-lg"
                                style={{
                                  background: "linear-gradient(135deg, #D4B88B, #C9AB7F)",
                                  color: "#3D2B1F",
                                  fontWeight: 600,
                                  boxShadow: "0 4px 16px rgba(212, 184, 139, 0.3)"
                                }}
                              >
                                <RotateCcw className="w-4 h-4" />
                                Pesan Lagi
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
