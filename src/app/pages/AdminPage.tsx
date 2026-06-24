import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Package, MessageCircle, TrendingUp, Clock,
  CheckCircle, Truck, DollarSign, Star, Search, Send, ChevronRight,
  Calendar, X, Loader2, Check, CheckCheck, Sparkles, Tag, Filter,
  ArrowUpRight, Users, Store, AlertCircle, RefreshCw, Bell, XCircle,
  Info, User, Paperclip, ShieldCheck, Image as ImageIcon
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";
import { toast, Toaster } from "sonner";
import { BatikBackground } from "../components/BatikBackground";

// Platform fee multiplier — 15% added for platform earnings
const PLATFORM_FEE_MULTIPLIER = 1.15;

// ─── Types ──────────────────────────────────────────────────────────────────
interface StoreInfo {
  id: number;
  name: string;
  owner: string;
  specialty: string;
  rating: number;
  review_count: number;
  description: string;
  owner_id: string;
  status: "pending" | "approved" | "rejected";
}

interface OrderRow {
  id: string;
  user_id: string;
  item: string;
  artisan: string;
  status: string;
  total: number;
  payment_status: string;
  date: string;
  estimated_date?: string;
  type?: string;
  bg_color?: string;
  primary_color?: string;
  secondary_color?: string;
  quantity?: number;
  notes?: string;
  shipping_courier?: string;
  tracking_number?: string;
}

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: "user" | "artisan";
  message: string;
  price_offer?: number;
  negotiation_status?: "pending" | "accepted" | "rejected";
  status: "sent" | "delivered" | "read";
  created_at: string;
  attachment?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  negotiating: { label: "Negosiasi", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: MessageCircle },
  processing:  { label: "Diproses",  color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  icon: Clock },
  shipping:    { label: "Dikirim",   color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  icon: Truck },
  delivered:   { label: "Selesai",   color: "#16A34A", bg: "rgba(22,163,74,0.1)",   icon: CheckCircle },
  cancelled:   { label: "Dibatalkan",color: "#EF4444", bg: "rgba(239,68,68,0.1)",   icon: X },
};

type AdminTab = "overview" | "orders" | "chat";
type OrderFilter = "all" | "unpaid" | "awaiting_verification" | "paid" | "negotiating" | "processing" | "shipping" | "delivered";

// ─── Default note template for seller ─────────────────────────────────────────
const DEFAULT_NOTE_TEMPLATE = `Halo! Terima kasih telah mempercayakan pesanan batik Anda kepada kami. 🙏

Penawaran ini sudah mencakup:
✅ Bahan kain batik premium pilihan
✅ Proses pewarnaan & pembatikan tangan
✅ Pengecekan kualitas sebelum pengiriman

Jika ada pertanyaan mengenai detail desain atau bahan, jangan ragu untuk chat dengan kami. Kami siap membantu!

Salam hangat,
Tim Pengrajin Batik 🎨`;

// ─── Status Dropdown Component ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "negotiating", label: "Negosiasi",  color: "#D97706", bg: "rgba(245,158,11,0.12)",  icon: MessageCircle },
  { value: "processing",  label: "Diproses",   color: "#2563EB", bg: "rgba(59,130,246,0.12)",  icon: Clock },
  { value: "shipping",    label: "Dikirim",    color: "#7C3AED", bg: "rgba(139,92,246,0.12)",  icon: Truck },
] as const;

function StatusDropdown({
  currentStatus, orderId, disabled,
  onUpdate, size = "md",
}: {
  currentStatus: string; orderId: string; disabled: boolean;
  onUpdate: (id: string, status: string) => void; size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = STATUS_OPTIONS.find(o => o.value === currentStatus)
    ?? { value: currentStatus, label: currentStatus, color: "#8B6F47", bg: "rgba(139,111,71,0.1)", icon: Info };
  const Icon = (current as any).icon;
  const isSmall = size === "sm";

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-xl font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
          isSmall ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
        style={{
          background: current.bg,
          color: current.color,
          borderColor: `${current.color}33`,
        }}
      >
        <Icon className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        {current.label}
        <ChevronRight
          className={`transition-transform duration-200 ${isSmall ? "w-2.5 h-2.5" : "w-3 h-3"}`}
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 min-w-[130px] rounded-2xl overflow-hidden right-0"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 8px 32px rgba(61,43,31,0.18), 0 2px 8px rgba(61,43,31,0.08)",
              border: "1px solid rgba(212,184,139,0.2)",
            }}
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {STATUS_OPTIONS.map(opt => {
                const OptIcon = opt.icon;
                const isActive = opt.value === currentStatus;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) onUpdate(orderId, opt.value);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold w-full text-left transition-all ${
                      isActive ? "cursor-default" : "hover:opacity-90"
                    }`}
                    style={{
                      background: isActive ? opt.bg : "transparent",
                      color: isActive ? opt.color : "#5A4A3E",
                    }}
                  >
                    <OptIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: opt.color }} />
                    {opt.label}
                    {isActive && <Check className="w-3 h-3 ml-auto" style={{ color: opt.color }} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Price Offer Modal ────────────────────────────────────────────────────────
function PriceOfferModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (price: number, estimatedDate: string, note: string) => void }) {
  const [price, setPrice] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [note, setNote] = useState(DEFAULT_NOTE_TEMPLATE);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price.replace(/[^0-9]/g, ""));
    if (!p || p <= 0) { toast.error("Masukkan harga yang valid"); return; }
    if (!estimatedDate) { toast.error("Pilih tanggal estimasi selesai"); return; }
    setLoading(true);
    await onSubmit(p, estimatedDate, note);
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
        className="bg-white rounded-3xl w-full max-w-sm p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.12)" }}>
            <Tag className="w-5 h-5" style={{ color: "#8B6F47" }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Tentukan Harga</h3>
            <p className="text-xs" style={{ color: "#A89B8F" }}>Kirim penawaran harga & estimasi selesai</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#7A6B5E" }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#5A4A3E" }}>Harga Penawaran (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#8B6F47" }}>Rp</span>
              <input
                type="text"
                value={price}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setPrice(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                }}
                placeholder="500.000"
                className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none font-semibold"
                style={{ border: "2px solid rgba(139,111,71,0.15)", background: "#FAFAF8", color: "#3D2B1F" }}
              />
            </div>
            {price && (
              <p className="text-[11px] font-medium mt-1.5 text-[#8B6F47]">
                Harga ke Pembeli (+15% Fee): <strong>Rp {Math.ceil(parseFloat(price.replace(/[^0-9]/g, "")) * 1.15).toLocaleString("id-ID")}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#5A4A3E" }}>Estimasi Selesai</label>
            <input
              type="date"
              value={estimatedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setEstimatedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
              style={{ border: "2px solid rgba(139,111,71,0.15)", background: "#FAFAF8", color: "#3D2B1F" }}
            />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: "#5A4A3E" }}>Catatan untuk Pembeli</label>
              <button
                type="button"
                onClick={() => setNote(DEFAULT_NOTE_TEMPLATE)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all"
                style={{ color: "#8B6F47", background: "rgba(139,111,71,0.08)", border: "1px solid rgba(139,111,71,0.15)" }}
              >
                ↺ Reset Template
              </button>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ border: "2px solid rgba(139,111,71,0.15)", background: "#FAFAF8", color: "#3D2B1F", lineHeight: 1.6 }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Tag className="w-4 h-4" />Kirim Penawaran</>}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Estimated Date Modal ─────────────────────────────────────────────────────
function EstimatedDateModal({ orderId, currentDate, onClose, onSave }: {
  orderId: string; currentDate?: string; onClose: () => void; onSave: (date: string) => void;
}) {
  const [date, setDate] = useState(currentDate ? currentDate.split("T")[0] : "");
  const [loading, setLoading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.12)" }}>
            <Calendar className="w-5 h-5" style={{ color: "#8B6F47" }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Estimasi Selesai</h3>
            <p className="text-xs" style={{ color: "#A89B8F" }}>Pesanan #{orderId.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#7A6B5E" }} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Tanggal Estimasi Selesai</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={{ border: "2px solid rgba(139,111,71,0.2)", background: "#FAFAF8", color: "#3D2B1F" }}
            />
          </div>
          <motion.button
            disabled={!date || loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={async () => { setLoading(true); await onSave(date); setLoading(false); onClose(); }}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calendar className="w-4 h-4" />Simpan Estimasi</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Shipping Info Modal ──────────────────────────────────────────────────────
function ShippingInfoModal({ orderId, onClose, onSubmit }: {
  orderId: string;
  onClose: () => void;
  onSubmit: (courier: string, trackingNumber: string) => void;
}) {
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courier.trim()) { toast.error("Masukkan nama kurir"); return; }
    if (!trackingNumber.trim()) { toast.error("Masukkan nomor resi"); return; }
    setLoading(true);
    await onSubmit(courier.trim(), trackingNumber.trim());
    setLoading(false);
    onClose();
  };

  const popularCouriers = ["JNE", "J&T", "SiCepat", "Anteraja", "Pos Indonesia", "Tiki"];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
            <Truck className="w-5 h-5" style={{ color: "#8B5CF6" }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Info Pengiriman</h3>
            <p className="text-xs" style={{ color: "#A89B8F" }}>Pesanan #{orderId.slice(0, 8)} — Masukkan kurir & resi</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" style={{ color: "#7A6B5E" }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#5A4A3E" }}>Nama Kurir</label>
            <input
              type="text"
              value={courier}
              onChange={e => setCourier(e.target.value)}
              placeholder="Contoh: JNE, J&T, SiCepat..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: "2px solid rgba(139,111,71,0.15)", background: "#FAFAF8", color: "#3D2B1F" }}
            />
            {/* Quick select */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {popularCouriers.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourier(c)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: courier === c ? "#3D2B1F" : "rgba(139,111,71,0.08)",
                    color: courier === c ? "#FFF" : "#8B6F47",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#5A4A3E" }}>Nomor Resi</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value.toUpperCase())}
              placeholder="Contoh: JNE001234567890"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono tracking-wider"
              style={{ border: "2px solid rgba(139,111,71,0.15)", background: "#FAFAF8", color: "#3D2B1F" }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6B21A8, #8B5CF6)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Truck className="w-4 h-4" />Konfirmasi Pengiriman</>}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export function AdminPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    return (sessionStorage.getItem("rekabatik_admin_tab") as AdminTab) || "overview";
  });
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Chat state
  const [chatConvos, setChatConvos] = useState<{ userId: string; orderIds: string[]; latestOrderId: string; hasNegotiating: boolean; lastTime: string; lastItem: string }[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserOrderIds, setActiveUserOrderIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [priceModalOrderId, setPriceModalOrderId] = useState<string | null>(null);
  const [estimateDateOrderId, setEstimateDateOrderId] = useState<string | null>(null);
  const [shippingModalOrderId, setShippingModalOrderId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [chatSearch, setChatSearch] = useState("");
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const chatViewportRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const isInitialLoadRef = useRef(true);
  const activeTabRef = useRef(activeTab);
  // Keep activeTabRef in sync with activeTab state
  activeTabRef.current = activeTab;
  // Persist active tab to sessionStorage so navbar click doesn't reset it
  useEffect(() => {
    sessionStorage.setItem("rekabatik_admin_tab", activeTab);
  }, [activeTab]);

  const scrollChatToBottom = () => {
    const el = chatViewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // ── Redirect non-artisans ──────────────────────────────────────────────────
  useEffect(() => {
    if (userRole && userRole !== "artisan") {
      toast.error("Halaman ini khusus untuk pengrajin batik.");
      navigate("/");
    }
  }, [userRole, navigate]);

  // ── Fetch store info ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchStore = async () => {
      setLoadingStore(true);
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      if (!error && data) setStoreInfo(data as StoreInfo);
      setLoadingStore(false);
    };
    fetchStore();
  }, [user]);

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!storeInfo) return;
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("artisan", storeInfo.name)
      .order("date", { ascending: false });
    if (!error && data) {
      setOrders(data as OrderRow[]);
      // Build conversation list grouped by user_id
      const userMap = new Map<string, { userId: string; orderIds: string[]; latestOrderId: string; hasNegotiating: boolean; lastTime: string; lastItem: string }>();
      for (const o of data as any[]) {
        if (!userMap.has(o.user_id)) {
          userMap.set(o.user_id, { userId: o.user_id, orderIds: [], latestOrderId: o.id, hasNegotiating: false, lastTime: o.date, lastItem: o.item });
        }
        const conv = userMap.get(o.user_id)!;
        conv.orderIds.push(o.id);
        if (o.status === "negotiating") conv.hasNegotiating = true;
      }
      setChatConvos(Array.from(userMap.values()));
    }
    setLoadingOrders(false);
  }, [storeInfo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-select most recent conversation when chat loads
  useEffect(() => {
    if (chatConvos.length > 0 && !activeUserId) {
      const first = chatConvos[0];
      setActiveUserId(first.userId);
      setActiveUserOrderIds(first.orderIds);
    }
  }, [chatConvos]);

  // ── Fetch messages for active user (all their orders) ────────────────────
  const fetchMessages = useCallback(async (orderIds: string[]) => {
    if (!orderIds.length) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  }, []);

  useEffect(() => {
    if (!activeUserId || !activeUserOrderIds.length) return;
    fetchMessages(activeUserOrderIds);

    // Subscribe to realtime
    if (channelRef.current) { supabase.removeChannel(channelRef.current); }
    const channel = supabase
      .channel(`admin-chat-user-${activeUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const msg = payload.new as Message;
        if (activeUserOrderIds.includes(msg.order_id)) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();
    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [activeUserId, activeUserOrderIds, fetchMessages]);

  // Auto-scroll: always on first load, conditionally for new messages
  useEffect(() => {
    const el = chatViewportRef.current;
    if (!el || messages.length === 0) return;
    if (isInitialLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
    } else {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 150;
      if (isAtBottom) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Reset initial load flag when changing active user
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [activeUserId]);

  // Scroll to bottom when switching to chat tab or selecting a user
  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(() => scrollChatToBottom(), 350);
      setTimeout(() => scrollChatToBottom(), 650);
    }
  }, [activeTab, activeUserId]);

  // Scroll to bottom when browser tab regains focus (switching Chrome tabs)
  // Uses activeTabRef.current to avoid stale closure. Registered once with [].
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && activeTabRef.current === "chat") {
        // Multiple retries — Chrome restores DOM asynchronously
        requestAnimationFrame(() => scrollChatToBottom());
        setTimeout(() => scrollChatToBottom(), 0);
        setTimeout(() => scrollChatToBottom(), 150);
        setTimeout(() => scrollChatToBottom(), 400);
        setTimeout(() => scrollChatToBottom(), 700);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const activeConvo = chatConvos.find(c => c.userId === activeUserId);
    const targetOrderId = activeConvo?.latestOrderId;
    if (!chatInput.trim() || !targetOrderId || !user) return;
    setSendingMsg(true);
    const { error } = await supabase.from("messages").insert([{
      order_id: targetOrderId,
      sender_id: user.id,
      sender_role: "artisan",
      message: chatInput.trim(),
      status: "sent",
    }]);
    if (error) { toast.error("Gagal mengirim pesan"); }
    else { setChatInput(""); }
    setSendingMsg(false);
  };

  // ── Send price offer ───────────────────────────────────────────────────────
  const sendPriceOffer = async (price: number, estimatedDate: string, note: string) => {
    if (!priceModalOrderId || !user) return;
    const finalPrice = Math.ceil(price * PLATFORM_FEE_MULTIPLIER);
    const text = `${note ? note + "\n\n" : ""}💰 *Penawaran Harga: ${formatCurrency(finalPrice)}*\n📅 *Estimasi Selesai: ${formatDate(estimatedDate)}*\n\nSilakan balas dengan Setuju atau Tidak Setuju untuk melanjutkan.`;
    
    // 1. Kirim pesan penawaran
    const { error: msgError } = await supabase.from("messages").insert([{
      order_id: priceModalOrderId,
      sender_id: user.id,
      sender_role: "artisan",
      message: text,
      price_offer: finalPrice,
      negotiation_status: "pending",
      status: "sent",
    }]);
    
    if (msgError) {
      toast.error("Gagal mengirim penawaran");
      return;
    }

    // 2. Perbarui tanggal estimasi di tabel orders secara otomatis
    const { error: orderError } = await supabase
      .from("orders")
      .update({ estimated_date: estimatedDate })
      .eq("id", priceModalOrderId);

    if (orderError) {
      console.error("Gagal memperbarui tanggal estimasi pesanan:", orderError);
    } else {
      // Perbarui state lokal orders
      setOrders(prev => prev.map(o => o.id === priceModalOrderId ? { ...o, estimated_date: estimatedDate } : o));
    }

    toast.success("Penawaran harga dan estimasi berhasil dikirim!");
    setPriceModalOrderId(null);
  };

  // ── Verify payment ─────────────────────────────────────────────────────────
  const verifyPayment = async (orderId: string) => {
    setVerifyingPayment(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "processing" })
      .eq("id", orderId);
    if (error) toast.error("Gagal memverifikasi pembayaran");
    else {
      toast.success("Pembayaran terverifikasi! Status pesanan diubah ke Diproses.");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: "paid", status: "processing" } : o));
    }
    setVerifyingPayment(null);
  };

  // ── Update order status ────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId: string, status: string) => {
    // Guard: only buyer can mark as delivered — admin cannot do it manually
    if (status === "delivered") return;
    // Intercept shipping: show modal to collect tracking info
    if (status === "shipping") {
      setShippingModalOrderId(orderId);
      return;
    }
    setUpdatingStatus(orderId);
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) toast.error("Gagal memperbarui status");
    else {
      toast.success("Status pesanan diperbarui!");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
    setUpdatingStatus(null);
  };

  // ── Confirm shipping with tracking info ────────────────────────────────────
  const confirmShipping = async (courier: string, trackingNumber: string) => {
    if (!shippingModalOrderId) return;
    setUpdatingStatus(shippingModalOrderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: "shipping", shipping_courier: courier, tracking_number: trackingNumber })
      .eq("id", shippingModalOrderId);
    if (error) toast.error("Gagal mengupdate info pengiriman");
    else {
      toast.success(`Pesanan dikirim via ${courier}! Resi: ${trackingNumber}`);
      setOrders(prev => prev.map(o =>
        o.id === shippingModalOrderId
          ? { ...o, status: "shipping", shipping_courier: courier, tracking_number: trackingNumber }
          : o
      ));
    }
    setUpdatingStatus(null);
  };

  // ── Send chat image ────────────────────────────────────────────────────────
  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran gambar maks 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setChatImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (chatImageInputRef.current) chatImageInputRef.current.value = "";
  };

  const sendChatImage = async () => {
    if (!chatImagePreview) return;
    const activeConvo = chatConvos.find(c => c.userId === activeUserId);
    const targetOrderId = activeConvo?.latestOrderId;
    if (!targetOrderId || !user) return;
    setSendingMsg(true);
    const { error } = await supabase.from("messages").insert([{
      order_id: targetOrderId,
      sender_id: user.id,
      sender_role: "artisan",
      message: chatInput.trim() || "[Gambar Referensi]",
      attachment: chatImagePreview,
      status: "sent",
    }]);
    if (error) toast.error("Gagal mengirim gambar");
    else { setChatInput(""); setChatImagePreview(null); }
    setSendingMsg(false);
  };

  // ── Update estimated date ──────────────────────────────────────────────────
  const saveEstimatedDate = async (date: string) => {
    if (!estimateDateOrderId) return;
    const { error } = await supabase.from("orders").update({ estimated_date: date }).eq("id", estimateDateOrderId);
    if (error) toast.error("Gagal menyimpan estimasi");
    else {
      toast.success("Estimasi selesai disimpan!");
      setOrders(prev => prev.map(o => o.id === estimateDateOrderId ? { ...o, estimated_date: date } : o));
    }
  };

  // ── Filter orders ──────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.item.toLowerCase().includes(orderSearch.toLowerCase());
    const matchFilter =
      orderFilter === "all" ? true :
      orderFilter === "unpaid" ? o.payment_status === "pending" && o.total > 0 && o.status !== "negotiating" :
      orderFilter === "awaiting_verification" ? o.payment_status === "awaiting_verification" :
      orderFilter === "paid" ? o.payment_status === "paid" :
      o.status === orderFilter;
    return matchSearch && matchFilter;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    totalRevenue: orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0),
    activeOrders: orders.filter(o => ["processing", "shipping"].includes(o.status)).length,
    negotiating: orders.filter(o => o.status === "negotiating").length,
    totalOrders: orders.length,
    unpaid: orders.filter(o => o.payment_status === "pending" && o.total > 0 && o.status !== "negotiating").length,
    awaitingVerification: orders.filter(o => o.payment_status === "awaiting_verification").length,
  };

  const activeConvo = chatConvos.find(c => c.userId === activeUserId);
  const activeConvoOrders = orders.filter(o => o.user_id === activeUserId);

  if (loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F5" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#8B6F47" }} />
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F5" }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
            <Store className="w-10 h-10" style={{ color: "#8B6F47" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            Toko Tidak Ditemukan
          </h2>
          <p className="text-sm mb-5" style={{ color: "#7A6B5E" }}>
            Akun Anda belum memiliki toko yang terdaftar. Silakan daftar sebagai Pengrajin Batik atau hubungi admin.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── Handling pending or rejected store ─────────────────────────────────────
  if (storeInfo.status === "pending" || storeInfo.status === "rejected") {
    return (
      <div className="min-h-screen relative" style={{ background: "#FAF8F5", fontFamily: "'Inter', sans-serif" }}>
        <BatikBackground opacity={0.03} patternType="mega" />
        <div className="absolute inset-0 flex items-center justify-center p-4 relative z-10">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center" style={{ boxShadow: "0 20px 60px rgba(61,43,31,0.08)", border: "1px solid rgba(212,184,139,0.3)" }}>
            {storeInfo.status === "pending" ? (
              <>
                <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
                  <Clock className="w-10 h-10" style={{ color: "#D97706" }} />
                </div>
                <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Menunggu Persetujuan</h2>
                <p className="text-sm" style={{ color: "#7A6B5E", lineHeight: 1.6 }}>
                  Pendaftaran toko Anda (<strong>{storeInfo.name}</strong>) sedang diverifikasi oleh tim RekaBatik. Harap tunggu beberapa saat hingga akun Anda diaktifkan untuk mulai menerima pesanan.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <XCircle className="w-10 h-10" style={{ color: "#EF4444" }} />
                </div>
                <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pendaftaran Ditolak</h2>
                <p className="text-sm" style={{ color: "#7A6B5E", lineHeight: 1.6 }}>
                  Maaf, pendaftaran toko Anda (<strong>{storeInfo.name}</strong>) tidak disetujui. Silakan hubungi admin RekaBatik untuk informasi lebih lanjut.
                </p>
              </>
            )}
            <button
              onClick={() => navigate("/")}
              className="mt-8 px-6 py-3 w-full rounded-xl text-sm font-semibold"
              style={{ border: "1.5px solid rgba(139,111,71,0.3)", color: "#8B6F47" }}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5", fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" richColors />
      <BatikBackground opacity={0.025} patternType="mega" />

      <div className={`${activeTab === "chat" ? "max-w-[96%] lg:max-w-[98%] mx-auto px-2 sm:px-4 py-4" : "max-w-7xl mx-auto px-4 sm:px-6 py-8"} relative z-10 transition-all duration-300`}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${activeTab === "chat" ? "mb-4" : "mb-8"}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}>
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8B6F47" }}>Dashboard Admin</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 700 }}>
              {storeInfo.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#7A6B5E" }}>
              {storeInfo.specialty} · ⭐ {storeInfo.rating}/5 ({storeInfo.review_count} ulasan)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.negotiating > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#D97706" }}>
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                {stats.negotiating} Negosiasi Aktif
              </div>
            )}
            <button onClick={fetchOrders} className="p-2.5 rounded-xl hover:bg-stone-100 transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" style={{ color: "#8B6F47" }} />
            </button>
          </div>
        </motion.div>

        {/* ── Tab Navigation ──────────────────────────────────────────── */}
        <div className={`flex p-1 rounded-2xl w-fit transition-all duration-300 ${activeTab === "chat" ? "mb-4" : "mb-8"}`} style={{ background: "rgba(139,111,71,0.08)", border: "1px solid rgba(139,111,71,0.12)" }}>
          {([
            { key: "overview", label: "Ringkasan", icon: TrendingUp },
            { key: "orders", label: "Pesanan", icon: Package, count: stats.activeOrders },
            { key: "chat", label: "Chat & Negosiasi", icon: MessageCircle, count: stats.negotiating },
          ] as { key: AdminTab; label: string; icon: any; count?: number }[]).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ color: isActive ? "#3D2B1F" : "#9E8E82" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-tab"
                    className="absolute inset-0 rounded-xl bg-white"
                    style={{ boxShadow: "0 2px 12px rgba(61,43,31,0.1)" }}
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: tab.key === "chat" ? "#F59E0B" : "#8B6F47" }}>
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Pendapatan", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "#16A34A", sub: "Dari pesanan lunas" },
                  { label: "Pesanan Aktif", value: stats.activeOrders, icon: Package, color: "#3B82F6", sub: "Diproses + Dikirim" },
                  { label: "Negosiasi Pending", value: stats.negotiating, icon: MessageCircle, color: "#F59E0B", sub: "Menunggu respons" },
                  { label: "Belum Dibayar", value: stats.unpaid, icon: AlertCircle, color: "#EF4444", sub: "Menunggu pembayaran" },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="p-5 rounded-2xl bg-white"
                      style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.04)" }}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                          <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "#A89B8F" }}>{s.label}</span>
                      </div>
                      <p className="text-2xl font-bold mb-0.5" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
                      <p className="text-xs" style={{ color: "#B8A898" }}>{s.sub}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick recent orders */}
              <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.04)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pesanan Terbaru</h3>
                  <button onClick={() => setActiveTab("orders")} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#8B6F47" }}>
                    Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {loadingOrders ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(139,111,71,0.06)" }} />)}</div>
                ) : orders.slice(0, 5).length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="w-10 h-10 mx-auto mb-2" style={{ color: "rgba(139,111,71,0.25)" }} />
                    <p className="text-sm" style={{ color: "#A89B8F" }}>Belum ada pesanan masuk</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map(o => {
                      const cfg = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.processing;
                      const Icon = cfg.icon;
                      return (
                        <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                          onClick={() => { setActiveTab("orders"); }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#3D2B1F" }}>{o.item}</p>
                            <p className="text-xs" style={{ color: "#A89B8F" }}>{formatDate(o.date)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold" style={{ color: "#8B6F47" }}>{o.total > 0 ? formatCurrency(o.total) : "Belum ditetapkan"}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: ORDERS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
                  <input
                    type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Cari pesanan atau nama produk..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm"
                    style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FFFFFF", color: "#3D2B1F" }}
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap mb-5">
                {([
                  { key: "all", label: "Semua", count: orders.length },
                  { key: "unpaid", label: "Belum Dibayar", count: stats.unpaid },
                  { key: "awaiting_verification", label: "Perlu Verifikasi", count: stats.awaitingVerification, highlight: true },
                  { key: "paid", label: "Sudah Dibayar", count: orders.filter(o => o.payment_status === "paid").length },
                  { key: "negotiating", label: "Negosiasi", count: stats.negotiating },
                  { key: "processing", label: "Diproses", count: orders.filter(o => o.status === "processing").length },
                  { key: "shipping", label: "Dikirim", count: orders.filter(o => o.status === "shipping").length },
                  { key: "delivered", label: "Selesai", count: orders.filter(o => o.status === "delivered").length },
                ] as { key: OrderFilter; label: string; count: number; highlight?: boolean }[]).map(f => {
                  const isActive = orderFilter === f.key;
                  const isHighlighted = f.highlight && f.count > 0;
                  return (
                    <button key={f.key} onClick={() => setOrderFilter(f.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${isHighlighted && !isActive ? "animate-pulse" : ""}`}
                      style={{
                        background: isActive
                          ? "#3D2B1F"
                          : isHighlighted
                            ? "rgba(59,130,246,0.08)"
                            : "rgba(255,255,255,0.9)",
                        color: isActive
                          ? "#FFF"
                          : isHighlighted
                            ? "#2563EB"
                            : "#7A6B5E",
                        border: isActive
                          ? "none"
                          : isHighlighted
                            ? "1px solid rgba(59,130,246,0.3)"
                            : "1px solid rgba(212,184,139,0.25)",
                        boxShadow: isActive ? "0 4px 12px rgba(61,43,31,0.25)" : "none",
                      }}
                    >
                      {f.label}
                      <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: isActive
                            ? "rgba(255,255,255,0.2)"
                            : isHighlighted
                              ? "rgba(59,130,246,0.2)"
                              : "rgba(139,111,71,0.1)",
                          color: isActive
                            ? "#fff"
                            : isHighlighted
                              ? "#2563EB"
                              : "#8B6F47"
                        }}
                      >
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              {loadingOrders ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(139,111,71,0.06)" }} />)}</div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                  <Package className="w-12 h-12 mb-3" style={{ color: "rgba(139,111,71,0.25)" }} />
                  <p className="font-semibold" style={{ color: "#3D2B1F" }}>Tidak ada pesanan</p>
                  <p className="text-sm mt-1" style={{ color: "#A89B8F" }}>Coba ubah filter atau kata kunci pencarian</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((o, idx) => {
                    const cfg = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.processing;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div
                        key={o.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                        className="bg-white rounded-2xl p-4 sm:p-5"
                        style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.04)" }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Info Column */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Status Icon */}
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                              <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm truncate animate-none" style={{ color: "#3D2B1F" }}>{o.item}</p>
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                                  <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                                </span>
                              </div>
                              <p className="font-mono text-[10px]" style={{ color: "#A89B8F" }}>#{o.id.slice(0, 12)}</p>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1.5" style={{ color: "#A89B8F" }}>
                                <span>📅 {formatDate(o.date)}</span>
                                {o.estimated_date && <span>🎯 Estimasi: {formatDate(o.estimated_date)}</span>}
                                <span className={`font-semibold ${
                                  o.payment_status === "paid" ? "text-green-600" :
                                  o.payment_status === "awaiting_verification" ? "text-blue-600" :
                                  "text-amber-600"
                                }`}>
                                  {o.payment_status === "paid" ? "✓ Lunas" :
                                   o.payment_status === "awaiting_verification" ? "🔍 Menunggu Verifikasi" :
                                   "⏳ Belum Dibayar"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price + Actions Column */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 flex-shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0" style={{ borderColor: "rgba(212,184,139,0.1)" }}>
                            {/* Price block */}
                            <div className="text-left lg:text-right">
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Total Harga</p>
                              <p className="font-bold text-base" style={{ color: "#8B6F47" }}>
                                {o.total > 0 ? formatCurrency(o.total) : <span className="text-xs font-normal italic" style={{ color: "#A89B8F" }}>Belum ditetapkan</span>}
                              </p>
                            </div>

                            {/* Actions Group */}
                             <div className="flex flex-wrap items-center gap-2">
                               {/* Verify Payment Button */}
                               {o.payment_status === "awaiting_verification" && (
                                 <motion.button
                                   whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                   onClick={() => verifyPayment(o.id)}
                                   disabled={verifyingPayment === o.id}
                                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60 shadow-sm"
                                   style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
                                 >
                                   {verifyingPayment === o.id
                                     ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                     : <ShieldCheck className="w-3.5 h-3.5" />}
                                   Verifikasi Bayar
                                 </motion.button>
                               )}

                               {/* Estimated Date Button */}
                               <button
                                 onClick={() => setEstimateDateOrderId(o.id)}
                                 className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
                               >
                                 <Calendar className="w-3.5 h-3.5" />
                                 {o.estimated_date ? "Ubah Estimasi" : "Set Estimasi"}
                               </button>

                               {/* Chat Button */}
                               <button
                                 onClick={() => { setActiveTab("chat"); setActiveUserId(o.user_id); setActiveUserOrderIds(orders.filter(x => x.user_id === o.user_id).map(x => x.id)); }}
                                 className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
                               >
                                 <MessageCircle className="w-3.5 h-3.5" />Chat
                               </button>

                               {/* Status Update Dropdown */}
                               {o.status !== "delivered" && o.status !== "cancelled" && (
                                 <StatusDropdown
                                   currentStatus={o.status}
                                   orderId={o.id}
                                   disabled={updatingStatus === o.id}
                                   onUpdate={(id, status) => {
                                     if (status === "shipping") setShippingModalOrderId(id);
                                     else updateOrderStatus(id, status);
                                   }}
                                   size="md"
                                 />
                               )}
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: CHAT & NEGOSIASI
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex bg-white rounded-3xl overflow-hidden shadow-lg border border-[#D4B88B]/20 h-[calc(100vh-180px)] min-h-[650px] relative"
            >
              {/* Kolom 1: Sidebar Percakapan */}
              <div
                className={`flex-shrink-0 flex flex-col bg-white border-r border-[#D4B88B]/10 transition-all duration-300 ${
                  activeUserId ? "hidden md:flex md:w-[320px] lg:w-[350px]" : "flex w-full md:w-[320px] lg:w-[350px]"
                }`}
              >
                {/* Header Sidebar */}
                <div className="p-4 flex-shrink-0 bg-[#FAF8F5] border-b border-[#D4B88B]/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>
                      Percakapan
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#8B6F47" }}>
                      {chatConvos.length}
                    </span>
                  </div>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      placeholder="Cari pelanggan atau barang..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-xs transition-all"
                      style={{
                        border: "1px solid rgba(212,184,139,0.25)",
                        background: "#FFFFFF",
                        color: "#3D2B1F",
                      }}
                    />
                    {chatSearch && (
                      <button
                        onClick={() => setChatSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Daftar Percakapan */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#D4B88B]/05 bg-white">
                  {(() => {
                    const filteredConvos = chatConvos.filter(conv => {
                      const matchUser = conv.userId.toLowerCase().includes(chatSearch.toLowerCase());
                      const matchItem = conv.lastItem.toLowerCase().includes(chatSearch.toLowerCase());
                      return matchUser || matchItem;
                    });

                    if (filteredConvos.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                          <MessageCircle className="w-12 h-12 mb-3" style={{ color: "rgba(139,111,71,0.2)" }} />
                          <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>Tidak ada percakapan</p>
                          <p className="text-xs mt-1" style={{ color: "#A89B8F" }}>
                            {chatSearch ? "Kata kunci pencarian tidak ditemukan" : "Belum ada pesan yang masuk dari pelanggan."}
                          </p>
                        </div>
                      );
                    }

                    return filteredConvos.map(conv => {
                      const isActive = activeUserId === conv.userId;
                      const userOrders = orders.filter(o => o.user_id === conv.userId);
                      
                      // Hash avatar gradient color based on user ID
                      let hash = 0;
                      for (let i = 0; i < conv.userId.length; i++) {
                        hash = conv.userId.charCodeAt(i) + ((hash << 5) - hash);
                      }
                      const gradients = [
                        "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                        "linear-gradient(135deg, #5C4033, #A0522D)",
                        "linear-gradient(135deg, #4A3B32, #C19A6B)",
                        "linear-gradient(135deg, #1C3B2B, #3B6B4F)",
                        "linear-gradient(135deg, #2B3A42, #4F6B73)",
                      ];
                      const avatarBg = gradients[Math.abs(hash) % gradients.length];

                      return (
                        <button
                          key={conv.userId}
                          onClick={() => {
                            setActiveUserId(conv.userId);
                            setActiveUserOrderIds(conv.orderIds);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all hover:bg-stone-50/80 border-b border-stone-100"
                          style={{
                            background: isActive ? "rgba(139,111,71,0.06)" : "transparent",
                            borderLeft: isActive ? "4px solid #8B6F47" : "4px solid transparent",
                          }}
                        >
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-xs shadow-sm"
                            style={{ background: avatarBg }}
                          >
                            {conv.userId.slice(0, 2).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className="text-xs font-bold truncate" style={{ color: "#3D2B1F" }}>
                                Pelanggan #{conv.userId.slice(0, 6)}
                              </p>
                              <span className="text-[10px]" style={{ color: "#A89B8F" }}>
                                {new Date(conv.lastTime).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }) === "Invalid Date"
                                  ? formatTime(conv.lastTime)
                                  : new Date(conv.lastTime).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <p className="text-xs truncate font-medium" style={{ color: "#8B6F47" }}>
                              {conv.lastItem}
                            </p>
                            <p className="text-[10px] truncate" style={{ color: "#A89B8F" }}>
                              {userOrders.length} Pesanan
                            </p>
                          </div>

                          {/* Negotiation Badge */}
                          {conv.hasNegotiating && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                              style={{ background: "#F59E0B" }}
                              title="Negosiasi Aktif"
                            />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Kolom 2: Area Chat Utama */}
              <div
                className={`flex-1 flex flex-col bg-[#FAF9F6] relative transition-all duration-300 ${
                  !activeUserId && "hidden md:flex"
                }`}
              >
                {activeConvo ? (
                  <>
                    {/* Header Chat */}
                    <div
                      className="px-5 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#D4B88B]/10 bg-white"
                      style={{ boxShadow: "0 2px 10px rgba(61,43,31,0.02)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Tombol Back Mobile */}
                        <button
                          onClick={() => setActiveUserId(null)}
                          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 rotate-180" style={{ color: "#3D2B1F" }} />
                        </button>

                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
                          style={{
                            background: (() => {
                              let hash = 0;
                              for (let i = 0; i < activeConvo.userId.length; i++) {
                                hash = activeConvo.userId.charCodeAt(i) + ((hash << 5) - hash);
                              }
                              const gradients = [
                                "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                                "linear-gradient(135deg, #5C4033, #A0522D)",
                                "linear-gradient(135deg, #4A3B32, #C19A6B)",
                                "linear-gradient(135deg, #1C3B2B, #3B6B4F)",
                                "linear-gradient(135deg, #2B3A42, #4F6B73)",
                              ];
                              return gradients[Math.abs(hash) % gradients.length];
                            })(),
                          }}
                        >
                          {activeConvo.userId.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Customer ID & Status */}
                        <div className="min-w-0">
                          <p className="font-bold text-sm" style={{ color: "#3D2B1F" }}>
                            Pelanggan #{activeConvo.userId.slice(0, 8)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: activeConvo.hasNegotiating ? "#F59E0B" : "#10B981" }}
                            />
                            <p className="text-xs" style={{ color: "#A89B8F" }}>
                              {activeConvo.hasNegotiating ? "Negosiasi Aktif" : "Semua Selesai / Diproses"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        {/* Toggle Detail Panel */}
                        <button
                          onClick={() => setShowDetailPanel(prev => !prev)}
                          className="p-2.5 rounded-xl border border-stone-100 hover:bg-stone-50 transition-all cursor-pointer"
                          style={{
                            background: showDetailPanel ? "rgba(139,111,71,0.08)" : "transparent",
                            borderColor: showDetailPanel ? "rgba(139,111,71,0.2)" : "#E5E7EB",
                          }}
                          title="Detail Pesanan & Pelanggan"
                        >
                          <Info className="w-4 h-4" style={{ color: showDetailPanel ? "#8B6F47" : "#7A6B5E" }} />
                        </button>
                      </div>
                    </div>

                    {/* Viewport Chat */}
                    <div ref={chatViewportRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4 relative" style={{ background: "#FAF8F5" }}>
                      {/* Batik Background Watermark */}
                      <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0">
                        <BatikBackground opacity={1} patternType="mega" />
                      </div>

                      <div className="relative z-10 space-y-4">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Sparkles className="w-12 h-12 mb-3" style={{ color: "rgba(139,111,71,0.15)" }} />
                            <p className="text-sm font-semibold" style={{ color: "#7A6B5E" }}>Belum ada pesan obrolan</p>
                            <p className="text-xs mt-1" style={{ color: "#A89B8F" }}>Kirim pesan pertamamu untuk memulai percakapan.</p>
                          </div>
                        ) : (
                          <AnimatePresence initial={false}>
                            {messages.map(msg => {
                              const isMe = msg.sender_role === "artisan";
                              const order = activeConvoOrders.find(o => o.id === msg.order_id);
                              const orderStatus = order?.status;
                              const isPriceOffer = !!msg.price_offer;
                              const originalMsg = isPriceOffer
                                ? messages.find(m => m.order_id === msg.order_id && m.sender_role === "user" && !!m.attachment)
                                : null;

                              return (
                                <motion.div
                                  key={msg.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className={`flex ${isMe ? "justify-end" : "justify-start"} z-10 relative`}
                                >
                                  <div className={`max-w-[70%] md:max-w-[65%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                                    {/* Bubble Chat */}
                                    <div
                                      className="px-4 py-3 rounded-2xl text-sm leading-relaxed relative"
                                      style={{
                                        background: isMe ? "linear-gradient(135deg, #3D2B1F, #8B6F47)" : "#FFFFFF",
                                        color: isMe ? "#FFF" : "#3D2B1F",
                                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                        boxShadow: isMe ? "0 4px 15px rgba(61,43,31,0.15)" : "0 2px 10px rgba(61,43,31,0.05)",
                                        whiteSpace: "pre-line",
                                      }}
                                    >
                                      {/* File / Design Attachment */}
                                      {msg.attachment && (
                                        <div className="relative group overflow-hidden rounded-xl mb-2.5 max-w-full">
                                          <img
                                            src={msg.attachment}
                                            alt="Desain Kustom"
                                            className="w-full max-w-[260px] max-h-[300px] object-contain rounded-xl transition-all duration-300 group-hover:scale-102 bg-[#F5F2EB]"
                                            style={{ border: "1px solid rgba(212,184,139,0.2)" }}
                                          />
                                        </div>
                                      )}

                                      {/* Message Content */}
                                      <p className="text-xs md:text-sm font-medium">{msg.message}</p>

                                      {/* Custom Design Follow-Up Action (For Merchant) */}
                                      {msg.attachment && msg.sender_role === "user" && orderStatus === "negotiating" && (
                                        <div
                                          className="mt-3 pt-3 flex flex-col gap-2 border-t"
                                          style={{ borderColor: "rgba(212,184,139,0.25)" }}
                                        >
                                          <p className="text-[11px] font-bold" style={{ color: "#8B6F47" }}>
                                            Kutipan Pesanan Kustom:
                                          </p>
                                          <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setPriceModalOrderId(msg.order_id)}
                                            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all"
                                            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
                                          >
                                            <Tag className="w-3.5 h-3.5" /> Beri Penawaran Harga
                                          </motion.button>
                                        </div>
                                      )}

                                      {/* Price Offer Card inside Chat Bubble */}
                                      {msg.price_offer && (
                                        <div
                                          className="mt-3 pt-2.5 flex flex-col gap-2 border-t"
                                          style={{ borderColor: isMe ? "rgba(255,255,255,0.2)" : "rgba(212,184,139,0.2)" }}
                                        >
                                          {originalMsg && (
                                            <div
                                              className="flex bg-black/10 rounded-xl p-2 gap-2 w-full text-left"
                                              style={{ borderLeft: "3px solid rgba(255,255,255,0.5)" }}
                                            >
                                              {originalMsg.attachment && (
                                                <img
                                                  src={originalMsg.attachment}
                                                  alt="Desain"
                                                  className="w-9 h-9 object-cover rounded bg-white flex-shrink-0"
                                                />
                                              )}
                                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                                                  Membalas Pesanan
                                                </p>
                                                <p className="text-[10px] truncate opacity-95">
                                                  {originalMsg.message.split("\n").find(l => l.includes("Item:"))?.replace("- Item: ", "") || "Desain Kustom"}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Penawaran Card Box */}
                                          <div
                                            className="rounded-xl p-3 flex flex-col gap-1.5 shadow-sm text-left border"
                                            style={{
                                              background: isMe ? "rgba(255,255,255,0.08)" : "#FAF8F5",
                                              borderColor: isMe ? "rgba(255,255,255,0.15)" : "rgba(139,111,71,0.15)",
                                            }}
                                          >
                                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider opacity-75">
                                              <Tag className="w-3.5 h-3.5" />
                                              Penawaran Resmi
                                            </div>
                                            <div className="text-base font-extrabold" style={{ color: isMe ? "#FFF" : "#8B6F47" }}>
                                              {formatCurrency(msg.price_offer)}
                                            </div>

                                            {msg.negotiation_status && (
                                              <div className="flex items-center mt-1">
                                                {msg.negotiation_status === "accepted" && (
                                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-green-500 text-white shadow-sm flex items-center gap-1">
                                                    ✓ Penawaran Diterima
                                                  </span>
                                                )}
                                                {msg.negotiation_status === "rejected" && (
                                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-red-500 text-white shadow-sm flex items-center gap-1">
                                                    ✗ Penawaran Ditolak
                                                  </span>
                                                )}
                                                {msg.negotiation_status === "pending" && (
                                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1 animate-pulse">
                                                    ⏳ Menunggu Jawaban
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer Info: Time & Read Status */}
                                    <div className={`flex items-center gap-1 mt-1 text-[10px] px-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`} style={{ color: "#B8A898" }}>
                                      <span>{formatTime(msg.created_at)}</span>
                                      {isMe && (
                                        msg.status === "read"
                                          ? <CheckCheck className="w-3 h-3 text-emerald-600" />
                                          : <Check className="w-3 h-3 text-stone-400" />
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>

                    {/* Bar Input Chat */}
                     <div className="flex-shrink-0 border-t border-[#D4B88B]/10 bg-white">
                       {/* Image Preview */}
                       {chatImagePreview && (
                         <div className="px-4 pt-3 pb-0 flex items-center gap-3">
                           <div className="relative">
                             <img src={chatImagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-[#D4B88B]/30" />
                             <button
                               onClick={() => setChatImagePreview(null)}
                               className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                           <p className="text-xs" style={{ color: "#A89B8F" }}>Gambar siap dikirim. Tambahkan teks opsional lalu tekan kirim.</p>
                         </div>
                       )}
                       <div className="px-4 py-3 flex items-center gap-2.5">
                         {/* Hidden file input */}
                         <input
                           ref={chatImageInputRef}
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleChatImageSelect}
                         />
                         {/* Image Upload Button */}
                         <motion.button
                           whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                           onClick={() => chatImageInputRef.current?.click()}
                           className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 border"
                           style={{ background: "#FAF8F5", borderColor: "rgba(212,184,139,0.3)", color: "#8B6F47" }}
                           title="Kirim Gambar Referensi"
                         >
                           <Paperclip className="w-4 h-4" />
                         </motion.button>

                         {/* Price Offer Button — hanya muncul jika ada order negotiating */}
                         {(() => {
                           const negotiatingOrder = orders.find(
                             o => activeUserOrderIds.includes(o.id) && o.status === "negotiating"
                           );
                           if (!negotiatingOrder) return null;
                           return (
                             <motion.button
                               key="price-offer-btn"
                               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                               onClick={() => setPriceModalOrderId(negotiatingOrder.id)}
                               className="flex items-center gap-1.5 px-3 h-11 rounded-2xl text-xs font-semibold transition-all flex-shrink-0 border"
                               style={{
                                 background: "linear-gradient(135deg, rgba(139,111,71,0.12), rgba(61,43,31,0.08))",
                                 borderColor: "rgba(139,111,71,0.4)",
                                 color: "#8B6F47",
                               }}
                               title="Beri Penawaran Harga"
                             >
                               <Tag className="w-3.5 h-3.5" />
                               <span className="hidden sm:inline whitespace-nowrap">Beri Penawaran</span>
                             </motion.button>
                           );
                         })()}

                         {/* Input Text */}
                         <input
                           type="text"
                           value={chatInput}
                           onChange={e => setChatInput(e.target.value)}
                           onKeyDown={e => {
                             if (e.key === "Enter" && !e.shiftKey) {
                               e.preventDefault();
                               chatImagePreview ? sendChatImage() : sendMessage();
                             }
                           }}
                           placeholder={chatImagePreview ? "Tambahkan keterangan (opsional)..." : "Ketik pesan balasan Anda..."}
                           className="flex-1 px-4 py-3 rounded-2xl text-xs md:text-sm outline-none transition-all"
                           style={{
                             border: "1px solid rgba(212,184,139,0.25)",
                             background: "#FAF8F5",
                             color: "#3D2B1F",
                           }}
                         />

                         {/* Send Button */}
                         <motion.button
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={chatImagePreview ? sendChatImage : sendMessage}
                           disabled={(!chatInput.trim() && !chatImagePreview) || sendingMsg}
                           className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-40 shadow-sm flex-shrink-0"
                           style={{
                             background: (chatInput.trim() || chatImagePreview)
                               ? "linear-gradient(135deg, #8B6F47, #6B4F2F)"
                               : "#E8E1DA",
                           }}
                         >
                           {sendingMsg ? (
                             <Loader2 className="w-5 h-5 animate-spin" />
                           ) : (
                             <Send className="w-4 h-4" style={{ transform: "translateX(1px)" }} />
                           )}
                         </motion.button>
                       </div>
                     </div>
                  </>
                ) : (
                  /* Halaman Kosong Chat */
                  <div
                    className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#FAF8F5] relative"
                  >
                    <div className="absolute inset-0 opacity-[0.012] pointer-events-none z-0">
                      <BatikBackground opacity={1} patternType="mega" />
                    </div>
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative z-10 shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, rgba(212,184,139,0.15), rgba(139,111,71,0.08))",
                        border: "1px solid rgba(212,184,139,0.25)",
                      }}
                    >
                      <MessageCircle className="w-9 h-9" style={{ color: "#D4B88B" }} />
                    </motion.div>
                    <h3
                      className="text-lg font-bold mb-1.5 relative z-10"
                      style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}
                    >
                      Pilih Percakapan
                    </h3>
                    <p className="text-xs max-w-xs relative z-10" style={{ color: "#A89B8F", lineHeight: 1.6 }}>
                      Pilih salah satu obrolan pelanggan dari daftar di sebelah kiri untuk melihat pesan masuk dan memulai negosiasi harga.
                    </p>
                  </div>
                )}
              </div>

              {/* Kolom 3: Detail Pesanan & Pelanggan (Collapsible Panel) */}
              <AnimatePresence>
                {activeConvo && showDetailPanel && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "320px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="hidden lg:flex flex-col bg-white border-l border-[#D4B88B]/10 overflow-hidden flex-shrink-0 h-full"
                  >
                    <div className="p-4 flex-shrink-0 bg-[#FAF8F5] border-b border-[#D4B88B]/10 flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: "#3D2B1F" }}>
                        Detail Pelanggan
                      </h4>
                      <button
                        onClick={() => setShowDetailPanel(false)}
                        className="p-1 rounded-lg hover:bg-stone-200/50 transition-colors"
                      >
                        <X className="w-4 h-4 text-stone-500" />
                      </button>
                    </div>

                    {/* Detail Panel Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      {/* Profil Singkat */}
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md mb-3"
                          style={{
                            background: (() => {
                              let hash = 0;
                              for (let i = 0; i < activeConvo.userId.length; i++) {
                                hash = activeConvo.userId.charCodeAt(i) + ((hash << 5) - hash);
                              }
                              const gradients = [
                                "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                                "linear-gradient(135deg, #5C4033, #A0522D)",
                                "linear-gradient(135deg, #4A3B32, #C19A6B)",
                                "linear-gradient(135deg, #1C3B2B, #3B6B4F)",
                                "linear-gradient(135deg, #2B3A42, #4F6B73)",
                              ];
                              return gradients[Math.abs(hash) % gradients.length];
                            })(),
                          }}
                        >
                          {activeConvo.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <h5 className="font-bold text-sm" style={{ color: "#3D2B1F" }}>
                          Pelanggan #{activeConvo.userId.slice(0, 8)}
                        </h5>
                        <p className="text-[11px] font-mono mt-0.5 break-all px-2 select-all" style={{ color: "#A89B8F" }}>
                          {activeConvo.userId}
                        </p>
                      </div>

                      <hr className="border-stone-100" />

                      {/* Profil Pesanan */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: "#8B6F47" }}>
                          Daftar Pesanan ({activeConvoOrders.length})
                        </h4>

                        <div className="space-y-3">
                          {activeConvoOrders.map(o => {
                            const cfg = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.processing;
                            const StatusIcon = cfg.icon;
                            return (
                              <div
                                key={o.id}
                                className="p-3.5 rounded-2xl border transition-all text-left bg-stone-50/50 hover:bg-stone-50"
                                style={{ borderColor: "rgba(212,184,139,0.15)" }}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1.5">
                                  <h6 className="font-bold text-xs line-clamp-2" style={{ color: "#3D2B1F" }}>
                                    {o.item}
                                  </h6>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 flex items-center gap-0.5"
                                    style={{ background: cfg.bg, color: cfg.color }}
                                  >
                                    <StatusIcon className="w-2.5 h-2.5" />
                                    {cfg.label}
                                  </span>
                                </div>

                                <p className="text-[10px] font-mono" style={{ color: "#A89B8F" }}>
                                  ID: #{o.id.slice(0, 12)}
                                </p>

                                <div className="mt-2.5 pt-2.5 border-t border-stone-200/50 flex flex-col gap-2">
                                  {/* Price */}
                                  <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: "#A89B8F" }}>Total Harga:</span>
                                    <span className="font-bold" style={{ color: "#8B6F47" }}>
                                      {o.total > 0 ? formatCurrency(o.total) : "Belum ditetapkan"}
                                    </span>
                                  </div>

                                  {/* Payment status */}
                                  <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: "#A89B8F" }}>Pembayaran:</span>
                                    <span
                                      className={`font-bold ${
                                        o.payment_status === "paid" ? "text-green-600" :
                                        o.payment_status === "awaiting_verification" ? "text-blue-600" :
                                        "text-amber-600"
                                      }`}
                                    >
                                      {o.payment_status === "paid" ? "✓ Lunas" :
                                       o.payment_status === "awaiting_verification" ? "🔍 Verifikasi" :
                                       "⏳ Belum Bayar"}
                                    </span>
                                  </div>

                                  {/* Estimasi selesai */}
                                  <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: "#A89B8F" }}>Estimasi:</span>
                                    <span className="font-semibold text-stone-700">
                                      {o.estimated_date ? formatDate(o.estimated_date) : "Belum diset"}
                                    </span>
                                  </div>

                                  {/* Actions inside Detail Card */}
                                  <div className="mt-1 flex flex-col gap-1.5">
                                    <button
                                      onClick={() => setEstimateDateOrderId(o.id)}
                                      className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      {o.estimated_date ? "Ubah Estimasi" : "Set Estimasi Selesai"}
                                    </button>

                                    {o.status === "negotiating" && (
                                      <button
                                        onClick={() => setPriceModalOrderId(o.id)}
                                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all"
                                        style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
                                      >
                                        <Tag className="w-3 h-3" /> Beri Penawaran
                                      </button>
                                    )}

                                    {o.status !== "delivered" && o.status !== "cancelled" && (
                                      <div className="flex flex-col gap-1 mt-1">
                                        <span className="text-[10px]" style={{ color: "#A89B8F" }}>
                                          Update Status Pesanan:
                                        </span>
                                        <StatusDropdown
                                          currentStatus={o.status}
                                          orderId={o.id}
                                          disabled={updatingStatus === o.id}
                                          onUpdate={updateOrderStatus}
                                          size="sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {priceModalOrderId && (
          <PriceOfferModal
            onClose={() => setPriceModalOrderId(null)}
            onSubmit={sendPriceOffer}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {estimateDateOrderId && (
          <EstimatedDateModal
            orderId={estimateDateOrderId}
            currentDate={orders.find(o => o.id === estimateDateOrderId)?.estimated_date}
            onClose={() => setEstimateDateOrderId(null)}
            onSave={saveEstimatedDate}
          />
        )}
      </AnimatePresence>
       <AnimatePresence>
         {shippingModalOrderId && (
           <ShippingInfoModal
             orderId={shippingModalOrderId}
             onClose={() => setShippingModalOrderId(null)}
             onSubmit={confirmShipping}
           />
         )}
       </AnimatePresence>

      {/* Toaster */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
