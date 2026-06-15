import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, Clock, CheckCircle, Truck, Plus, Search, Star, ChevronRight,
  ShoppingBag, MapPin, CreditCard, RotateCcw, X, Loader2, CheckCircle2,
  AlertCircle, ShoppingCart, Download
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { Order } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "sonner";

type OrderStatus = "all" | "delivered" | "shipping" | "processing";

// ─── Pattern Preview ────────────────────────────────────────────────────────
function PatternMini({ primary, secondary, bg, type }: { primary: string; secondary: string; bg: string; type: string }) {
  const id = `ord-${type}-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <svg width="100%" height="100%">
      <defs>
        <pattern id={id} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="30" height="30" />
          {type === "parang" && <path d="M0,15 Q7.5,7.5 15,15 Q22.5,22.5 30,15" stroke={primary} strokeWidth="2" fill="none" />}
          {type === "kawung" && (<><ellipse cx="15" cy="8" rx="4" ry="6" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="15" cy="22" rx="4" ry="6" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="8" cy="15" rx="6" ry="4" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="22" cy="15" rx="6" ry="4" fill="none" stroke={primary} strokeWidth="1.5" /><circle cx="15" cy="15" r="2" fill={secondary} /></>)}
          {type === "mega" && <path d="M0,15 Q7.5,6 15,15 Q22.5,24 30,15" stroke={primary} strokeWidth="2.5" fill="none" />}
          {type === "sidomukti" && (<><rect x="6" y="6" width="18" height="18" fill="none" stroke={primary} strokeWidth="1.5" /><rect x="10" y="10" width="10" height="10" fill="none" stroke={secondary} strokeWidth="1.5" /><rect x="13" y="13" width="4" height="4" fill={secondary} opacity="0.6" /></>)}
          {!["parang","kawung","mega","sidomukti"].includes(type) && <path d="M0,15 Q7.5,7.5 15,15 Q22.5,22.5 30,15" stroke={primary} strokeWidth="2" fill="none" />}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const statusConfig = {
  delivered: { label: "Terkirim", icon: CheckCircle, color: "#16A34A", bg: "rgba(22, 163, 74, 0.1)", border: "rgba(22, 163, 74, 0.25)", steps: [true, true, true, true] },
  shipping:  { label: "Dalam Pengiriman", icon: Truck, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.25)", steps: [true, true, true, false] },
  processing:{ label: "Sedang Diproses", icon: Clock, color: "#D97706", bg: "rgba(217, 119, 6, 0.1)", border: "rgba(217, 119, 6, 0.25)", steps: [true, true, false, false] },
};

const stepLabels = ["Pesanan Diterima", "Pengrajin Membatik", "Siap Kirim", "Terkirim"];

const paymentMethodLabel: Record<string, React.ReactNode> = {
  transfer_bca: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" className="h-4 object-contain inline-block" /> Transfer BCA</span>,
  transfer_mandiri: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" alt="Mandiri" className="h-3.5 object-contain inline-block" /> Transfer Mandiri</span>,
  gopay: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="GoPay" className="h-4 object-contain inline-block" /> GoPay</span>,
  ovo: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" alt="OVO" className="h-4 object-contain inline-block" /> OVO</span>,
  cod: <span className="flex items-center gap-2"><Package className="w-4 h-4 text-[#5A3D2B] inline-block" /> Bayar di Tempat (COD)</span>,
};

// ─── Order Detail Modal ─────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onConfirmReceived, onBuyAgain, onViewFullPreview }: {
  order: Order;
  onClose: () => void;
  onConfirmReceived: (id: string) => Promise<void>;
  onBuyAgain: (order: Order) => Promise<void>;
  onViewFullPreview: (src: string, title: string) => void;
}) {
  const sc = statusConfig[order.status];
  const [confirming, setConfirming] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white rounded-t-3xl z-10" style={{ borderBottom: "1px solid rgba(212,184,139,0.2)" }}>
          <div>
            <p className="text-xs font-medium" style={{ color: "#A89B8F" }}>Nomor Pesanan</p>
            <p className="font-mono font-bold" style={{ color: "#3D2B1F" }}>{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5" style={{ color: "#7A6B5E" }} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
            <sc.icon className="w-5 h-5" style={{ color: sc.color }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: sc.color }}>{sc.label}</p>
              <p className="text-xs" style={{ color: "#7A6B5E" }}>
                {order.status === "processing" && "Pengrajin sedang memproses pesanan Anda"}
                {order.status === "shipping" && "Paket dalam perjalanan menuju Anda"}
                {order.status === "delivered" && `Diterima ${order.delivered_date ? new Date(order.delivered_date).toLocaleDateString("id-ID") : ""}`}
              </p>
            </div>
          </div>

          {/* Progress Tracker */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "#5A4A3E" }}>Tracking Pesanan</p>
            <div className="space-y-3">
              {stepLabels.map((label, i) => {
                const done = sc.steps[i];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{ background: done ? (i === sc.steps.filter(Boolean).length - 1 ? sc.color : "#8B6F47") : "#E8E1DA" }}
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      >
                        {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      </motion.div>
                      {i < stepLabels.length - 1 && (
                        <div className="w-0.5 h-6 mt-1" style={{ background: sc.steps[i + 1] ? "#8B6F47" : "#E8E1DA" }} />
                      )}
                    </div>
                    <p className="text-sm pb-5" style={{ color: done ? "#3D2B1F" : "#B8A898", fontWeight: done ? 500 : 400 }}>{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Item Info */}
          <div className="p-4 rounded-xl" style={{ background: "#FAF8F5", border: "1px solid rgba(212,184,139,0.2)" }}>
            <div className="flex gap-3 items-center">
              <div 
                className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-stone-50 flex items-center justify-center border border-stone-100 ${order.bg_color?.startsWith("data:image") ? "cursor-zoom-in hover:opacity-90" : ""}`}
                style={{ background: order.bg_color?.startsWith("data:image") ? undefined : order.bg_color }}
                onClick={() => {
                  if (order.bg_color?.startsWith("data:image")) {
                    onViewFullPreview(order.bg_color, order.item);
                  }
                }}
              >
                {order.bg_color?.startsWith("data:image") ? (
                  <img src={order.bg_color} alt={order.item} className="w-full h-full object-cover" />
                ) : (
                  <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color} type={order.type} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "#3D2B1F" }}>{order.item}</p>
                <p className="text-xs" style={{ color: "#A89B8F" }}>
                  {order.quantity ? `Qty: ${order.quantity}` : ""} · Pengrajin: {order.artisan}
                </p>
              </div>
            </div>
            {order.bg_color?.startsWith("data:image") && (
              <button
                onClick={() => onViewFullPreview(order.bg_color, order.item)}
                className="mt-3 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:bg-[rgba(139,111,71,0.12)]"
                style={{ 
                  background: "rgba(139, 111, 71, 0.08)", 
                  color: "#8B6F47",
                  border: "1px dashed rgba(139, 111, 71, 0.3)" 
                }}
              >
                Lihat Preview Penuh (Custom)
              </button>
            )}
          </div>

          {/* Payment Info */}
          <div className="p-4 rounded-xl space-y-2" style={{ background: "#FAF8F5", border: "1px solid rgba(212,184,139,0.2)" }}>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#5A4A3E" }}><CreditCard className="w-4 h-4" />Info Pembayaran</p>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#7A6B5E" }}>Metode</span>
              <span style={{ color: "#3D2B1F" }}>{paymentMethodLabel[order.payment_method || ""] || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#7A6B5E" }}>Status Bayar</span>
              <span className={`font-semibold ${order.payment_status === "paid" ? "text-green-600" : order.payment_status === "failed" ? "text-red-500" : "text-amber-600"}`}>
                {order.payment_status === "paid" ? "✓ Lunas" : order.payment_status === "failed" ? "✗ Gagal" : "⏳ Menunggu Pembayaran"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
              <span style={{ color: "#5A4A3E" }}>Total Bayar</span>
              <span style={{ color: "#8B6F47" }}>Rp {order.total.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="p-4 rounded-xl" style={{ background: "#FAF8F5", border: "1px solid rgba(212,184,139,0.2)" }}>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#5A4A3E" }}><MapPin className="w-4 h-4" />Alamat Pengiriman</p>
              <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{order.shipping_address.name} · {order.shipping_address.phone}</p>
              <p className="text-sm" style={{ color: "#7A6B5E" }}>
                {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
              </p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="p-4 rounded-xl" style={{ background: "rgba(212,184,139,0.08)", border: "1px solid rgba(212,184,139,0.2)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#A89B8F" }}>Catatan Pesanan</p>
              <p className="text-sm italic" style={{ color: "#7A6B5E" }}>{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {order.status === "shipping" && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={confirming}
                onClick={async () => { setConfirming(true); await onConfirmReceived(order.id); setConfirming(false); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Konfirmasi Terima</>}
              </motion.button>
            )}
            {order.status === "delivered" && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={buyingAgain}
                onClick={async () => { setBuyingAgain(true); await onBuyAgain(order); setBuyingAgain(false); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
              >
                {buyingAgain ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4" />Beli Lagi</>}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Image Lightbox ─────────────────────────────────────────────────────────
function ImageLightbox({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `${title.replace(/\s+/g, "_")}_preview.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Gambar preview berhasil diunduh!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4"
      style={{ background: "rgba(15, 10, 8, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-4 text-white">
          <div>
            <h4 className="font-bold text-lg" style={{ color: "#FAF8F5", fontFamily: "'Playfair Display', serif" }}>Preview {title}</h4>
            <p className="text-xs text-stone-400">Desain Batik Kustom Anda</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 rounded-xl transition-all hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-1.5 border border-stone-700 bg-stone-900/50"
              title="Unduh Gambar"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Unduh</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors border border-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="w-full bg-[#FAF8F5] rounded-3xl p-5 md:p-8 overflow-hidden flex items-center justify-center border" style={{ borderColor: "rgba(212,184,139,0.2)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
          <img src={src} alt={title} className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-md" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus>("all");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleConfirmReceived = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders")
        .update({ status: "delivered", delivered_date: new Date().toISOString() })
        .eq("id", orderId).eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Pesanan dikonfirmasi diterima!");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "delivered", delivered_date: new Date().toISOString() } : o));
    } catch {
      toast.error("Gagal mengkonfirmasi pesanan");
    }
  };

  const handleBuyAgain = async (order: Order) => {
    try {
      // Find the batik_item by name in the catalog and add to cart
      const { data: items, error } = await supabase.from("batik_items").select("id").eq("name", order.item).limit(1);
      if (error || !items?.length) {
        toast.error("Produk tidak ditemukan di katalog");
        return;
      }
      const batikId = items[0].id;
      const { error: cartError } = await supabase.from("cart_items").insert([{
        user_id: user!.id,
        batik_id: batikId,
        quantity: order.quantity || 1,
      }]);
      if (cartError) throw cartError;
      toast.success("Barang ditambahkan ke keranjang!");
      navigate("/cart");
    } catch {
      toast.error("Gagal menambahkan ke keranjang");
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchSearch = !searchId || o.id.toLowerCase().includes(searchId.toLowerCase()) || o.item.toLowerCase().includes(searchId.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCounts = {
    all: orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    shipping:  orders.filter(o => o.status === "shipping").length,
    processing: orders.filter(o => o.status === "processing").length,
  };

  const totalSpent = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);

  const FILTER_TABS: { key: OrderStatus; label: string; icon: any; color: string }[] = [
    { key: "all", label: "Semua", icon: Package, color: "#8B6F47" },
    { key: "processing", label: "Diproses", icon: Clock, color: "#D97706" },
    { key: "shipping", label: "Dikirim", icon: Truck, color: "#3B82F6" },
    { key: "delivered", label: "Selesai", icon: CheckCircle, color: "#16A34A" },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="mega" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,184,139,0.08) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 sm:px-6 py-10 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-10">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, marginBottom: "0.4rem" }}>
              Pesanan Saya
            </h1>
            <p style={{ color: "#7A6B5E" }}>Lacak dan kelola semua pesanan batik Anda</p>
          </div>
          <Link to="/catalog"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", boxShadow: "0 4px 16px rgba(139,111,71,0.25)" }}
          >
            <Plus className="w-4 h-4" /> Pesan Baru
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Pesanan", value: orders.length, icon: Package, color: "#8B6F47" },
            { label: "Terkirim", value: statusCounts.delivered, icon: CheckCircle, color: "#16A34A" },
            { label: "Dalam Pengiriman", value: statusCounts.shipping, icon: Truck, color: "#3B82F6" },
            { label: "Total Belanja", value: `Rp ${totalSpent.toLocaleString("id-ID")}`, icon: Star, color: "#D4B88B" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="p-4 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#A89B8F" }}>{s.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: "#3D2B1F" }}>{s.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search + Filter */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
            <input
              type="text" value={searchId} onChange={e => setSearchId(e.target.value)}
              placeholder="Cari nomor pesanan atau nama produk..."
              className="w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm"
              style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FFFFFF", color: "#3D2B1F" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              const active = filterStatus === tab.key;
              return (
                <motion.button key={tab.key} whileTap={{ scale: 0.97 }}
                  onClick={() => setFilterStatus(tab.key)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? tab.color : "rgba(255,255,255,0.9)",
                    color: active ? "#FFFFFF" : "#7A6B5E",
                    border: active ? "none" : "1px solid rgba(212,184,139,0.25)",
                    boxShadow: active ? `0 4px 12px ${tab.color}40` : "none"
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: active ? "rgba(255,255,255,0.25)" : "rgba(139,111,71,0.1)", color: active ? "#fff" : "#8B6F47" }}>
                    {statusCounts[tab.key]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white"
            style={{ border: "1px solid rgba(212,184,139,0.2)" }}
          >
            <div className="w-20 h-20 mb-5 rounded-full flex items-center justify-center" style={{ background: "rgba(139,111,71,0.08)" }}>
              <ShoppingBag className="w-9 h-9" style={{ color: "#8B6F47" }} />
            </div>
            <h3 className="text-lg font-semibold mb-1.5" style={{ color: "#3D2B1F" }}>
              {searchId || filterStatus !== "all" ? "Tidak Ada Pesanan Ditemukan" : "Belum Ada Pesanan"}
            </h3>
            <p className="mb-6 text-center max-w-xs" style={{ color: "#7A6B5E", fontSize: "0.9rem" }}>
              {searchId || filterStatus !== "all" ? "Coba ubah kata kunci atau filter yang digunakan." : "Mulai berbelanja batik pilihan dari pengrajin terbaik!"}
            </p>
            <Link to="/catalog">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-7 py-3 rounded-full font-semibold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}
              >
                Belanja Sekarang
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order, idx) => {
              const sc = statusConfig[order.status];
              const Icon = sc.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white cursor-pointer transition-all group"
                  style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                  onClick={() => setSelectedOrder(order)}
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(61,43,31,0.08)" }}
                >
                  {/* Pattern thumb */}
                  <div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-50 flex items-center justify-center border border-stone-100 ${order.bg_color?.startsWith("data:image") ? "cursor-zoom-in hover:opacity-90" : ""}`}
                    style={{ background: order.bg_color?.startsWith("data:image") ? undefined : order.bg_color }}
                    onClick={(e) => {
                      if (order.bg_color?.startsWith("data:image")) {
                        e.stopPropagation(); // mencegah membuka modal detail order
                        setPreviewImage({ src: order.bg_color, title: order.item });
                      }
                    }}
                  >
                    {order.bg_color?.startsWith("data:image") ? (
                      <img src={order.bg_color} alt={order.item} className="w-full h-full object-cover" />
                    ) : (
                      <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color} type={order.type} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h3 className="font-semibold" style={{ color: "#3D2B1F" }}>{order.item}</h3>
                        <p className="font-mono text-xs mt-0.5" style={{ color: "#A89B8F" }}>{order.id}</p>
                      </div>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        <Icon className="w-3.5 h-3.5" />{sc.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "#A89B8F" }}>
                      <span>{new Date(order.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                      {order.payment_method && <span>{paymentMethodLabel[order.payment_method]}</span>}
                      {order.shipping_address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.shipping_address.city}</span>}
                    </div>

                    {/* Mini progress */}
                    <div className="flex items-center gap-1.5 mt-3">
                      {sc.steps.map((done, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: done ? sc.color : "rgba(212,184,139,0.2)" }} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 w-full sm:w-auto">
                    <span className="font-bold" style={{ color: "#8B6F47" }}>Rp {order.total.toLocaleString("id-ID")}</span>
                    <div className="flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all" style={{ color: "#8B6F47" }}>
                      Detail <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onConfirmReceived={handleConfirmReceived}
            onBuyAgain={handleBuyAgain}
            onViewFullPreview={(src, title) => setPreviewImage({ src, title })}
          />
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {previewImage && (
          <ImageLightbox
            src={previewImage.src}
            title={previewImage.title}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
