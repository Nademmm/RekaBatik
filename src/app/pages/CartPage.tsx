import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, ChevronLeft,
  MapPin, CreditCard, CheckCircle2, Package, ChevronRight, User, Phone,
  Building2, Navigation, Hash, StickyNote, BadgeCheck, Palette, Store, MessageCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { CartItem, ShippingAddress } from "../../types/database";
import { toast, Toaster } from "sonner";
import { Skeleton } from "../components/ui/skeleton";

// ─── Tipe ──────────────────────────────────────────────────────────────────
type CheckoutStep = 1 | 2 | 3 | 4;

type PaymentMethod = "transfer_bca" | "transfer_mandiri" | "gopay" | "ovo" | "cod";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { id: "transfer_bca", label: "Transfer BCA", desc: "Virtual Account BCA", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" className="h-5 md:h-6 object-contain" />, color: "#0056A0" },
  { id: "transfer_mandiri", label: "Transfer Mandiri", desc: "Virtual Account Mandiri", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" alt="Mandiri" className="h-4 md:h-5 object-contain" />, color: "#003087" },
  { id: "gopay", label: "GoPay", desc: "Bayar via aplikasi Gojek", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="GoPay" className="h-5 md:h-6 object-contain" />, color: "#00AED6" },
  { id: "ovo", label: "OVO", desc: "Bayar via aplikasi OVO", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" alt="OVO" className="h-5 md:h-6 object-contain" />, color: "#4C3494" },
  { id: "cod", label: "Bayar di Tempat (COD)", desc: "Bayar saat paket tiba", icon: <Package className="w-6 h-6" style={{ color: "#5A3D2B" }} />, color: "#5A3D2B" },
];

const PROVINCES = [
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Banten", "Bali", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Sumatera Selatan", "Bengkulu", "Lampung", "Bangka Belitung",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur",
  "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara",
  "Papua Barat", "Papua", "NTB", "NTT", "Aceh",
];

// ─── Toko Pengrajin Batik ──────────────────────────────────────────────────
const BATIK_STORES = [
  { id: 1, name: "Batik Amri Jetis", owner: "Pak Amri", avatar: "BA", color: "#8B6F47", specialty: "Batik Tulis Beras Utah", rating: 4.9 },
  { id: 2, name: "Batik Siti Collection", owner: "Bu Siti", avatar: "BS", color: "#5A7C8B", specialty: "Batik Cap Modern", rating: 4.7 },
  { id: 3, name: "Rumah Batik Hartono", owner: "Pak Hartono", avatar: "RB", color: "#6B3A8B", specialty: "Batik Tulis Premium", rating: 4.8 },
  { id: 4, name: "Batik Jetis Muda", owner: "Kak Dian", avatar: "BJ", color: "#2D5A2D", specialty: "Batik Kontemporer", rating: 4.6 },
];

// ─── SVG Pattern Mini ──────────────────────────────────────────────────────
function PatternThumb({ bg, primary }: { bg: string; primary: string }) {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl" style={{ background: bg }}>
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <pattern id={`pt-${primary.replace("#","")}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke={primary} strokeWidth="1.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pt-${primary.replace("#","")})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Package className="w-6 h-6 opacity-40" style={{ color: primary }} />
      </div>
    </div>
  );
}

// ─── Stepper ───────────────────────────────────────────────────────────────
const STEPS_NORMAL = [
  { step: 1, label: "Keranjang", icon: ShoppingBag },
  { step: 2, label: "Alamat", icon: MapPin },
  { step: 3, label: "Pembayaran", icon: CreditCard },
  { step: 4, label: "Konfirmasi", icon: CheckCircle2 },
];

const STEPS_CUSTOM = [
  { step: 1, label: "Keranjang", icon: ShoppingBag },
  { step: 2, label: "Alamat", icon: MapPin },
  { step: 3, label: "Pilih Toko", icon: Store },
  { step: 4, label: "Konfirmasi", icon: CheckCircle2 },
];

function Stepper({ current, steps = STEPS_NORMAL }: { current: CheckoutStep; steps?: typeof STEPS_NORMAL }) {
  // Make absolutely 100% sure we have a valid array!
  let safeSteps: typeof STEPS_NORMAL = [];
  if (Array.isArray(steps)) {
    safeSteps = steps;
  } else if (Array.isArray(STEPS_NORMAL)) {
    safeSteps = STEPS_NORMAL;
  }
  
  // Extra fallback
  if (!Array.isArray(safeSteps) || safeSteps.length === 0) {
    safeSteps = STEPS_NORMAL;
  }

  return (
    <div className="flex items-center justify-center mb-10">
      {safeSteps.map((s, i) => {
        const done = current > s.step;
        const active = current === s.step;
        const Icon = s.icon;
        return (
          <div key={s.step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: done ? "#8B6F47" : active ? "linear-gradient(135deg, #3D2B1F, #8B6F47)" : "rgba(212,184,139,0.2)",
                  scale: active ? 1.1 : 1,
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                {done ? (
                  <BadgeCheck className="w-5 h-5 text-white" />
                ) : (
                  <Icon className="w-4 h-4" style={{ color: active ? "#FAF8F5" : "#A89B8F" }} />
                )}
              </motion.div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: active ? "#3D2B1F" : "#A89B8F" }}>
                {s.label}
              </span>
            </div>
            {i < safeSteps.length - 1 && (
              <div
                className="w-12 sm:w-20 h-0.5 mx-2 mb-5 transition-all duration-500"
                style={{ background: current > s.step ? "#8B6F47" : "rgba(212,184,139,0.25)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Step 2 — Alamat
  const [address, setAddress] = useState<ShippingAddress>({
    name: user?.user_metadata?.full_name || "",
    phone: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [addressErrors, setAddressErrors] = useState<Partial<ShippingAddress>>({});
  const [notes, setNotes] = useState("");

  // Step 3 — Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer_bca");

  // Step 3 — Pilih Toko (custom flow)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const SHIPPING_COST = 20000;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCartItems = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, batik_items(*), custom_designs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      toast.error("Gagal memuat keranjang belanja");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCartItems(); }, [fetchCartItems]);

  // ── Quantity ──────────────────────────────────────────────────────────────
  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    try {
      const { error } = await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    } catch {
      toast.error("Gagal mengubah jumlah"); fetchCartItems();
    }
  };

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeItem = async (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Barang dihapus dari keranjang");
    } catch {
      toast.error("Gagal menghapus barang"); fetchCartItems();
    }
  };

  // ── Address Validation ────────────────────────────────────────────────────
  const validateAddress = (): boolean => {
    const errs: Partial<ShippingAddress> = {};
    if (!address.name.trim()) errs.name = "Nama wajib diisi";
    if (!address.phone.trim()) errs.phone = "Nomor HP wajib diisi";
    else if (!/^(08|\+62)[0-9]{7,12}$/.test(address.phone.replace(/\s/g, ""))) errs.phone = "Format nomor HP tidak valid";
    if (!address.street.trim()) errs.street = "Alamat jalan wajib diisi";
    if (!address.city.trim()) errs.city = "Kota wajib diisi";
    if (!address.province) errs.province = "Provinsi wajib dipilih";
    if (!address.postal_code.trim()) errs.postal_code = "Kode pos wajib diisi";
    else if (!/^[0-9]{5}$/.test(address.postal_code)) errs.postal_code = "Kode pos harus 5 digit";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    if (hasCustomItems && !selectedStoreId) {
      toast.error("Silakan pilih toko pengrajin terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const store = BATIK_STORES.find(s => s.id === selectedStoreId);

      const ordersToInsert = cartItems.map(item => {
        const bItem = item.batik_items;
        const cItem = item.custom_designs;
        let cData = null;
        try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;
        
        const isCustom = !bItem && !!cItem;
        const price = bItem ? bItem.price : 0;
        const name = bItem ? bItem.name : "Desain Batik Kustom";
        const desc = bItem ? bItem.description : "Karya seni batik kustom buatan Anda sendiri.";

        return {
          id: orderId,
          user_id: user.id,
          item: name,
          description: desc,
          status: "processing",
          total: bItem ? ((price * item.quantity) + SHIPPING_COST) : 0,
          type: bItem?.category || "custom",
          primary_color: bItem?.primary_color || "#3D2B1F",
          secondary_color: bItem?.secondary_color || "#D4B88B",
          bg_color: bItem?.bg_color || cData?.canvasThumbnail || cData?.canvasBackground || "#FAF8F5",
          artisan: hasCustomItems && store ? store.name : "RekaBatik Artisan",
          can_review: false,
          reviewed: false,
          date: new Date().toISOString(),
          quantity: item.quantity,
          payment_method: hasCustomItems ? "cod" : paymentMethod,
          payment_status: "pending",
          shipping_address: address,
          notes: notes || null,
        };
      });

      const { error: insertError } = await supabase.from("orders").insert(ordersToInsert).select();
      if (insertError) throw insertError;

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      setCartItems([]);

      if (hasCustomItems && store) {
        // Collect custom design thumbnails for the chat opening message
        const customThumbnails = cartItems
          .filter(i => i.custom_designs && !i.batik_items)
          .map(i => {
            if (!i.custom_designs?.drawing_data) return null;
            try {
              const d = JSON.parse(i.custom_designs.drawing_data);
              return d?.canvasThumbnail || null;
            } catch { return null; }
          })
          .filter(Boolean);

        // Redirect to chat with store info and custom design data
        navigate("/chat", {
          state: {
            fromCheckout: true,
            storeId: store.id,
            orderId: ordersToInsert[0].id,
            customThumbnails,
          },
        });
        toast.success("Pesanan dibuat! Silakan diskusikan desain & harga dengan toko.");
      } else {
        setSuccessOrderId(ordersToInsert[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Checkout gagal. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.batik_items ? item.batik_items.price : 0;
    return sum + (price * item.quantity);
  }, 0);
  const hasRegularItems = cartItems.some(item => item.batik_items);
  const hasCustomItems = cartItems.some(item => item.custom_designs && !item.batik_items);
  const total = hasRegularItems ? subtotal + SHIPPING_COST : 0;
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
  const selectedPayment = PAYMENT_OPTIONS.find(p => p.id === paymentMethod)!;
  const selectedStore = BATIK_STORES.find(s => s.id === selectedStoreId);
  const checkoutSteps = hasCustomItems ? STEPS_CUSTOM : STEPS_NORMAL;

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS MODAL
  // ─────────────────────────────────────────────────────────────────────────
  if (successOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{ background: "#FAF8F5" }}>
        <BatikBackground opacity={0.04} patternType="kawung" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 max-w-md w-full mx-4 p-10 rounded-3xl text-center bg-white"
          style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.12)", border: "1px solid rgba(212,184,139,0.3)" }}
        >
          {/* Animated check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            Pesanan Berhasil! 🎉
          </h2>
          <p className="mb-4" style={{ color: "#7A6B5E" }}>
            Terima kasih! Pesanan Anda sedang diproses oleh pengrajin kami.
          </p>

          {/* Premium Ticket / Receipt */}
          <div className="bg-white rounded-2xl relative overflow-hidden mt-8 mb-8" style={{ border: "1px solid rgba(212,184,139,0.4)", boxShadow: "0 15px 40px rgba(61,43,31,0.06)" }}>
            
            {/* Top: Order ID */}
            <div className="p-5 text-center" style={{ background: "linear-gradient(to bottom, #FAF8F5, #FFFFFF)" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#A89B8F" }}>Nomor Pesanan</p>
              <p className="font-mono font-bold text-lg md:text-xl tracking-tight" style={{ color: "#3D2B1F" }}>{successOrderId}</p>
            </div>
            
            {/* Ticket Separator */}
            <div className="relative flex items-center h-0">
              <div className="w-5 h-5 rounded-full absolute -left-2.5 z-10" style={{ background: "#FAF8F5", borderRight: "1px solid rgba(212,184,139,0.4)" }}></div>
              <div className="flex-1 border-t-2 border-dashed mx-4" style={{ borderColor: "rgba(212,184,139,0.4)" }}></div>
              <div className="w-5 h-5 rounded-full absolute -right-2.5 z-10" style={{ background: "#FAF8F5", borderLeft: "1px solid rgba(212,184,139,0.4)" }}></div>
            </div>

            {/* Bottom: Details */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: "#7A6B5E" }}>Metode Pembayaran</span>
                <span className="font-semibold flex items-center gap-2" style={{ color: "#3D2B1F" }}>
                  {selectedPayment.icon} {selectedPayment.label}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: "#7A6B5E" }}>Total Tagihan</span>
                <span className="font-bold text-xl" style={{ color: "#8B6F47" }}>
                      {!hasCustomItems ? `Rp ${total.toLocaleString("id-ID")}` : "Rp xxx.xxx"}
                    </span>
              </div>
              
              {paymentMethod !== "cod" && (
                <div className="pt-4 mt-2 border-t" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
                  <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: "#7A6B5E" }}>
                    <span className="text-base">⏰</span>
                    <span>Selesaikan pembayaran dalam <strong style={{ color: "#D97706" }}>24 jam</strong> agar pesanan tidak dibatalkan otomatis oleh sistem.</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/orders")}
              className="flex-1 py-3.5 rounded-xl font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}
            >
              Lihat Pesanan
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/catalog")}
              className="flex-1 py-3.5 rounded-xl font-semibold"
              style={{ border: "1.5px solid rgba(139,111,71,0.3)", color: "#8B6F47" }}
            >
              Belanja Lagi
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative pb-20" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(20%, -20%)" }} />

      <div className="container mx-auto px-4 pt-8 md:pt-12 relative z-10 max-w-5xl">
        {/* Back */}
        <Link to="/catalog" className="inline-flex items-center gap-1.5 mb-6 text-sm font-medium hover:underline" style={{ color: "#8B6F47" }}>
          <ChevronLeft className="w-4 h-4" />
          Kembali Belanja
        </Link>

        <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, marginBottom: "1.75rem" }}>
          Keranjang Belanja
        </h1>

        {/* Stepper */}
        <Stepper current={step} steps={checkoutSteps} />

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : cartItems.length === 0 && step === 1 ? (
          // ── EMPTY ───────────────────────────────────────────────────────
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white"
            style={{ border: "1px solid rgba(212,184,139,0.2)" }}
          >
            <div className="w-24 h-24 mb-6 rounded-full flex items-center justify-center" style={{ background: "rgba(139,111,71,0.08)" }}>
              <ShoppingBag className="w-10 h-10" style={{ color: "#8B6F47" }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#3D2B1F" }}>Keranjang Kosong</h2>
            <p className="mb-8 text-center max-w-xs" style={{ color: "#7A6B5E" }}>Belum ada batik yang ditambahkan. Jelajahi koleksi terbaik kami!</p>
            <Link to="/catalog">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-full font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}
              >
                Mulai Belanja
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* ── LEFT: Step Content ─────────────────────────────────────── */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">

                {/* STEP 1: Cart Items */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                    <AnimatePresence>
                      {cartItems.map(item => {
                        const bItem = item.batik_items;
                        const cItem = item.custom_designs;
                        if (!bItem && !cItem) return null;
                        
                        let cData = null;
                        try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}

                        const price = bItem ? bItem.price : 0;
                        const name = bItem ? bItem.name : "Desain Batik Kustom";
                        const origin = bItem ? bItem.origin : "RekaBatik Studio";

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30, height: 0 }}
                            className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-white"
                            style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                          >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center">
                              {bItem ? (
                                <PatternThumb bg={bItem.bg_color} primary={bItem.primary_color} />
                              ) : cData?.canvasThumbnail ? (
                                <img src={cData.canvasThumbnail} alt="Custom Design" className="w-full h-full object-cover" />
                              ) : (
                                <Palette className="w-8 h-8 text-stone-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="font-semibold truncate" style={{ color: "#3D2B1F" }}>{name}</h3>
                                <button onClick={() => removeItem(item.id)} className="flex-shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all group">
                                  <Trash2 className="w-4 h-4 transition-all group-hover:stroke-[2.5px] group-hover:scale-110" />
                                </button>
                              </div>
                              <p className="text-xs mb-3" style={{ color: "#A89B8F" }}>{origin}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold" style={{ color: "#8B6F47" }}>
                                  {bItem ? (
                                    `Rp ${(price * item.quantity).toLocaleString("id-ID")}`
                                  ) : (
                                    <span className="text-sm">Rp xxx.xxx</span>
                                  )}
                                  {bItem && item.quantity > 1 && <span className="text-xs font-normal ml-1" style={{ color: "#A89B8F" }}>(Rp {price.toLocaleString("id-ID")} × {item.quantity})</span>}
                                </span>
                                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(139,111,71,0.2)" }}>
                                  <button onClick={() => updateQuantity(item.id, item.quantity, -1)} disabled={item.quantity <= 1} className="px-3 py-1.5 hover:bg-amber-50 disabled:opacity-40 transition-colors" style={{ color: "#5A4A3E" }}><Minus className="w-3.5 h-3.5" /></button>
                                  <div className="px-3 py-1.5 text-sm font-bold min-w-[38px] text-center" style={{ color: "#3D2B1F", background: "#FDFCF8" }}>{item.quantity}</div>
                                  <button onClick={() => updateQuantity(item.id, item.quantity, 1)} className="px-3 py-1.5 hover:bg-amber-50 transition-colors" style={{ color: "#5A4A3E" }}><Plus className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* STEP 2: Shipping Address */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="p-6 rounded-2xl bg-white space-y-5"
                    style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                  >
                    <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Alamat Pengiriman</h2>

                    {[
                      { key: "name", label: "Nama Penerima", icon: User, placeholder: "Nama lengkap" },
                      { key: "phone", label: "Nomor HP", icon: Phone, placeholder: "08xx-xxxx-xxxx" },
                      { key: "street", label: "Alamat Jalan", icon: Navigation, placeholder: "Nama jalan, nomor rumah, RT/RW, kelurahan" },
                      { key: "city", label: "Kota / Kabupaten", icon: Building2, placeholder: "Cth: Sidoarjo" },
                      { key: "postal_code", label: "Kode Pos", icon: Hash, placeholder: "5 digit kode pos" },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>{field.label}</label>
                        <div className="relative">
                          <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#B8A898" }} />
                          <input
                            type={field.key === "postal_code" ? "text" : "text"}
                            value={(address as any)[field.key]}
                            onChange={e => { setAddress(prev => ({ ...prev, [field.key]: e.target.value })); setAddressErrors(prev => ({ ...prev, [field.key]: undefined })); }}
                            placeholder={field.placeholder}
                            maxLength={field.key === "postal_code" ? 5 : undefined}
                            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all"
                            style={{
                              border: `1.5px solid ${(addressErrors as any)[field.key] ? "#ef4444" : "rgba(139,111,71,0.2)"}`,
                              background: "#FAFAF8",
                              color: "#3D2B1F",
                            }}
                          />
                        </div>
                        {(addressErrors as any)[field.key] && (
                          <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{(addressErrors as any)[field.key]}</p>
                        )}
                      </div>
                    ))}

                    {/* Province */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Provinsi</label>
                      <select
                        value={address.province}
                        onChange={e => { setAddress(prev => ({ ...prev, province: e.target.value })); setAddressErrors(prev => ({ ...prev, province: undefined })); }}
                        className="w-full px-4 py-3 rounded-xl outline-none text-sm appearance-none"
                        style={{ border: `1.5px solid ${addressErrors.province ? "#ef4444" : "rgba(139,111,71,0.2)"}`, background: "#FAFAF8", color: address.province ? "#3D2B1F" : "#C4B5A5" }}
                      >
                        <option value="">Pilih Provinsi</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {addressErrors.province && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.province}</p>}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>
                        <span className="flex items-center gap-1.5"><StickyNote className="w-4 h-4" />Catatan Pesanan <span style={{ color: "#A89B8F" }}>(Opsional)</span></span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Cth: Tolong bungkus rapi karena untuk hadiah..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                        style={{ border: "1.5px solid rgba(139,111,71,0.2)", background: "#FAFAF8", color: "#3D2B1F" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Payment or Select Store */}
                {step === 3 && (
                  hasCustomItems ? (
                    <motion.div key="step3-custom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="p-6 rounded-2xl bg-white"
                      style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                    >
                      <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pilih Toko Pengrajin</h2>
                      <p className="text-sm mb-6" style={{ color: "#7A6B5E" }}>Pilih toko pengrajin batik yang ingin Anda ajak berdiskusi tentang desain dan harga.</p>
                      <div className="space-y-3">
                        {BATIK_STORES.map(store => (
                          <motion.button
                            key={store.id}
                            onClick={() => setSelectedStoreId(store.id)}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                            style={{
                              border: selectedStoreId === store.id ? `2px solid ${store.color}` : "1.5px solid rgba(139,111,71,0.2)",
                              background: selectedStoreId === store.id ? `rgba(${parseInt(store.color.slice(1,3),16)},${parseInt(store.color.slice(3,5),16)},${parseInt(store.color.slice(5,7),16)},0.05)` : "#FAFAF8",
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: store.color }}>
                              {store.avatar}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: "#3D2B1F" }}>{store.name}</p>
                              <p className="text-xs" style={{ color: "#A89B8F" }}>{store.specialty}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0`} style={{ borderColor: selectedStoreId === store.id ? store.color : "rgba(139,111,71,0.3)" }}>
                              {selectedStoreId === store.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: store.color }} />}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="step3-normal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="p-6 rounded-2xl bg-white"
                      style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                    >
                      <h2 className="font-bold text-lg mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Metode Pembayaran</h2>
                      <div className="space-y-3">
                        {PAYMENT_OPTIONS.map(p => (
                          <motion.button
                            key={p.id}
                            onClick={() => setPaymentMethod(p.id)}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                            style={{
                              border: paymentMethod === p.id ? `2px solid ${p.color}` : "1.5px solid rgba(139,111,71,0.2)",
                              background: paymentMethod === p.id ? `rgba(${parseInt(p.color.slice(1,3),16)},${parseInt(p.color.slice(3,5),16)},${parseInt(p.color.slice(5,7),16)},0.05)` : "#FAFAF8",
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `rgba(${parseInt(p.color.slice(1,3),16)},${parseInt(p.color.slice(3,5),16)},${parseInt(p.color.slice(5,7),16)},0.1)` }}>
                              {p.icon}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: "#3D2B1F" }}>{p.label}</p>
                              <p className="text-xs" style={{ color: "#A89B8F" }}>{p.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0`} style={{ borderColor: paymentMethod === p.id ? p.color : "rgba(139,111,71,0.3)" }}>
                              {paymentMethod === p.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      {paymentMethod !== "cod" && (
                        <p className="mt-4 text-xs p-3 rounded-lg" style={{ color: "#7A6B5E", background: "rgba(139,111,71,0.06)", border: "1px solid rgba(139,111,71,0.1)" }}>
                          ℹ️ Instruksi pembayaran akan ditampilkan setelah Anda klik "Konfirmasi Pesanan". Selesaikan dalam 24 jam.
                        </p>
                      )}
                    </motion.div>
                  )
                )}

                {/* STEP 4: Review & Confirm */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    {/* Items Review */}
                    <div className="p-5 rounded-2xl bg-white" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                      <h3 className="font-semibold mb-3" style={{ color: "#3D2B1F" }}>Barang Pesanan</h3>
                      {cartItems.map(item => {
                        const bItem = item.batik_items;
                        const cItem = item.custom_designs;
                        if (!bItem && !cItem) return null;
                        
                        let cData = null;
                        try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}

                        const price = bItem ? bItem.price : 0;
                        const name = bItem ? bItem.name : "Desain Batik Kustom";
                        return (
                          <div key={item.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 flex items-center justify-center">
                              {bItem ? (
                                <PatternThumb bg={bItem.bg_color} primary={bItem.primary_color} />
                              ) : cData?.canvasThumbnail ? (
                                <img src={cData.canvasThumbnail} alt="Custom" className="w-full h-full object-cover" />
                              ) : (
                                <Palette className="w-5 h-5 text-stone-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "#3D2B1F" }}>{name}</p>
                              <p className="text-xs" style={{ color: "#A89B8F" }}>Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-bold" style={{ color: "#8B6F47" }}>
                              {bItem ? `Rp ${(price * item.quantity).toLocaleString("id-ID")}` : "Rp xxx.xxx"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Address Review */}
                    <div className="p-5 rounded-2xl bg-white" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" style={{ color: "#8B6F47" }} />
                        <h3 className="font-semibold" style={{ color: "#3D2B1F" }}>Alamat Pengiriman</h3>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{address.name} · {address.phone}</p>
                      <p className="text-sm" style={{ color: "#7A6B5E" }}>{address.street}, {address.city}, {address.province} {address.postal_code}</p>
                      {notes && <p className="mt-2 text-xs italic" style={{ color: "#A89B8F" }}>Catatan: {notes}</p>}
                    </div>

                    {/* Payment or Store Review */}
                    {hasCustomItems && selectedStore ? (
                      <div className="p-5 rounded-2xl bg-white" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Store className="w-4 h-4" style={{ color: "#8B6F47" }} />
                          <h3 className="font-semibold" style={{ color: "#3D2B1F" }}>Toko Pengrajin</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white" style={{ background: selectedStore.color }}>
                            {selectedStore.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{selectedStore.name}</p>
                            <p className="text-xs" style={{ color: "#A89B8F" }}>{selectedStore.specialty}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-white" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4" style={{ color: "#8B6F47" }} />
                          <h3 className="font-semibold" style={{ color: "#3D2B1F" }}>Metode Pembayaran</h3>
                        </div>
                        <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{selectedPayment.icon} {selectedPayment.label}</p>
                        <p className="text-xs" style={{ color: "#A89B8F" }}>{selectedPayment.desc}</p>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(prev => (prev - 1) as CheckoutStep)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm"
                    style={{ border: "1.5px solid rgba(139,111,71,0.25)", color: "#8B6F47" }}
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </motion.button>
                )}
                {step < 4 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (step === 2 && !validateAddress()) return;
                      if (step === 3 && hasCustomItems && !selectedStoreId) {
                        toast.error("Silakan pilih toko pengrajin terlebih dahulu.");
                        return;
                      }
                      setStep(prev => (prev + 1) as CheckoutStep);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
                  >
                    {step === 1 ? "Isi Alamat Pengiriman" : step === 2 ? (hasCustomItems ? "Pilih Toko" : "Pilih Pembayaran") : "Review Pesanan"}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:opacity-70"
                    style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : hasCustomItems ? <><MessageCircle className="w-5 h-5" />Hubungi Toko</> : <><CheckCircle2 className="w-5 h-5" />Konfirmasi Pesanan</>}
                  </motion.button>
                )}
              </div>
            </div>

            {/* ── RIGHT: Order Summary ───────────────────────────────────── */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 p-6 rounded-2xl bg-white" style={{ border: "1px solid rgba(212,184,139,0.25)", boxShadow: "0 8px 30px rgba(61,43,31,0.04)" }}>
                <h3 className="font-bold text-lg mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Ringkasan</h3>
                <div className="space-y-3 mb-4">
                  {cartItems.map(item => {
                    const bItem = item.batik_items;
                    const cItem = item.custom_designs;
                    if (!bItem && !cItem) return null;
                    const price = bItem ? bItem.price : 0;
                    const name = bItem ? bItem.name : "Desain Batik Kustom";
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate max-w-[140px]" style={{ color: "#7A6B5E" }}>{name} ×{item.quantity}</span>
                        <span className="font-medium flex-shrink-0 ml-2" style={{ color: "#5A4A3E" }}>
                          {bItem ? `Rp ${(price * item.quantity).toLocaleString("id-ID")}` : "Rp xxx.xxx"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t space-y-2 mb-4" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
                  <div className="flex justify-between text-sm" style={{ color: "#7A6B5E" }}>
                    <span>Subtotal ({totalQty} barang)</span>
                    <span>{hasRegularItems ? `Rp ${subtotal.toLocaleString("id-ID")} ` : "Rp xxx.xxx"}</span>
                  </div>
                  {hasRegularItems && (
                    <div className="flex justify-between text-sm" style={{ color: "#7A6B5E" }}>
                      <span>Ongkos Kirim</span>
                      <span>Rp {SHIPPING_COST.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold" style={{ color: "#5A4A3E" }}>Total</span>
                    <span className="text-xl font-bold" style={{ color: "#3D2B1F" }}>
                      {!hasCustomItems ? `Rp ${total.toLocaleString("id-ID")}` : "Rp xxx.xxx"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
