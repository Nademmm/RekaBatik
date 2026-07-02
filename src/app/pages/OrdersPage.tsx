import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, Clock, CheckCircle, Truck, Plus, Search, Star, ChevronRight,
  ShoppingBag, MapPin, CreditCard, RotateCcw, X, Loader2, CheckCircle2,
  AlertCircle, ShoppingCart, Download, MessageCircle, Wallet, Calendar,
  BanknoteIcon, Copy,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { resolveCatalogImageUrl } from "../constants/batikCatalog";
import { Order } from "../../types/database";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "sonner";

type OrderStatus = "all" | "unpaid" | "paid" | "delivered" | "shipping" | "processing";

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
  negotiating:{ label: "Negosiasi Harga", icon: MessageCircle, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.25)", steps: [true, false, false, false] },
  cancelled:  { label: "Dibatalkan", icon: X, color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.25)", steps: [false, false, false, false] },
};

const stepLabels = ["Pesanan Diterima", "Pengrajin Membatik", "Siap Kirim", "Terkirim"];

const SHIPPING_COST = 20000;
const SERVICE_FEE = 1000;

const paymentMethodLabel: Record<string, React.ReactNode> = {
  transfer_bca: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" className="h-4 object-contain inline-block" /> Transfer BCA</span>,
  transfer_mandiri: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" alt="Mandiri" className="h-3.5 object-contain inline-block" /> Transfer Mandiri</span>,
  gopay: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="GoPay" className="h-4 object-contain inline-block" /> GoPay</span>,
  ovo: <span className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" alt="OVO" className="h-4 object-contain inline-block" /> OVO</span>,
  cod: <span className="flex items-center gap-2"><Package className="w-4 h-4 text-[#5A3D2B] inline-block" /> Bayar di Tempat (COD)</span>,
};

// ─── Payment Timer (Countdown 24 Jam) ───────────────────────────────────────
function PaymentTimer({ orderDate }: { orderDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const limit = new Date(orderDate).getTime() + 24 * 60 * 60 * 1000;
      const diff = limit - Date.now();
      if (diff <= 0) {
        setTimeLeft("Batas waktu habis");
        setIsExpired(true);
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`Sisa: ${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [orderDate]);

  return (
    <span className={`text-[10px] font-bold ${isExpired ? "text-red-500 bg-red-50 border-red-200" : "text-amber-600 bg-amber-50 border-amber-200"} px-2.5 py-1 rounded-xl border inline-flex items-center gap-1`}>
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}

// ─── Review Modal (Sistem Rating/Ulasan) ────────────────────────────────────
function ReviewModal({ order, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (orderId: string, rating: number, comment: string) => Promise<void> }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(order.id, rating, comment.trim());
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 border-b pb-4">
          <div>
            <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Berikan Ulasan</h3>
            <p className="text-xs" style={{ color: "#A89B8F" }}>Bagikan pengalaman Anda membeli {order.item}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full">
            <X className="w-5 h-5" style={{ color: "#7A6B5E" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Select */}
          <div className="flex flex-col items-center gap-2 py-2.5 bg-[#FAF8F5] rounded-2xl border border-stone-100">
            <p className="text-xs font-semibold" style={{ color: "#5A4A3E" }}>Nilai Kualitas Produk & Layanan</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none cursor-pointer"
                >
                  <Star
                    className="w-8 h-8 transition-colors"
                    style={{
                      color: star <= (hoverRating || rating) ? "#F59E0B" : "#E5E7EB",
                      fill: star <= (hoverRating || rating) ? "#F59E0B" : "transparent"
                    }}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold" style={{ color: "#8B6F47" }}>
              {rating === 1 && "Sangat Buruk 😞"}
              {rating === 2 && "Buruk 🙁"}
              {rating === 3 && "Cukup Baik 😐"}
              {rating === 4 && "Sangat Baik 🙂"}
              {rating === 5 && "Sempurna! 😍"}
            </p>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#5A4A3E" }}>Tulis Komentar (opsional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ceritakan kepuasan Anda terhadap motif batik, bahan kain, dan respon pengrajin..."
              rows={4}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
              style={{ border: "2px solid rgba(139,111,71,0.15)", background: "#FAFAF8", color: "#3D2B1F" }}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Ulasan"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Payment Modal ──────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onPaid }: { order: Order; onClose: () => void; onPaid: (orderId: string, method: string) => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = Math.max(0, order.total - SHIPPING_COST - SERVICE_FEE);

  const methods = [
    { key: "transfer_bca", label: "Transfer BCA", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" className="h-5 object-contain" />, detail: "1234567890 a/n RekaBatik", color: "#0056A0" },
    { key: "transfer_mandiri", label: "Transfer Mandiri", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" alt="Mandiri" className="h-4 object-contain" />, detail: "9876543210 a/n RekaBatik", color: "#003087" },
    { key: "gopay", label: "GoPay", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="GoPay" className="h-5 object-contain" />, detail: "081234567890", color: "#00AED6" },
    { key: "ovo", label: "OVO", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" alt="OVO" className="h-5 object-contain" />, detail: "081234567890", color: "#4C3494" },
    { key: "cod", label: "Bayar di Tempat (COD)", icon: <Package className="w-5 h-5" style={{ color: "#5A3D2B" }} />, detail: "Bayar saat barang diterima", color: "#5A3D2B" },
  ];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.96 }}
        className="bg-white rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ boxShadow: "0 -20px 60px rgba(61,43,31,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-4 z-10" style={{ borderBottom: "1px solid rgba(212,184,139,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Metode Pembayaran</h3>
              <p className="text-[10px] mt-0.5" style={{ color: "#A89B8F" }}>Pesanan: <span className="font-mono text-[9px]">{order.id}</span></p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full">
              <X className="w-5 h-5" style={{ color: "#7A6B5E" }} />
            </button>
          </div>
          
          {/* Ringkasan Biaya di Modal Pembayaran */}
          <div className="mt-4 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-100 space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-stone-400">Subtotal ({order.quantity || 1}x)</span>
              <span className="text-stone-600 font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-stone-400">Biaya Pengiriman</span>
              <span className="text-stone-600 font-medium">Rp {SHIPPING_COST.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-stone-400">Biaya Layanan</span>
              <span className="text-stone-600 font-medium">Rp {SERVICE_FEE.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-stone-200">
              <span className="text-xs font-bold text-stone-700">Total Bayar</span>
              <span className="text-sm font-bold text-[#8B6F47]">Rp {order.total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {methods.map(m => (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left"
              style={{
                border: `2px solid ${selected === m.key ? m.color : "rgba(212,184,139,0.2)"}`,
                background: selected === m.key ? `${m.color}08` : "#FAFAF8",
                boxShadow: selected === m.key ? `0 0 0 4px ${m.color}12` : "none",
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${m.color}15` }}>
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "#3D2B1F" }}>{m.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#A89B8F" }}>{m.detail}</p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: selected === m.key ? m.color : "rgba(212,184,139,0.4)" }}
              >
                {selected === m.key && <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />}
              </div>
            </button>
          ))}

          <button
            disabled={!selected || loading}
            onClick={async () => {
              if (!selected) return;
              setLoading(true);
              await onPaid(order.id, selected);
              setLoading(false);
              onClose();
            }}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #8B6F47 100%)", boxShadow: "0 4px 20px rgba(61,43,31,0.3)" }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Wallet className="w-4 h-4" />Konfirmasi Pembayaran</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Order Detail Modal ─────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onConfirmReceived, onBuyAgain, onViewFullPreview, onPay, onReview }: {
  order: Order;
  onClose: () => void;
  onConfirmReceived: (id: string) => void;
  onBuyAgain: (order: Order) => Promise<void>;
  onViewFullPreview: (src: string, title: string) => void;
  onPay: (order: Order) => void;
  onReview?: (order: Order) => void;
}) {
  const displayImage = order.bg_color ? resolveCatalogImageUrl(order.bg_color) : null;
  const isImage = !!(displayImage && !displayImage.startsWith("#"));

  const sc = (statusConfig as any)[order.status] || statusConfig.processing;
  const [confirming, setConfirming] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState(false);
  const navigate = useNavigate();

  const isExpired = order.payment_status === "pending" && order.status !== "cancelled" && new Date(order.date).getTime() + 86400000 < Date.now();
  const isUnpaid = order.payment_status === "pending" && order.total > 0 && order.status !== "negotiating" && order.status !== "cancelled" && !isExpired;

  const subtotal = Math.max(0, order.total - SHIPPING_COST - SERVICE_FEE);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
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
        className="bg-white rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 bg-white rounded-t-3xl z-10 border-b" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
          <div className="min-w-0 pr-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B6F47]/10 flex items-center justify-center text-[#8B6F47] flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono font-bold text-xs truncate" style={{ color: "#3D2B1F" }}>{order.id}</p>
              <p className="text-[9px] font-medium" style={{ color: "#A89B8F" }}>{new Date(order.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full flex-shrink-0"><X className="w-5 h-5" style={{ color: "#7A6B5E" }} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Pay Now / Expired Banners (Compact) */}
          {(isUnpaid || isExpired) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl flex items-center gap-3"
              style={{ 
                background: isUnpaid ? "linear-gradient(135deg, #FFF7ED, #FFFBF5)" : "linear-gradient(135deg, #FEF2F2, #FFF5F5)", 
                border: `1.5px solid ${isUnpaid ? "rgba(217,119,6,0.2)" : "rgba(239,68,68,0.2)"}` 
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isUnpaid ? "rgba(217,119,6,0.1)" : "rgba(239,68,68,0.1)" }}>
                {isUnpaid ? <BanknoteIcon className="w-4 h-4 text-[#D97706]" /> : <AlertCircle className="w-4 h-4 text-[#EF4444]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: isUnpaid ? "#92400E" : "#991B1B" }}>
                  {isUnpaid ? "Menunggu Pembayaran" : "Waktu Bayar Habis"}
                </p>
                {isUnpaid && <PaymentTimer orderDate={order.date} />}
              </div>
              {isUnpaid && (
                <button
                  onClick={() => { onClose(); onPay(order); }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}
                >
                  Bayar
                </button>
              )}
            </motion.div>
          )}

          {/* Compact Info Card: Item + Status */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-100">
            <div className="flex gap-3.5 items-start">
              <div
                className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-50 flex items-center justify-center border border-stone-200 ${isImage ? "cursor-zoom-in hover:opacity-90" : ""}`}
                style={{ background: isImage ? undefined : order.bg_color }}
                onClick={() => { if (isImage && displayImage) onViewFullPreview(displayImage, order.item); }}
              >
                {isImage && displayImage ? (
                  <img src={displayImage} alt={order.item} className="w-full h-full object-cover" />
                ) : (
                  <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color || "#FAF8F5"} type={order.type} />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1"
                    style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                    <sc.icon className="w-2.5 h-2.5" /> {sc.label}
                  </span>
                  <span className="text-[10px] font-bold text-[#8B6F47]">Rp {order.total.toLocaleString("id-ID")}</span>
                </div>
                <h4 className="font-bold text-sm text-[#3D2B1F] truncate">{order.item}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-500 font-medium">{order.quantity || 1}x Item</span>
                  <span className="text-[9px] text-stone-400 truncate">· {order.artisan}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Summary */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] flex items-center gap-1.5 px-1">
                <CreditCard className="w-3 h-3" /> Pembayaran
              </p>
              <div className="p-3.5 rounded-xl bg-white border border-stone-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-stone-400">Metode</span>
                  <span className="font-semibold text-stone-700 truncate ml-2 text-right">{paymentMethodLabel[order.payment_method || ""] || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-stone-400">Subtotal</span>
                  <span className="text-stone-600">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-stone-400">Biaya Pengiriman</span>
                  <span className="text-stone-600">Rp {SHIPPING_COST.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-stone-400">Biaya Layanan</span>
                  <span className="text-stone-600">Rp {SERVICE_FEE.toLocaleString("id-ID")}</span>
                </div>
                <div className="pt-2 mt-1 border-t border-stone-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-700">Total</span>
                  <span className="text-xs font-bold text-[#8B6F47]">Rp {order.total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Shipping Summary */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] flex items-center gap-1.5 px-1">
                <MapPin className="w-3 h-3" /> Pengiriman
              </p>
              <div className="p-3.5 rounded-xl bg-white border border-stone-100 shadow-sm min-h-[105px] flex flex-col justify-center">
                {order.shipping_address ? (
                  <>
                    <p className="text-[10px] font-bold text-stone-700 truncate">{order.shipping_address.name}</p>
                    <p className="text-[9px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {order.shipping_address.street}, {order.shipping_address.city}
                    </p>
                    {order.tracking_number && (
                      <div className="mt-2 pt-2 border-t border-stone-50 flex justify-between items-center">
                        <span className="text-[8px] text-blue-500 font-bold uppercase">{order.courier}</span>
                        <span className="text-[9px] font-mono font-bold text-blue-600 truncate max-w-[80px] text-right">{order.tracking_number}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-stone-400 italic text-center">Belum diatur</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons (Compact) */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => { onClose(); navigate("/chat"); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px]"
              style={{ border: "1.5px solid rgba(139,111,71,0.2)", color: "#8B6F47", background: "rgba(139,111,71,0.03)" }}
            >
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </button>

            {order.status === "delivered" && order.can_review && !order.reviewed ? (
              <button
                onClick={() => { onClose(); onReview?.(order); }}
                className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px] text-white"
                style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)" }}
              >
                <Star className="w-3.5 h-3.5 fill-white" /> Ulasan
              </button>
            ) : order.status === "shipping" ? (
              <button
                onClick={() => { onClose(); onConfirmReceived(order.id); }}
                className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px] text-white"
                style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi
              </button>
            ) : (
              <button
                onClick={async () => { await onBuyAgain(order); onClose(); }}
                className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px] text-white"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Beli Lagi
              </button>
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
      <div className="relative w-full sm:max-w-2xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <div className="w-full flex items-center justify-between mb-4 text-white">
          <div className="min-w-0 pr-4">
            <h4 className="font-bold text-sm sm:text-lg truncate" style={{ color: "#FAF8F5", fontFamily: "'Playfair Display', serif" }}>Preview {title}</h4>
            <p className="text-[10px] sm:text-xs text-stone-400">Desain Batik Kustom Anda</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownload} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-200 flex items-center gap-1.5 border border-stone-700 bg-stone-900/50">
              <Download className="w-3.5 h-3.5 sm:w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Unduh</span>
            </button>
            <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full text-stone-400 border border-stone-800">
              <X className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="w-full bg-[#FAF8F5] rounded-2xl sm:rounded-3xl p-3 sm:p-8 overflow-hidden flex items-center justify-center border" style={{ borderColor: "rgba(212,184,139,0.2)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
          <img src={src} alt={title} className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain rounded-xl sm:rounded-2xl shadow-md" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Confirm Received Dialog ───────────────────────────────────────────────
function ConfirmReceivedDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full sm:max-w-md p-5 sm:p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}>
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Konfirmasi Penerimaan</h3>
          <p className="text-sm mt-2" style={{ color: "#7A6B5E" }}>
            Apakah Anda yakin barang ini telah sampai dengan baik dan ingin menyelesaikan pesanan?
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ border: "1.5px solid rgba(139,111,71,0.3)", color: "#8B6F47", background: "rgba(139,111,71,0.04)" }}
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Konfirmasi"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getStatusProperties(order: Order, isExpired: boolean, isUnpaid: boolean) {
  if (isExpired) {
    return {
      label: "Batal (Waktu Habis)",
      bg: "rgba(239, 68, 68, 0.08)",
      text: "#EF4444",
      border: "rgba(239, 68, 68, 0.2)",
      icon: X
    };
  }
  if (order.payment_status === "awaiting_verification") {
    return {
      label: "Verifikasi",
      bg: "rgba(245, 158, 11, 0.08)",
      text: "#D97706",
      border: "rgba(245, 158, 11, 0.2)",
      icon: Clock
    };
  }
  if (isUnpaid) {
    return {
      label: "Belum Bayar",
      bg: "rgba(249, 115, 22, 0.08)",
      text: "#EA580C",
      border: "rgba(249, 115, 22, 0.2)",
      icon: AlertCircle
    };
  }

  const sc = (statusConfig as any)[order.status] || statusConfig.processing;
  return {
    label: sc.label,
    bg: sc.bg,
    text: sc.color,
    border: sc.border,
    icon: sc.icon
  };
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus>("all");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [confirmingReceived, setConfirmingReceived] = useState<string | null>(null);

  const copyToClipboard = (text: string, label = "Teks") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin! 📋`);
  };

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

  useEffect(() => {
    if (location.state?.openPaymentFor && orders.length > 0) {
      const order = orders.find(o => o.id === location.state.openPaymentFor);
      if (order && order.payment_status === "pending" && order.status !== "cancelled") {
        setPayingOrder(order);
        // Clear history state to avoid reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, orders, navigate]);

  const handleConfirmReceived = async (orderId: string): Promise<void> => {
    try {
      const { error } = await supabase.from("orders")
        .update({ status: "delivered", delivered_date: new Date().toISOString(), can_review: true })
        .eq("id", orderId).eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Pesanan dikonfirmasi diterima! Silakan berikan ulasan Anda. 🎉");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "delivered", delivered_date: new Date().toISOString(), can_review: true } : o));
    } catch { 
      toast.error("Gagal mengkonfirmasi pesanan"); 
    }
  };

  const handleBuyAgain = async (order: Order) => {
    try {
      if (order.type === "custom") {
        const customDesignId = (order as any).custom_design_id;
        if (!customDesignId) {
          toast.info("Untuk pesanan kustom, silakan buat desain baru di Studio Batik");
          navigate("/custom");
          return;
        }
        const { error: cartError } = await supabase.from("cart_items").insert([{
          user_id: user!.id,
          custom_design_id: customDesignId,
          quantity: order.quantity || 1,
        }]);
        if (cartError) throw cartError;
        toast.success("Desain kustom ditambahkan ke keranjang! 🎉");
        navigate("/cart");
        return;
      }

      const { data: items, error } = await supabase.from("batik_items").select("id").eq("name", order.item).limit(1);
      if (error || !items?.length) { toast.error("Produk tidak ditemukan di katalog"); return; }
      const batikId = items[0].id;
      const { error: cartError } = await supabase.from("cart_items").insert([{
        user_id: user!.id,
        batik_id: batikId,
        quantity: order.quantity || 1,
      }]);
      if (cartError) throw cartError;
      toast.success("Barang ditambahkan ke keranjang!");
      navigate("/cart");
    } catch { toast.error("Gagal menambahkan ke keranjang"); }
  };

  const handlePaid = async (orderId: string, method: string) => {
    try {
      const paymentMethod = method as Order["payment_method"];
      const targetOrder = orders.find(o => o.id === orderId);
      const needsAdminVerification = targetOrder?.type === "custom";
      const nextPaymentStatus = needsAdminVerification ? "awaiting_verification" : "paid";
      const { error } = await supabase.from("orders")
        .update({ payment_status: nextPaymentStatus, payment_method: paymentMethod })
        .eq("id", orderId).eq("user_id", user!.id);
      if (error) throw error;
      toast.success(
        needsAdminVerification
          ? "Konfirmasi pembayaran terkirim! Menunggu verifikasi admin. 🎉"
          : "Pembayaran berhasil dikonfirmasi. Pesanan langsung diproses. 🎉"
      );
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: nextPaymentStatus, payment_method: paymentMethod } : o));
    } catch { toast.error("Gagal mengirim konfirmasi pembayaran"); }
  };

  const handleReviewSubmit = async (orderId: string, rating: number, comment: string) => {
    try {
      const { error } = await supabase.from("orders")
        .update({
          reviewed: true,
          review_rating: rating,
          review_comment: comment
        })
        .eq("id", orderId).eq("user_id", user!.id);
      
      if (error) throw error;
      toast.success("Terima kasih atas ulasan Anda! ❤️");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, reviewed: true, review_rating: rating, review_comment: comment } : o));
    } catch {
      toast.error("Gagal mengirim ulasan");
    }
  };

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch = !searchId || o.id.toLowerCase().includes(searchId.toLowerCase()) || o.item.toLowerCase().includes(searchId.toLowerCase());
    let matchStatus = true;
    if (filterStatus === "unpaid") matchStatus = o.payment_status === "pending" && o.total > 0 && o.status !== "negotiating" && o.status !== "cancelled";
    else if (filterStatus === "paid") matchStatus = o.payment_status === "paid";
    else if (filterStatus !== "all") matchStatus = o.status === filterStatus;
    return matchStatus && matchSearch;
  });

  const counts = {
    all: orders.length,
    unpaid: orders.filter(o => o.payment_status === "pending" && o.total > 0 && o.status !== "negotiating" && o.status !== "cancelled").length,
    paid: orders.filter(o => o.payment_status === "paid").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipping: orders.filter(o => o.status === "shipping").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const totalSpent = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);

  const FILTER_TABS: { key: OrderStatus; label: string; icon: any; color: string }[] = [
    { key: "all",        label: "Semua",        icon: Package,         color: "#8B6F47" },
    { key: "unpaid",     label: "Belum Dibayar", icon: AlertCircle,    color: "#EF4444" },
    { key: "paid",       label: "Sudah Dibayar", icon: CheckCircle2,   color: "#16A34A" },
    { key: "processing", label: "Diproses",      icon: Clock,          color: "#D97706" },
    { key: "shipping",   label: "Dikirim",       icon: Truck,          color: "#3B82F6" },
    { key: "delivered",  label: "Selesai",       icon: CheckCircle,    color: "#16A34A" },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#FAF8F5" }}>
      <Toaster position="top-right" richColors />
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
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm w-full sm:w-auto"
            style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", boxShadow: "0 4px 16px rgba(139,111,71,0.25)" }}
          >
            <Plus className="w-4 h-4" /> Pesan Baru
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          {[
            { label: "Total Pesanan", value: orders.length, icon: Package, color: "#8B6F47" },
            { label: "Belum Dibayar", value: counts.unpaid, icon: AlertCircle, color: "#EF4444" },
            { label: "Sudah Dibayar", value: counts.paid, icon: CheckCircle2, color: "#16A34A" },
            { label: "Total Belanja", value: `Rp ${totalSpent.toLocaleString("id-ID")}`, icon: Star, color: "#D4B88B" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="p-3 sm:p-4 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium truncate" style={{ color: "#A89B8F" }}>{s.label}</span>
                </div>
                <p className="text-sm sm:text-xl font-bold truncate" style={{ color: "#3D2B1F" }}>{s.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search + Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="mb-6 space-y-4 max-w-full"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
            <input
              type="text" value={searchId} onChange={e => setSearchId(e.target.value)}
              placeholder="Cari nomor pesanan atau nama produk..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none text-sm transition-all focus:ring-2 focus:ring-[#8B6F47]/20"
              style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FFFFFF", color: "#3D2B1F" }}
            />
          </div>
          
          <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide px-4 sm:px-0 -mx-4 sm:mx-0">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              const active = filterStatus === tab.key;
              const count = (counts as any)[tab.key] ?? 0;
              return (
                <button key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap"
                  style={{
                    background: active ? tab.color : "rgba(255,255,255,0.9)",
                    color: active ? "#FFFFFF" : "#7A6B5E",
                    border: active ? "none" : "1px solid rgba(212,184,139,0.25)",
                    boxShadow: active ? `0 4px 12px ${tab.color}40` : "none"
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full" style={{ background: active ? "rgba(255,255,255,0.25)" : "rgba(139,111,71,0.1)", color: active ? "#fff" : "#8B6F47" }}>
                    {count}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 sm:h-64 w-full rounded-2xl" />)}
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
              <button
                className="px-7 py-3 rounded-full font-semibold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}
              >
                Belanja Sekarang
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
            {filtered.map((order, idx) => {
              const displayImage = order.bg_color ? resolveCatalogImageUrl(order.bg_color) : null;
              const isImage = !!(displayImage && !displayImage.startsWith("#"));

              const isExpired = order.payment_status === "pending" && order.status !== "cancelled" && new Date(order.date).getTime() + 86400000 < Date.now();
              const isUnpaid = order.payment_status === "pending" && order.total > 0 && order.status !== "negotiating" && order.status !== "cancelled" && !isExpired;

              // Determine status badge properties
              const badge = getStatusProperties(order, isExpired, isUnpaid);
              const StatusIcon = badge.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedOrder(order)}
                  whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(61,43,31,0.06)" }}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-stone-100 hover:border-amber-900/10 cursor-pointer overflow-hidden transition-all duration-300 flex flex-col min-w-0"
                  style={{
                    boxShadow: "0 4px 20px rgba(61,43,31,0.02)",
                  }}
                >
                  {/* Card Header: Shop details and Status badge */}
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 bg-stone-50/50 border-b border-stone-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#8B6F47]/10 flex items-center justify-center text-[#8B6F47] flex-shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] sm:text-sm font-bold text-[#3D2B1F] truncate">{order.artisan}</h4>
                        <p className="text-[9px] sm:text-[10px] text-[#A89B8F]">
                          {new Date(order.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold border flex items-center gap-1"
                        style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}>
                        <StatusIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate max-w-[60px] xs:max-w-none">{badge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 sm:p-6 flex flex-col gap-3 sm:gap-5 items-start">
                    {/* Image / Canvas Thumbnail */}
                    <div
                      className={`relative w-full aspect-[4/3] sm:aspect-square lg:aspect-video rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-stone-100 bg-stone-50/80 group/thumb ${isImage ? "cursor-zoom-in hover:opacity-90" : ""}`}
                      onClick={(e) => {
                        if (isImage && displayImage) {
                          e.stopPropagation();
                          setPreviewImage({ src: displayImage, title: order.item });
                        }
                      }}
                    >
                      {isImage && displayImage ? (
                        <>
                          <img src={displayImage} alt={order.item} className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Search className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color || "#FAF8F5"} type={order.type} />
                      )}
                    </div>

                    {/* Middle details */}
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="font-bold text-xs sm:text-base text-[#3D2B1F] leading-tight truncate sm:whitespace-normal">{order.item}</h3>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-[#5A4A3E]">
                            {order.quantity || 1}x
                          </span>
                          <span className="font-bold text-[11px] sm:text-base text-[#8B6F47]">
                            {order.total > 0 ? `Rp ${order.total.toLocaleString("id-ID")}` : "Nego"}
                          </span>
                        </div>
                      </div>

                      {/* Info tambahan (city/method) - Visible on larger screens or adjusted for grid */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 sm:mt-3 border-t border-stone-50 pt-2.5">
                        {order.shipping_address?.city && (
                          <span className="flex items-center gap-1 text-[9px] sm:text-[11px] text-[#A89B8F]">
                            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8B6F47]" />
                            <span className="truncate max-w-[80px] sm:max-w-none">{order.shipping_address.city}</span>
                          </span>
                        )}
                        {order.payment_method && (
                          <span className="flex items-center gap-1 text-[9px] sm:text-[11px] text-[#A89B8F]">
                            <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8B6F47]" />
                            <span className="truncate max-w-[80px] sm:max-w-none">{paymentMethodLabel[order.payment_method] || order.payment_method.replace("transfer_", "").toUpperCase()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer - Simplified for Grid */}
                  <div className="mt-auto px-3 py-3 bg-stone-50/30 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="flex-1 py-1.5 sm:py-2 border border-stone-200 text-[#7A6B5E] text-[10px] sm:text-xs font-bold rounded-lg"
                    >
                      Detail
                    </button>
                    {isUnpaid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayingOrder(order);
                        }}
                        className="flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold text-white shadow-sm"
                        style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}
                      >
                        Bayar
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onConfirmReceived={(orderId) => setConfirmingReceived(orderId)}
            onBuyAgain={handleBuyAgain}
            onViewFullPreview={(src, title) => setPreviewImage({ src, title })}
            onPay={(o) => { setSelectedOrder(null); setPayingOrder(o); }}
            onReview={(o) => setReviewingOrder(o)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {payingOrder && (
          <PaymentModal
            order={payingOrder}
            onClose={() => setPayingOrder(null)}
            onPaid={handlePaid}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reviewingOrder && (
          <ReviewModal
            order={reviewingOrder}
            onClose={() => setReviewingOrder(null)}
            onSubmit={handleReviewSubmit}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {previewImage && (
          <ImageLightbox
            src={previewImage.src}
            title={previewImage.title}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmingReceived && (
          <ConfirmReceivedDialog
            onConfirm={async () => {
              await handleConfirmReceived(confirmingReceived);
              setConfirmingReceived(null);
            }}
            onCancel={() => setConfirmingReceived(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
