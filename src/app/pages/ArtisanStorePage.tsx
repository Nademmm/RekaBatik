import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Store, Save, Loader2, CheckCircle2, AlertCircle, XCircle,
  ArrowLeft, Eye, Upload, Trash2, Plus, Clock, MapPin, Phone,
  DollarSign, FileText, Tag, Sparkles, Image as ImageIcon, Users,
  Info, ChevronRight, Camera, ExternalLink, AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "sonner";
import { BatikBackground } from "../components/BatikBackground";
import { Skeleton } from "../components/ui/skeleton";

// ─── Required fields config ────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  { key: "name", label: "Nama Toko" },
  { key: "owner", label: "Nama Pemilik" },
  { key: "specialty", label: "Keahlian / Spesialisasi" },
  { key: "address", label: "Alamat Toko" },
  { key: "phone", label: "Nomor Telepon" },
  { key: "hours", label: "Jam Operasional" },
  { key: "price_range", label: "Rentang Harga" },
  { key: "description", label: "Deskripsi Toko" },
  { key: "image", label: "Foto Toko (Thumbnail)" },
  { key: "hero_image", label: "Foto Hero / Banner" },
  { key: "tags", label: "Kategori / Tag" },
  { key: "motifs", label: "Motif Unggulan" },
  { key: "gallery", label: "Foto Galeri" },
] as const;

type RequiredKey = typeof REQUIRED_FIELDS[number]["key"];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function checkCompletion(form: StoreFormState): { completed: RequiredKey[]; missing: RequiredKey[] } {
  const completed: RequiredKey[] = [];
  const missing: RequiredKey[] = [];

  for (const field of REQUIRED_FIELDS) {
    const val = form[field.key as keyof StoreFormState];
    let filled = false;
    if (Array.isArray(val)) {
      filled = val.length > 0;
    } else if (typeof val === "string") {
      filled = val.trim().length > 0;
      if (field.key === "description") filled = val.trim().length >= 20;
    }
    if (filled) completed.push(field.key);
    else missing.push(field.key);
  }

  return { completed, missing };
}

interface StoreFormState {
  name: string;
  owner: string;
  established: string;
  specialty: string;
  address: string;
  phone: string;
  hours_start: string;
  hours_end: string;
  hours: string;
  price_min: string;
  price_max: string;
  price_range: string;
  description: string;
  image: string;
  hero_image: string;
  tags: string[];
  motifs: string[];
  gallery: string[];
  team: string[];
  // For text inputs (comma-separated editing)
  tagsRaw: string;
  motifsRaw: string;
  galleryRaw: string;
  teamRaw: string;
}

// ─── FieldRow component ────────────────────────────────────────────────────────
function FieldRow({
  label, children, hint, required, filled
}: {
  label: string; children: React.ReactNode; hint?: string;
  required?: boolean; filled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
          {label}
        </label>
        {required && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
            WAJIB
          </span>
        )}
        {filled !== undefined && (
          filled
            ? <CheckCircle2 className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "#16A34A" }} />
            : <AlertCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: required ? "#EF4444" : "#F59E0B" }} />
        )}
      </div>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "#B5A89E" }}>{hint}</p>}
    </div>
  );
}

// ─── Main ArtisanStorePage ─────────────────────────────────────────────────────
export function ArtisanStorePage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeStatus, setStoreStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const [form, setForm] = useState<StoreFormState>({
    name: "", owner: "", established: "", specialty: "",
    address: "", phone: "", hours_start: "", hours_end: "", hours: "",
    price_min: "", price_max: "", price_range: "",
    description: "", image: "", hero_image: "",
    tags: [], motifs: [], gallery: [], team: [],
    tagsRaw: "", motifsRaw: "", galleryRaw: "", teamRaw: "",
  });

  // Redirect if not artisan
  useEffect(() => {
    if (userRole && userRole !== "artisan") {
      toast.error("Halaman ini khusus untuk pengrajin.");
      navigate("/");
    }
  }, [userRole, navigate]);

  // Fetch store data
  useEffect(() => {
    if (!user) return;
    const fetchStore = async () => {
      setLoadingStore(true);
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setStoreId(data.id);
          setStoreStatus(data.status as any);
          setIsProfileComplete(data.is_profile_complete || false);

          // Parse hours
          let hours_start = "";
          let hours_end = "";
          if (data.hours) {
            const parts = data.hours.split(/[-–—]/);
            if (parts.length >= 2) {
              hours_start = parts[0].trim();
              hours_end = parts[1].trim();
            }
          }

          // Parse price_range
          let price_min = "";
          let price_max = "";
          if (data.price_range) {
            const parts = data.price_range.split(/[-–—]/);
            if (parts.length >= 2) {
              price_min = parts[0].replace(/[^0-9]/g, "");
              price_max = parts[1].replace(/[^0-9]/g, "");
            }
          }

          const tagsArr = data.tags || [];
          const motifsArr = data.motifs || [];
          const galleryArr = data.gallery || [];
          const teamArr = data.team || [];

          setForm({
            name: data.name || "",
            owner: data.owner || "",
            established: data.established || "",
            specialty: data.specialty || "",
            address: data.address || "",
            phone: data.phone || "",
            hours_start,
            hours_end,
            hours: data.hours || "",
            price_min,
            price_max,
            price_range: data.price_range || "",
            description: data.description || "",
            image: data.image || "",
            hero_image: data.hero_image || "",
            tags: tagsArr,
            motifs: motifsArr,
            gallery: galleryArr,
            team: teamArr,
            tagsRaw: tagsArr.join(", "),
            motifsRaw: motifsArr.join(", "),
            galleryRaw: galleryArr.join(", "),
            teamRaw: teamArr.join(", "),
          });
        }
      } catch (err) {
        console.error("Error fetching store:", err);
        toast.error("Gagal memuat data toko");
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStore();
  }, [user?.id]);

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("store-images")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("store-images").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Gagal mengunggah file");
      return null;
    }
  };

  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Hanya file gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Maksimum 5MB untuk foto toko"); return; }
    setUploadingImage(true);
    const url = await uploadFile(file, "store-profiles");
    if (url) setForm(p => ({ ...p, image: url }));
    setUploadingImage(false);
  };

  const handleHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Hanya file gambar"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Maksimum 10MB untuk foto hero"); return; }
    setUploadingHero(true);
    const url = await uploadFile(file, "store-heroes");
    if (url) setForm(p => ({ ...p, hero_image: url }));
    setUploadingHero(false);
  };

  const handleGalleryImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) { toast.error(`File ${file.name} terlalu besar (maks 10MB)`); continue; }
      const url = await uploadFile(file, "store-gallery");
      if (url) newUrls.push(url);
    }
    if (newUrls.length > 0) {
      setForm(p => {
        const updated = [...p.gallery, ...newUrls];
        return { ...p, gallery: updated, galleryRaw: updated.join(", ") };
      });
      toast.success(`${newUrls.length} foto galeri berhasil diunggah`);
    }
    setUploadingGallery(false);
    e.target.value = "";
  };

  const removeGalleryImage = (idx: number) => {
    setForm(p => {
      const updated = p.gallery.filter((_, i) => i !== idx);
      return { ...p, gallery: updated, galleryRaw: updated.join(", ") };
    });
  };

  // Derived computed form for completion check
  const derivedForm = {
    ...form,
    hours: form.hours_start && form.hours_end ? `${form.hours_start} - ${form.hours_end}` : form.hours,
    price_range: form.price_min && form.price_max
      ? `Rp ${parseInt(form.price_min).toLocaleString("id-ID")} - Rp ${parseInt(form.price_max).toLocaleString("id-ID")}`
      : form.price_range,
    tags: form.tagsRaw.split(",").map(s => s.trim()).filter(Boolean),
    motifs: form.motifsRaw.split(",").map(s => s.trim()).filter(Boolean),
    gallery: form.gallery,
    team: form.teamRaw.split(",").map(s => s.trim()).filter(Boolean),
  };

  const { completed, missing } = checkCompletion(derivedForm as any);
  const completionPct = Math.round((completed.length / REQUIRED_FIELDS.length) * 100);

  const handleSave = async () => {
    if (!user || !storeId) return;

    // Validate required fields
    if (missing.length > 0) {
      const missingLabels = missing
        .map(k => REQUIRED_FIELDS.find(f => f.key === k)?.label)
        .filter(Boolean)
        .join(", ");
      toast.error(`Data belum lengkap: ${missingLabels}`);
      return;
    }

    // Extra validations
    if (form.description.trim().length < 20) {
      toast.error("Deskripsi toko minimal 20 karakter");
      return;
    }

    setSaving(true);
    try {
      const hours = form.hours_start && form.hours_end
        ? `${form.hours_start} - ${form.hours_end}`
        : form.hours;

      const price_range = form.price_min && form.price_max
        ? `Rp ${parseInt(form.price_min).toLocaleString("id-ID")} - Rp ${parseInt(form.price_max).toLocaleString("id-ID")}`
        : form.price_range;

      const tags = form.tagsRaw.split(",").map(s => s.trim()).filter(Boolean);
      const motifs = form.motifsRaw.split(",").map(s => s.trim()).filter(Boolean);
      const gallery = form.gallery;
      const team = form.teamRaw.split(",").map(s => s.trim()).filter(Boolean);

      // Check completeness for is_profile_complete flag
      const allFilled = missing.length === 0;

      const payload = {
        name: form.name.trim(),
        owner: form.owner.trim(),
        established: form.established.trim(),
        specialty: form.specialty.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        hours,
        price_range,
        description: form.description.trim(),
        image: form.image.trim(),
        hero_image: form.hero_image.trim(),
        tags,
        motifs,
        gallery,
        team,
        is_profile_complete: allFilled,
      };

      const { error } = await supabase
        .from("stores")
        .update(payload)
        .eq("id", storeId);

      if (error) throw error;

      setIsProfileComplete(allFilled);
      toast.success(
        allFilled
          ? "Data toko berhasil disimpan! Toko Anda sudah lengkap dan tampil ke publik."
          : "Data toko berhasil disimpan. Lengkapi semua field untuk menampilkan toko."
      );
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.message || "Gagal menyimpan data toko");
    } finally {
      setSaving(false);
    }
  };

  // ─── Status banner ────────────────────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (storeStatus === "pending") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl border mb-6"
          style={{ background: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.3)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.15)" }}>
            <Clock className="w-5 h-5" style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5" style={{ color: "#92400E" }}>Menunggu Persetujuan Admin</p>
            <p className="text-xs leading-relaxed" style={{ color: "#B45309" }}>
              Pendaftaran toko Anda sedang dalam proses review oleh tim RekaBatik. Sambil menunggu, Anda sudah bisa melengkapi data toko agar langsung tampil setelah disetujui.
            </p>
          </div>
        </motion.div>
      );
    }
    if (storeStatus === "rejected") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl border mb-6"
          style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5 text-red-700">Pendaftaran Ditolak</p>
            <p className="text-xs leading-relaxed text-red-600">
              Maaf, pendaftaran toko Anda ditolak oleh admin. Silakan hubungi tim RekaBatik untuk informasi lebih lanjut.
            </p>
          </div>
        </motion.div>
      );
    }
    if (storeStatus === "approved" && isProfileComplete) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl border mb-6"
          style={{ background: "rgba(22,163,74,0.06)", borderColor: "rgba(22,163,74,0.25)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,163,74,0.12)" }}>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-0.5 text-green-700">Toko Aktif & Tampil ke Publik 🎉</p>
            <p className="text-xs leading-relaxed text-green-600">
              Data toko Anda sudah lengkap. Toko Anda bisa dilihat oleh pengunjung di halaman Desa Jetis.
            </p>
          </div>
          {storeId && (
            <Link
              to={`/desa-jetis/${storeId}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all hover:opacity-80"
              style={{ background: "rgba(22,163,74,0.15)", color: "#15803D" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Toko
            </Link>
          )}
        </motion.div>
      );
    }
    if (storeStatus === "approved" && !isProfileComplete) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl border mb-6"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5 text-red-700">Toko Belum Tampil — Data Belum Lengkap</p>
            <p className="text-xs leading-relaxed text-red-600">
              Toko Anda sudah disetujui admin, namun <strong>belum tampil ke publik</strong> karena data belum lengkap. Isi semua field yang bertanda <span className="font-bold">WAJIB</span> lalu simpan untuk mengaktifkan toko Anda.
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  if (loadingStore) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-10 rounded-[2rem] shadow-xl border"
          style={{ borderColor: "#E8E1DA" }}
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(139,111,71,0.1)" }}>
            <Store className="w-10 h-10" style={{ color: "#8B6F47" }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            Belum Ada Toko
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#7A6B5E" }}>
            Anda belum mendaftarkan toko. Daftar sebagai pengrajin terlebih dahulu melalui halaman pendaftaran.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            Daftar Pengrajin
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  const isFieldFilled = (key: RequiredKey) => completed.includes(key);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <BatikBackground opacity={0.025} patternType="kawung" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate("/admin")}
            className="p-2.5 rounded-xl hover:bg-white transition-all border"
            style={{ borderColor: "rgba(212,184,139,0.25)" }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: "#8B6F47" }} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
              Kelola Toko Saya
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#9B8C80" }}>
              Lengkapi data toko agar tampil di halaman Desa Jetis
            </p>
          </div>
          {storeId && storeStatus === "approved" && isProfileComplete && (
            <Link
              to={`/desa-jetis/${storeId}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:shadow-md"
              style={{ borderColor: "rgba(212,184,139,0.4)", color: "#8B6F47", background: "white" }}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview Toko</span>
            </Link>
          )}
        </motion.div>

        {/* Status Banner */}
        {renderStatusBanner()}

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border mb-6 shadow-sm"
          style={{ borderColor: "rgba(212,184,139,0.2)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "#8B6F47" }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#3D2B1F" }}>Kelengkapan Data</p>
                <p className="text-xs" style={{ color: "#9B8C80" }}>{completed.length} dari {REQUIRED_FIELDS.length} field terisi</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: completionPct === 100 ? "#16A34A" : "#8B6F47" }}>
                {completionPct}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(212,184,139,0.15)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: completionPct === 100
                  ? "linear-gradient(90deg, #16A34A, #22C55E)"
                  : "linear-gradient(90deg, #8B6F47, #D4B88B)"
              }}
            />
          </div>

          {/* Missing fields */}
          {missing.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {missing.map(key => (
                <span
                  key={key}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.07)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  {REQUIRED_FIELDS.find(f => f.key === key)?.label}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── FORM ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border shadow-sm overflow-hidden mb-6"
          style={{ borderColor: "rgba(212,184,139,0.2)" }}
        >
          {/* Card Header */}
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
              <Store className="w-5 h-5" style={{ color: "#8B6F47" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#3D2B1F" }}>Informasi Dasar Toko</p>
              <p className="text-xs" style={{ color: "#9B8C80" }}>Identitas dan detail kontak toko</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            <FieldRow label="Nama Toko" required filled={isFieldFilled("name")}>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="contoh: Batik Amri Jetis"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
            </FieldRow>

            <FieldRow label="Nama Pemilik" required filled={isFieldFilled("owner")}>
              <input
                value={form.owner}
                onChange={e => setForm(p => ({ ...p, owner: e.target.value }))}
                placeholder="contoh: Pak Amri Sutomo"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
            </FieldRow>

            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Tahun Berdiri" filled={form.established.trim().length > 0}>
                <input
                  type="number"
                  value={form.established}
                  onChange={e => setForm(p => ({ ...p, established: e.target.value }))}
                  placeholder="2010"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
                />
              </FieldRow>
              <FieldRow label="Keahlian / Spesialisasi" required filled={isFieldFilled("specialty")}>
                <input
                  value={form.specialty}
                  onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                  placeholder="contoh: Batik Tulis"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
                />
              </FieldRow>
            </div>

            <FieldRow label="Alamat Lengkap Toko" required filled={isFieldFilled("address")}
              hint="Alamat lengkap agar pelanggan bisa berkunjung">
              <input
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="contoh: Jl. Raya Jetis No. 12, Sidoarjo"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
            </FieldRow>

            <FieldRow label="Nomor Telepon / WhatsApp" required filled={isFieldFilled("phone")}>
              <input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/[^0-9+]/g, "") }))}
                placeholder="contoh: 08123456789"
                inputMode="tel"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
            </FieldRow>

            <FieldRow label="Jam Operasional" required filled={isFieldFilled("hours")}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] mb-1.5" style={{ color: "#9B8C80" }}>Buka</p>
                  <input
                    type="time"
                    value={form.hours_start}
                    onChange={e => setForm(p => ({ ...p, hours_start: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
                  />
                </div>
                <span className="text-xl mt-5" style={{ color: "#8B6F47" }}>–</span>
                <div className="flex-1">
                  <p className="text-[11px] mb-1.5" style={{ color: "#9B8C80" }}>Tutup</p>
                  <input
                    type="time"
                    value={form.hours_end}
                    onChange={e => setForm(p => ({ ...p, hours_end: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
                  />
                </div>
              </div>
            </FieldRow>

            <FieldRow label="Rentang Harga" required filled={isFieldFilled("price_range")}
              hint="Harga minimum dan maksimum produk toko Anda">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] mb-1.5" style={{ color: "#9B8C80" }}>Harga Minimum</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#8B6F47" }}>Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.price_min ? parseInt(form.price_min).toLocaleString("id-ID") : ""}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setForm(p => ({ ...p, price_min: raw }));
                      }}
                      placeholder="500.000"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
                    />
                  </div>
                </div>
                <span className="text-xl mt-5" style={{ color: "#8B6F47" }}>–</span>
                <div className="flex-1">
                  <p className="text-[11px] mb-1.5" style={{ color: "#9B8C80" }}>Harga Maksimum</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#8B6F47" }}>Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.price_max ? parseInt(form.price_max).toLocaleString("id-ID") : ""}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setForm(p => ({ ...p, price_max: raw }));
                      }}
                      placeholder="5.000.000"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
                    />
                  </div>
                </div>
              </div>
            </FieldRow>

            <FieldRow label="Deskripsi Toko" required filled={isFieldFilled("description")}
              hint={`Minimal 20 karakter. Saat ini: ${form.description.trim().length} karakter`}>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={5}
                placeholder="Ceritakan tentang toko Anda, keahlian, dan produk unggulan..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-vertical"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8", lineHeight: 1.7 }}
              />
            </FieldRow>
          </div>
        </motion.div>

        {/* ─── PHOTOS CARD ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border shadow-sm overflow-hidden mb-6"
          style={{ borderColor: "rgba(212,184,139,0.2)" }}
        >
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
              <ImageIcon className="w-5 h-5" style={{ color: "#8B6F47" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#3D2B1F" }}>Foto & Galeri</p>
              <p className="text-xs" style={{ color: "#9B8C80" }}>Foto toko, banner halaman, dan galeri produk</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Store Thumbnail */}
            <FieldRow label="Foto Toko (Thumbnail)" required filled={isFieldFilled("image")}
              hint="Foto yang tampil di kartu toko. Rasio 1:1 atau landscape. Maks 5MB.">
              <div className="space-y-3">
                {form.image && (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
                    <img src={form.image} alt="Preview toko" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, image: "" }))}
                      className="absolute top-2 right-2 p-2 bg-white rounded-xl shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: "rgba(0,0,0,0.5)" }}>
                      Foto Thumbnail
                    </div>
                  </div>
                )}
                <label className="flex items-center justify-center w-full h-11 border-2 border-dashed rounded-xl cursor-pointer hover:bg-[#FAF8F5] transition-colors" style={{ borderColor: "rgba(139,111,71,0.4)" }}>
                  {uploadingImage ? (
                    <span className="flex items-center gap-2 text-sm" style={{ color: "#8B6F47" }}>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm" style={{ color: "#8B6F47" }}>
                      <Upload className="w-4 h-4" /> {form.image ? "Ganti foto thumbnail" : "Upload foto thumbnail"}
                    </span>
                  )}
                  <input type="file" accept="image/*" onChange={handleStoreImageChange} disabled={uploadingImage} className="hidden" />
                </label>
                <input
                  value={form.image}
                  onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                  placeholder="Atau masukkan URL gambar..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid rgba(212,184,139,0.25)", color: "#3D2B1F", background: "#FAFAF8" }}
                />
              </div>
            </FieldRow>

            {/* Hero / Banner */}
            <FieldRow label="Foto Hero / Banner" required filled={isFieldFilled("hero_image")}
              hint="Foto besar yang tampil di bagian atas halaman detail toko. Landscape (16:9). Maks 10MB.">
              <div className="space-y-3">
                {form.hero_image && (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
                    <img src={form.hero_image} alt="Preview hero" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, hero_image: "" }))}
                      className="absolute top-2 right-2 p-2 bg-white rounded-xl shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: "rgba(0,0,0,0.5)" }}>
                      Foto Hero (Banner)
                    </div>
                  </div>
                )}
                <label className="flex items-center justify-center w-full h-11 border-2 border-dashed rounded-xl cursor-pointer hover:bg-[#FAF8F5] transition-colors" style={{ borderColor: "rgba(139,111,71,0.4)" }}>
                  {uploadingHero ? (
                    <span className="flex items-center gap-2 text-sm" style={{ color: "#8B6F47" }}>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm" style={{ color: "#8B6F47" }}>
                      <Upload className="w-4 h-4" /> {form.hero_image ? "Ganti foto hero" : "Upload foto hero/banner"}
                    </span>
                  )}
                  <input type="file" accept="image/*" onChange={handleHeroImageChange} disabled={uploadingHero} className="hidden" />
                </label>
                <input
                  value={form.hero_image}
                  onChange={e => setForm(p => ({ ...p, hero_image: e.target.value }))}
                  placeholder="Atau masukkan URL gambar..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid rgba(212,184,139,0.25)", color: "#3D2B1F", background: "#FAFAF8" }}
                />
              </div>
            </FieldRow>

            {/* Gallery */}
            <FieldRow label="Galeri Produk" required filled={isFieldFilled("gallery")}
              hint="Foto-foto produk batik Anda. Minimal 1 foto. Bisa upload sekaligus beberapa foto.">
              <div className="space-y-3">
                {/* Gallery Grid Preview */}
                {form.gallery.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.gallery.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
                        <img src={img} alt={`Galeri ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))}
                    {/* Add more button */}
                    <label className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-[#FAF8F5] transition-colors" style={{ borderColor: "rgba(139,111,71,0.35)" }}>
                      <div className="text-center">
                        <Plus className="w-5 h-5 mx-auto mb-1" style={{ color: "#8B6F47" }} />
                        <span className="text-[10px]" style={{ color: "#8B6F47" }}>Tambah</span>
                      </div>
                      <input type="file" accept="image/*" multiple onChange={handleGalleryImageAdd} disabled={uploadingGallery} className="hidden" />
                    </label>
                  </div>
                )}
                {form.gallery.length === 0 && (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:bg-[#FAF8F5] transition-colors" style={{ borderColor: "rgba(139,111,71,0.4)" }}>
                    {uploadingGallery ? (
                      <span className="flex items-center gap-2 text-sm" style={{ color: "#8B6F47" }}>
                        <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                      </span>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-2" style={{ color: "#8B6F47" }} />
                        <span className="text-sm font-medium" style={{ color: "#8B6F47" }}>Upload Foto Galeri</span>
                        <span className="text-xs mt-1" style={{ color: "#B5A89E" }}>Bisa pilih beberapa sekaligus</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleGalleryImageAdd} disabled={uploadingGallery} className="hidden" />
                  </label>
                )}
                {uploadingGallery && form.gallery.length > 0 && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#8B6F47" }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mengunggah foto...
                  </div>
                )}
              </div>
            </FieldRow>
          </div>
        </motion.div>

        {/* ─── CATEGORIZATION CARD ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl border shadow-sm overflow-hidden mb-6"
          style={{ borderColor: "rgba(212,184,139,0.2)" }}
        >
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(212,184,139,0.15)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
              <Sparkles className="w-5 h-5" style={{ color: "#8B6F47" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#3D2B1F" }}>Kategori & Motif</p>
              <p className="text-xs" style={{ color: "#9B8C80" }}>Tag, motif unggulan, dan tim pengrajin</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            <FieldRow label="Kategori / Tag" required filled={isFieldFilled("tags")}
              hint="Pisahkan dengan koma. Contoh: Batik Tulis, Custom, Tradisional">
              <input
                value={form.tagsRaw}
                onChange={e => {
                  const raw = e.target.value;
                  setForm(p => ({
                    ...p,
                    tagsRaw: raw,
                    tags: raw.split(",").map(s => s.trim()).filter(Boolean)
                  }));
                }}
                placeholder="Batik Tulis, Custom, Tradisional"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(212,184,139,0.15)", color: "#8B6F47", border: "1px solid rgba(212,184,139,0.3)" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </FieldRow>

            <FieldRow label="Motif Unggulan" required filled={isFieldFilled("motifs")}
              hint="Pisahkan dengan koma. Contoh: Parang, Kawung, Beras Utah">
              <input
                value={form.motifsRaw}
                onChange={e => {
                  const raw = e.target.value;
                  setForm(p => ({
                    ...p,
                    motifsRaw: raw,
                    motifs: raw.split(",").map(s => s.trim()).filter(Boolean)
                  }));
                }}
                placeholder="Beras Utah, Parang, Kawung"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
              {form.motifs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.motifs.map((m, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(212,184,139,0.1)", color: "#6B5A4A", border: "1px solid rgba(212,184,139,0.25)" }}>
                      ✦ {m}
                    </span>
                  ))}
                </div>
              )}
            </FieldRow>

            <FieldRow label="Tim Pengrajin" hint="Pisahkan dengan koma. Contoh: Pak Amri (Pemilik), Bu Siti (Pengrajin)">
              <input
                value={form.teamRaw}
                onChange={e => {
                  const raw = e.target.value;
                  setForm(p => ({
                    ...p,
                    teamRaw: raw,
                    team: raw.split(",").map(s => s.trim()).filter(Boolean)
                  }));
                }}
                placeholder="Pak Amri (Pemilik), Bu Siti (Pengrajin)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: "1.5px solid rgba(212,184,139,0.35)", color: "#3D2B1F", background: "#FAFAF8" }}
              />
            </FieldRow>
          </div>
        </motion.div>

        {/* ─── SAVE BUTTON ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {missing.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
              <p className="text-xs leading-relaxed text-red-600">
                <strong>Toko belum bisa ditampilkan.</strong> Masih ada {missing.length} field yang belum diisi: {missing.map(k => REQUIRED_FIELDS.find(f => f.key === k)?.label).join(", ")}.
              </p>
            </div>
          )}

          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.01 }}
            whileTap={{ scale: saving ? 1 : 0.99 }}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-lg"
            style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Menyimpan...</>
            ) : (
              <><Save className="w-5 h-5" />Simpan Data Toko</>
            )}
          </motion.button>

          {storeId && storeStatus === "approved" && isProfileComplete && (
            <Link
              to={`/desa-jetis/${storeId}`}
              target="_blank"
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 border transition-all hover:bg-white"
              style={{ borderColor: "rgba(139,111,71,0.3)", color: "#8B6F47" }}
            >
              <Eye className="w-4 h-4" />
              Lihat Halaman Toko Publik
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
