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
  Edit,
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

type TabId = "account" | "favorites" | "orders" | "support" | "addresses" | "store";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Akun", icon: <User className="w-4 h-4" /> },
  { id: "addresses", label: "Alamat", icon: <MapPin className="w-4 h-4" /> },
  { id: "favorites", label: "Favorit", icon: <Heart className="w-4 h-4" /> },
  { id: "orders", label: "Pesanan", icon: <Package className="w-4 h-4" /> },
  { id: "store", label: "Kelola Toko", icon: <Store className="w-4 h-4" /> },
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
  const { user, signOut, userRole } = useAuth();
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

  // Orders
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

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

  // Store Management state
  const [store, setStore] = useState<StoreType | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    owner: "",
    established: "",
    specialty: "",
    address: "",
    phone: "",
    hours_start: "",
    hours_end: "",
    price_min: "",
    price_max: "",
    description: "",
    image: "",
    hero_image: "",
    tags: "" as string,
    motifs: "" as string,
    gallery: "" as string,
    team: "" as string,
  });

  const canManageStoreFromProfile =
    userRole === "artisan" && store?.status === "approved";

  const visibleTabs = TABS.filter(
    (tab) => tab.id !== "store" || canManageStoreFromProfile,
  );

  // Function to upload file to Supabase Storage
  const uploadFile = async (file: File, folder: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('store-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengunggah file');
      return null;
    }
  };

  // Handle file change for store image
  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diizinkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file tidak boleh lebih dari 5MB');
      return;
    }

    setUploadingImage(true);
    const url = await uploadFile(file, 'store-profiles');
    if (url) {
      setStoreForm(prev => ({ ...prev, image: url }));
      toast.success('Gambar toko berhasil diunggah');
    }
    setUploadingImage(false);
  };

  // Handle file change for hero image
  const handleHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diizinkan');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file tidak boleh lebih dari 10MB');
      return;
    }

    setUploadingHero(true);
    const url = await uploadFile(file, 'store-heroes');
    if (url) {
      setStoreForm(prev => ({ ...prev, hero_image: url }));
      toast.success('Gambar hero berhasil diunggah');
    }
    setUploadingHero(false);
  };

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

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      setUserOrders(data || []);
    } catch {
      toast.error("Gagal memuat data pesanan");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchStore = async () => {
    if (!user) return;
    try {
      setLoadingStore(true);
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 means no rows found

      if (data) {
        setStore(data as StoreType);
        
        // Parse existing hours and price_range
        let hours_start = "";
        let hours_end = "";
        if (data.hours) {
          const parts = data.hours.split(/[-–—]/);
          if (parts.length >= 2) {
            hours_start = parts[0].trim();
            hours_end = parts[1].trim();
          }
        }

        let price_min = "";
        let price_max = "";
        if (data.price_range) {
          const parts = data.price_range.split(/[-–—]/);
          if (parts.length >= 2) {
            // Extract numbers only
            price_min = parts[0].replace(/[^0-9]/g, '');
            price_max = parts[1].replace(/[^0-9]/g, '');
          }
        }

        setStoreForm({
          name: data.name || "",
          owner: data.owner || "",
          established: data.established || "",
          specialty: data.specialty || "",
          address: data.address || "",
          phone: data.phone || "",
          hours_start,
          hours_end,
          price_min,
          price_max,
          description: data.description || "",
          image: data.image || "",
          hero_image: data.hero_image || "",
          tags: (data.tags || []).join(", "),
          motifs: (data.motifs || []).join(", "),
          gallery: (data.gallery || []).join(", "),
          team: (data.team || []).join(", "),
        });
      }
    } catch {
      toast.error("Gagal memuat data toko");
    } finally {
      setLoadingStore(false);
    }
  };

  const formatRupiah = (angka: string) => {
    if (!angka) return "";
    const num = parseInt(angka.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return "";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleSaveStore = async () => {
    if (!user) return;
    if (!canManageStoreFromProfile) {
      toast.error("Akses kelola toko hanya tersedia untuk pengrajin yang sudah disetujui admin");
      return;
    }
    setSavingStore(true);
    try {
      // Format hours and price range
      const hours = storeForm.hours_start && storeForm.hours_end 
        ? `${storeForm.hours_start} - ${storeForm.hours_end}` 
        : "";
      
      const price_range = storeForm.price_min && storeForm.price_max 
        ? `Rp ${parseInt(storeForm.price_min).toLocaleString('id-ID')} - Rp ${parseInt(storeForm.price_max).toLocaleString('id-ID')}` 
        : "";

      const payload = {
        name: storeForm.name,
        owner: storeForm.owner,
        established: storeForm.established,
        specialty: storeForm.specialty,
        address: storeForm.address,
        phone: storeForm.phone,
        hours,
        price_range,
        description: storeForm.description,
        image: storeForm.image,
        hero_image: storeForm.hero_image,
        tags: storeForm.tags.split(",").map((s) => s.trim()).filter(Boolean),
        motifs: storeForm.motifs.split(",").map((s) => s.trim()).filter(Boolean),
        gallery: storeForm.gallery.split(",").map((s) => s.trim()).filter(Boolean),
        team: storeForm.team.split(",").map((s) => s.trim()).filter(Boolean),
        owner_id: user.id,
        // Default values for required fields
        rating: 0,
        review_count: 0,
        featured: false,
      };

      if (store?.id) {
        const { error } = await supabase
          .from("stores")
          .update(payload)
          .eq("id", store.id);
        if (error) throw error;
        toast.success("Toko berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("stores")
          .insert([payload]);
        if (error) throw error;
        toast.success("Toko berhasil dibuat");
      }

      await fetchStore();
      setIsEditingStore(false);
    } catch (err: any) {
      console.error("Error saving store full:", err);
      console.error("Error message:", err?.message);
      console.error("Error details:", err?.details);
      toast.error(err?.message || err?.hint || "Gagal menyimpan data toko");
    } finally {
      setSavingStore(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      fetchFavorites();
      fetchAddresses();
      fetchOrders();
      if (userRole === "artisan") {
        fetchStore();
      } else {
        setStore(null);
        setLoadingStore(false);
        setIsEditingStore(false);
      }
    }
    setLoading(false);
  }, [user, userRole]);

  useEffect(() => {
    if (activeTab === "store" && !canManageStoreFromProfile) {
      setActiveTab("account");
      setIsEditingStore(false);
    }
  }, [activeTab, canManageStoreFromProfile]);

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
            { num: String(userOrders.length), label: "Pesanan" },
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
          {visibleTabs.map((tab) => (
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
                {loadingOrders ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-2xl w-full" />
                    ))}
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(139,111,71,0.08)" }}
                    >
                      <Package className="w-7 h-7" style={{ color: "#8B6F47" }} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#3D2B1F" }}>
                      Belum Ada Pesanan
                    </p>
                    <p className="text-xs mb-4" style={{ color: "#9B8C80" }}>
                      Mulailah membuat desain atau beli batik dari katalog
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
                        Belanja Sekarang
                      </Button>
                    </Link>
                  </div>
                ) : (
                  userOrders.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => navigate("/orders")}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(139,111,71,0.08)" }}
                      >
                        <Package className="w-5 h-5" style={{ color: "#8B6F47" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#3D2B1F" }}>
                          #{o.id}
                        </p>
                        <p className="text-xs" style={{ color: "#9B8C80" }}>
                          {o.item} · {new Date(o.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })} · Rp {Number(o.total).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 uppercase tracking-wider"
                        style={
                          o.status === "delivered"
                            ? { background: "#EAF3DE", color: "#3B6D11" }
                            : o.status === "cancelled"
                            ? { background: "#FEE2E2", color: "#B91C1C" }
                            : { background: "#E6F1FB", color: "#185FA5" }
                        }
                      >
                        {o.status === "negotiating" ? "Negosiasi" : 
                         o.status === "processing" ? "Proses" :
                         o.status === "shipping" ? "Dikirim" :
                         o.status === "delivered" ? "Selesai" : "Batal"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {userOrders.length > 0 && (
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
              )}
            </SectionCard>
          </motion.div>
        )}

        {/* ── Tab: Kelola Toko ── */}
        {activeTab === "store" && canManageStoreFromProfile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <SectionCard
              icon={<Store className="w-4 h-4" />}
              title="Informasi Toko"
              description="Kelola detail dan informasi toko Anda"
            >
              {loadingStore ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  {isEditingStore ? (
                    <>
                      <FieldRow label="Nama Toko">
                        <Input
                          value={storeForm.name}
                          onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Nama Pemilik">
                        <Input
                          value={storeForm.owner}
                          onChange={(e) => setStoreForm({ ...storeForm, owner: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Tahun Berdiri">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={storeForm.established}
                          onChange={(e) => setStoreForm({ ...storeForm, established: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                          placeholder="2020"
                        />
                      </FieldRow>
                      <FieldRow label="Keahlian / Spesialisasi">
                        <Input
                          value={storeForm.specialty}
                          onChange={(e) => setStoreForm({ ...storeForm, specialty: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Alamat Toko">
                        <Input
                          value={storeForm.address}
                          onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Nomor Telepon">
                        <Input
                          value={storeForm.phone}
                          onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value.replace(/[^0-9]/g, "") })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                          inputMode="numeric"
                        />
                      </FieldRow>
                      <FieldRow label="Jam Operasional">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-[#9B8C80] mb-1">Dari</p>
                            <Input
                              type="time"
                              value={storeForm.hours_start}
                              onChange={(e) => setStoreForm({ ...storeForm, hours_start: e.target.value })}
                              className="rounded-xl text-sm"
                              style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                            />
                          </div>
                          <span className="text-lg text-[#8B6F47]">–</span>
                          <div className="flex-1">
                            <p className="text-xs text-[#9B8C80] mb-1">Sampai</p>
                            <Input
                              type="time"
                              value={storeForm.hours_end}
                              onChange={(e) => setStoreForm({ ...storeForm, hours_end: e.target.value })}
                              className="rounded-xl text-sm"
                              style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                            />
                          </div>
                        </div>
                      </FieldRow>
                      <FieldRow label="Rentang Harga">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-[#9B8C80] mb-1">Minimum</p>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8B6F47]">Rp</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={storeForm.price_min ? parseInt(storeForm.price_min).toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                  setStoreForm({ ...storeForm, price_min: rawValue });
                                }}
                                className="rounded-xl text-sm pl-12"
                                style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                                placeholder="500.000"
                              />
                            </div>
                          </div>
                          <span className="text-lg text-[#8B6F47]">–</span>
                          <div className="flex-1">
                            <p className="text-xs text-[#9B8C80] mb-1">Maksimum</p>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8B6F47]">Rp</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={storeForm.price_max ? parseInt(storeForm.price_max).toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                  setStoreForm({ ...storeForm, price_max: rawValue });
                                }}
                                className="rounded-xl text-sm pl-12"
                                style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                                placeholder="3.000.000"
                              />
                            </div>
                          </div>
                        </div>
                      </FieldRow>
                      <FieldRow label="Deskripsi Toko">
                        <textarea
                          value={storeForm.description}
                          onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                          rows={4}
                          className="w-full p-3 rounded-xl outline-none transition-all text-sm"
                          style={{ border: "1px solid rgba(212,184,139,0.35)", color: "#3D2B1F", resize: "vertical" }}
                        />
                      </FieldRow>
                      <FieldRow label="Gambar Toko" hint="Unggah gambar untuk profil toko (max 5MB)">
                        <div className="space-y-3">
                          {/* Preview */}
                          {storeForm.image && (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[rgba(212,184,139,0.3)]">
                              <img
                                src={storeForm.image}
                                alt="Preview gambar toko"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setStoreForm({ ...storeForm, image: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          )}
                          
                          {/* File Upload */}
                          <label className="flex items-center justify-center w-full h-12 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(139,111,71,0.4)' }}>
                            {uploadingImage ? (
                              <div className="flex items-center gap-2 text-sm" style={{ color: '#8B6F47' }}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Mengunggah...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm" style={{ color: '#8B6F47' }}>
                                <Plus className="w-4 h-4" />
                                <span>{storeForm.image ? 'Ganti gambar' : 'Pilih gambar'}</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleStoreImageChange}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                          </label>

                          {/* Optional URL input */}
                          <Input
                            value={storeForm.image}
                            onChange={(e) => setStoreForm({ ...storeForm, image: e.target.value })}
                            className="rounded-xl text-sm"
                            style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                            placeholder="Atau masukkan URL gambar..."
                          />
                        </div>
                      </FieldRow>
                      
                      <FieldRow label="Gambar Hero Toko" hint="Unggah gambar hero untuk halaman toko (max 10MB)">
                        <div className="space-y-3">
                          {/* Preview */}
                          {storeForm.hero_image && (
                            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-[rgba(212,184,139,0.3)]">
                              <img
                                src={storeForm.hero_image}
                                alt="Preview gambar hero"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setStoreForm({ ...storeForm, hero_image: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          )}
                          
                          {/* File Upload */}
                          <label className="flex items-center justify-center w-full h-12 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(139,111,71,0.4)' }}>
                            {uploadingHero ? (
                              <div className="flex items-center gap-2 text-sm" style={{ color: '#8B6F47' }}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Mengunggah...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm" style={{ color: '#8B6F47' }}>
                                <Plus className="w-4 h-4" />
                                <span>{storeForm.hero_image ? 'Ganti gambar' : 'Pilih gambar'}</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHeroImageChange}
                              disabled={uploadingHero}
                              className="hidden"
                            />
                          </label>

                          {/* Optional URL input */}
                          <Input
                            value={storeForm.hero_image}
                            onChange={(e) => setStoreForm({ ...storeForm, hero_image: e.target.value })}
                            className="rounded-xl text-sm"
                            style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                            placeholder="Atau masukkan URL gambar..."
                          />
                        </div>
                      </FieldRow>
                      <FieldRow label="Tag / Kategori" hint="Pisahkan dengan koma (contoh: Batik Tulis, Custom, Tradisional)">
                        <Input
                          value={storeForm.tags}
                          onChange={(e) => setStoreForm({ ...storeForm, tags: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Motif Unggulan" hint="Pisahkan dengan koma (contoh: Parang, Kawung, Mega Mendung)">
                        <Input
                          value={storeForm.motifs}
                          onChange={(e) => setStoreForm({ ...storeForm, motifs: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Galeri Toko" hint="Pisahkan URL gambar dengan koma">
                        <Input
                          value={storeForm.gallery}
                          onChange={(e) => setStoreForm({ ...storeForm, gallery: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <FieldRow label="Tim Toko" hint="Pisahkan dengan koma (contoh: Pak Amri, Bu Siti)">
                        <Input
                          value={storeForm.team}
                          onChange={(e) => setStoreForm({ ...storeForm, team: e.target.value })}
                          className="rounded-xl text-sm"
                          style={{ borderColor: "rgba(212,184,139,0.35)", height: 42 }}
                        />
                      </FieldRow>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSaveStore}
                          disabled={savingStore}
                          className="flex-1 rounded-xl font-semibold"
                          style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#fff", height: 42 }}
                        >
                          {savingStore ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Simpan
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditingStore(false);
                            if (store) {
                              // Parse existing hours and price_range for cancel
                              let hours_start = "";
                              let hours_end = "";
                              if (store.hours) {
                                const parts = store.hours.split(/[-–—]/);
                                if (parts.length >= 2) {
                                  hours_start = parts[0].trim();
                                  hours_end = parts[1].trim();
                                }
                              }

                              let price_min = "";
                              let price_max = "";
                              if (store.price_range) {
                                const parts = store.price_range.split(/[-–—]/);
                                if (parts.length >= 2) {
                                  price_min = parts[0].replace(/[^0-9]/g, '');
                                  price_max = parts[1].replace(/[^0-9]/g, '');
                                }
                              }

                              setStoreForm({
                                name: store.name || "",
                                owner: store.owner || "",
                                established: store.established || "",
                                specialty: store.specialty || "",
                                address: store.address || "",
                                phone: store.phone || "",
                                hours_start,
                                hours_end,
                                price_min,
                                price_max,
                                description: store.description || "",
                                image: store.image || "",
                                hero_image: store.hero_image || "",
                                tags: (store.tags || []).join(", "),
                                motifs: (store.motifs || []).join(", "),
                                gallery: (store.gallery || []).join(", "),
                                team: (store.team || []).join(", "),
                              });
                            }
                          }}
                          className="rounded-xl font-semibold"
                          style={{ height: 42 }}
                        >
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {store ? (
                        <div className="space-y-4">
                          {/* Hero Image Preview */}
                          {store.hero_image && (
                            <div className="w-full h-48 rounded-2xl overflow-hidden border border-[rgba(212,184,139,0.3)]">
                              <img
                                src={store.hero_image}
                                alt="Hero gambar toko"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Store Image Preview */}
                          {store.image && (
                            <div className="w-32 h-32 rounded-2xl overflow-hidden border border-[rgba(212,184,139,0.3)]">
                              <img
                                src={store.image}
                                alt="Gambar profil toko"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                                Nama Toko
                              </p>
                              <p className="text-base font-semibold" style={{ color: "#3D2B1F" }}>
                                {store.name || "-"}
                              </p>
                            </div>
                            {store.id && (
                              <Link
                                to={`/desa-jetis/${store.id}`}
                                className="p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors"
                                target="_blank"
                              >
                                <Eye className="w-4 h-4" style={{ color: "#8B6F47" }} />
                              </Link>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                                Pemilik
                              </p>
                              <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                                {store.owner || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                                Tahun Berdiri
                              </p>
                              <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                                {store.established || "-"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                              Keahlian
                            </p>
                            <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                              {store.specialty || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                              Alamat
                            </p>
                            <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                              {store.address || "-"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                                Telepon
                              </p>
                              <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                                {store.phone || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                                Jam Operasional
                              </p>
                              <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                                {store.hours || "-"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                              Rentang Harga
                            </p>
                            <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>
                              {store.price_range || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B8C80" }}>
                              Deskripsi
                            </p>
                            <p className="text-sm font-medium leading-relaxed" style={{ color: "#7A6B5E" }}>
                              {store.description || "-"}
                            </p>
                          </div>
                          {(store.tags || []).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9B8C80" }}>
                                Tag
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(store.tags || []).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                                    style={{ background: "rgba(212,184,139,0.15)", color: "#8B6F47", border: "1px solid rgba(212,184,139,0.3)" }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(store.motifs || []).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9B8C80" }}>
                                Motif Unggulan
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(store.motifs || []).map((motif, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium"
                                    style={{ background: "linear-gradient(135deg, rgba(61,43,31,0.05), rgba(212,184,139,0.1))", color: "#3D2B1F", border: "1px solid rgba(212,184,139,0.2)" }}
                                  >
                                    {motif}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingStore(true)}
                            className="w-full rounded-xl font-semibold mt-4"
                            style={{ borderColor: "rgba(139,111,71,0.35)", color: "#8B6F47", height: 42 }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Toko
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(139,111,71,0.08)" }}>
                            <Store className="w-7 h-7" style={{ color: "#8B6F47" }} />
                          </div>
                          <p className="text-sm font-semibold mb-1" style={{ color: "#3D2B1F" }}>Belum Ada Toko</p>
                          <p className="text-xs mb-4" style={{ color: "#9B8C80" }}>
                            Buat toko Anda dan mulai berjualan batik
                          </p>
                          <Button
                            onClick={() => setIsEditingStore(true)}
                            className="rounded-xl font-semibold"
                            style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#fff", height: 42 }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Buat Toko
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
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
