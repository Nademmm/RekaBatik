import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import {
  MessageCircle, Send, ChevronLeft, Search,
  CheckCheck, Check, X,
  CheckCircle, XCircle, Tag, AlertTriangle, Loader2,
  ShoppingCart, Store, Image as ImageIcon, Handshake,
} from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DBMessage {
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

interface StoreConvo {
  storeName: string;
  storeAvatar: string;
  storeColor: string;
  orderIds: string[];
  latestOrderId: string;
  lastMessage?: string;
  lastTime?: string;
  hasNegotiating: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function formatLastTime(s: string) {
  const now = new Date();
  const d = new Date(s);
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt`;
  if (diff < 86400000) return formatTime(s);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}
function avatarColor(str: string) {
  const colors = ["#8B6F47", "#5A7C8B", "#6B3A8B", "#2D5A2D", "#8B3A3A", "#3A5A8B"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
function avatarInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Accept Confirmation Dialog ─────────────────────────────────────────────
function AcceptConfirmDialog({ onCancel, onConfirm, loading, price }: {
  onCancel: () => void; onConfirm: () => void; loading: boolean; price: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(22,163,74,0.1)" }}>
          <CheckCircle className="w-7 h-7" style={{ color: "#16A34A" }} />
        </div>
        <h3 className="text-lg font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
          Setujui Penawaran Harga?
        </h3>
        <p className="text-sm text-center mb-2" style={{ color: "#7A6B5E", lineHeight: 1.7 }}>
          Anda akan menyetujui harga sebesar:
        </p>
        <p className="text-2xl font-bold text-center mb-6" style={{ color: "#8B6F47" }}>
          {formatCurrency(price)}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ border: "1.5px solid rgba(139,111,71,0.2)", color: "#7A6B5E" }}>
            Batal
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" />Ya, Setuju</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Rejection Confirmation Dialog ───────────────────────────────────────────
function RejectConfirmDialog({ onCancel, onConfirm, loading }: {
  onCancel: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,43,31,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6"
        style={{ boxShadow: "0 30px 80px rgba(61,43,31,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertTriangle className="w-7 h-7" style={{ color: "#EF4444" }} />
        </div>
        <h3 className="text-lg font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
          Tolak Penawaran Harga?
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: "#7A6B5E", lineHeight: 1.7 }}>
          Menolak harga akan <strong>membatalkan pesanan ini</strong>. Riwayat chat akan tetap tersimpan.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ border: "1.5px solid rgba(139,111,71,0.2)", color: "#7A6B5E" }}>
            Batal
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4" />Ya, Tolak</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ChatPage ────────────────────────────────────────────────────────────
export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<StoreConvo[]>([]);
  const [activeStoreName, setActiveStoreName] = useState<string | null>(null);
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // Confirmation flows
  const [pendingRejectMsg, setPendingRejectMsg] = useState<{ id: string; orderId: string; priceOffer?: number; itemName?: string } | null>(null);
  const [pendingAcceptMsg, setPendingAcceptMsg] = useState<{ id: string; orderId: string; price: number } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [acceptingMsgId, setAcceptingMsgId] = useState<string | null>(null);

  // Negotiation question chip flow
  const [showNegotiationOptions, setShowNegotiationOptions] = useState<string | null>(null); // msgId
  const [sendingNegotiation, setSendingNegotiation] = useState(false);

  // Clear any old stale respondedOffers cache on mount
  useEffect(() => {
    try {
      localStorage.removeItem("rekabatik_responded_offers_v2");
    } catch {}
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const processedCheckoutRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load conversations grouped by store ───────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvos(true);
    const { data: orders } = await supabase
      .from("orders")
      .select("id, artisan, status, date, total")
      .eq("user_id", user.id)
      .in("status", ["negotiating", "processing", "shipping", "delivered", "cancelled"])
      .order("date", { ascending: false });

    if (orders && orders.length > 0) {
      // Group by artisan (store name)
      const storeMap = new Map<string, StoreConvo>();
      for (const o of orders) {
        const storeName = o.artisan || "Toko Batik";
        if (!storeMap.has(storeName)) {
          storeMap.set(storeName, {
            storeName,
            storeAvatar: avatarInitials(storeName),
            storeColor: avatarColor(storeName),
            orderIds: [],
            latestOrderId: o.id,
            hasNegotiating: false,
          });
        }
        const conv = storeMap.get(storeName)!;
        conv.orderIds.push(o.id);
        if (o.status === "negotiating") conv.hasNegotiating = true;
      }

      // Fetch last message per store
      const convos = await Promise.all(
        Array.from(storeMap.values()).map(async (conv) => {
          const { data: lastMsgs } = await supabase
            .from("messages")
            .select("message, created_at")
            .in("order_id", conv.orderIds)
            .order("created_at", { ascending: false })
            .limit(1);
          const last = lastMsgs?.[0];
          const latestOrder = orders.find(o => o.id === conv.latestOrderId);
          return { ...conv, lastMessage: last?.message, lastTime: last?.created_at || latestOrder?.date } as StoreConvo;
        })
      );
      setConversations(convos);
    } else {
      setConversations([]);
    }
    setLoadingConvos(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Auto-select most recent conversation on load/refresh
  useEffect(() => {
    // Skip auto-select if navigating from checkout (has its own store selection)
    if (location.state?.fromCheckout) return;
    if (conversations.length > 0 && !activeStoreName) {
      const first = conversations[0];
      setActiveStoreName(first.storeName);
      setActiveOrderIds(first.orderIds);
    }
  }, [conversations]);

  // ── Handle checkout navigation ─────────────────────────────────────────────
  useEffect(() => {
    if (!user || !location.state?.fromCheckout || !location.state?.storeId) return;
    const { orderId } = location.state;
    const checkoutKey = `${user.id}-${orderId}`;
    if (processedCheckoutRef.current === checkoutKey) return;
    processedCheckoutRef.current = checkoutKey;

    setTimeout(async () => {
      await fetchConversations();
      if (orderId) {
        const { data: orderData } = await supabase.from("orders").select("artisan").eq("id", orderId).single();
        if (orderData?.artisan) {
          const { data: storeOrders } = await supabase.from("orders").select("id").eq("user_id", user.id).eq("artisan", orderData.artisan);
          if (storeOrders) {
            setActiveStoreName(orderData.artisan);
            setActiveOrderIds(storeOrders.map(o => o.id));
          }
        }
        setMobileShowChat(true);
      }
    }, 1200);
  }, [user, location.state, fetchConversations]);

  // ── Fetch messages for all orders of active store ─────────────────────────
  const fetchMessages = useCallback(async (orderIds: string[]) => {
    if (!orderIds.length) return;
    const { data } = await supabase
      .from("messages").select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as DBMessage[]);
  }, []);

  useEffect(() => {
    if (!activeStoreName || !activeOrderIds.length) return;
    fetchMessages(activeOrderIds);

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`chat-store-${activeStoreName.replace(/\s+/g, "-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as DBMessage;
        if (activeOrderIds.includes(msg.order_id)) setMessages((prev) => [...prev, msg]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as DBMessage;
        if (activeOrderIds.includes(msg.order_id))
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeStoreName, activeOrderIds, fetchMessages]);

  // Scroll helpers
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Auto-scroll: always on first load, conditionally after (only if near bottom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;
    if (isInitialLoadRef.current) {
      // First batch of messages — always scroll to bottom instantly
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    } else {
      // Subsequent messages — only scroll if user is near bottom
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
      if (isAtBottom) container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Reset initial load flag when switching conversations
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [activeStoreName]);

  // Scroll to bottom when browser tab regains focus (visibilitychange)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => scrollToBottom("instant"), 100);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const activeConvo = conversations.find((c) => c.storeName === activeStoreName);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const targetOrderId = activeConvo?.latestOrderId;
    if (!inputText.trim() || !targetOrderId || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert([{
      order_id: targetOrderId, sender_id: user.id, sender_role: "user",
      message: inputText.trim(), status: "sent",
    }]);
    if (error) toast.error("Gagal mengirim pesan");
    else setInputText("");
    setSending(false);
  };

  // ── Handle image upload ──────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const targetOrderId = activeConvo?.latestOrderId;
      if (!targetOrderId || !user) return;
      setSending(true);
      const { error } = await supabase.from("messages").insert([{
        order_id: targetOrderId,
        sender_id: user.id,
        sender_role: "user",
        message: "Mengirim gambar referensi...",
        attachment: base64,
        status: "sent",
      }]);
      if (error) toast.error("Gagal mengirim gambar");
      else toast.success("Gambar referensi terkirim!");
      setSending(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Accept offer ───────────────────────────────────────────────────────────
  const acceptOffer = async (msgId: string, price: number, orderId: string) => {
    if (!user || acceptingMsgId) return;
    setPendingAcceptMsg({ id: msgId, orderId, price });
  };

  const confirmAcceptOffer = async () => {
    if (!pendingAcceptMsg || !user) return;
    const { id: msgId, orderId, price } = pendingAcceptMsg;
    setAcceptingMsgId(msgId);
    setPendingAcceptMsg(null);
    await supabase.from("messages").update({ negotiation_status: "accepted" }).eq("id", msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, negotiation_status: "accepted" } : m));
    const buyerPrice = price;
    const { error } = await supabase.from("orders")
      .update({ total: buyerPrice, status: "processing", payment_status: "pending" })
      .eq("id", orderId).eq("user_id", user.id);
    if (error) { 
      console.error("Supabase Error Accept Offer:", error);
      toast.error(`Gagal menyetujui harga: ${error.message || "Kesalahan database"}`); 
      setAcceptingMsgId(null); 
      return; 
    }
    await supabase.from("messages").insert([{
      order_id: orderId, sender_id: user.id, sender_role: "user",
      message: `✅ Saya setuju dengan harga ${formatCurrency(buyerPrice)}. Terima kasih!`, status: "sent",
    }]);
    toast.success("Harga disetujui! Pesanan sedang diproses.");
    fetchConversations();
    setAcceptingMsgId(null);
    navigate("/orders", { state: { openPaymentFor: orderId } });
  };

  // ── Negotiation question chips ─────────────────────────────────────────────
  const NEGOTIATION_QUESTIONS = [
    "💬 Apakah harga ini bisa lebih fleksibel?",
    "🤝 Bolehkah saya menawar sedikit?",
    "📦 Apakah ada diskon untuk pembelian ini?",
    "🙏 Bisa tolong pertimbangkan harga yang lebih terjangkau?",
  ];

  const sendNegotiationQuestion = async (msgId: string, orderId: string, questionText: string) => {
    if (!user) return;
    setSendingNegotiation(true);
    try {
      await supabase.from("messages").insert([{
        order_id: orderId,
        sender_id: user.id,
        sender_role: "user",
        message: questionText,
        status: "sent",
      }]);
      setShowNegotiationOptions(null);
      toast.success("Pertanyaan dikirim! Tunggu balasan pengrajin 😊");
      fetchConversations();
    } catch {
      toast.error("Gagal mengirim pertanyaan");
    } finally {
      setSendingNegotiation(false);
    }
  };

  // ── Reject offer ──────────────────────────────────────────────────────────
  const confirmRejectOffer = async () => {
    if (!pendingRejectMsg || !user) return;
    const { id: msgId, orderId, priceOffer, itemName } = pendingRejectMsg;
    setRejectLoading(true);

    // Mark message as rejected
    await supabase.from("messages").update({ negotiation_status: "rejected" }).eq("id", msgId);

    // Cancel the order (don't delete — keep history)
    const { error } = await supabase.from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId).eq("user_id", user.id);

    if (error) {
      console.error("Supabase Error Reject Offer:", error);
      toast.error(`Gagal membatalkan pesanan: ${error.message || "Kesalahan database"}`);
      setRejectLoading(false);
      setPendingRejectMsg(null);
      return;
    }

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, negotiation_status: "rejected" } : m));

    // Build descriptive rejection message using item name + price offer
    const itemLabel = itemName ? `"${itemName}"` : "pesanan ini";
    const rejectText = priceOffer
      ? `❌ Saya tidak setuju dengan harga ${formatCurrency(priceOffer)} untuk ${itemLabel}. Pesanan dibatalkan — saya akan mencari toko lain.`
      : `❌ Saya tidak setuju dengan penawaran harga untuk ${itemLabel}. Pesanan dibatalkan — saya akan mencari toko lain.`;

    await supabase.from("messages").insert([{
      order_id: orderId, sender_id: user.id, sender_role: "user",
      message: rejectText, status: "sent",
    }]);

    setRejectLoading(false);
    setPendingRejectMsg(null);
    toast.success("Penawaran ditolak. Silakan pilih toko lain.");
    fetchConversations();
    // Navigate directly to CartPage step 3 (Pilih Toko) with forceCustomStep
    navigate("/cart", { state: { step: 3, forceCustomStep: true } });
  };

  const filteredConvos = conversations.filter(
    (c) => !searchQuery || c.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const latestPendingOffer = messages.findLast(
    (m) => m.sender_role === "artisan" && m.price_offer && m.negotiation_status === "pending"
  );

  const handleSelectStore = (convo: StoreConvo) => {
    setActiveStoreName(convo.storeName);
    setActiveOrderIds(convo.orderIds);
    setMobileShowChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F5" }}>
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "rgba(139,111,71,0.3)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#3D2B1F" }}>Silakan Login</h2>
          <p style={{ color: "#7A6B5E" }}>Anda harus login untuk menggunakan fitur chat toko.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.02} patternType="mega" />

      <div className="flex-1 flex overflow-hidden relative z-10 max-w-[200vh] w-full mx-auto max-h-[90vh]">
        <div className="flex-1 flex overflow-hidden bg-white shadow-lg">

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div
            className={`flex-shrink-0 flex flex-col border-r ${mobileShowChat ? "hidden sm:flex" : "flex"}`}
            style={{ width: "320px", borderColor: "rgba(212,184,139,0.15)" }}
          >
            <div className="px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(212,184,139,0.15)", background: "linear-gradient(to bottom, #FAF8F5, #FFFFFF)" }}
            >
              <h2 className="font-bold text-lg mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Chat Pengrajin
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari toko..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FAF8F5", color: "#3D2B1F" }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="flex flex-col gap-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(139,111,71,0.07)" }} />
                  ))}
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Store className="w-12 h-12 mb-3 opacity-20" style={{ color: "#8B6F47" }} />
                  <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>Belum ada percakapan</p>
                  <p className="text-xs mt-1" style={{ color: "#A89B8F" }}>
                    Percakapan muncul setelah Anda checkout pesanan custom batik
                  </p>
                </div>
              ) : (
                filteredConvos.map((convo) => {
                  const isActive = activeStoreName === convo.storeName;
                  return (
                    <motion.button key={convo.storeName} onClick={() => handleSelectStore(convo)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all"
                      style={{
                        background: isActive ? "rgba(139,111,71,0.08)" : "transparent",
                        borderLeft: isActive ? "3px solid #8B6F47" : "3px solid transparent",
                      }}
                      whileHover={{ background: "rgba(139,111,71,0.05)" }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
                        style={{ background: `linear-gradient(135deg, ${convo.storeColor}, ${convo.storeColor}99)` }}
                      >
                        {convo.storeAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold text-sm truncate" style={{ color: "#3D2B1F" }}>{convo.storeName}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {convo.hasNegotiating && <span className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />}
                            {convo.lastTime && <span className="text-[10px]" style={{ color: "#A89B8F" }}>{formatLastTime(convo.lastTime)}</span>}
                          </div>
                        </div>
                        <p className="text-xs truncate" style={{ color: "#A89B8F" }}>
                          {convo.lastMessage || "Mulai percakapan..."}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#C4B5A5" }}>
                          {convo.orderIds.length} pesanan digabungkan
                        </p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat Area ────────────────────────────────────────────── */}
          <div className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat && !activeStoreName ? "hidden sm:flex" : "flex"}`}>
            {activeConvo ? (
              <>
                {/* Chat Header */}
                <div className="px-5 py-4 flex items-center gap-4 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(212,184,139,0.15)", background: "linear-gradient(to bottom, #FAF8F5, #FFFFFF)" }}
                >
                  <button onClick={() => setMobileShowChat(false)} className="sm:hidden p-2 rounded-xl hover:bg-stone-100 transition-colors">
                    <ChevronLeft className="w-5 h-5" style={{ color: "#3D2B1F" }} />
                  </button>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${activeConvo.storeColor}, ${activeConvo.storeColor}99)` }}
                  >
                    {activeConvo.storeAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: "#3D2B1F" }}>{activeConvo.storeName}</p>
                    <p className="text-xs" style={{ color: "#A89B8F" }}>
                      {activeConvo.orderIds.length} pesanan · {activeConvo.hasNegotiating ? "🟡 Negosiasi aktif" : "✅ Semua diproses"}
                    </p>
                  </div>
                  {/* Global Offer Badge Removed in favor of Per-Order Contextual Offers */}
                </div>

                {/* Messages */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: "#F8F6F2" }}>
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px" style={{ background: "rgba(139,111,71,0.12)" }} />
                    <span className="text-[10px] font-medium px-3" style={{ color: "#A89B8F" }}>Semua percakapan dengan {activeConvo.storeName}</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(139,111,71,0.12)" }} />
                  </div>

                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isUser = msg.sender_role === "user";
                      const isPriceOffer = !!msg.price_offer;
                      // Derive offer state: purely based on DB status
                      const effectiveStatus: "pending" | "accepted" | "rejected" =
                        msg.negotiation_status === "accepted" ? "accepted"
                        : msg.negotiation_status === "rejected" ? "rejected"
                        : "pending";
                      const isOfferPending = isPriceOffer && effectiveStatus === "pending";
                      const isOfferAccepted = isPriceOffer && effectiveStatus === "accepted";
                      const isOfferRejected = isPriceOffer && effectiveStatus === "rejected";
                      const originalMsg = isPriceOffer ? messages.find(m => m.order_id === msg.order_id && m.sender_role === "user" && !!m.attachment) : null;

                      return (
                        <motion.div key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end"
                              style={{ background: `linear-gradient(135deg, ${activeConvo.storeColor}, ${activeConvo.storeColor}99)` }}
                            >
                              {activeConvo.storeAvatar[0]}
                            </div>
                          )}
                          <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                              style={{
                                background: isUser ? "linear-gradient(135deg, #8B6F47, #6B4F2F)" : isPriceOffer ? "linear-gradient(135deg, #FFF7ED, #FFFFFF)" : "#FFFFFF",
                                color: isUser ? "#FFFFFF" : "#3D2B1F",
                                borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                boxShadow: isPriceOffer ? "0 4px 16px rgba(245,158,11,0.2)" : isUser ? "0 2px 8px rgba(139,111,71,0.25)" : "0 2px 8px rgba(61,43,31,0.06)",
                                border: isPriceOffer ? "2px solid rgba(245,158,11,0.3)" : "none",
                                whiteSpace: "pre-line",
                              }}
                            >
                              {isPriceOffer && (
                                <div className="flex flex-col gap-2 mb-2 pb-2" style={{ borderBottom: "1px dashed rgba(245,158,11,0.3)" }}>
                                  {originalMsg && (
                                    <div className="flex bg-white/60 rounded-xl p-2 gap-2 w-full" style={{ borderLeft: "3px solid rgba(245,158,11,0.5)" }}>
                                      {originalMsg.attachment && (
                                        <img src={originalMsg.attachment} alt="Desain" className="w-10 h-10 object-cover rounded bg-white" style={{ border: "1px solid rgba(212,184,139,0.2)" }} />
                                      )}
                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-[10px] font-bold" style={{ color: "#D97706" }}>Membalas Pesanan</p>
                                        <p className="text-xs truncate" style={{ color: "#7A6B5E" }}>{originalMsg.message.split("\n").find(l => l.includes("Item:"))?.replace("- Item: ", "") || "Desain Kustom"}</p>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                                      <Tag className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#D97706" }}>Penawaran Harga</p>
                                      <p className="text-base font-bold" style={{ color: "#3D2B1F" }}>{formatCurrency(msg.price_offer!)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {msg.attachment && (
                                <img src={msg.attachment} alt="Desain" className="w-full max-w-[200px] sm:max-w-[240px] rounded-xl mb-2 object-contain" style={{ border: "1px solid rgba(212,184,139,0.2)" }} />
                              )}
                              {msg.message}
                            </div>

                            {/* Status banner — below the bubble, only one at a time */}
                            {isOfferAccepted && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl mt-1"
                                style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", maxWidth: "100%" }}
                              >
                                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#16A34A" }} />
                                <span className="text-xs font-bold" style={{ color: "#16A34A" }}>✅ Penawaran Diterima — Lanjut ke Pembayaran</span>
                              </motion.div>
                            )}
                            {isOfferRejected && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl mt-1"
                                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", maxWidth: "100%" }}
                              >
                                <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#EF4444" }} />
                                <span className="text-xs font-bold" style={{ color: "#EF4444" }}>❌ Penawaran Ditolak — Pesanan Dibatalkan</span>
                              </motion.div>
                            )}

                            {/* Offer action buttons — 3 options: Setuju / Tawar Harga / Tidak Setuju */}
                            {isOfferPending && !isUser && (
                              <div className="mt-2 space-y-2">
                                {/* ── 3 option buttons (always visible while pending) ── */}
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                  className="flex flex-wrap gap-1.5"
                                >
                                  {/* Setuju */}
                                  <motion.button
                                    whileHover={{ scale: acceptingMsgId ? 1 : 1.03 }}
                                    whileTap={{ scale: acceptingMsgId ? 1 : 0.97 }}
                                    onClick={() => acceptOffer(msg.id, msg.price_offer!, msg.order_id)}
                                    disabled={!!acceptingMsgId}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                                    style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}
                                  >
                                    {acceptingMsgId === msg.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <CheckCircle className="w-3.5 h-3.5" />}
                                    Setuju — {formatCurrency(msg.price_offer!)}
                                  </motion.button>

                                  {/* Tanya Pengrajin toggle */}
                                  <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowNegotiationOptions(showNegotiationOptions === msg.id ? null : msg.id)}
                                    disabled={!!acceptingMsgId || sendingNegotiation}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                                    style={{
                                      background: showNegotiationOptions === msg.id ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.1)",
                                      color: "#D97706",
                                      border: `1.5px solid rgba(245,158,11,${showNegotiationOptions === msg.id ? "0.5" : "0.3"})`,
                                      transition: "all 0.2s",
                                    }}
                                  >
                                    <Handshake className="w-3.5 h-3.5" />
                                    {showNegotiationOptions === msg.id ? "Tutup Opsi" : "Tanya Pengrajin"}
                                  </motion.button>

                                  {/* Tidak Setuju */}
                                  <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={async () => {
                                      let itemName: string | undefined;
                                      try {
                                        const { data: ord } = await supabase
                                          .from("orders").select("item").eq("id", msg.order_id).single();
                                        if (ord?.item) itemName = ord.item;
                                      } catch {}
                                      setPendingRejectMsg({ id: msg.id, orderId: msg.order_id, priceOffer: msg.price_offer, itemName });
                                    }}
                                    disabled={!!acceptingMsgId}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                                    style={{
                                      background: "rgba(239,68,68,0.07)",
                                      color: "#DC2626",
                                      border: "1.5px solid rgba(239,68,68,0.25)",
                                    }}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Tidak Setuju
                                  </motion.button>
                                </motion.div>

                                {/* ── Negotiation question chips ── */}
                                {showNegotiationOptions === msg.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="rounded-2xl p-3 space-y-2"
                                    style={{ background: "rgba(245,158,11,0.06)", border: "1.5px solid rgba(245,158,11,0.2)" }}
                                  >
                                    <p className="text-[11px] font-semibold" style={{ color: "#D97706" }}>💬 Pilih pertanyaan untuk dikirim ke pengrajin:</p>
                                    <div className="flex flex-col gap-1.5">
                                      {NEGOTIATION_QUESTIONS.map((q) => (
                                        <motion.button
                                          key={q}
                                          whileHover={{ scale: 1.02, x: 2 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => sendNegotiationQuestion(msg.id, msg.order_id, q)}
                                          disabled={sendingNegotiation}
                                          className="text-left px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center gap-2"
                                          style={{
                                            background: "rgba(255,255,255,0.7)",
                                            border: "1px solid rgba(245,158,11,0.25)",
                                            color: "#3D2B1F",
                                            transition: "all 0.15s",
                                          }}
                                        >
                                          {sendingNegotiation
                                            ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: "#D97706" }} />
                                            : <span className="w-3 h-3 flex-shrink-0" />}
                                          {q}
                                        </motion.button>
                                      ))}
                                    </div>
                                    <p className="text-[10px]" style={{ color: "#9A8B7E" }}>Atau ketik langsung di kolom chat di bawah untuk negosiasi bebas 🙂</p>
                                  </motion.div>
                                )}
                              </div>
                            )}

                            <div className={`flex items-center gap-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                              <span className="text-[10px]" style={{ color: "#B8A898" }}>{formatTime(msg.created_at)}</span>
                              {isUser && msg.status === "read" && <CheckCheck className="w-3 h-3" style={{ color: "#8B6F47" }} />}
                              {isUser && msg.status === "delivered" && <CheckCheck className="w-3 h-3" style={{ color: "#B8A898" }} />}
                              {isUser && msg.status === "sent" && <Check className="w-3 h-3" style={{ color: "#B8A898" }} />}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(212,184,139,0.15)", background: "#FFFFFF" }}
                >
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all text-stone-500 hover:text-[#8B6F47] hover:bg-stone-50 flex-shrink-0 disabled:opacity-40"
                    style={{ borderColor: "rgba(212,184,139,0.25)" }}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </motion.button>

                  <input ref={inputRef} type="text" value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Pesan ke ${activeConvo.storeName}...`}
                    className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
                    style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FAF8F5", color: "#3D2B1F" }}
                  />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={sendMessage} disabled={!inputText.trim() || sending}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: inputText.trim() ? "linear-gradient(135deg, #8B6F47, #6B4F2F)" : "#E8E1DA" }}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" style={{ transform: "translateX(1px)" }} />}
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ background: "#F8F6F2" }}>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 mb-6 rounded-3xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(212,184,139,0.2), rgba(139,111,71,0.1))", border: "1px solid rgba(212,184,139,0.3)" }}
                >
                  <MessageCircle className="w-12 h-12" style={{ color: "#D4B88B" }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  Chat Pengrajin
                </h3>
                <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#7A6B5E" }}>
                  Semua pesanan ke toko yang sama digabungkan dalam satu percakapan. Kustom batik yang perlu negosiasi ditandai dengan 🟡.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pendingAcceptMsg && (
          <AcceptConfirmDialog
            onCancel={() => setPendingAcceptMsg(null)}
            onConfirm={confirmAcceptOffer}
            loading={!!acceptingMsgId}
            price={pendingAcceptMsg.price}
          />
        )}
        {pendingRejectMsg && (
          <RejectConfirmDialog
            onCancel={() => setPendingRejectMsg(null)}
            onConfirm={confirmRejectOffer}
            loading={rejectLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
