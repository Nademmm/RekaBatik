import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, Truck, Plus, Search, Filter, ChevronDown, Star, RotateCcw } from "lucide-react";
import { Link } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
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
    bg: "rgba(22, 163, 74, 0.1)",
    border: "rgba(22, 163, 74, 0.25)",
    steps: [true, true, true, true],
  },
  shipping: {
    label: "Dalam Pengiriman",
    icon: Truck,
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.25)",
    steps: [true, true, true, false],
  },
  processing: {
    label: "Sedang Diproses",
    icon: Clock,
    color: "#D4B88B",
    bg: "rgba(212, 184, 139, 0.15)",
    border: "rgba(212, 184, 139, 0.35)",
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
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("date", { ascending: false });

        if (error) throw error;
        if (data) {
          setOrders(data);
        }
      } catch (err: any) {
        handleSupabaseError(err, "OrdersPage.fetchOrders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
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
      <BatikBackground opacity={0.04} patternType="kawung" />

      <div className="container mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-block px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(212, 184, 139, 0.2)", color: "#8B6F47" }}>
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.12em", fontWeight: 500 }}>RIWAYAT TRANSAKSI</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "2.25rem", fontWeight: 600 }}>
              Pesanan Saya
            </h1>
            <p style={{ color: "#7A6B5E", fontSize: "0.95rem", marginTop: "0.5rem" }}>
              Lacak dan kelola semua pesanan batik Anda
            </p>
          </div>
          <Link
            to="/catalog"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:shadow-lg"
            style={{ background: "#D4B88B", color: "#3D2B1F", fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Pesan Baru
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Pesanan", value: orders.length, icon: Package, color: "#8B6F47" },
            { label: "Terkirim", value: statusCounts.delivered, icon: CheckCircle, color: "#16A34A" },
            { label: "Dalam Pengiriman", value: statusCounts.shipping, icon: Truck, color: "#3B82F6" },
            { label: "Total Belanja", value: `Rp ${totalSpent.toLocaleString("id-ID")}`, icon: Star, color: "#D4B88B" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="p-5 rounded-2xl" style={{ background: "white", border: "1px solid #E8E1DA", boxShadow: "0 1px 2px rgba(61, 43, 31, 0.05)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600 }}>{s.value}</div>
                    <div style={{ color: "#7A6B5E", fontSize: "0.8rem", marginTop: "0.25rem" }}>{s.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
            <input
              type="text"
              placeholder="Cari nomor pesanan atau nama produk..."
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-2 focus:ring-offset-0"
              style={{ background: "white", border: "1px solid #E8E1DA", color: "#3D2B1F", fontSize: "0.9rem" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "processing", "shipping", "delivered"] as OrderStatus[]).map((s) => {
              const labels: Record<OrderStatus, string> = { all: "Semua", processing: "Diproses", shipping: "Dikirim", delivered: "Terkirim" };
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: filterStatus === s ? "#D4B88B" : "white",
                    color: filterStatus === s ? "#3D2B1F" : "#7A6B5E",
                    border: `1px solid ${filterStatus === s ? "#D4B88B" : "#E8E1DA"}`,
                    fontWeight: 500,
                  }}
                >
                  {labels[s]}
                  {statusCounts[s] > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                      style={{ background: filterStatus === s ? "rgba(61, 43, 31, 0.12)" : "rgba(212, 184, 139, 0.2)", color: filterStatus === s ? "#3D2B1F" : "#8B6F47" }}>
                      {statusCounts[s]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-[#E8E1DA] space-y-4">
                <div className="flex gap-5">
                  <Skeleton className="w-28 h-28 rounded-xl" style={{ background: "#FAF8F5" }} />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3" style={{ background: "#FAF8F5" }} />
                      <Skeleton className="h-8 w-24 rounded-full" style={{ background: "#FAF8F5" }} />
                    </div>
                    <Skeleton className="h-4 w-1/2" style={{ background: "#FAF8F5" }} />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" style={{ background: "#FAF8F5" }} />
                      <Skeleton className="h-4 w-20" style={{ background: "#FAF8F5" }} />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-1 w-full" style={{ background: "#FAF8F5" }} />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" style={{ background: "#FAF8F5" }} />
                  <Skeleton className="h-10 w-32 rounded-xl" style={{ background: "#FAF8F5" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl" style={{ background: "white", border: "1px solid #E8E1DA" }}>
            <Package className="w-14 h-14 mx-auto mb-4" style={{ color: "#D4B88B", opacity: 0.6 }} />
            <h2 className="mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "1.4rem", fontWeight: 600 }}>
              Tidak Ada Pesanan
            </h2>
            <p className="mb-6" style={{ color: "#7A6B5E", fontSize: "0.95rem" }}>
              {searchId ? "Pesanan tidak ditemukan" : "Belum ada pesanan dengan status ini"}
            </p>
            <Link to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:shadow-lg"
              style={{ background: "#D4B88B", color: "#3D2B1F", fontWeight: 500 }}>
              Lihat Katalog
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              return (
                <div key={order.id} className="rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                  style={{ background: "white", border: "1px solid #E8E1DA" }}>
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Pattern preview */}
                      <div className="w-full lg:w-32 h-28 lg:h-32 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: order.bg_color }}>
                        <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color} type={order.type} />
                      </div>

                      {/* Order info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="mb-1" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600 }}>
                              {order.item}
                            </h3>
                            <p style={{ color: "#7A6B5E", fontSize: "0.875rem" }}>{order.description}</p>
                          </div>
                          <span
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm flex-shrink-0 self-start"
                            style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}`, fontWeight: 500 }}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </div>

                        {/* Order details */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5">
                          <div style={{ color: "#A89B8F", fontSize: "0.85rem" }}>
                            <span style={{ color: "#7A6B5E", fontWeight: 500 }}>No:</span> {order.id}
                          </div>
                          <div style={{ color: "#A89B8F", fontSize: "0.85rem" }}>
                            <span style={{ color: "#7A6B5E", fontWeight: 500 }}>Tanggal:</span> {order.date}
                          </div>
                          <div style={{ color: "#A89B8F", fontSize: "0.85rem" }}>
                            <span style={{ color: "#7A6B5E", fontWeight: 500 }}>Pengrajin:</span> {order.artisan}
                          </div>
                          {order.status === "delivered" && (
                            <div style={{ color: "#16A34A", fontSize: "0.85rem", fontWeight: 500 }}>
                              ✓ Diterima: {(order as any).delivered_date}
                            </div>
                          )}
                          {order.status !== "delivered" && (
                            <div style={{ color: "#A89B8F", fontSize: "0.85rem" }}>
                              <span style={{ color: "#7A6B5E", fontWeight: 500 }}>Estimasi:</span> {(order as any).estimated_date}
                            </div>
                          )}
                        </div>

                        {/* Progress steps */}
                        <div className="mb-5">
                          <div className="flex items-center gap-2">
                            {config.steps.map((done, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all"
                                  style={{
                                    background: done ? "#D4B88B" : "rgba(212, 184, 139, 0.15)",
                                    color: done ? "#3D2B1F" : "#A89B8F",
                                    border: `1px solid ${done ? "#D4B88B" : "rgba(212, 184, 139, 0.3)"}`,
                                    fontWeight: done ? 600 : 500,
                                  }}
                                >
                                  {done ? "✓" : i + 1}
                                </div>
                                {i < config.steps.length - 1 && (
                                  <div
                                    className="h-0.5 flex-1"
                                    style={{
                                      width: "1.75rem",
                                      background: done && config.steps[i + 1] ? "#D4B88B" : "rgba(212, 184, 139, 0.2)",
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4 mt-2">
                            {stepLabels.map((label, i) => (
                              <span key={i} style={{ color: config.steps[i] ? "#7A6B5E" : "#A89B8F", fontSize: "0.7rem", width: "5rem", lineHeight: "1.4", textAlign: "center" }}>
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4" style={{ borderTop: "1px solid #E8E1DA" }}>
                          <div style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 600 }}>
                            Rp {order.total.toLocaleString("id-ID")}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-[#FAF8F5]"
                              style={{ background: "transparent", color: "#7A6B5E", border: "1px solid #E8E1DA", fontWeight: 500 }}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                              Detail Pesanan
                            </button>
                            {order.status === "delivered" && !order.reviewed && (
                              <button
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-md"
                                style={{ background: "#D4B88B", color: "#3D2B1F", fontWeight: 500 }}
                              >
                                <Star className="w-3.5 h-3.5" />
                                Beri Ulasan
                              </button>
                            )}
                            {order.status === "delivered" && order.reviewed && (
                              <button
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-md"
                                style={{ background: "#D4B88B", color: "#3D2B1F", fontWeight: 500 }}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Pesan Lagi
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
