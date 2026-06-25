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
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
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
                  className="p-1 focus:outline-none transition-transform active:scale-95 cursor-pointer"
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
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Ulasan"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Payment Modal ──────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onPaid }: { order: Order; onClose: () => void; onPaid: (orderId: string, method: string) => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.96 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 -20px 60px rgba(61,43,31,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl flex items-center justify-between px-6 py-4 z-10" style={{ borderBottom: "1px solid rgba(212,184,139,0.2)" }}>
          <div>
            <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pilih Metode Pembayaran</h3>
            <p className="text-xs mt-0.5" style={{ color: "#A89B8F" }}>Total: <strong style={{ color: "#8B6F47", fontSize: "0.95rem" }}>Rp {order.total.toLocaleString("id-ID")}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" style={{ color: "#7A6B5E" }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {methods.map(m => (
            <motion.button
              key={m.key}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(m.key)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left"
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
            </motion.button>
          ))}

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
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
          </motion.button>
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
  const sc = (statusConfig as any)[order.status] || statusConfig.processing;
  const [confirming, setConfirming] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState(false);
  const navigate = useNavigate();

  const isExpired = order.payment_status === "pending" && order.status !== "cancelled" && new Date(order.date).getTime() + 86400000 < Date.now();
  const isUnpaid = order.payment_status === "pending" && order.total > 0 && order.status !== "negotiating" && order.status !== "cancelled" && !isExpired;

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
          {/* Pay Now Banner (if unpaid) */}
          {isUnpaid && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #FFF7ED, #FFFBF5)", border: "2px solid rgba(217,119,6,0.25)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.12)" }}>
                <BanknoteIcon className="w-5 h-5" style={{ color: "#D97706" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#92400E" }}>Menunggu Pembayaran</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-xs font-semibold" style={{ color: "#B45309" }}>Total: Rp {order.total.toLocaleString("id-ID")}</p>
                  <PaymentTimer orderDate={order.date} />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onClose(); onPay(order); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}
              >
                Bayar Sekarang
              </motion.button>
            </motion.div>
          )}

          {/* Expired Banner */}
          {isExpired && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #FEF2F2, #FFF5F5)", border: "2px solid rgba(239,68,68,0.25)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
                <AlertCircle className="w-5 h-5" style={{ color: "#EF4444" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#991B1B" }}>Batas Waktu Pembayaran Habis</p>
                <p className="text-xs mt-0.5" style={{ color: "#B91C1C" }}>Pesanan ini dibatalkan secara otomatis karena tidak dibayar dalam 24 jam.</p>
              </div>
            </motion.div>
          )}

          {/* Estimated Date (custom orders) */}
          {(order as any).estimated_date && (
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: "#3B82F6" }} />
              <div>
                <p className="text-xs font-medium" style={{ color: "#3B82F6" }}>Estimasi Selesai</p>
                <p className="text-sm font-bold" style={{ color: "#1D4ED8" }}>
                  {new Date((order as any).estimated_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}
          {!(order as any).estimated_date && order.status === "processing" && (
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(156,163,175,0.06)", border: "1px solid rgba(156,163,175,0.2)" }}>
              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Menunggu estimasi dari pengrajin</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
            <sc.icon className="w-5 h-5" style={{ color: sc.color }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: sc.color }}>{sc.label}</p>
              <p className="text-xs" style={{ color: "#7A6B5E" }}>
                {order.status === "processing" && "Pengrajin sedang memproses pesanan Anda"}
                {order.status === "shipping" && "Paket dalam perjalanan menuju Anda"}
                {order.status === "delivered" && `Diterima ${order.delivered_date ? new Date(order.delivered_date).toLocaleDateString("id-ID") : ""}`}
                {order.status === "negotiating" && "Menunggu konfirmasi harga dari pengrajin"}
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
                onClick={() => { if (order.bg_color?.startsWith("data:image")) onViewFullPreview(order.bg_color, order.item); }}
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
              <span className={`font-semibold ${order.payment_status === "paid" ? "text-green-600" : order.payment_status === "awaiting_verification" ? "text-amber-500 animate-pulse font-bold" : order.payment_status === "failed" ? "text-red-500" : "text-amber-600"}`}>
                {order.payment_status === "paid" ? "✓ Lunas" : order.payment_status === "awaiting_verification" ? "⏳ Menunggu Verifikasi" : order.payment_status === "failed" ? "✗ Gagal" : "⏳ Menunggu Pembayaran"}
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

          {/* Shipping tracking info */}
          {order.tracking_number && (
            <div className="p-4 rounded-xl space-y-2 bg-[#FAF8F5] border" style={{ borderColor: "rgba(59,130,246,0.15)" }}>
              <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#3B82F6" }}><Truck className="w-4 h-4" />Informasi Pengiriman</p>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#7A6B5E" }}>Kurir</span>
                <span className="font-semibold" style={{ color: "#3D2B1F" }}>{order.courier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#7A6B5E" }}>Nomor Resi</span>
                <span className="font-mono font-bold select-all text-blue-600" style={{ color: "#2563EB" }}>{order.tracking_number}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="p-4 rounded-xl" style={{ background: "rgba(212,184,139,0.08)", border: "1px solid rgba(212,184,139,0.2)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#A89B8F" }}>Catatan Pesanan</p>
              <p className="text-sm italic" style={{ color: "#7A6B5E" }}>{order.notes}</p>
            </div>
          )}

          {/* Review Info (if reviewed) */}
          {order.reviewed && (
            <div className="p-4 rounded-xl space-y-2 bg-[#FAF8F5]" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#8B6F47" }}><Star className="w-4 h-4 fill-amber-500 text-amber-500" />Ulasan Anda</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4" style={{ color: star <= (order.review_rating || 0) ? "#F59E0B" : "#E5E7EB", fill: star <= (order.review_rating || 0) ? "#F59E0B" : "transparent" }} />
                ))}
              </div>
              {order.review_comment && (
                <p className="text-xs italic text-stone-500">"{order.review_comment}"</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {isUnpaid && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onClose(); onPay(order); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)", boxShadow: "0 4px 16px rgba(217,119,6,0.3)" }}
              >
                <Wallet className="w-4 h-4" />Bayar Sekarang
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { onClose(); navigate("/chat"); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
              style={{ border: "1.5px solid rgba(139,111,71,0.3)", color: "#8B6F47", background: "rgba(139,111,71,0.04)" }}
            >
              <MessageCircle className="w-4 h-4" />Hubungi Toko
            </motion.button>
            {order.status === "shipping" && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onClose(); onConfirmReceived(order.id); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
              >
                <CheckCircle2 className="w-4 h-4" />Konfirmasi Terima
              </motion.button>
            )}
            {order.status === "delivered" && order.can_review && !order.reviewed && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onClose(); onReview?.(order); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", boxShadow: "0 4px 16px rgba(139,111,71,0.2)" }}
              >
                <Star className="w-4 h-4 fill-white" />Tulis Ulasan
              </motion.button>
            )}
            {order.status === "delivered" && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={buyingAgain}
                onClick={async () => { setBuyingAgain(true); await onBuyAgain(order); setBuyingAgain(false); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-70 cursor-pointer"
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
        <div className="w-full flex items-center justify-between mb-4 text-white">
          <div>
            <h4 className="font-bold text-lg" style={{ color: "#FAF8F5", fontFamily: "'Playfair Display', serif" }}>Preview {title}</h4>
            <p className="text-xs text-stone-400">Desain Batik Kustom Anda</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="p-2 rounded-xl transition-all hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-1.5 border border-stone-700 bg-stone-900/50">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Unduh</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors border border-stone-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="w-full bg-[#FAF8F5] rounded-3xl p-5 md:p-8 overflow-hidden flex items-center justify-center border" style={{ borderColor: "rgba(212,184,139,0.2)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
          <img src={src} alt={title} className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-md" />
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
        className="bg-white rounded-3xl w-full max-w-md p-6"
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
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ border: "1.5px solid rgba(139,111,71,0.3)", color: "#8B6F47", background: "rgba(139,111,71,0.04)" }}
            disabled={loading}
          >
            Batal
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Konfirmasi"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
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
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
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
            { label: "Belum Dibayar", value: counts.unpaid, icon: AlertCircle, color: "#EF4444" },
            { label: "Sudah Dibayar", value: counts.paid, icon: CheckCircle2, color: "#16A34A" },
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
              const count = (counts as any)[tab.key] ?? 0;
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
                    {count}
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
              const isExpired = order.payment_status === "pending" && order.status !== "cancelled" && new Date(order.date).getTime() + 86400000 < Date.now();
              const isUnpaid = order.payment_status === "pending" && order.total > 0 && order.status !== "negotiating" && order.status !== "cancelled" && !isExpired;

              // Determine status badge properties
              const getStatusProperties = () => {
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
                    label: "Verifikasi Pembayaran",
                    bg: "rgba(245, 158, 11, 0.08)",
                    text: "#D97706",
                    border: "rgba(245, 158, 11, 0.2)",
                    icon: Clock
                  };
                }
                if (isUnpaid) {
                  return {
                    label: "Belum Dibayar",
                    bg: "rgba(249, 115, 22, 0.08)",
                    text: "#EA580C",
                    border: "rgba(249, 115, 22, 0.2)",
                    icon: AlertCircle
                  };
                }

                // If paid or COD, show standard order status config
                const sc = (statusConfig as any)[order.status] || statusConfig.processing;
                return {
                  label: sc.label,
                  bg: sc.bg,
                  text: sc.color,
                  border: sc.border,
                  icon: sc.icon
                };
              };

              const badge = getStatusProperties();
              const StatusIcon = badge.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedOrder(order)}
                  whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(61,43,31,0.06)" }}
                  className="bg-white rounded-3xl border border-stone-100 hover:border-amber-900/10 cursor-pointer overflow-hidden transition-all duration-300 flex flex-col"
                  style={{
                    boxShadow: "0 4px 20px rgba(61,43,31,0.02)",
                  }}
                >
                  {/* Card Header: Shop details and Status badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-stone-50/50 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#8B6F47]/10 flex items-center justify-center text-[#8B6F47]">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#3D2B1F]">{order.artisan}</h4>
                        <p className="text-[10px] text-[#A89B8F] mt-0.5">
                          {new Date(order.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.type === "custom" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-[#8B6F47] border border-amber-200/60 flex items-center gap-1">
                          ✨ Kustom
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-100 text-[#7A6B5E] border border-stone-200/40">
                          Katalog
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1"
                        style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col md:flex-row gap-5 items-start">
                    {/* Image / Canvas Thumbnail */}
                    <div
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-stone-100 bg-stone-50/80 group/thumb ${order.bg_color?.startsWith("data:image") ? "cursor-zoom-in hover:opacity-90" : ""}`}
                      style={{
                        boxShadow: "0 2px 8px rgba(61,43,31,0.03)",
                      }}
                      onClick={(e) => {
                        if (order.bg_color?.startsWith("data:image")) {
                          e.stopPropagation();
                          setPreviewImage({ src: order.bg_color, title: order.item });
                        }
                      }}
                    >
                      {order.bg_color?.startsWith("data:image") ? (
                        <>
                          <img src={order.bg_color} alt={order.item} className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Search className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <PatternMini primary={order.primary_color} secondary={order.secondary_color} bg={order.bg_color} type={order.type} />
                      )}
                    </div>

                    {/* Middle details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[#3D2B1F] leading-snug">{order.item}</h3>
                      
                      {/* ID Pesanan copyable */}
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#A89B8F] font-mono">
                        <span>ID: {order.id.slice(0, 18)}...</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(order.id, "ID Pesanan");
                          }}
                          className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                          title="Salin ID Pesanan"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-[#5A4A3E]">
                          Qty: {order.quantity || 1}
                        </span>

                        {order.payment_method && (
                          <span className="flex items-center gap-1 text-[11px] text-[#A89B8F]">
                            <CreditCard className="w-3 h-3 text-[#8B6F47]" />
                            {paymentMethodLabel[order.payment_method] || order.payment_method.replace("transfer_", "").toUpperCase()}
                          </span>
                        )}

                        {order.shipping_address?.city && (
                          <span className="flex items-center gap-1 text-[11px] text-[#A89B8F]">
                            <MapPin className="w-3 h-3 text-[#8B6F47]" />
                            {order.shipping_address.city}
                          </span>
                        )}

                        {order.reviewed && order.review_rating && (
                          <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-bold text-amber-700">{order.review_rating}</span>
                          </div>
                        )}
                      </div>

                      {/* Shipment Tracking details */}
                      {order.status === "shipping" && order.tracking_number && (
                        <div className="mt-3.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-md">
                          <div>
                            <p className="text-[10px] text-blue-500 font-medium">Ekspedisi: {order.courier}</p>
                            <p className="text-xs font-mono font-bold text-blue-900 select-all mt-0.5">{order.tracking_number}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(order.tracking_number || "", "Nomor resi");
                            }}
                            className="px-2.5 py-1 bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm self-start sm:self-auto cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" /> Salin Resi
                          </button>
                        </div>
                      )}

                      {/* Estimated finish details */}
                      {order.status === "processing" && (order as any).estimated_date && (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-blue-600 font-medium bg-blue-50/50 border border-blue-100 px-2.5 py-1 rounded-xl">
                          <Calendar className="w-3 h-3" />
                          <span>Estimasi Selesai: <strong>{new Date((order as any).estimated_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Right side: Price */}
                    <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:justify-center pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 md:h-20">
                      <span className="text-xs text-[#A89B8F]">Total Belanja</span>
                      <span className="font-bold text-base md:text-lg text-[#8B6F47] mt-0.5">
                        {order.total > 0
                          ? `Rp ${order.total.toLocaleString("id-ID")}`
                          : "Negosiasi"
                        }
                      </span>
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  {isUnpaid && (
                    <div className="mx-6 mb-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-900">Menunggu Pembayaran</p>
                          <p className="text-[10px] text-amber-700/80 mt-0.5">Harap lakukan pembayaran dalam waktu 24 jam.</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <PaymentTimer orderDate={order.date} />
                      </div>
                    </div>
                  )}

                  {order.payment_status === "awaiting_verification" && (
                    <div className="mx-6 mb-4 p-3 rounded-2xl bg-blue-50/60 border border-blue-200/40 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900">Pembayaran Menunggu Verifikasi</p>
                        <p className="text-[10px] text-blue-700/80">Bukti transfer sedang divalidasi oleh pengrajin.</p>
                      </div>
                    </div>
                  )}

                  {isExpired && (
                    <div className="mx-6 mb-4 p-3 rounded-2xl bg-red-50/60 border border-red-200/40 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-900">Batas Waktu Habis</p>
                        <p className="text-[10px] text-red-700/80">Pesanan dibatalkan secara otomatis karena waktu pembayaran habis.</p>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="px-6 py-4 bg-stone-50/30 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-[#7A6B5E] hover:text-[#3D2B1F] text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Detail Pesanan
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/chat");
                        }}
                        className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-[#8B6F47] hover:text-[#735b36] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Hubungi Toko
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {isUnpaid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayingOrder(order);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                          style={{
                            background: "linear-gradient(135deg, #D97706, #F59E0B)",
                            boxShadow: "0 4px 12px rgba(217,119,6,0.2)",
                          }}
                        >
                          <Wallet className="w-3.5 h-3.5" /> Bayar Sekarang
                        </button>
                      )}

                      {order.status === "shipping" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingReceived(order.id);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                          style={{
                            background: "linear-gradient(135deg, #16A34A, #15803D)",
                            boxShadow: "0 4px 12px rgba(22,163,74,0.2)",
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Terima
                        </button>
                      )}

                      {order.status === "delivered" && order.can_review && !order.reviewed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewingOrder(order);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                          style={{
                            background: "linear-gradient(135deg, #8B6F47, #A88967)",
                            boxShadow: "0 4px 12px rgba(139,111,71,0.2)",
                          }}
                        >
                          <Star className="w-3.5 h-3.5 fill-white" /> Tulis Ulasan
                        </button>
                      )}

                      {order.status === "delivered" && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleBuyAgain(order);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer flex items-center gap-1.5"
                          style={{
                            background: "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                          }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Beli Lagi
                        </button>
                      )}
                    </div>
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
