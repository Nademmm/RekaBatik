import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User,
  Lock,
  Save,
  Heart,
  Store,
  Palette,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ChevronRight,
  Package,
  MessageCircle,
  LogOut,
  MapPin,
  Star,
  ChevronDown,
  Phone,
  Trash2,
  Plus,
} from "lucide-react";
import { useNavigate, Link } from "react-router";
import { BatikBackground } from "../components/BatikBackground";
import { PatternMini } from "../components/BatikDetailModal";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { INDONESIAN_LOCATIONS, PROVINCES } from "../constants/locations";
import type { BatikItem, Store as StoreType } from "../../types/database";

function getInitials(user: {
  user_metadata?: { full_name?: string };
  email?: string;
}) {
  const name = user.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (user.email || "U").slice(0, 2).toUpperCase();
}

type TabId = "account" | "favorites" | "orders" | "support" | "addresses";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Akun", icon: <User className="w-4 h-4" /> },
  { id: "addresses", label: "Alamat", icon: <MapPin className="w-4 h-4" /> },
  { id: "favorites", label: "Favorit", icon: <Heart className="w-4 h-4" /> },
  { id: "orders", label: "Pesanan", icon: <Package className="w-4 h-4" /> },
  { id: "support", label: "Bantuan", icon: <MessageCircle className="w-4 h-4" /> },
];

// ─── Reusable section card ────────────────────────────────────────────────────
function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(212,184,139,0.18)",
        boxShadow: "0 1px 3px rgba(61,43,31,0.06)",
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(212,184,139,0.15)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(139,111,71,0.1)", color: "#8B6F47" }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "#3D2B1F" }}
          >
            {title}
          </p>
          <p className="text-xs" style={{ color: "#9B8C80" }}>
            {description}
          </p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────
function FieldRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#9B8C80" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: "#B5A89E" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Password input ───────────────────────────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl pr-10 text-sm"
        style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "#B5A89E" }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left py-3"
      style={{ borderBottom: "1px solid rgba(212,184,139,0.15)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
          {q}
        </span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{
            color: "#8B6F47",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      {open && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "#7A6B5E" }}>
          {a}
        </p>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [loading, setLoading] = useState(true);

  // Account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Logout
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Favorites
  const [favoriteStores, setFavoriteStores] = useState<StoreType[]>([]);
  const [favoriteBatik, setFavoriteBatik] = useState<BatikItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Address Book state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Address Form state
  const [addressForm, setAddressForm] = useState({
    label: "Rumah",
    recipient_name: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    is_default: false,
  });

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setLoadingAddresses(true);
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch {
      toast.error("Gagal memuat alamat");
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addressForm.recipient_name.trim()) { toast.error("Nama penerima wajib diisi"); return; }
    if (!addressForm.phone.trim()) { toast.error("Nomor HP wajib diisi"); return; }
    if (!/^(08|\+62)[0-9]{7,12}$/.test(addressForm.phone.replace(/\s/g, ""))) { toast.error("Format nomor HP tidak valid"); return; }
    if (!addressForm.street.trim()) { toast.error("Alamat jalan wajib diisi"); return; }
    if (!addressForm.city.trim()) { toast.error("Kota/Kabupaten wajib diisi"); return; }
    if (!addressForm.province) { toast.error("Silakan pilih provinsi"); return; }
    if (!/^[0-9]{5}$/.test(addressForm.postal_code.trim())) { toast.error("Kode pos harus 5 digit angka"); return; }

    try {
      setSavingName(true); // use savingName spinner or loading
      if (addressForm.is_default) {
        await supabase
          .from("user_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from("user_addresses")
          .update({
            label: addressForm.label,
            recipient_name: addressForm.recipient_name,
            phone: addressForm.phone,
            street: addressForm.street,
            city: addressForm.city,
            province: addressForm.province,
            postal_code: addressForm.postal_code,
            is_default: addressForm.is_default,
          })
          .eq("id", editingAddress.id);
        if (error) throw error;
        toast.success("Alamat berhasil diperbarui");
      } else {
        const isFirst = addresses.length === 0;
        const { error } = await supabase
          .from("user_addresses")
          .insert([{
            user_id: user.id,
            label: addressForm.label,
            recipient_name: addressForm.recipient_name,
            phone: addressForm.phone,
            street: addressForm.street,
            city: addressForm.city,
            province: addressForm.province,
            postal_code: addressForm.postal_code,
            is_default: isFirst ? true : addressForm.is_default,
          }]);
        if (error) throw error;
        toast.success("Alamat berhasil ditambahkan");
      }

      setAddressModalOpen(false);
      fetchAddresses();
    } catch {
      toast.error("Gagal menyimpan alamat");
    } finally {
      setSavingName(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    if (!user) return;
    try {
      setSavingName(true);
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", addressId);
      if (error) throw error;

      toast.success("Alamat utama berhasil diubah");
      fetchAddresses();
    } catch {
      toast.error("Gagal mengubah alamat utama");
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!user) return;
    try {
      setSavingName(true);
      const target = addresses.find(a => a.id === addressId);
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", addressId);
      if (error) throw error;

      toast.success("Alamat berhasil dihapus");
      
      if (target?.is_default && addresses.length > 1) {
        const nextDefault = addresses.find(a => a.id !== addressId);
        if (nextDefault) {
          await supabase
            .from("user_addresses")
            .update({ is_default: true })
            .eq("id", nextDefault.id);
        }
      }

      fetchAddresses();
    } catch {
      toast.error("Gagal menghapus alamat");
    } finally {
      setSavingName(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      setLoadingFavorites(true);
      const { data: storeFavs, error: storeErr } = await supabase
        .from("favorite_stores")
        .select("*, stores(*)")
        .eq("user_id", user.id);
      if (storeErr) throw storeErr;
      setFavoriteStores(
        storeFavs?.map((f) => f.stores).filter(Boolean) as StoreType[] || []
      );

      const { data: batikFavs, error: batikErr } = await supabase
        .from("favorite_batik")
        .select("*, batik_items(*)")
        .eq("user_id", user.id);
      if (batikErr) throw batikErr;
      setFavoriteBatik(
        batikFavs?.map((f) => f.batik_items).filter(Boolean) as BatikItem[] || []
      );
    } catch {
      toast.error("Gagal memuat data favorit");
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      fetchFavorites();
      fetchAddresses();
    }
    setLoading(false);
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw error;
      toast.success("Nama berhasil diperbarui");
      setIsEditingName(false);
    } catch {
      toast.error("Gagal memperbarui nama");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    setChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Password saat ini salah");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
    toast.success("Berhasil keluar");
    navigate("/");
  };

  const removeFavoriteStore = async (storeId: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("favorite_stores")
        .delete()
        .eq("user_id", user.id)
        .eq("store_id", storeId);
      if (error) throw error;
      setFavoriteStores((prev) => prev.filter((s) => s.id !== storeId));
      toast.success("Dihapus dari favorit");
    } catch {
      toast.error("Gagal menghapus toko dari favorit");
    }
  };

  const removeFavoriteBatik = async (batikId: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("favorite_batik")
        .delete()
        .eq("user_id", user.id)
        .eq("batik_id", batikId);
      if (error) throw error;
      setFavoriteBatik((prev) => prev.filter((b) => b.id !== batikId));
      toast.success("Batik dihapus dari favorit");
    } catch {
      toast.error("Gagal menghapus batik dari favorit");
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Pengguna";
  const initials = user ? getInitials(user) : "U";

  return (
    <div className="min-h-screen" style={{ background: "#F7F4F0" }}>
      <BatikBackground opacity={0.025} patternType="mega" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* ── Hero banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl overflow-hidden mb-5"
          style={{
            background: "linear-gradient(140deg, #3D2B1F 0%, #6B4A30 50%, #A88255 100%)",
            padding: "1.75rem",
          }}
        >
          {/* decorative circles */}
          <div
            className="absolute"
            style={{
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "28px solid rgba(255,255,255,0.05)",
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: -40,
              left: 60,
              width: 140,
              height: 140,
              borderRadius: "50%",
              border: "18px solid rgba(255,255,255,0.04)",
            }}
          />

          <div className="relative z-10 flex items-center gap-5">
            {/* avatar */}
            <div className="flex-shrink-0">
              <div
                className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center text-2xl font-bold select-none"
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "2px solid rgba(255,255,255,0.28)",
                  color: "#fff",
                  letterSpacing: 1,
                }}
              >
                {loading ? "…" : initials}
              </div>
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <Skeleton className="h-6 w-40 mb-2 bg-white/10" />
                  <Skeleton className="h-4 w-52 bg-white/10" />
                </>
              ) : (
                <>
                  <h1
                    className="text-xl font-bold text-white truncate mb-0.5"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {displayName}
                  </h1>
                  <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {email}
                  </p>
                  
                
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="grid grid-cols-3 gap-3 mb-5"
        >
          {[
            { num: "12", label: "Pesanan" },
            { num: String(favoriteStores.length), label: "Toko Favorit" },
            { num: String(favoriteBatik.length), label: "Batik Favorit" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-3 text-center"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(212,184,139,0.18)",
                boxShadow: "0 1px 3px rgba(61,43,31,0.05)",
              }}
            >
              <p
                className="text-2xl font-bold"
                style={{ color: "#8B6F47", fontFamily: "'Playfair Display', serif" }}
              >
                {s.num}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9B8C80" }}>
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-1 rounded-2xl p-1 mb-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(212,184,139,0.18)",
            boxShadow: "0 1px 3px rgba(61,43,31,0.05)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
              style={
                activeTab === tab.id
                  ? {
                      background: "linear-gradient(135deg, #8B6F47, #A88967)",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(139,111,71,0.3)",
                    }
                  : { color: "#9B8C80" }
              }
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Tab: Akun ── */}
        {activeTab === "account" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Informasi Akun */}
            <SectionCard
              icon={<User className="w-4 h-4" />}
              title="Informasi Akun"
              description="Perbarui profil Anda"
            >
              <div className="space-y-4">
                <FieldRow label="Nama Lengkap">
                  <div className="flex gap-2">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditingName}
                      className="rounded-xl text-sm flex-1"
                      style={{
                        borderColor: "rgba(212,184,139,0.35)",
                        height: 42,
                        background: isEditingName ? "#fff" : "#FAF8F5",
                      }}
                    />
                    {isEditingName ? (
                      <>
                        <Button
                          onClick={handleSaveName}
                          disabled={savingName}
                          size="sm"
                          className="rounded-xl font-semibold px-4"
                          style={{
                            background: "linear-gradient(135deg, #8B6F47, #A88967)",
                            color: "#fff",
                            height: 42,
                          }}
                        >
                          {savingName ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span className="ml-1.5">Simpan</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFullName(user?.user_metadata?.full_name || "");
                            setIsEditingName(false);
                          }}
                          className="rounded-xl"
                          style={{ height: 42 }}
                        >
                          Batal
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingName(true)}
                        className="rounded-xl font-semibold"
                        style={{
                          borderColor: "rgba(139,111,71,0.35)",
                          color: "#8B6F47",
                          height: 42,
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </FieldRow>

                <FieldRow label="Email" hint="Email tidak dapat diubah">
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: "#B5A89E" }}
                    />
                    <Input
                      value={email}
                      disabled
                      className="rounded-xl text-sm pl-9"
                      style={{
                        borderColor: "rgba(212,184,139,0.2)",
                        height: 42,
                        background: "#FAF8F5",
                        color: "#9B8C80",
                      }}
                    />
                  </div>
                </FieldRow>
              </div>
            </SectionCard>

            {/* Ubah Password */}
            <SectionCard
              icon={<Lock className="w-4 h-4" />}
              title="Ubah Password"
              description="Lindungi akun dengan password baru"
            >
              <div className="space-y-3">
                <FieldRow label="Password Saat Ini">
                  <PasswordInput
                    id="currentPw"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Masukkan password saat ini"
                  />
                </FieldRow>
                <FieldRow label="Password Baru">
                  <PasswordInput
                    id="newPw"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Minimal 6 karakter"
                  />
                </FieldRow>
                <FieldRow label="Konfirmasi Password Baru">
                  <PasswordInput
                    id="confirmPw"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Ulangi password baru"
                  />
                </FieldRow>

                <div className="pt-1">
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full rounded-xl font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #8B6F47, #A88967)",
                      color: "#fff",
                      height: 44,
                    }}
                  >
                    {changingPassword ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Simpan Password Baru
                  </Button>
                </div>
              </div>
            </SectionCard>

            {/* Danger zone */}
            <div
              className="rounded-3xl p-5 flex items-center justify-between gap-4"
              style={{
                background: "#fff",
                border: "1px solid rgba(220,70,70,0.18)",
                boxShadow: "0 1px 3px rgba(61,43,31,0.05)",
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "#C0392B" }}>
                  Keluar dari Akun
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#9B8C80" }}>
                  Sesi Anda akan diakhiri
                </p>
              </div>
              <Button
                onClick={() => setShowLogoutDialog(true)}
                size="sm"
                className="rounded-xl font-semibold flex items-center gap-1.5"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(220,70,70,0.3)",
                  color: "#C0392B",
                  height: 38,
                }}
              >
                <LogOut className="w-4 h-4" /> Keluar
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Tab: Alamat Saya ── */}
        {activeTab === "addresses" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>Daftar Alamat</h2>
              <Button
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    label: "Rumah",
                    recipient_name: "",
                    phone: "",
                    street: "",
                    city: "",
                    province: "",
                    postal_code: "",
                    is_default: addresses.length === 0,
                  });
                  setAddressModalOpen(true);
                }}
                className="rounded-xl font-semibold flex items-center gap-1 px-3 py-1.5"
                style={{
                  background: "linear-gradient(135deg, #8B6F47, #A88967)",
                  color: "#fff",
                  height: 38,
                }}
              >
                <Plus className="w-4 h-4" /> Tambah Alamat
              </Button>
            </div>

            {loadingAddresses ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl w-full" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12 rounded-3xl bg-white border" style={{ borderColor: "rgba(212,184,139,0.18)" }}>
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#8B6F47]" />
                <p className="text-sm font-semibold mb-1" style={{ color: "#3D2B1F" }}>Belum Ada Alamat</p>
                <p className="text-xs mb-4" style={{ color: "#9B8C80" }}>Simpan alamat pengiriman Anda untuk memudahkan saat checkout</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-5 rounded-3xl bg-white border flex flex-col sm:flex-row justify-between gap-4 relative overflow-hidden"
                    style={{
                      borderColor: addr.is_default ? "#8B6F47" : "rgba(212,184,139,0.18)",
                      boxShadow: "0 1px 3px rgba(61,43,31,0.04)",
                    }}
                  >
                    {addr.is_default && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                        <div className="absolute top-2 -right-6 w-20 text-[8px] font-bold text-center py-1 bg-[#8B6F47] text-white rotate-45 uppercase tracking-widest shadow">
                          Utama
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "rgba(139,111,71,0.08)", color: "#8B6F47" }}>
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold" style={{ color: "#3D2B1F" }}>
                        {addr.recipient_name}
                      </p>
                      <p className="text-xs font-mono" style={{ color: "#9B8C80" }}>
                        {addr.phone}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "#7A6B5E" }}>
                        {addr.street}, {addr.city}, {addr.province} {addr.postal_code}
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col justify-end items-end gap-2.5 sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAddress(addr);
                            setAddressForm({
                              label: addr.label,
                              recipient_name: addr.recipient_name,
                              phone: addr.phone,
                              street: addr.street,
                              city: addr.city,
                              province: addr.province,
                              postal_code: addr.postal_code,
                              is_default: addr.is_default,
                            });
                            setAddressModalOpen(true);
                          }}
                          className="rounded-xl h-8 text-xs font-semibold px-3"
                          style={{ borderColor: "rgba(139,111,71,0.25)", color: "#8B6F47" }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="rounded-xl h-8 text-xs font-semibold px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {!addr.is_default && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[10px] font-bold text-left hover:underline"
                          style={{ color: "#8B6F47" }}
                        >
                          Atur sebagai Alamat Utama
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Favorit ── */}
        {activeTab === "favorites" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Toko Favorit */}
            <SectionCard
              icon={<Store className="w-4 h-4" />}
              title="Toko Favorit"
              description="Toko batik yang Anda simpan"
            >
              {loadingFavorites ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="w-14 h-14 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : favoriteStores.length === 0 ? (
                <div className="text-center py-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(139,111,71,0.08)" }}
                  >
                    <Store className="w-7 h-7" style={{ color: "#8B6F47" }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#3D2B1F" }}>
                    Belum Ada Toko Favorit
                  </p>
                  <p className="text-xs mb-4" style={{ color: "#9B8C80" }}>
                    Jelajahi toko di Desa Jetis dan tandai sebagai favorit
                  </p>
                  <Link to="/desa-jetis">
                    <Button
                      size="sm"
                      className="rounded-xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #8B6F47, #A88967)",
                        color: "#fff",
                      }}
                    >
                      Jelajahi Toko
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {favoriteStores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FAF8F5] transition-colors"
                    >
                      <Link
                        to={`/desa-jetis/${store.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div
                          className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ background: "rgba(139,111,71,0.08)" }}
                        >
                          {store.image ? (
                            <img
                              src={store.image}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="w-6 h-6" style={{ color: "#8B6F47" }} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: "#3D2B1F" }}
                          >
                            {store.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: "#9B8C80" }}>
                            {store.specialty}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavoriteStore(store.id)}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                        style={{ color: "#E05252" }}
                        title="Hapus dari favorit"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Batik Favorit */}
            <SectionCard
              icon={<Palette className="w-4 h-4" />}
              title="Batik Favorit"
              description="Motif yang Anda simpan"
            >
              {loadingFavorites ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i}>
                      <Skeleton className="w-full aspect-square rounded-2xl mb-2" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : favoriteBatik.length === 0 ? (
                <div className="text-center py-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(139,111,71,0.08)" }}
                  >
                    <Palette className="w-7 h-7" style={{ color: "#8B6F47" }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#3D2B1F" }}>
                    Belum Ada Batik Favorit
                  </p>
                  <p className="text-xs mb-4" style={{ color: "#9B8C80" }}>
                    Simpan motif batik favorit Anda dari katalog
                  </p>
                  <Link to="/catalog">
                    <Button
                      size="sm"
                      className="rounded-xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #8B6F47, #A88967)",
                        color: "#fff",
                      }}
                    >
                      Lihat Katalog
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {favoriteBatik.map((batik) => (
                    <div key={batik.id}>
                      <div
                        className="aspect-square rounded-2xl overflow-hidden mb-2"
                        style={{ background: batik.bg_color }}
                      >
                        <PatternMini
                          primary={batik.primary_color}
                          secondary={batik.secondary_color}
                          bg={batik.bg_color}
                          type={batik.style_type || "parang"}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: "#3D2B1F" }}
                        >
                          {batik.name}
                        </p>
                        <button
                          onClick={() => removeFavoriteBatik(batik.id)}
                          className="flex-shrink-0 p-1 rounded-full hover:bg-red-50 transition-colors"
                          style={{ color: "#E05252" }}
                          title="Hapus"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>
        )}

        {/* ── Tab: Pesanan ── */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SectionCard
              icon={<Package className="w-4 h-4" />}
              title="Riwayat Pesanan"
              description="Semua transaksi Anda"
            >
              <div className="space-y-2 mb-4">
                {/* Example order rows — replace with real data */}
                {[
                  { id: "#ORD-20240601", items: "2 item", date: "1 Jun 2024", price: "Rp 450.000", status: "Selesai" },
                  { id: "#ORD-20240518", items: "1 item", date: "18 Mei 2024", price: "Rp 280.000", status: "Dikirim" },
                ].map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(139,111,71,0.08)" }}
                    >
                      <Package className="w-5 h-5" style={{ color: "#8B6F47" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>
                        {o.id}
                      </p>
                      <p className="text-xs" style={{ color: "#9B8C80" }}>
                        {o.items} · {o.date} · {o.price}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={
                        o.status === "Selesai"
                          ? { background: "#EAF3DE", color: "#3B6D11" }
                          : { background: "#E6F1FB", color: "#185FA5" }
                      }
                    >
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>

              <Link to="/orders">
                <Button
                  className="w-full rounded-xl font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #8B6F47, #A88967)",
                    color: "#fff",
                    height: 44,
                  }}
                >
                  Lihat Semua Pesanan
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </SectionCard>
          </motion.div>
        )}

        {/* ── Tab: Bantuan ── */}
        {activeTab === "support" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <SectionCard
              icon={<MessageCircle className="w-4 h-4" />}
              title="Hubungi Kami"
              description="Kami siap membantu Anda"
            >
              <div className="space-y-2">
                {[
                  {
                    href: "/chat",
                    icon: <MessageCircle className="w-5 h-5" />,
                    title: "Chat dengan CS",
                    sub: "Balas dalam beberapa menit",
                  },
                  {
                    href: "mailto:info@rekabatik.id",
                    icon: <Mail className="w-5 h-5" />,
                    title: "Email Kami",
                    sub: "info@rekabatik.id",
                  },
                  {
                    href: "https://wa.me/6281200000000",
                    icon: <Phone className="w-5 h-5" />,
                    title: "WhatsApp",
                    sub: "+62 812-0000-0000",
                  },
                ].map((c) => (
                  <a
                    key={c.title}
                    href={c.href}
                    className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-[#FAF8F5] transition-colors"
                    style={{ border: "1px solid rgba(212,184,139,0.15)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(139,111,71,0.08)", color: "#8B6F47" }}
                    >
                      {c.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>
                        {c.title}
                      </p>
                      <p className="text-xs" style={{ color: "#9B8C80" }}>
                        {c.sub}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: "#C4B5A8" }} />
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* FAQ */}
            <SectionCard
              icon={<MessageCircle className="w-4 h-4" />}
              title="Pertanyaan Umum"
              description="Jawaban cepat untuk pertanyaan Anda"
            >
              <div>
                <FaqItem
                  q="Bagaimana cara melacak pesanan saya?"
                  a="Buka tab Pesanan di halaman profil ini. Klik nomor pesanan untuk melihat detail dan status pengiriman secara real-time."
                />
                <FaqItem
                  q="Bisakah saya mengembalikan produk?"
                  a="Ya, pengembalian dapat dilakukan dalam 7 hari setelah produk diterima, selama kondisi produk masih original dan belum dicuci."
                />
                <FaqItem
                  q="Metode pembayaran apa yang tersedia?"
                  a="Kami menerima transfer bank, dompet digital (GoPay, OVO, Dana), serta pembayaran tunai melalui minimarket."
                />
                <FaqItem
                  q="Berapa lama estimasi pengiriman?"
                  a="Pengiriman ke area Sidoarjo 1–2 hari kerja. Luar kota 3–5 hari kerja tergantung ekspedisi yang dipilih."
                />
              </div>
            </SectionCard>
          </motion.div>
        )}
      </div>

      {/* ── Logout Dialog ── */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}
            >
              Keluar dari Akun?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#7A6B5E" }}>
              Apakah Anda yakin ingin keluar dari akun {displayName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl"
              style={{ background: "#C0392B" }}
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Address Form Modal ── */}
      <AlertDialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <AlertDialogContent className="rounded-3xl max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
              {editingAddress ? "Ubah Alamat" : "Tambah Alamat Baru"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addrLabel" className="text-xs font-bold text-[#5A4A3E]">Label Alamat</Label>
                <select
                  id="addrLabel"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full mt-1.5 px-3 py-2 border rounded-xl outline-none text-xs"
                  style={{ borderColor: "rgba(212,184,139,0.35)", background: "#fff", height: 38 }}
                >
                  <option value="Rumah">Rumah</option>
                  <option value="Kantor">Kantor</option>
                  <option value="Toko">Toko</option>
                  <option value="Kos">Kos</option>
                </select>
              </div>
              <div>
                <Label htmlFor="addrDefault" className="text-xs font-bold text-[#5A4A3E] block">Set Default</Label>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="addrDefault"
                    checked={addressForm.is_default}
                    disabled={editingAddress?.is_default}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 accent-[#8B6F47]"
                  />
                  <span className="text-xs font-medium" style={{ color: "#7A6B5E" }}>Alamat Utama</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="addrRecipient" className="text-xs font-bold text-[#5A4A3E]">Nama Penerima</Label>
              <Input
                id="addrRecipient"
                value={addressForm.recipient_name}
                onChange={(e) => setAddressForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                placeholder="Contoh: Budi Santoso"
                className="mt-1.5 rounded-xl text-xs"
                style={{ borderColor: "rgba(212,184,139,0.35)", height: 38 }}
              />
            </div>

            <div>
              <Label htmlFor="addrPhone" className="text-xs font-bold text-[#5A4A3E]">Nomor HP</Label>
              <Input
                id="addrPhone"
                inputMode="numeric"
                value={addressForm.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setAddressForm(prev => ({ ...prev, phone: val }));
                }}
                placeholder="Contoh: 08123456789"
                className="mt-1.5 rounded-xl text-xs"
                style={{ borderColor: "rgba(212,184,139,0.35)", height: 38 }}
              />
            </div>

            <div>
              <Label htmlFor="addrStreet" className="text-xs font-bold text-[#5A4A3E]">Alamat Lengkap / Jalan</Label>
              <Input
                id="addrStreet"
                value={addressForm.street}
                onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Nama jalan, gedung, nomor rumah, RT/RW"
                className="mt-1.5 rounded-xl text-xs"
                style={{ borderColor: "rgba(212,184,139,0.35)", height: 38 }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addrProvince" className="text-xs font-bold text-[#5A4A3E]">Provinsi</Label>
                <Select
                  value={addressForm.province}
                  onValueChange={(val) => setAddressForm(prev => ({ ...prev, province: val, city: "", postal_code: "" }))}
                >
                  <SelectTrigger
                    id="addrProvince"
                    className="mt-1.5 h-9 rounded-xl text-xs transition-all border-[rgba(212,184,139,0.35)]"
                    style={{ background: "#fff", color: addressForm.province ? "#3D2B1F" : "#C4B5A5" }}
                  >
                    <SelectValue placeholder="Pilih Provinsi" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="addrCity" className="text-xs font-bold text-[#5A4A3E]">Kota / Kabupaten</Label>
                <Select
                  value={addressForm.city}
                  onValueChange={(val) => setAddressForm(prev => ({ ...prev, city: val }))}
                  disabled={!addressForm.province}
                >
                  <SelectTrigger
                    id="addrCity"
                    className="mt-1.5 h-9 rounded-xl text-xs transition-all border-[rgba(212,184,139,0.35)]"
                    style={{ background: "#fff", color: addressForm.city ? "#3D2B1F" : "#C4B5A5" }}
                  >
                    <SelectValue placeholder="Pilih Kota" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDONESIAN_LOCATIONS.find(loc => loc.province === addressForm.province)?.cities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="addrPostal" className="text-xs font-bold text-[#5A4A3E]">Kode Pos</Label>
              <Input
                id="addrPostal"
                value={addressForm.postal_code}
                inputMode="numeric"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setAddressForm(prev => ({ ...prev, postal_code: val }));
                }}
                placeholder="5 digit angka"
                maxLength={5}
                className="mt-1.5 rounded-xl text-xs"
                style={{ borderColor: "rgba(212,184,139,0.35)", height: 38 }}
              />
            </div>
          </div>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl text-xs h-9">Batal</AlertDialogCancel>
            <Button
              onClick={handleSaveAddress}
              className="rounded-xl text-xs h-9 px-4 text-white font-bold"
              style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)" }}
            >
              Simpan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
