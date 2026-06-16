import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import {
  MessageCircle, Send, ChevronLeft, Search,
  Store, Clock, CheckCheck, Check, Circle,
  Sparkles, Phone, X, CheckCircle, XCircle
} from "lucide-react";
import { BatikBackground } from "../components/BatikBackground";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

// Store data (matching DesaJetisPage stores)
const STORES = [
  { id: 1, name: "Batik Amri Jetis", owner: "Pak Amri", phone: "+62 812-3456-7890", avatar: "BA", color: "#8B6F47", specialty: "Batik Tulis Beras Utah" },
  { id: 2, name: "Batik Siti Collection", owner: "Bu Siti", phone: "+62 821-9876-5432", avatar: "BS", color: "#5A7C8B", specialty: "Batik Cap Modern" },
  { id: 3, name: "Rumah Batik Hartono", owner: "Pak Hartono", phone: "+62 819-8765-4321", avatar: "RB", color: "#6B3A8B", specialty: "Batik Tulis Premium" },
  { id: 4, name: "Batik Jetis Muda", owner: "Kak Dian", phone: "+62 856-7890-1234", avatar: "BJ", color: "#2D5A2D", specialty: "Batik Kontemporer" },
];

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "store";
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
  isPriceOffer?: boolean;
  price?: number;
}

interface Conversation {
  storeId: number;
  messages: ChatMessage[];
  lastMessage?: string;
  lastTime?: Date;
  unread: number;
  orderId?: string;
  negotiationStatus?: "pending" | "offered" | "accepted" | "rejected";
  agreedPrice?: number;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatLastTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt`;
  if (diff < 86400000) return formatTime(date);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const processedCheckoutRef = useRef<string | null>(null); // Track processed checkout
  const lastMessageCountRef = useRef<Record<number, number>>({}); // Track message count per store

  // Load conversations from localStorage
  useEffect(() => {
    if (!user) return;
    const key = `reka_chat_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const restored = parsed.map((c: any) => ({
            ...c,
            messages: Array.isArray(c.messages) ? c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [],
            lastTime: c.lastTime ? new Date(c.lastTime) : undefined,
          }));
          setConversations(restored);
          if (restored.length > 0 && !activeStoreId) {
            setActiveStoreId(restored[0].storeId);
          }
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    } else {
      // If no saved convos, and not from checkout, nothing to do
    }
  }, [user, activeStoreId]);

  // Handle incoming state from checkout (separate useEffect with ref check)
  useEffect(() => {
    if (!user || !location.state?.fromCheckout || !location.state?.storeId) return;

    const { storeId, orderId } = location.state;
    // Create unique key for this checkout to avoid reprocessing
    const checkoutKey = `${user.id}-${storeId}-${orderId}`;
    if (processedCheckoutRef.current === checkoutKey) return;
    processedCheckoutRef.current = checkoutKey;

    const key = `reka_chat_${user.id}`;
    const store = STORES.find(s => s.id === storeId);
    if (!store) return;

    setConversations(prev => {
      const existing = prev.find(c => c.storeId === storeId);
      let newMessages: ChatMessage[];
      
      if (existing) {
        newMessages = [...existing.messages];
      } else {
        newMessages = [
          {
            id: `welcome-${storeId}`,
            text: `Halo! Selamat datang di ${store.name} 😊`,
            sender: "store",
            timestamp: new Date(),
            status: "read",
          }
        ];
      }

      // Check if we already added the checkout message
      const hasCheckoutMessage = newMessages.some(m => m.id.startsWith(`checkout-${orderId}`));
      if (!hasCheckoutMessage) {
        newMessages.push({
          id: `checkout-${orderId}-${Date.now()}`,
          text: `Halo, saya ingin memesan batik custom dengan desain berikut. Bisa diskusi tentang harga?`,
          sender: "user",
          timestamp: new Date(),
          status: "read",
        });
      }

      const updated: Conversation[] = existing 
        ? prev.map(c => c.storeId === storeId ? { ...c, messages: newMessages, lastMessage: newMessages[newMessages.length - 1].text, lastTime: new Date(), orderId, negotiationStatus: "pending" as const } : c)
        : [{ storeId, messages: newMessages, lastMessage: newMessages[newMessages.length - 1].text, lastTime: new Date(), unread: 0, orderId, negotiationStatus: "pending" as const }, ...prev];

      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });

    setActiveStoreId(storeId);
      setMobileShowChat(true);
      // Reset message count for this store to trigger scroll
      if (activeStoreId) {
        lastMessageCountRef.current[storeId] = 0;
      }

    // Simulate store responding (only if not already offered)
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setConversations(prev => {
          const targetConvo = prev.find(c => c.storeId === storeId);
          if (!targetConvo || targetConvo.negotiationStatus === "offered") return prev;
          
          const randomPrice = 250000 + Math.floor(Math.random() * 500000);
          const offerMessage: ChatMessage = {
            id: `offer-${Date.now()}`,
            text: `Terima kasih atas pesanannya! Setelah melihat desainnya, kami dapat menawarkan harga ${formatCurrency(randomPrice)} untuk batik custom ini. Apakah Anda setuju?`,
            sender: "store",
            timestamp: new Date(),
            status: "read",
            isPriceOffer: true,
            price: randomPrice,
          };

          const updated = prev.map(c => {
            if (c.storeId === storeId) {
              return {
                ...c,
                messages: [...c.messages, offerMessage],
                lastMessage: offerMessage.text,
                lastTime: new Date(),
                negotiationStatus: "offered" as const
              };
            }
            return c;
          });
          localStorage.setItem(key, JSON.stringify(updated));
          return updated;
        });
      }, 2500);
    }, 1500);
  }, [user, location.state]);

  // Save conversations to localStorage
  const saveConversations = useCallback((convos: Conversation[]) => {
    if (!user) return;
    const key = `reka_chat_${user.id}`;
    localStorage.setItem(key, JSON.stringify(convos));
  }, [user]);

  // Scroll to bottom (only when new messages arrive AND user is at/near bottom)
  useEffect(() => {
    const activeConvo = conversations.find(c => c.storeId === activeStoreId);
    if (!activeConvo || !activeStoreId) return;
    
    const lastCount = lastMessageCountRef.current[activeStoreId] || 0;
    if (activeConvo.messages.length > lastCount) {
      const container = scrollContainerRef.current;
      if (container) {
        // Check if user is within 100px of the bottom
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        if (isAtBottom || lastCount === 0) { // Also scroll if it's a new convo (lastCount 0)
          // Use container.scrollTop instead of scrollIntoView() to prevent whole page from scrolling
          container.scrollTop = container.scrollHeight;
        }
      }
    }
    // Update the count regardless
    lastMessageCountRef.current[activeStoreId] = activeConvo.messages.length;
  }, [conversations, activeStoreId]);

  const activeStore = STORES.find(s => s.id === activeStoreId);
  const activeConvo = conversations.find(c => c.storeId === activeStoreId);

  const getOrCreateConvo = (storeId: number): Conversation => {
    const existing = conversations.find(c => c.storeId === storeId);
    if (existing) return existing;
    
    const store = STORES.find(s => s.id === storeId)!;
    const welcomeMsg: ChatMessage = {
      id: `welcome-${storeId}`,
      text: `Halo! Saya admin dari ${store.name}. Ada yang bisa saya bantu untuk pesanan batik custom Anda? 😊`,
      sender: "store",
      timestamp: new Date(),
      status: "read",
    };
    return {
      storeId,
      messages: [welcomeMsg],
      lastMessage: welcomeMsg.text,
      lastTime: new Date(),
      unread: 0,
    };
  };

  const openConversation = (storeId: number) => {
    setConversations(prev => {
      const exists = prev.find(c => c.storeId === storeId);
      if (!exists) {
        const newConvo = getOrCreateConvo(storeId);
        const updated = [newConvo, ...prev];
        saveConversations(updated);
        return updated;
      }
      // Mark as read
      const updated = prev.map(c =>
        c.storeId === storeId ? { ...c, unread: 0 } : c
      );
      saveConversations(updated);
      return updated;
    });
    setActiveStoreId(storeId);
    setMobileShowChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const acceptOffer = async (price: number) => {
    if (!activeStoreId) return;
    const activeConvo = conversations.find(c => c.storeId === activeStoreId);
    if (!activeConvo) return;

    const acceptMessage: ChatMessage = {
      id: `accept-${Date.now()}`,
      text: `Saya setuju dengan harga ${formatCurrency(price)}. Silakan lanjutkan proses pesanan!`,
      sender: "user",
      timestamp: new Date(),
      status: "read",
    };

    // Update conversation
    setConversations(prev => {
      const updated = prev.map(c =>
        c.storeId === activeStoreId
          ? {
              ...c,
              messages: [...c.messages, acceptMessage],
              lastMessage: acceptMessage.text,
              lastTime: new Date(),
              negotiationStatus: "accepted" as const,
              agreedPrice: price
            }
          : c
      );
      saveConversations(updated);
      return updated;
    });

    // Update order in Supabase
    if (activeConvo.orderId) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            total: price,
            status: "processing",
            payment_status: "pending"
          })
          .eq("id", activeConvo.orderId)
          .eq("user_id", user!.id);
        if (error) throw error;
        toast.success("Harga disetujui! Pesanan Anda sedang diproses.");
        navigate("/orders");
      } catch (err) {
        console.error(err);
        toast.error("Gagal memperbarui pesanan.");
      }
    }
  };

  const rejectOffer = () => {
    if (!activeStoreId) return;

    const rejectMessage: ChatMessage = {
      id: `reject-${Date.now()}`,
      text: "Maaf, saya tidak setuju dengan harga tersebut. Bisa diskusi lagi?",
      sender: "user",
      timestamp: new Date(),
      status: "read",
    };

    setConversations(prev => {
      const updated = prev.map(c =>
        c.storeId === activeStoreId
          ? {
              ...c,
              messages: [...c.messages, rejectMessage],
              lastMessage: rejectMessage.text,
              lastTime: new Date(),
              negotiationStatus: "rejected" as const
            }
          : c
      );
      saveConversations(updated);
      return updated;
    });

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMessage: ChatMessage = {
        id: `reply-${Date.now()}`,
        text: "Tentu saja! Kami bisa menawarkan harga lain. Apa harga yang Anda inginkan?",
        sender: "store",
        timestamp: new Date(),
        status: "read",
      };
      setConversations(prev => {
        const updated = prev.map(c =>
          c.storeId === activeStoreId
            ? {
                ...c,
                messages: [...c.messages, replyMessage],
                lastMessage: replyMessage.text,
                lastTime: new Date(),
                negotiationStatus: "pending" as const
              }
            : c
        );
        saveConversations(updated);
        return updated;
      });
    }, 1500);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !activeStoreId) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
      status: "sent",
    };

    setConversations(prev => {
      const updated = prev.map(c =>
        c.storeId === activeStoreId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              lastMessage: userMsg.text,
              lastTime: new Date(),
            }
          : c
      );
      // Move active convo to top
      const active = updated.find(c => c.storeId === activeStoreId)!;
      const rest = updated.filter(c => c.storeId !== activeStoreId);
      const sorted = [active, ...rest];
      saveConversations(sorted);
      return sorted;
    });

    const typedText = inputText.trim();
    setInputText("");

    // Simulate delivery status
    setTimeout(() => {
      setConversations(prev => {
        const updated = prev.map(c =>
          c.storeId === activeStoreId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === userMsg.id ? { ...m, status: "delivered" as const } : m
                ),
              }
            : c
        );
        saveConversations(updated);
        return updated;
      });
    }, 800);

    // Simulate store typing & reply
    setIsTyping(true);
    const replyDelay = 1500 + Math.random() * 1500;
    setTimeout(() => {
      setIsTyping(false);
      const replyText = "Terima kasih atas pesannya! Kami akan segera merespon.";
      const storeMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        text: replyText,
        sender: "store",
        timestamp: new Date(),
        status: "read",
      };
      setConversations(prev => {
        const updated = prev.map(c =>
          c.storeId === activeStoreId
            ? {
                ...c,
                messages: [...c.messages, storeMsg],
                lastMessage: storeMsg.text,
                lastTime: new Date(),
              }
            : c
        );
        saveConversations(updated);
        return updated;
      });
    }, replyDelay);
  };

  const filteredConvos = conversations.filter(c => {
    const store = STORES.find(s => s.id === c.storeId);
    return !searchQuery || store?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const allStores = STORES.filter(s => !conversations.find(c => c.storeId === s.id));

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

      {/* Chat Container */}
      <div className="flex-1 flex overflow-hidden relative z-10 max-w-[200vh] w-full mx-auto max-h-[90vh]">
        <div className="flex-1 flex overflow-hidden bg-white shadow-lg">
      
          {/* ── Sidebar ─────────────────────────────────────────── */}
          <div
            className={`flex-shrink-0 flex flex-col border-r ${mobileShowChat ? "hidden sm:flex" : "flex"}`}
            style={{ width: "320px", borderColor: "rgba(212,184,139,0.15)" }}
          >
            {/* Sidebar Header */}
            <div
              className="px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(212,184,139,0.15)", background: "linear-gradient(to bottom, #FAF8F5, #FFFFFF)" }}
            >
              <h2 className="font-bold text-lg mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Pesan Toko
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari toko..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FAF8F5", color: "#3D2B1F" }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {/* Active conversations */}
              {filteredConvos.map(convo => {
                const store = STORES.find(s => s.id === convo.storeId)!;
                const isActive = activeStoreId === convo.storeId;
                return (
                  <motion.button
                    key={convo.storeId}
                    onClick={() => openConversation(convo.storeId)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all"
                    style={{
                      background: isActive ? "rgba(139,111,71,0.08)" : "transparent",
                      borderLeft: isActive ? "3px solid #8B6F47" : "3px solid transparent",
                    }}
                    whileHover={{ background: "rgba(139,111,71,0.05)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
                      style={{ background: `linear-gradient(135deg, ${store.color}, ${store.color}99)` }}
                    >
                      {store.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-sm truncate" style={{ color: "#3D2B1F" }}>{store.name}</p>
                        {convo.lastTime && (
                          <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "#A89B8F" }}>
                            {formatLastTime(convo.lastTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate" style={{ color: "#A89B8F" }}>{convo.lastMessage}</p>
                        {convo.unread > 0 && (
                          <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#8B6F47" }}>
                            {convo.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {/* Divider + All stores */}
              {allStores.length > 0 && (
                <>
                  <div className="px-5 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A89B8F" }}>
                      Toko Batik Jetis
                    </p>
                  </div>
                  {allStores.map(store => (
                    <motion.button
                      key={store.id}
                      onClick={() => openConversation(store.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                      whileHover={{ background: "rgba(139,111,71,0.04)" }}
                    >
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm opacity-70"
                        style={{ background: `linear-gradient(135deg, ${store.color}, ${store.color}99)` }}
                      >
                        {store.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "#3D2B1F" }}>{store.name}</p>
                        <p className="text-xs" style={{ color: "#A89B8F" }}>{store.specialty}</p>
                      </div>
                      <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#D4B88B" }} />
                    </motion.button>
                  ))}
                </>
              )}

              {conversations.length === 0 && allStores.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20" style={{ color: "#8B6F47" }} />
                  <p className="text-sm" style={{ color: "#A89B8F" }}>Belum ada percakapan</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat Area ───────────────────────────────────────── */}
          <div className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat && !activeStoreId ? "hidden sm:flex" : "flex"}`}>
            {activeStore && activeConvo ? (
              <>
                {/* Chat Header */}
                <div
                  className="px-5 py-4 flex items-center gap-4 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(212,184,139,0.15)", background: "linear-gradient(to bottom, #FAF8F5, #FFFFFF)" }}
                >
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="sm:hidden p-2 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: "#3D2B1F" }} />
                  </button>
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${activeStore.color}, ${activeStore.color}99)` }}
                  >
                    {activeStore.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: "#3D2B1F" }}>{activeStore.name}</p>
                    <p className="text-xs" style={{ color: isTyping ? "#8B6F47" : "#A89B8F" }}>
                      {isTyping ? "Sedang mengetik..." : "Online"}
                    </p>
                  </div>
                  <a
                    href={`tel:${activeStore.phone}`}
                    className="p-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                    title={`Hubungi ${activeStore.owner}`}
                  >
                    <Phone className="w-5 h-5" style={{ color: "#8B6F47" }} />
                  </a>
                </div>

                {/* Messages */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: "#F8F6F2" }}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px" style={{ background: "rgba(139,111,71,0.12)" }} />
                    <span className="text-[10px] font-medium px-3" style={{ color: "#A89B8F" }}>Hari ini</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(139,111,71,0.12)" }} />
                  </div>

                  <AnimatePresence initial={false}>
                    {activeConvo.messages.map((msg) => {
                      const isUser = msg.sender === "user";
                      const showOfferButtons = msg.isPriceOffer && activeConvo.negotiationStatus === "offered";
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end"
                              style={{ background: `linear-gradient(135deg, ${activeStore.color}, ${activeStore.color}99)` }}
                            >
                              {activeStore.avatar[0]}
                            </div>
                          )}
                          <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            <div
                              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                              style={{
                                background: isUser
                                  ? "linear-gradient(135deg, #8B6F47, #6B4F2F)"
                                  : "#FFFFFF",
                                color: isUser ? "#FFFFFF" : "#3D2B1F",
                                borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                boxShadow: isUser ? "0 2px 8px rgba(139,111,71,0.25)" : "0 2px 8px rgba(61,43,31,0.06)",
                                whiteSpace: "pre-line",
                              }}
                            >
                              {msg.text}
                            </div>
                            {showOfferButtons && (
                              <div className="flex gap-2 mt-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => acceptOffer(msg.price!)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                                  style={{ background: "#16A34A" }}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Setuju
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={rejectOffer}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                                  style={{ border: "1px solid #EF4444", color: "#EF4444" }}
                                >
                                  <XCircle className="w-3 h-3" />
                                  Tidak Setuju
                                </motion.button>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                              <span className="text-[10px]" style={{ color: "#B8A898" }}>
                                {formatTime(msg.timestamp)}
                              </span>
                              {isUser && msg.status === "read" && <CheckCheck className="w-3 h-3" style={{ color: "#8B6F47" }} />}
                              {isUser && msg.status === "delivered" && <CheckCheck className="w-3 h-3" style={{ color: "#B8A898" }} />}
                              {isUser && msg.status === "sent" && <Check className="w-3 h-3" style={{ color: "#B8A898" }} />}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-end gap-2"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${activeStore.color}, ${activeStore.color}99)` }}
                        >
                          {activeStore.avatar[0]}
                        </div>
                        <div
                          className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                          style={{ background: "#FFFFFF", boxShadow: "0 2px 8px rgba(61,43,31,0.06)", borderRadius: "18px 18px 18px 4px" }}
                        >
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                              className="w-2 h-2 rounded-full"
                              style={{ background: "#A89B8F" }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div
                  className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(212,184,139,0.15)", background: "#FFFFFF" }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Pesan ke ${activeStore.name}...`}
                    className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
                    style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FAF8F5", color: "#3D2B1F" }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={!inputText.trim()}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-40"
                    style={{ background: inputText.trim() ? "linear-gradient(135deg, #8B6F47, #6B4F2F)" : "#E8E1DA" }}
                  >
                    <Send className="w-5 h-5" style={{ transform: "translateX(1px)" }} />
                  </motion.button>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ background: "#F8F6F2" }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 mb-6 rounded-3xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(212,184,139,0.2), rgba(139,111,71,0.1))", border: "1px solid rgba(212,184,139,0.3)" }}
                >
                  <MessageCircle className="w-12 h-12" style={{ color: "#D4B88B" }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  Chat dengan Toko Batik
                </h3>
                <p className="text-sm max-w-xs" style={{ color: "#7A6B5E", lineHeight: 1.7 }}>
                  Pilih toko di sebelah kiri untuk mulai berdiskusi tentang desain dan harga batik custom Anda
                </p>
                <div className="mt-6 flex gap-2 flex-wrap justify-center">
                  {STORES.slice(0, 2).map(store => (
                    <motion.button
                      key={store.id}
                      onClick={() => openConversation(store.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(212,184,139,0.15)", color: "#8B6F47", border: "1px solid rgba(212,184,139,0.3)" }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {store.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
