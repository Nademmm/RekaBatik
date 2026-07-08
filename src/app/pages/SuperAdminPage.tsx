import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";
import { Store } from "../../types/database";
import { toast, Toaster } from "sonner";
import { BatikBackground } from "../components/BatikBackground";
import {
  Loader2,
  Store as StoreIcon,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  ShieldCheck,
  MapPin,
  Users,
  Crown,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

interface PremiumSubscription {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: "weekly" | "monthly";
  price: number;
  sender_name: string;
  bank_from: string;
  transfer_date: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  attachment_url?: string;
  created_at: string;
  expires_at: string;
}

export function SuperAdminPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState<Store[]>([]);
  const [subscriptions, setSubscriptions] = useState<PremiumSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Top level sections: "stores" | "premium"
  const [activeSection, setActiveSection] = useState<"stores" | "premium">("stores");
  // Sub-tabs for stores: "pending" | "approved" | "rejected"
  const [activeStoreTab, setActiveStoreTab] = useState<"pending" | "approved" | "rejected">("pending");
  // Sub-tabs for premium: "pending" | "approved" | "rejected"
  const [activePremiumTab, setActivePremiumTab] = useState<"pending" | "approved" | "rejected">("pending");

  const [updating, setUpdating] = useState<number | null>(null);
  const [updatingSub, setUpdatingSub] = useState<number | null>(null);

  // ── Redirect non-super_admins ────────────────────────────────────────────────
  useEffect(() => {
    if (userRole && userRole !== "super_admin") {
      toast.error("Halaman ini khusus untuk Super Admin RekaBatik.");
      navigate("/");
    }
  }, [userRole, navigate]);

  // ── Fetch stores ─────────────────────────────────────────────────────────────
  const fetchStores = async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setStores(data as Store[]);
    }
  };

  // ── Fetch subscriptions ──────────────────────────────────────────────────────
  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setSubscriptions(data as PremiumSubscription[]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStores(), fetchSubscriptions().catch(() => {})]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Handle Store Status Update ───────────────────────────────────────────────
  const updateStoreStatus = async (storeId: number, status: "approved" | "rejected") => {
    setUpdating(storeId);
    try {
      const { error } = await supabase
        .from("stores")
        .update({ status })
        .eq("id", storeId);

      if (error) throw error;
      toast.success(`Toko berhasil di${status === "approved" ? "setujui" : "tolak"}.`);
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, status } : s)));
    } catch (err) {
      toast.error("Gagal memperbarui status toko.");
    } finally {
      setUpdating(null);
    }
  };

  // ── Handle Subscription Status Update ────────────────────────────────────────
  const updateSubStatus = async (subId: number, status: "approved" | "rejected") => {
    setUpdatingSub(subId);
    try {
      const { error } = await supabase
        .from("premium_subscriptions")
        .update({ status })
        .eq("id", subId);

      if (error) throw error;
      toast.success(`Langganan premium berhasil di${status === "approved" ? "setujui" : "tolak"}.`);
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? { ...s, status } : s)));
    } catch (err) {
      toast.error("Gagal memperbarui status langganan.");
    } finally {
      setUpdatingSub(null);
    }
  };

  // ── Filtered Stores ──────────────────────────────────────────────────────────
  const filteredStores = stores.filter((s) => {
    const sStatus = s.status || "pending";
    if (sStatus !== activeStoreTab) return false;
    if (
      searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.owner.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // ── Filtered Subscriptions ───────────────────────────────────────────────────
  const filteredSubscriptions = subscriptions.filter((s) => {
    if (s.status !== activePremiumTab) return false;
    if (
      searchQuery &&
      !s.user_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.user_email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const pendingStoresCount = stores.filter((s) => (s.status || "pending") === "pending").length;
  const pendingSubsCount = subscriptions.filter((s) => s.status === "pending").length;

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "#FAF8F5", fontFamily: "'Inter', sans-serif" }}
    >
      <Toaster position="top-right" richColors />
      <BatikBackground opacity={0.03} patternType="mega" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)" }}
              >
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8B6F47" }}>
                RekaBatik Admin
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#3D2B1F",
                fontSize: "clamp(1.6rem, 3vw, 2rem)",
                fontWeight: 700,
              }}
            >
              Portal Super Admin
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#7A6B5E" }}>
              Kelola verifikasi pendaftaran toko pengrajin dan aktivasi akun premium.
            </p>
          </div>
        </motion.div>

        {/* ── Top Level Section Tabs ──────────────────────────────────── */}
        <div className="flex gap-4 border-b mb-6" style={{ borderColor: "rgba(212,184,139,0.18)" }}>
          <button
            onClick={() => {
              setActiveSection("stores");
              setSearchQuery("");
            }}
            className="pb-3 px-1 text-sm font-semibold relative flex items-center gap-2"
            style={{ color: activeSection === "stores" ? "#8B6F47" : "#A89B8F" }}
          >
            <StoreIcon className="w-4 h-4" />
            Verifikasi Toko
            {pendingStoresCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingStoresCount}
              </span>
            )}
            {activeSection === "stores" && (
              <motion.div
                layoutId="active-section-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B6F47]"
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveSection("premium");
              setSearchQuery("");
            }}
            className="pb-3 px-1 text-sm font-semibold relative flex items-center gap-2"
            style={{ color: activeSection === "premium" ? "#8B6F47" : "#A89B8F" }}
          >
            <Crown className="w-4 h-4" />
            Verifikasi Premium
            {pendingSubsCount > 0 && (
              <span className="bg-[#C49D65] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingSubsCount}
              </span>
            )}
            {activeSection === "premium" && (
              <motion.div
                layoutId="active-section-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B6F47]"
              />
            )}
          </button>
        </div>

        {/* ── Sub Navigation & Search ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div
            className="flex p-1 rounded-2xl w-fit"
            style={{ background: "rgba(139,111,71,0.08)", border: "1px solid rgba(139,111,71,0.12)" }}
          >
            {(["pending", "approved", "rejected"] as const).map((tab) => {
              const currentTab = activeSection === "stores" ? activeStoreTab : activePremiumTab;
              const isActive = currentTab === tab;
              const setTab = activeSection === "stores" ? setActiveStoreTab : setActivePremiumTab;

              return (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: isActive ? "#3D2B1F" : "#9E8E82" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sub-tab-pill"
                      className="absolute inset-0 rounded-xl bg-white"
                      style={{ boxShadow: "0 2px 12px rgba(61,43,31,0.1)" }}
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab === "pending" ? "Menunggu Verifikasi" : tab === "approved" ? "Disetujui" : "Ditolak"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#A89B8F" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSection === "stores"
                  ? "Cari nama toko atau pemilik..."
                  : "Cari pengirim, nama, atau email..."
              }
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid rgba(212,184,139,0.25)",
                background: "#FFFFFF",
                color: "#3D2B1F",
              }}
            />
          </div>
        </div>

        {/* ── Content Area ────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#8B6F47" }} />
          </div>
        ) : activeSection === "stores" ? (
          // ── Stores list ──
          filteredStores.length === 0 ? (
            <EmptyState label="Tidak ada toko" desc={`Belum ada pendaftaran toko dengan status ${activeStoreTab}.`} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStores.map((store) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 flex flex-col justify-between"
                  style={{
                    border: "1px solid rgba(212,184,139,0.2)",
                    boxShadow: "0 2px 8px rgba(61,43,31,0.04)",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg bg-stone-200">
                          {store.image ? (
                            <img
                              src={store.image}
                              alt={store.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span style={{ color: "#A89B8F" }}>{store.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight" style={{ color: "#3D2B1F" }}>
                            {store.name}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: "#A89B8F" }}>
                            Oleh {store.owner}
                          </p>
                        </div>
                      </div>
                      <BadgeStatus status={store.status || "pending"} />
                    </div>

                    <div className="space-y-1.5 mb-5">
                      <p className="text-xs flex items-center gap-2" style={{ color: "#5A4A3E" }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: "#8B6F47" }} /> {store.address}
                      </p>
                      <p className="text-xs flex items-center gap-2" style={{ color: "#5A4A3E" }}>
                        <Users className="w-3.5 h-3.5" style={{ color: "#8B6F47" }} /> Spesialisasi:{" "}
                        {store.specialty}
                      </p>
                      <p
                        className="text-xs line-clamp-2 mt-2"
                        style={{ color: "#7A6B5E", fontStyle: "italic" }}
                      >
                        "{store.description}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex flex-col sm:flex-row gap-2 border-t pt-4"
                    style={{ borderColor: "rgba(212,184,139,0.15)" }}
                  >
                    {store.status !== "approved" && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateStoreStatus(store.id, "approved")}
                        disabled={updating === store.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
                      >
                        {updating === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Setujui Pendaftaran
                          </>
                        )}
                      </motion.button>
                    )}
                    {store.status !== "rejected" && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateStoreStatus(store.id, "rejected")}
                        disabled={updating === store.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                        style={{ border: "1.5px solid #EF4444", color: "#EF4444", background: "transparent" }}
                      >
                        {updating === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Tolak
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          // ── Premium subscriptions list ──
          filteredSubscriptions.length === 0 ? (
            <EmptyState
              label="Tidak ada transaksi premium"
              desc={`Belum ada konfirmasi pembayaran premium dengan status ${activePremiumTab}.`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSubscriptions.map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 flex flex-col justify-between"
                  style={{
                    border: "1px solid rgba(212,184,139,0.2)",
                    boxShadow: "0 2px 8px rgba(61,43,31,0.04)",
                  }}
                >
                  <div className="space-y-4">
                    {/* Identity row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: "rgba(196,157,101,0.12)",
                            border: "1px solid rgba(196,157,101,0.25)",
                          }}
                        >
                          <Crown className="w-5 h-5" style={{ color: "#C49D65" }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[16px] leading-tight" style={{ color: "#3D2B1F" }}>
                            {sub.plan_id === "weekly" ? "Premium Mingguan" : "Premium Bulanan"}
                          </h3>
                          <p className="text-xs text-[#9B8C80] mt-0.5">ID Transaksi #{sub.id}</p>
                        </div>
                      </div>
                      <BadgeStatus status={sub.status} />
                    </div>

                    <div className="h-px" style={{ background: "rgba(212,184,139,0.15)" }} />

                    {/* Transfer details */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                      <div>
                        <span className="text-[#9B8C80] block mb-0.5 uppercase tracking-wider text-[10px]">
                          Pengguna
                        </span>
                        <div className="flex items-center gap-1.5 text-[#3D2B1F] font-semibold">
                          <User className="w-3 h-3 text-[#8B6F47]" />
                          <span className="truncate max-w-[140px]">{sub.user_name}</span>
                        </div>
                        <span className="text-[11px] text-[#A89B8F]">{sub.user_email}</span>
                      </div>

                      <div>
                        <span className="text-[#9B8C80] block mb-0.5 uppercase tracking-wider text-[10px]">
                          Nominal Transfer
                        </span>
                        <div className="flex items-center gap-1 text-[#C49D65] font-bold text-[13px]">
                          <DollarSign className="w-3.5 h-3.5" />
                          Rp {Number(sub.price).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#9B8C80] block mb-0.5 uppercase tracking-wider text-[10px]">
                          Pengirim / Bank Asal
                        </span>
                        <div className="flex items-center gap-1.5 text-[#3D2B1F] font-semibold">
                          <CreditCard className="w-3 h-3 text-[#8B6F47]" />
                          <span>
                            {sub.sender_name} ({sub.bank_from})
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[#9B8C80] block mb-0.5 uppercase tracking-wider text-[10px]">
                          Tanggal Transfer
                        </span>
                        <div className="flex items-center gap-1.5 text-[#3D2B1F]">
                          <Calendar className="w-3 h-3 text-[#8B6F47]" />
                          <span>{sub.transfer_date}</span>
                        </div>
                      </div>
                    </div>

                    {sub.notes && (
                      <div
                        className="rounded-xl p-3 text-xs leading-relaxed text-[#7A6B5E]"
                        style={{ background: "#FAF8F5", border: "1px solid rgba(212,184,139,0.12)" }}
                      >
                        <div className="flex items-center gap-1 font-semibold mb-0.5">
                          <FileText className="w-3.5 h-3.5" /> Catatan User:
                        </div>
                        "{sub.notes}"
                      </div>
                    )}

                    {sub.attachment_url && (
                      <div className="space-y-1.5">
                        <span className="text-[#9B8C80] block uppercase tracking-wider text-[10px]">
                          Bukti Pembayaran
                        </span>
                        <a
                          href={sub.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border relative group hover:opacity-95 transition-opacity"
                          style={{
                            borderColor: "rgba(212,184,139,0.25)",
                            background: "#FAF8F5",
                            height: "140px",
                          }}
                        >
                          <img
                            src={sub.attachment_url}
                            alt="Bukti Transfer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If PDF or broken image, fallback to file link look
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#3D2B1F]/90">
                              Buka File Asli
                            </span>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex flex-col sm:flex-row gap-2 border-t pt-4 mt-5"
                    style={{ borderColor: "rgba(212,184,139,0.15)" }}
                  >
                    {sub.status !== "approved" && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateSubStatus(sub.id, "approved")}
                        disabled={updatingSub === sub.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
                      >
                        {updatingSub === sub.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Aktifkan Premium
                          </>
                        )}
                      </motion.button>
                    )}
                    {sub.status !== "rejected" && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateSubStatus(sub.id, "rejected")}
                        disabled={updatingSub === sub.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                        style={{ border: "1.5px solid #EF4444", color: "#EF4444", background: "transparent" }}
                      >
                        {updatingSub === sub.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Tolak
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Helpers Components ──────────────────────────────────────────────────────

function EmptyState({ label, desc }: { label: string; desc: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl"
      style={{ border: "1px solid rgba(212,184,139,0.2)" }}
    >
      <StoreIcon className="w-12 h-12 mb-3" style={{ color: "rgba(139,111,71,0.2)" }} />
      <h3 className="text-lg font-bold mb-1" style={{ color: "#3D2B1F" }}>
        {label}
      </h3>
      <p className="text-sm text-[#7A6B5E] max-w-xs">{desc}</p>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <span
        className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider"
        style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}
      >
        <Clock className="w-3.5 h-3.5" /> MENUNGGU
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span
        className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider"
        style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> AKTIF
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider"
      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
    >
      <XCircle className="w-3.5 h-3.5" /> DITOLAK
    </span>
  );
}
