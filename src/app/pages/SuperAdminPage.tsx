import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";
import { Store } from "../../types/database";
import { toast, Toaster } from "sonner";
import { BatikBackground } from "../components/BatikBackground";
import { Loader2, Store as StoreIcon, CheckCircle2, XCircle, Search, Clock, ShieldCheck, MapPin, Users } from "lucide-react";

export function SuperAdminPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [updating, setUpdating] = useState<number | null>(null);

  // ── Redirect non-super_admins ────────────────────────────────────────────────
  useEffect(() => {
    if (userRole && userRole !== "super_admin") {
      toast.error("Halaman ini khusus untuk Super Admin RekaBatik.");
      navigate("/");
    }
  }, [userRole, navigate]);

  // ── Fetch stores ─────────────────────────────────────────────────────────────
  const fetchStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setStores(data as Store[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // ── Handle Status Update ─────────────────────────────────────────────────────
  const updateStoreStatus = async (storeId: number, status: "approved" | "rejected") => {
    setUpdating(storeId);
    try {
      const { error } = await supabase
        .from("stores")
        .update({ status })
        .eq("id", storeId);

      if (error) throw error;
      toast.success(`Toko berhasil di${status === "approved" ? "setujui" : "tolak"}.`);
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status } : s));
    } catch (err) {
      toast.error("Gagal memperbarui status toko.");
    } finally {
      setUpdating(null);
    }
  };

  // ── Filtered Data ────────────────────────────────────────────────────────────
  const filteredStores = stores.filter(s => {
    const sStatus = s.status || "pending";
    if (sStatus !== activeTab) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.owner.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const pendingCount = stores.filter(s => (s.status || "pending") === "pending").length;

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5", fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" richColors />
      <BatikBackground opacity={0.03} patternType="mega" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#1D4ED8" }}>RekaBatik Admin</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 700 }}>
              Portal Super Admin
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#7A6B5E" }}>
              Verifikasi pendaftaran pengrajin baru dan kelola toko platform.
            </p>
          </div>
        </motion.div>

        {/* ── Tab Navigation ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex p-1 rounded-2xl w-fit" style={{ background: "rgba(139,111,71,0.08)", border: "1px solid rgba(139,111,71,0.12)" }}>
            {(["pending", "approved", "rejected"] as const).map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: isActive ? "#3D2B1F" : "#9E8E82" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="super-admin-tab"
                      className="absolute inset-0 rounded-xl bg-white"
                      style={{ boxShadow: "0 2px 12px rgba(61,43,31,0.1)" }}
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab === "pending" ? "Menunggu Verifikasi" : tab === "approved" ? "Disetujui" : "Ditolak"}
                    {tab === "pending" && pendingCount > 0 && (
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#F59E0B" }}>
                        {pendingCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A89B8F" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari toko atau pemilik..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1px solid rgba(212,184,139,0.25)", background: "#FFFFFF", color: "#3D2B1F" }}
            />
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1D4ED8" }} />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
            <StoreIcon className="w-12 h-12 mb-3" style={{ color: "rgba(139,111,71,0.2)" }} />
            <h3 className="text-lg font-bold mb-1.5" style={{ color: "#3D2B1F" }}>Tidak ada toko</h3>
            <p className="text-sm" style={{ color: "#7A6B5E" }}>Belum ada toko yang berada di status {activeTab}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStores.map(store => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 flex flex-col justify-between"
                style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.04)" }}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg bg-stone-200">
                        {store.image ? (
                          <img src={store.image} alt={store.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span style={{ color: "#A89B8F" }}>{store.name[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight" style={{ color: "#3D2B1F" }}>{store.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "#A89B8F" }}>Oleh {store.owner}</p>
                      </div>
                    </div>
                    {store.status === "pending" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
                        <Clock className="w-3 h-3" /> MENUNGGU
                      </span>
                    )}
                    {store.status === "approved" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
                        <CheckCircle2 className="w-3 h-3" /> AKTIF
                      </span>
                    )}
                    {store.status === "rejected" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                        <XCircle className="w-3 h-3" /> DITOLAK
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <p className="text-xs flex items-center gap-2" style={{ color: "#5A4A3E" }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: "#8B6F47" }} /> {store.address}
                    </p>
                    <p className="text-xs flex items-center gap-2" style={{ color: "#5A4A3E" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#8B6F47" }} /> Spesialisasi: {store.specialty}
                    </p>
                    <p className="text-xs line-clamp-2 mt-2" style={{ color: "#7A6B5E", fontStyle: "italic" }}>
                      "{store.description}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 border-t pt-4" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
                  {store.status !== "approved" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => updateStoreStatus(store.id, "approved")}
                      disabled={updating === store.id}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
                    >
                      {updating === store.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Setujui Pendaftaran</>}
                    </motion.button>
                  )}
                  {store.status !== "rejected" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => updateStoreStatus(store.id, "rejected")}
                      disabled={updating === store.id}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                      style={{ border: "1.5px solid #EF4444", color: "#EF4444", background: "transparent" }}
                    >
                      {updating === store.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Tolak</>}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
