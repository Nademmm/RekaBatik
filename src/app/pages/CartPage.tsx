import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, ChevronLeft,
  MapPin, CreditCard, CheckCircle2, Package, ChevronRight, User, Phone,
  Building2, Navigation, Hash, StickyNote, BadgeCheck, Palette, Store, MessageCircle, X,
  BookUser, Check, Copy, Upload
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "../components/ui/utils";
import { Link, useNavigate, useLocation } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import { supabase } from "../../lib/supabase";
import { CartItem, ShippingAddress } from "../../types/database";
import { toast, Toaster } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { INDONESIAN_LOCATIONS, PROVINCES } from "../constants/locations";

// Import semua gambar catalog
import BerasUtahImg from "../../assets/catalog-images/beras_utah.webp";
import CeplokImg from "../../assets/catalog-images/ceplok.webp";
import KawungImg from "../../assets/catalog-images/kawung.webp";
import MegaMendungImg from "../../assets/catalog-images/mega_mendung.webp";
import ParangImg from "../../assets/catalog-images/parang.webp";
import SekarJagadImg from "../../assets/catalog-images/sekar_jagad.webp";
import SidomuktiImg from "../../assets/catalog-images/sidomukti.webp";
import TruntumImg from "../../assets/catalog-images/truntum.webp";

// Map nama gambar ke import gambar
const imageMap: Record<string, string> = {
  "beras_utah.webp": BerasUtahImg,
  "ceplok.webp": CeplokImg,
  "kawung.webp": KawungImg,
  "mega_mendung.webp": MegaMendungImg,
  "parang.webp": ParangImg,
  "sekar_jagad.webp": SekarJagadImg,
  "sidomukti.webp": SidomuktiImg,
  "truntum.webp": TruntumImg
};

// Fungsi helper untuk map image_url ke import lokal
function mapImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  for (const [filename, imgSrc] of Object.entries(imageMap)) {
    if (imageUrl.includes(filename)) {
      return imgSrc;
    }
  }
  return imageUrl;
}

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

// ─── Store Helper ────────────────────────────────────────────────────────────
const STORE_COLORS = ["#8B6F47", "#5A7C8B", "#6B3A8B", "#2D5A2D", "#8B475D"];
function getStoreUI(id: number, name: string) {
  const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "TK";
  const color = STORE_COLORS[id % STORE_COLORS.length];
  return { avatar: initials, color };
}

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
    <div className="flex items-center justify-center mb-8">
      {safeSteps.map((s, i) => {
        const done = current > s.step;
        const active = current === s.step;
        const Icon = s.icon;
        return (
          <div key={s.step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: done ? "#8B6F47" : active ? "linear-gradient(135deg, #3D2B1F, #8B6F47)" : "rgba(212,184,139,0.2)",
                  scale: active ? 1.1 : 1,
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
              >
                {done ? (
                  <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: active ? "#FAF8F5" : "#A89B8F" }} />
                )}
              </motion.div>
              <span className="text-[10px] sm:text-xs font-medium hidden sm:block" style={{ color: active ? "#3D2B1F" : "#A89B8F" }}>
                {s.label}
              </span>
            </div>
            {i < safeSteps.length - 1 && (
              <div
                className="w-8 sm:w-12 lg:w-20 h-0.5 mx-1 sm:mx-2 transition-all duration-500 flex-shrink-0 sm:mb-4"
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
  const { fetchFullCart, updateQuantity: updateCartQuantity, removeItem: removeCartItem, refreshCart, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [approvedStores, setApprovedStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load step from sessionStorage or location state
  const [step, setStep] = useState<CheckoutStep>(() => {
    const savedStep = sessionStorage.getItem('checkoutStep');
    if (savedStep) return parseInt(savedStep, 10) as CheckoutStep;
    return ((location.state as any)?.step) || 1;
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [finalHasCustom, setFinalHasCustom] = useState<boolean>(false);
  
  // Dari penolakan negosiasi - paksa flow ke Pilih Toko
  const forceCustomStep = !!(location.state as any)?.forceCustomStep;
  const restoredItem = (location.state as any)?.restoredItem || null;

  // Step 2 — Alamat (load from sessionStorage)
  const [address, setAddress] = useState<ShippingAddress>(() => {
    const savedAddress = sessionStorage.getItem('checkoutAddress');
    if (savedAddress) return JSON.parse(savedAddress);
    return ((location.state as any)?.address) || {
      name: user?.user_metadata?.full_name || "",
      phone: "",
      street: "",
      city: "",
      province: "",
      postal_code: "",
    };
  });
  const [addressErrors, setAddressErrors] = useState<Partial<ShippingAddress>>({});
  
  const [notes, setNotes] = useState<string>(() => {
    return sessionStorage.getItem('checkoutNotes') || "";
  });

  // Payment proof states
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofFileName, setPaymentProofFileName] = useState<string | null>(null);
  const [paymentSenderName, setPaymentSenderName] = useState("");
  const [paymentBankFrom, setPaymentBankFrom] = useState("");

  // Address Book state in Cart
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressSelectModal, setShowAddressSelectModal] = useState(false);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  
  const [newAddressForm, setNewAddressForm] = useState({
    label: "Rumah",
    recipient_name: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
  });

  const fetchSavedAddresses = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingAddresses(true);
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSavedAddresses(data || []);
      
      // Auto-select default address
      if (data && data.length > 0) {
        const defaultAddr = data.find((a: any) => a.is_default) || data[0];
        setAddress({
          name: defaultAddr.recipient_name,
          phone: defaultAddr.phone,
          street: defaultAddr.street,
          city: defaultAddr.city,
          province: defaultAddr.province,
          postal_code: defaultAddr.postal_code,
        });
      }
    } catch (err) {
      console.error("Gagal memuat alamat tersimpan:", err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  // Step 3 — Pembayaran (load from sessionStorage)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    return (sessionStorage.getItem('checkoutPaymentMethod') as PaymentMethod) || "transfer_bca";
  });

  // Step 3 — Pilih Toko (custom flow, load from sessionStorage)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('checkoutSelectedStoreId');
    return saved ? parseInt(saved, 10) : null;
  });

  const SHIPPING_COST = 20000;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCartItems = useCallback(async (showLoading = true) => {
    if (!user) { setLoading(false); return; }
    try {
      if (showLoading) setLoading(true);
      const data = await fetchFullCart();
      setCartItems(data || []);
    } catch (err) {
      toast.error("Gagal memuat keranjang belanja");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id, fetchFullCart]);

  // Save checkout state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('checkoutStep', step.toString());
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem('checkoutAddress', JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    sessionStorage.setItem('checkoutNotes', notes);
  }, [notes]);

  useEffect(() => {
    sessionStorage.setItem('checkoutPaymentMethod', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    if (selectedStoreId) {
      sessionStorage.setItem('checkoutSelectedStoreId', selectedStoreId.toString());
    } else {
      sessionStorage.removeItem('checkoutSelectedStoreId');
    }
  }, [selectedStoreId]);

  // Clear sessionStorage when order is successful
  useEffect(() => {
    if (successOrderId) {
      sessionStorage.removeItem('checkoutStep');
      sessionStorage.removeItem('checkoutAddress');
      sessionStorage.removeItem('checkoutNotes');
      sessionStorage.removeItem('checkoutPaymentMethod');
      sessionStorage.removeItem('checkoutSelectedStoreId');
      sessionStorage.removeItem('checkoutRestoredItem');
      sessionStorage.removeItem('forceCustomStep');
    }
  }, [successOrderId]);

  useEffect(() => { 
    let mounted = true;

    const initData = async () => {
      if (!user?.id || !mounted) return;
      
      // Fetch data without showing full-page loader if we already have items
      const showLoader = cartItems.length === 0;
      await Promise.all([
        fetchCartItems(showLoader),
        fetchSavedAddresses()
      ]);

      if (!mounted) return;
      const { data } = await supabase.from("stores").select("*").eq("status", "approved");
      if (data && mounted) setApprovedStores(data);
    };

    initData();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only re-run if user identity changes, not on token refresh

  // ── Quantity ──────────────────────────────────────────────────────────────
  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    try {
      await updateCartQuantity(id, newQty);
    } catch {
      toast.error("Gagal mengubah jumlah"); 
      fetchCartItems();
    }
  };

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeItem = async (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    try {
      await removeCartItem(id);
      toast.success("Barang dihapus dari keranjang");
    } catch {
      toast.error("Gagal menghapus barang"); 
      fetchCartItems();
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
    if (!user) return;
    // Allow proceeding if forceCustomStep+restoredItem (empty cart due to missing notes column)
    if (cartItems.length === 0 && !(forceCustomStep && restoredItem)) return;
    if (hasCustomItems && !selectedStoreId) {
      toast.error("Silakan pilih toko pengrajin terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const store = approvedStores.find(s => s.id === selectedStoreId);

      // Build orders from cart items OR from restoredItem if cart is empty
      let ordersToInsert: any[] = [];

      if (cartItems.length > 0) {
        ordersToInsert = cartItems.map(item => {
          const bItem = item.batik_items;
          const cItem = item.custom_designs;
          
          let restoredData: any = null;
          try { if (item.notes) { const n = JSON.parse(item.notes); if (n.restored_from_order) restoredData = n; } } catch {}

          let cData = null;
          try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}
          const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;
          
          const isCustom = !bItem && (!!cItem || !!restoredData);
          const price = bItem ? bItem.price : 0;
          const name = bItem ? bItem.name : (cData?.projectInfo?.name || (restoredData ? restoredData.item : "Desain Batik Kustom"));
          const desc = bItem ? bItem.description : "Karya seni batik kustom buatan Anda sendiri.";

          return {
            id: orderId,
            user_id: user.id,
            item: name,
            description: desc,
            status: isCustom ? "negotiating" : "processing",
            total: bItem ? ((price * item.quantity) + SHIPPING_COST) : 0,
            type: bItem?.category || "custom",
            primary_color: bItem?.primary_color || "#3D2B1F",
            secondary_color: bItem?.secondary_color || "#D4B88B",
            bg_color: bItem?.image_url || cData?.canvasThumbnail || cData?.canvasBackground || restoredData?.bg_color || "#FAF8F5",
            artisan: hasCustomItems && store ? store.name : "RekaBatik Artisan",
            can_review: false,
            reviewed: false,
            date: new Date().toISOString(),
            quantity: item.quantity,
            payment_method: hasCustomItems ? "cod" : paymentMethod,
            payment_status: isCustom ? "pending" : "paid",
            shipping_address: address,
            notes: notes || null,
          };
        });
      } else if (forceCustomStep && restoredItem) {
        // Cart is empty — restored item from rejected negotiation (notes column missing)
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;
        ordersToInsert = [{
          id: orderId,
          user_id: user.id,
          item: restoredItem.item || "Desain Batik Kustom",
          description: "Karya seni batik kustom buatan Anda sendiri.",
          status: "negotiating",
          total: 0,
          type: "custom",
          primary_color: "#3D2B1F",
          secondary_color: "#D4B88B",
          bg_color: restoredItem.bg_color || "#FAF8F5",
          artisan: store ? store.name : "RekaBatik Artisan",
          can_review: false,
          reviewed: false,
          date: new Date().toISOString(),
          quantity: restoredItem.quantity || 1,
          payment_method: "cod",
          payment_status: "pending",
          shipping_address: address,
          notes: null,
        }];
      }

      // Check transfer constraints
      const isBankTransfer = paymentMethod === "transfer_bca" || paymentMethod === "transfer_mandiri";
      if (isBankTransfer && !hasCustomItems) {
        if (!paymentSenderName.trim()) return toast.error("Masukkan nama pengirim transfer.");
        if (!paymentBankFrom.trim()) return toast.error("Masukkan asal bank transfer.");
        if (!paymentProofFile) return toast.error("Silakan unggah bukti transfer pembayaran.");
      }

      // Upload file first if exists
      let uploadedUrl: string | null = null;
      if (isBankTransfer && paymentProofFile && !hasCustomItems) {
        const fileExt = paymentProofFile.name.split('.').pop();
        const pathName = `receipts/orders-${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("store-images")
          .upload(pathName, paymentProofFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("store-images")
          .getPublicUrl(pathName);
        uploadedUrl = publicUrlData?.publicUrl || null;
      }

      // Add proof url to orders
      if (ordersToInsert.length > 0) {
        ordersToInsert = ordersToInsert.map(o => ({
          ...o,
          payment_proof_url: uploadedUrl,
          notes: o.notes ? `${o.notes} (Transfer oleh: ${paymentSenderName} via ${paymentBankFrom})` : `Transfer oleh: ${paymentSenderName} via ${paymentBankFrom}`
        }));
      }

      const { error: insertError } = await supabase.from("orders").insert(ordersToInsert).select();
      if (insertError) throw insertError;

      // Auto-send template message for custom orders
      const customOrders = ordersToInsert.filter(o => o.status === "negotiating");
      if (customOrders.length > 0) {
        const templateMessages = customOrders.map(order => ({
          order_id: order.id,
          sender_id: user.id,
          sender_role: "user",
          message: `Halo Min, saya ingin membuat batik dengan desain seperti gambar yang saya lampirkan.\n\nDetail Pesanan:\n- Item: ${order.item}\n- Jumlah: ${order.quantity} pcs\n\nApakah desain ini bisa dikerjakan? Mohon estimasi harga dan waktunya ya. Terima kasih!`,
          status: "sent",
          attachment: order.bg_color?.startsWith("data:image") ? order.bg_color : null
        }));
        await supabase.from("messages").insert(templateMessages);
      }

      // Save address to book if user checked the option
      if (saveToAddressBook && user) {
        try {
          const isFirst = savedAddresses.length === 0;
          await supabase.from("user_addresses").insert([{
            user_id: user.id,
            label: "Rumah",
            recipient_name: address.name,
            phone: address.phone,
            street: address.street,
            city: address.city,
            province: address.province,
            postal_code: address.postal_code,
            is_default: isFirst,
          }]);
        } catch (err) {
          console.error("Gagal simpan alamat ke buku alamat:", err);
        }
      }

      // Clear cart from context and DB
      setFinalTotal(total);
      setFinalHasCustom(hasCustomItems);
      await clearCart();
      setCartItems([]);

      if (hasCustomItems && store) {
        // Collect custom design thumbnails for the chat opening message
        const customThumbnails = [
          ...cartItems
            .filter(i => (i.custom_designs && !i.batik_items) || (i.notes && i.notes.includes("restored_from_order")))
            .map(i => {
              if (i.notes && i.notes.includes("restored_from_order")) {
                 try { const n = JSON.parse(i.notes); return n.bg_color || null; } catch { return null; }
              }
              if (!i.custom_designs?.drawing_data) return null;
              try {
                const d = JSON.parse(i.custom_designs.drawing_data);
                return d?.canvasThumbnail || null;
              } catch { return null; }
            })
            .filter(Boolean),
          // Include restoredItem thumbnail if cart was empty
          ...(forceCustomStep && restoredItem && cartItems.length === 0 && restoredItem.bg_color ? [restoredItem.bg_color] : []),
        ];

        // Clear session storage and temporary state before navigating
      sessionStorage.removeItem('checkoutRestoredItem');
      sessionStorage.removeItem('forceCustomStep');
      sessionStorage.removeItem('checkoutStep'); // Reset step to 1
      setStep(1);

        // Redirect to chat with store info and custom design data
        navigate("/chat", {
          replace: true, // Use replace to prevent going back to cart with old state
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
        sessionStorage.removeItem('checkoutStep'); // Reset step to 1
        setStep(1);
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
  const hasCustomItems = forceCustomStep || cartItems.some(item => (item.custom_designs && !item.batik_items) || (item.notes && item.notes.includes("restored_from_order")));
  const total = hasRegularItems ? subtotal + SHIPPING_COST : 0;
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
  const selectedPayment = PAYMENT_OPTIONS.find(p => p.id === paymentMethod)!;
  const selectedStore = approvedStores.find(s => s.id === selectedStoreId);
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
                      {!finalHasCustom ? `Rp ${finalTotal.toLocaleString("id-ID")}` : "Rp xxx.xxx"}
                    </span>
              </div>
              
              {!finalHasCustom && (
                <div className="pt-4 mt-2 border-t" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
                  <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: "#7A6B5E" }}>
                    <span className="text-base">✓</span>
                    <span>Pembayaran pesanan katalog sudah tercatat dari checkout keranjang. Pesanan tinggal masuk proses pengiriman.</span>
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
    <div className="min-h-screen relative pb-20 w-full overflow-x-hidden" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(20%, -20%)" }} />

      <div className="container mx-auto px-4 pt-8 md:pt-12 relative z-10 max-w-5xl w-full">
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
          <div className="grid lg:grid-cols-3 gap-6 w-full">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : cartItems.length === 0 && step === 1 && !forceCustomStep ? (
          // ── EMPTY ───────────────────────────────────────────────────────
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white w-full"
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
          <div className="grid lg:grid-cols-12 gap-6 w-full">
            {/* ── LEFT: Step Content ─────────────────────────────────────── */}
            <div className="lg:col-span-8 w-full">
              <AnimatePresence mode="wait">

                {/* STEP 1: Cart Items */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 w-full">
                    {/* Restored item from rejected negotiation (when notes column not yet added) */}
                    {forceCustomStep && restoredItem && cartItems.length === 0 && (
                      <div className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-white w-full" style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}>
                        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center">
                          {restoredItem.bg_color?.startsWith("data:image") ? (
                            <img src={restoredItem.bg_color} alt="Desain" className="w-full h-full object-cover" />
                          ) : (
                            <Palette className="w-8 h-8 text-stone-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-sm sm:text-base" style={{ color: "#3D2B1F" }}>{restoredItem.item || "Desain Batik Kustom"}</h3>
                          <p className="text-xs mb-1" style={{ color: "#A89B8F" }}>RekaBatik Studio</p>
                          <span className="text-sm font-semibold" style={{ color: "#8B6F47" }}>Rp xxx.xxx <span className="font-normal text-xs">(harga via negosiasi)</span></span>
                        </div>
                      </div>
                    )}
                    <AnimatePresence>
                      {cartItems.map(item => {
                        const bItem = item.batik_items;
                        const cItem = item.custom_designs;
                        
                        let restoredData: any = null;
                        if (!bItem && !cItem) {
                          try {
                            if (item.notes) {
                              const n = JSON.parse(item.notes);
                              if (n.restored_from_order) restoredData = n;
                            }
                          } catch {}
                        }
                        
                        if (!bItem && !cItem && !restoredData) return null;

                        let cData = null;
                        try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}

                        const price = bItem ? bItem.price : 0;
                        const name = bItem ? bItem.name : (cData?.projectInfo?.name || (restoredData ? restoredData.item : "Desain Batik Kustom"));
                        const origin = bItem ? bItem.origin : "RekaBatik Studio";

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30, height: 0 }}
                            className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-white w-full"
                            style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                          >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center">
                              {bItem ? (
                                mapImageUrl(bItem.image_url) ? (
                                  <img src={mapImageUrl(bItem.image_url)} alt={bItem.name} className="w-full h-full object-cover" />
                                ) : (
                                  <PatternThumb bg={bItem.bg_color} primary={bItem.primary_color} />
                                )
                              ) : (cData?.canvasThumbnail || restoredData?.bg_color) ? (
                                <img src={cData?.canvasThumbnail || restoredData?.bg_color} alt="Custom Design" className="w-full h-full object-cover" />
                              ) : (
                                <Palette className="w-8 h-8 text-stone-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="font-semibold truncate text-sm sm:text-base w-full" style={{ color: "#3D2B1F" }}>{name}</h3>
                                <button onClick={() => removeItem(item.id)} className="flex-shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all group">
                                  <Trash2 className="w-4 h-4 transition-all group-hover:stroke-[2.5px] group-hover:scale-110" />
                                </button>
                              </div>
                              <p className="text-xs mb-3" style={{ color: "#A89B8F" }}>{origin}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                                <span className="font-bold text-sm sm:text-base w-full break-words" style={{ color: "#8B6F47" }}>
                                  {bItem ? (
                                    `Rp ${(price * item.quantity).toLocaleString("id-ID")}`
                                  ) : (
                                    <span className="text-sm">Rp xxx.xxx</span>
                                  )}
                                  {bItem && item.quantity > 1 && <span className="text-xs font-normal ml-1" style={{ color: "#A89B8F" }}>(Rp {price.toLocaleString("id-ID")} × {item.quantity})</span>}
                                </span>
                                <div className="flex items-center rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1.5px solid rgba(139,111,71,0.2)" }}>
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
                    className="p-6 rounded-2xl bg-white space-y-5 w-full"
                    style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Alamat Pengiriman</h2>
                      {savedAddresses.length > 0 && (
                        <button
                          onClick={() => setShowAddressSelectModal(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                          style={{ background: "rgba(139,111,71,0.08)", color: "#8B6F47", border: "1px solid rgba(139,111,71,0.2)" }}
                        >
                          <BookUser className="w-3.5 h-3.5" />
                          Pilih Alamat Tersimpan
                        </button>
                      )}
                    </div>

                    {/* Selected address from book banner */}
                    {savedAddresses.length > 0 && address.name && (
                      <div
                        className="flex items-start gap-3 p-3.5 rounded-xl"
                        style={{ background: "rgba(139,111,71,0.05)", border: "1.5px solid rgba(139,111,71,0.2)" }}
                      >
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#8B6F47" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{address.name} · {address.phone}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#7A6B5E" }}>{address.street}, {address.city}, {address.province} {address.postal_code}</p>
                        </div>
                        <button
                          onClick={() => setShowAddressSelectModal(true)}
                          className="text-xs font-semibold flex-shrink-0"
                          style={{ color: "#8B6F47" }}
                        >
                          Ubah
                        </button>
                      </div>
                    )}

                    {/* Divider when address book exists */}
                    {savedAddresses.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ background: "rgba(212,184,139,0.25)" }} />
                        <span className="text-xs" style={{ color: "#A89B8F" }}>atau isi manual</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(212,184,139,0.25)" }} />
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Nama Penerima</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#B8A898" }} />
                        <input
                          type="text"
                          value={address.name}
                          onChange={e => { setAddress(prev => ({ ...prev, name: e.target.value })); setAddressErrors(prev => ({ ...prev, name: undefined })); }}
                          placeholder="Nama lengkap"
                          className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all hover:border-amber-200 focus:border-[#8B6F47]"
                          style={{
                            border: `1.5px solid ${addressErrors.name ? "#ef4444" : "rgba(139,111,71,0.2)"}`,
                            background: "#FAFAF8",
                            color: "#3D2B1F",
                          }}
                        />
                      </div>
                      {addressErrors.name && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Nomor HP</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#B8A898" }} />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={address.phone}
                          onChange={e => { 
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setAddress(prev => ({ ...prev, phone: val })); 
                            setAddressErrors(prev => ({ ...prev, phone: undefined })); 
                          }}
                          placeholder="08xx-xxxx-xxxx"
                          className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all hover:border-amber-200 focus:border-[#8B6F47]"
                          style={{
                            border: `1.5px solid ${addressErrors.phone ? "#ef4444" : "rgba(139,111,71,0.2)"}`,
                            background: "#FAFAF8",
                            color: "#3D2B1F",
                          }}
                        />
                      </div>
                      {addressErrors.phone && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.phone}</p>}
                    </div>

                    {/* Province */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Provinsi</label>
                      <Select
                        value={address.province}
                        onValueChange={(newProvince) => { 
                          setAddress(prev => ({ 
                            ...prev, 
                            province: newProvince, 
                            city: "", 
                            postal_code: "" 
                          })); 
                          setAddressErrors(prev => ({ ...prev, province: undefined, city: undefined, postal_code: undefined })); 
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full px-4 py-3 rounded-xl text-sm transition-all",
                            addressErrors.province ? "border-red-500" : "border-[rgba(139,111,71,0.2)]"
                          )}
                          style={{ 
                            background: "#FAFAF8", 
                            color: address.province ? "#3D2B1F" : "#C4B5A5"
                          }}
                        >
                          <SelectValue placeholder="Pilih Provinsi" />
                        </SelectTrigger>
                        <SelectContent sideOffset={6} className="max-h-[300px]">
                          {PROVINCES.map(p => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addressErrors.province && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.province}</p>}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Kota / Kabupaten</label>
                      <Select
                        value={address.city}
                        onValueChange={(newCity) => { 
                          setAddress(prev => ({ 
                            ...prev, 
                            city: newCity
                          })); 
                          setAddressErrors(prev => ({ ...prev, city: undefined, postal_code: undefined })); 
                        }}
                        disabled={!address.province}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full px-4 py-3 rounded-xl text-sm transition-all",
                            addressErrors.city ? "border-red-500" : "border-[rgba(139,111,71,0.2)]"
                          )}
                          style={{ 
                            background: "#FAFAF8", 
                            color: address.city ? "#3D2B1F" : "#C4B5A5"
                          }}
                        >
                          <SelectValue placeholder="Pilih Kota / Kabupaten" />
                        </SelectTrigger>
                        <SelectContent sideOffset={6} className="max-h-[300px]">
                          {INDONESIAN_LOCATIONS.find(loc => loc.province === address.province)?.cities.map(city => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addressErrors.city && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.city}</p>}
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Nama Jalan, Gedung, No. Rumah</label>
                      <div className="relative">
                        <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#B8A898" }} />
                        <input
                          type="text"
                          value={address.street}
                          onChange={e => { setAddress(prev => ({ ...prev, street: e.target.value })); setAddressErrors(prev => ({ ...prev, street: undefined })); }}
                          placeholder="Nama jalan, gedung, nomor rumah, RT/RW, kelurahan"
                          className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all hover:border-amber-200 focus:border-[#8B6F47]"
                          style={{
                            border: `1.5px solid ${addressErrors.street ? "#ef4444" : "rgba(139,111,71,0.2)"}`,
                            background: "#FAFAF8",
                            color: "#3D2B1F",
                          }}
                        />
                      </div>
                      {addressErrors.street && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.street}</p>}
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>Kode Pos</label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#B8A898" }} />
                        <input
                          type="text"
                          value={address.postal_code}
                          onChange={e => { setAddress(prev => ({ ...prev, postal_code: e.target.value })); setAddressErrors(prev => ({ ...prev, postal_code: undefined })); }}
                          placeholder="5 digit kode pos"
                          maxLength={5}
                          className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all hover:border-amber-200 focus:border-[#8B6F47]"
                          style={{
                            border: `1.5px solid ${addressErrors.postal_code ? "#ef4444" : "rgba(139,111,71,0.2)"}`,
                            background: "#FAFAF8",
                            color: "#3D2B1F",
                          }}
                        />
                      </div>
                      {addressErrors.postal_code && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{addressErrors.postal_code}</p>}
                    </div>

                    {/* Save to address book */}
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-all" style={{ background: saveToAddressBook ? "rgba(139,111,71,0.06)" : "transparent", border: `1px solid ${saveToAddressBook ? "rgba(139,111,71,0.25)" : "rgba(212,184,139,0.15)"}` }}>
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={saveToAddressBook}
                          onChange={e => setSaveToAddressBook(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center transition-all"
                          style={{ background: saveToAddressBook ? "#8B6F47" : "transparent", border: `1.5px solid ${saveToAddressBook ? "#8B6F47" : "rgba(139,111,71,0.4)"}` }}
                        >
                          {saveToAddressBook && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>Simpan alamat ini ke Buku Alamat</p>
                        <p className="text-xs" style={{ color: "#A89B8F" }}>Alamat akan tersimpan dan bisa dipilih saat checkout berikutnya</p>
                      </div>
                    </label>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#5A4A3E" }}>
                        <span className="flex items-center gap-1.5"><StickyNote className="w-4 h-4" />Catatan Pesanan <span style={{ color: "#A89B8F" }}>(Opsional)</span></span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Contoh: Pilih warna latar transparan, tambahkan pagar hitam..."
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
                      className="p-6 rounded-2xl bg-white w-full"
                      style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
                    >
                      <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pilih Toko Pengrajin</h2>
                      <p className="text-sm mb-6" style={{ color: "#7A6B5E" }}>Pilih toko pengrajin batik yang ingin Anda ajak berdiskusi tentang desain dan harga.</p>
                      <div className="space-y-3">
                        {approvedStores.map(store => {
                          const ui = getStoreUI(store.id, store.name);
                          return (
                          <motion.button
                            key={store.id}
                            onClick={() => setSelectedStoreId(store.id)}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                            style={{
                              border: selectedStoreId === store.id ? `2px solid ${ui.color}` : "1.5px solid rgba(139,111,71,0.2)",
                              background: selectedStoreId === store.id ? `rgba(${parseInt(ui.color.slice(1,3),16)},${parseInt(ui.color.slice(3,5),16)},${parseInt(ui.color.slice(5,7),16)},0.05)` : "#FAFAF8",
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: ui.color }}>
                              {ui.avatar}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: "#3D2B1F" }}>{store.name}</p>
                              <p className="text-xs" style={{ color: "#A89B8F" }}>{store.specialty || "Pengrajin Batik"}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0`} style={{ borderColor: selectedStoreId === store.id ? ui.color : "rgba(139,111,71,0.3)" }}>
                              {selectedStoreId === store.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: ui.color }} />}
                            </div>
                          </motion.button>
                        )})}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="step3-normal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="p-6 rounded-2xl bg-white w-full"
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
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 w-full">
                    {/* Items Review */}
                    <div className="p-5 rounded-2xl bg-white w-full" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                      <h3 className="font-semibold mb-3" style={{ color: "#3D2B1F" }}>Barang Pesanan</h3>
                      {cartItems.map(item => {
                        const bItem = item.batik_items;
                        const cItem = item.custom_designs;
                        
                        let restoredData: any = null;
                        if (!bItem && !cItem) {
                          try {
                            if (item.notes) {
                              const n = JSON.parse(item.notes);
                              if (n.restored_from_order) restoredData = n;
                            }
                          } catch {}
                        }
                        
                        if (!bItem && !cItem && !restoredData) return null;
                        
                        let cData = null;
                        try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}

                        const price = bItem ? bItem.price : 0;
                        const name = bItem ? bItem.name : (cData?.projectInfo?.name || (restoredData ? restoredData.item : "Desain Batik Kustom"));
                        return (
                          <div key={item.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 flex items-center justify-center">
                              {bItem ? (
                                mapImageUrl(bItem.image_url) ? (
                                  <img src={mapImageUrl(bItem.image_url)} alt={bItem.name} className="w-full h-full object-cover" />
                                ) : (
                                  <PatternThumb bg={bItem.bg_color} primary={bItem.primary_color} />
                                )
                              ) : (cData?.canvasThumbnail || restoredData?.bg_color) ? (
                                <img src={cData?.canvasThumbnail || restoredData?.bg_color} alt="Custom" className="w-full h-full object-cover" />
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
                    <div className="p-5 rounded-2xl bg-white w-full" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
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
                      <div className="p-5 rounded-2xl bg-white w-full" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
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
                      <div className="p-5 rounded-2xl bg-white w-full" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4" style={{ color: "#8B6F47" }} />
                          <h3 className="font-semibold" style={{ color: "#3D2B1F" }}>Metode Pembayaran</h3>
                        </div>
                        <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{selectedPayment.icon} {selectedPayment.label}</p>
                        <p className="text-xs" style={{ color: "#A89B8F" }}>{selectedPayment.desc}</p>
                      </div>
                    )}

                    {/* Step 4 Professional Payment details for Bank Transfers */}
                    {(paymentMethod === "transfer_bca" || paymentMethod === "transfer_mandiri") && !hasCustomItems && (
                      <div className="p-5 rounded-2xl bg-white w-full space-y-4" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4" style={{ color: "#8B6F47" }} />
                          <h3 className="font-semibold" style={{ color: "#3D2B1F" }}>Instruksi Transfer Bank</h3>
                        </div>
                        
                        <div className="p-3.5 rounded-xl space-y-3" style={{ background: "#FAF8F5", border: "1px solid rgba(139,111,71,0.1)" }}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8E7F72]">Bank Tujuan</span>
                            <span className="font-bold text-[#3D2B1F]">{paymentMethod === "transfer_bca" ? "BCA" : "Mandiri"}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8E7F72]">Nomor Rekening</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#3D2B1F]">
                                {paymentMethod === "transfer_bca" ? "880 000 1234 56" : "140 000 1234 567"}
                              </span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(paymentMethod === "transfer_bca" ? "880000123456" : "1400001234567");
                                  toast.success("Nomor rekening disalin!");
                                }}
                                className="p-1 hover:bg-stone-200 rounded transition-colors text-[#8B6F47]"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8E7F72]">Atas Nama</span>
                            <span className="text-[#5A4A3E]">RekaBatik</span>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t pt-2" style={{ borderColor: "rgba(139,111,71,0.1)" }}>
                            <span className="text-[#8E7F72] font-semibold">Total Transfer</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#8B6F47] text-sm">
                                Rp {(total).toLocaleString("id-ID")}
                              </span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(String(total));
                                  toast.success("Nominal disalin!");
                                }}
                                className="p-1 hover:bg-stone-200 rounded transition-colors text-[#8B6F47]"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sender Fields */}
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-[#8E7F72] mb-1">Nama Pengirim Transfer *</label>
                            <input 
                              type="text"
                              value={paymentSenderName}
                              onChange={e => setPaymentSenderName(e.target.value)}
                              placeholder="cth: Budi Santoso"
                              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-[#8B6F47]"
                              style={{ borderColor: "rgba(139,111,71,0.2)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#8E7F72] mb-1">Asal Bank Transfer *</label>
                            <input 
                              type="text"
                              value={paymentBankFrom}
                              onChange={e => setPaymentBankFrom(e.target.value)}
                              placeholder="cth: BCA Tabungan, Mandiri Mandiri"
                              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-[#8B6F47]"
                              style={{ borderColor: "rgba(139,111,71,0.2)" }}
                            />
                          </div>
                          
                          {/* Bukti File Upload */}
                          <div>
                            <label className="block text-xs font-semibold text-[#8E7F72] mb-1">Bukti Transfer (Wajib) *</label>
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              className="hidden"
                              id="order-payment-file"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  if (f.size > 5 * 1024 * 1024) return toast.error("Ukuran file maksimal 5MB");
                                  setPaymentProofFile(f);
                                  setPaymentProofFileName(f.name);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById("order-payment-file")?.click()}
                              className="w-full py-2.5 border border-dashed rounded-xl flex items-center justify-center gap-2 text-xs transition-colors hover:border-[#8B6F47]"
                              style={{ borderColor: paymentProofFileName ? "#8B6F47" : "rgba(139,111,71,0.3)", color: paymentProofFileName ? "#8B6F47" : "#8E7F72" }}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {paymentProofFileName || "Unggah Bukti Transfer (Gambar / PDF)"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6 w-full">
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
              <div className="lg:sticky lg:top-24 p-6 rounded-2xl bg-white w-full" style={{ border: "1px solid rgba(212,184,139,0.25)", boxShadow: "0 8px 30px rgba(61,43,31,0.04)" }}>
                <h3 className="font-bold text-lg mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Ringkasan</h3>
                <div className="space-y-3 mb-4">
                  {cartItems.map(item => {
                    const bItem = item.batik_items;
                    const cItem = item.custom_designs;
                    if (!bItem && !cItem) return null;
                    const price = bItem ? bItem.price : 0;
                    let cData = null;
                    try { if (cItem?.drawing_data) cData = JSON.parse(cItem.drawing_data); } catch {}
                    const name = bItem ? bItem.name : (cData?.projectInfo?.name || "Desain Batik Kustom");
                    return (
                      <div key={item.id} className="flex justify-between text-sm gap-2">
                        <span className="truncate flex-1 min-w-0" style={{ color: "#7A6B5E" }}>{name} ×{item.quantity}</span>
                        <span className="font-medium flex-shrink-0" style={{ color: "#5A4A3E" }}>
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

      {/* ── Address Select Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddressSelectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setShowAddressSelectModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white overflow-hidden"
              style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.2)", maxHeight: "85vh" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(212,184,139,0.2)" }}>
                <div className="flex items-center gap-2">
                  <BookUser className="w-5 h-5" style={{ color: "#8B6F47" }} />
                  <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pilih Alamat</h3>
                </div>
                <button
                  onClick={() => setShowAddressSelectModal(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                  style={{ color: "#7A6B5E" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Address List */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 130px)" }}>
                {loadingAddresses ? (
                  <div className="p-6 space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(212,184,139,0.15)" }} />
                    ))}
                  </div>
                ) : savedAddresses.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: "#8B6F47" }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: "#3D2B1F" }}>Belum Ada Alamat Tersimpan</p>
                    <p className="text-xs" style={{ color: "#9B8C80" }}>Simpan alamat Anda melalui halaman Profil &gt; Alamat Saya</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {savedAddresses.map((addr: any) => {
                      const isSelected =
                        address.name === addr.recipient_name &&
                        address.phone === addr.phone &&
                        address.street === addr.street;
                      return (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setAddress({
                              name: addr.recipient_name,
                              phone: addr.phone,
                              street: addr.street,
                              city: addr.city,
                              province: addr.province,
                              postal_code: addr.postal_code,
                            });
                            setSaveToAddressBook(false);
                            setShowAddressSelectModal(false);
                          }}
                          className="w-full text-left p-4 rounded-2xl transition-all relative overflow-hidden"
                          style={{
                            border: isSelected ? "2px solid #8B6F47" : "1.5px solid rgba(212,184,139,0.2)",
                            background: isSelected ? "rgba(139,111,71,0.05)" : "#FAFAF8",
                          }}
                        >
                          {/* Corner badge for default */}
                          {addr.is_default && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#8B6F47] text-white uppercase tracking-wider">Utama</span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5`} style={{ borderColor: isSelected ? "#8B6F47" : "rgba(139,111,71,0.3)" }}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#8B6F47]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(139,111,71,0.1)", color: "#8B6F47" }}>{addr.label}</span>
                              </div>
                              <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{addr.recipient_name} · {addr.phone}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#7A6B5E" }}>{addr.street}, {addr.city}, {addr.province} {addr.postal_code}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
                <button
                  onClick={() => {
                    setShowAddressSelectModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)", color: "#fff" }}
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
