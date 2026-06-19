import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette, Clock, Edit2, ArrowRight, Trash2, Package,
  Plus, CheckCircle, ShoppingBag, X, Loader2, ChevronRight,
  Star, Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";

interface DesainItem {
  id: number;
  created_at: string;
  drawing_data: string | null;
  user_id: string;
  thumbnail?: string;
  projectName?: string;
  fabric?: string;
  description?: string;
  isOrdered?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DesignCard({
  design,
  onDelete,
  onOrder,
  onDetail,
}: {
  design: DesainItem;
  onDelete: (design: DesainItem) => void;
  onOrder: (design: DesainItem) => void;
  onDetail: (design: DesainItem) => void;
}) {
  const navigate = useNavigate();

  let parsed: any = null;
  try {
    if (design.drawing_data) parsed = JSON.parse(design.drawing_data);
  } catch {}

  const thumbnail = parsed?.canvasThumbnail || null;
  const projectName = parsed?.projectInfo?.name || "Desain Tanpa Nama";
  const fabric = parsed?.projectInfo?.fabric || "Katun Primisima";
  const description = parsed?.projectInfo?.description || "";
  const isOrdered = design.isOrdered ?? false;

  const handleEdit = () => {
    if (isOrdered) {
      toast.error("Desain yang sudah dipesan tidak bisa diedit.");
      return;
    }
    navigate(`/custom?editDesignId=${design.id}`);
  };

  const handleDelete = () => {
    if (isOrdered) {
      toast.error("Desain yang sudah dipesan tidak bisa dihapus.");
      return;
    }
    onDelete(design);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(61,43,31,0.12)" }}
      className="bg-white rounded-3xl overflow-hidden cursor-pointer"
      style={{
        border: "1px solid rgba(212,184,139,0.25)",
        boxShadow: "0 4px 16px rgba(61,43,31,0.05)",
      }}
      onClick={() => onDetail(design)}
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-stone-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={projectName}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FAF8F5, #F0EBE1)" }}
          >
            <Palette className="w-14 h-14 mb-2" style={{ color: "rgba(139,111,71,0.3)" }} />
            <p className="text-sm" style={{ color: "rgba(139,111,71,0.5)" }}>Tidak ada preview</p>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {isOrdered ? (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A", backdropFilter: "blur(8px)", border: "1px solid rgba(22,163,74,0.3)" }}
            >
              <CheckCircle className="w-3 h-3" />
              Sudah Dipesan
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(212,184,139,0.2)", color: "#8B6F47", backdropFilter: "blur(8px)", border: "1px solid rgba(212,184,139,0.4)" }}
            >
              <Sparkles className="w-3 h-3" />
              Belum Dipesan
            </span>
          )}
        </div>

        {/* Delete button */}
        {!isOrdered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(239,68,68,0.85)", color: "white", backdropFilter: "blur(6px)" }}
            title="Hapus desain"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-base mb-0.5 truncate" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
          {projectName}
        </h3>
        
        <div className="flex items-center gap-1.5 mb-3" style={{ color: "#A89B8F" }}>
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">{formatDate(design.created_at)}</span>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
            {!isOrdered && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-sm active:scale-95"
                style={{ border: "1.5px solid rgba(139,111,71,0.25)", color: "#8B6F47", background: "rgba(139,111,71,0.04)" }}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrder(design);
              }}
              disabled={isOrdered}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
              style={{
                background: isOrdered
                  ? "rgba(22,163,74,0.7)"
                  : "linear-gradient(135deg, #8B6F47, #6B4F2F)",
                boxShadow: isOrdered ? "none" : "0 4px 14px rgba(139,111,71,0.3)",
              }}
            >
              {isOrdered ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Dipesan
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Pesan
                </>
              )}
            </button>
        </div>
      </div>
    </motion.div>
  );
}

export function DesainHistoriPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<DesainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderTarget, setOrderTarget] = useState<DesainItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DesainItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<DesainItem | null>(null);

  const fetchDesigns = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);

      const { data: designData, error } = await supabase
        .from("custom_designs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check which designs have already been ordered
      const { data: cartData } = await supabase
        .from("cart_items")
        .select("custom_design_id")
        .eq("user_id", user.id);

      // Also check orders table
      const orderedDesignIds = new Set<number>();
      cartData?.forEach((ci: any) => {
        if (ci.custom_design_id) orderedDesignIds.add(ci.custom_design_id);
      });

      const enriched = (designData || []).map((d: any) => ({
        ...d,
        isOrdered: orderedDesignIds.has(d.id),
      }));

      setDesigns(enriched);
    } catch (err) {
      toast.error("Gagal memuat histori desain");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDesigns(); }, [fetchDesigns]);

  const handleDelete = (design: DesainItem) => {
    setDeleteTarget(design);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user) return;
    try {
      const { error } = await supabase
        .from("custom_designs")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("user_id", user.id);
      if (error) throw error;
      setDesigns(prev => prev.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Desain berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus desain");
    }
  };

  const handleOrder = (design: DesainItem) => {
    setOrderTarget(design);
  };

  const confirmOrder = async () => {
    if (!orderTarget || !user) return;
    try {
      // Add to cart
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("custom_design_id", orderTarget.id)
        .single();

      if (!existing) {
        await supabase.from("cart_items").insert([{
          user_id: user.id,
          custom_design_id: orderTarget.id,
          quantity: 1,
        }]);
      }

      setOrderTarget(null);
      navigate(`/cart?from=custom&designId=${orderTarget.id}`);
    } catch {
      toast.error("Gagal memproses pesanan");
    }
  };

  const totalDesigns = designs.length;
  const orderedCount = designs.filter(d => d.isOrdered).length;
  const pendingCount = designs.filter(d => !d.isOrdered).length;

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,184,139,0.08) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 sm:px-6 py-10 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10"
        >
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, marginBottom: "0.4rem" }}>
              Histori Desain Batik
            </h1>
            <p style={{ color: "#7A6B5E" }}>
              Semua karya batik kustom yang pernah kamu simpan
            </p>
          </div>
          <Link
            to="/custom"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", boxShadow: "0 4px 16px rgba(139,111,71,0.25)" }}
          >
            <Plus className="w-4 h-4" />
            Buat Desain Baru
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: "Total Desain", value: totalDesigns, icon: Palette, color: "#8B6F47" },
            { label: "Belum Dipesan", value: pendingCount, icon: Star, color: "#D97706" },
            { label: "Sudah Dipesan", value: orderedCount, icon: CheckCircle, color: "#16A34A" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-4 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(212,184,139,0.2)", boxShadow: "0 2px 8px rgba(61,43,31,0.03)" }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#A89B8F" }}>{s.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "#3D2B1F" }}>{s.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Designs Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : designs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white"
            style={{ border: "1px solid rgba(212,184,139,0.2)" }}
          >
            <div className="w-24 h-24 mb-6 rounded-full flex items-center justify-center" style={{ background: "rgba(139,111,71,0.08)" }}>
              <Palette className="w-10 h-10" style={{ color: "#8B6F47" }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "#3D2B1F" }}>Belum Ada Desain</h3>
            <p className="mb-8 text-center max-w-xs" style={{ color: "#7A6B5E" }}>
              Mulai buat desain batik kustom pertamamu di Studio Batik!
            </p>
            <Link to="/custom">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
              >
                <Plus className="w-4 h-4" />
                Mulai Berkreasi
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onDelete={handleDelete}
                  onOrder={handleOrder}
                  onDetail={setDetailTarget}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Confirm Order Modal */}
      <AnimatePresence>
        {orderTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderTarget(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"
              style={{ border: "1px solid rgba(212,184,139,0.3)" }}
            >
              <button
                onClick={() => setOrderTarget(null)}
                className="absolute top-4 right-4 p-2 text-[#A89B8F] hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}>
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Lanjut ke Pesanan?
              </h3>
              <p className="text-sm mb-6" style={{ color: "#7A6B5E" }}>
                Desain ini akan dimasukkan ke keranjang. Harga akan dikonfirmasi oleh CS toko setelah kamu memilih toko batik yang diinginkan.
              </p>

              {/* Price placeholder */}
              <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(139,111,71,0.06)", border: "1px dashed rgba(139,111,71,0.3)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#A89B8F" }}>Estimasi Harga</p>
                <p className="text-2xl font-bold" style={{ color: "#8B6F47", fontFamily: "'Playfair Display', serif" }}>
                  Rp xxx.xxx
                </p>
                <p className="text-xs mt-1" style={{ color: "#A89B8F" }}>Harga dikonfirmasi oleh CS toko</p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={confirmOrder}
                  className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:brightness-110 active:scale-98"
                  style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
                >
                  Lanjut ke Keranjang
                </button>
                <button
                  onClick={() => setOrderTarget(null)}
                  className="w-full py-3 rounded-xl font-semibold transition-all"
                  style={{ color: "#8B6F47", border: "1.5px solid rgba(139,111,71,0.2)", background: "rgba(139,111,71,0.04)" }}
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"
              style={{ border: "1px solid rgba(212,184,139,0.3)" }}
            >
              <button
                onClick={() => setDeleteTarget(null)}
                className="absolute top-4 right-4 p-2 text-[#A89B8F] hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                <Trash2 className="w-8 h-8" style={{ color: "#EF4444" }} />
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Hapus Desain?
              </h3>
              <p className="text-sm mb-6" style={{ color: "#7A6B5E" }}>
                Desain "{(() => {
                  try {
                    if (deleteTarget.drawing_data) {
                      const parsed = JSON.parse(deleteTarget.drawing_data);
                      return parsed?.projectInfo?.name || "Desain Tanpa Nama";
                    }
                  } catch {}
                  return "Desain Tanpa Nama";
                })()}" akan dihapus secara permanen dan tidak bisa dikembalikan.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={confirmDelete}
                  className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:brightness-110 active:scale-98"
                  style={{ background: "#EF4444" }}
                >
                  Hapus Permanen
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-3 rounded-xl font-semibold transition-all"
                  style={{ color: "#8B6F47", border: "1.5px solid rgba(139,111,71,0.2)", background: "rgba(139,111,71,0.04)" }}
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailTarget(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              style={{ border: "1px solid rgba(212,184,139,0.3)" }}
            >
              {(() => {
                let parsed: any = null;
                try {
                  if (detailTarget.drawing_data) parsed = JSON.parse(detailTarget.drawing_data);
                } catch {}
                const thumbnail = parsed?.canvasThumbnail || null;
                const projectName = parsed?.projectInfo?.name || "Desain Tanpa Nama";
                const fabric = parsed?.projectInfo?.fabric || "Katun Primisima";
                const description = parsed?.projectInfo?.description || "";
                const isOrdered = detailTarget.isOrdered ?? false;

                return (
                  <>
                    <button
                      onClick={() => setDetailTarget(null)}
                      className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm text-[#A89B8F] hover:bg-white rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Preview Image */}
                    <div className="bg-stone-100 flex items-center justify-center">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={projectName}
                          className="w-full h-auto"
                        />
                      ) : (
                        <div className="w-full h-64 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #FAF8F5, #F0EBE1)" }}>
                          <Palette className="w-14 h-14 mb-2" style={{ color: "rgba(139,111,71,0.3)" }} />
                          <p className="text-sm" style={{ color: "rgba(139,111,71,0.5)" }}>Tidak ada preview</p>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Status */}
                      <div className="mb-4">
                        {isOrdered ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.3)" }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Sudah Dipesan
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(212,184,139,0.2)", color: "#8B6F47", border: "1px solid rgba(212,184,139,0.4)" }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Belum Dipesan
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                        {projectName}
                      </h2>

                      <div className="flex items-center gap-1.5 mb-4" style={{ color: "#A89B8F" }}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(detailTarget.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(139,111,71,0.08)", color: "#8B6F47", border: "1px solid rgba(139,111,71,0.15)" }}>
                          {fabric}
                        </span>
                      </div>

                      {description && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold mb-2" style={{ color: "#3D2B1F" }}>Deskripsi / Tujuan</h4>
                          <p className="text-sm" style={{ color: "#7A6B5E" }}>
                            {description}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!isOrdered && (
                          <button
                            onClick={() => {
                              setDetailTarget(null);
                              navigate(`/custom?editDesignId=${detailTarget.id}`);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-sm active:scale-95"
                            style={{ border: "1.5px solid rgba(139,111,71,0.25)", color: "#8B6F47", background: "rgba(139,111,71,0.04)" }}
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Desain
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDetailTarget(null);
                            handleOrder(detailTarget);
                          }}
                          disabled={isOrdered}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                          style={{
                            background: isOrdered
                              ? "rgba(22,163,74,0.7)"
                              : "linear-gradient(135deg, #8B6F47, #6B4F2F)",
                            boxShadow: isOrdered ? "none" : "0 4px 14px rgba(139,111,71,0.3)",
                          }}
                        >
                          {isOrdered ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Sudah Dipesan
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4" />
                              Pesan Sekarang
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
