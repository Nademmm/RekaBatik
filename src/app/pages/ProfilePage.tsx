import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User,
  Lock,
  Save,
  Heart,
  Store,
  Palette,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ChevronRight,
  Package,
  MessageCircle,
  LogOut
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
  AlertDialogTitle
} from "../components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import type { BatikItem, Store as StoreType } from "../../types/database";

// Helper to get initials
function getInitials(user: { user_metadata?: { full_name?: string }; email?: string }) {
  const name = user.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (user.email || "U").slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // State for different sections
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);

  // Account edit state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Logout confirmation
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Favorites state
  const [favoriteStores, setFavoriteStores] = useState<StoreType[]>([]);
  const [favoriteBatik, setFavoriteBatik] = useState<BatikItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchFavorites = async () => {
    console.log("Fetching favorites for user:", user?.id);
    if (!user) return;

    try {
      setLoadingFavorites(true);

      // Fetch favorite stores with store data
      console.log("Fetching favorite stores...");
      const { data: storeFavorites, error: storeError } = await supabase
        .from("favorite_stores")
        .select("*, stores(*)")
        .eq("user_id", user.id);

      console.log("Store favorites result:", { data: storeFavorites, error: storeError });
      if (storeError) throw storeError;
      setFavoriteStores(storeFavorites?.map(f => f.stores).filter(Boolean) as StoreType[] || []);

      // Fetch favorite batik with batik data
      console.log("Fetching favorite batik...");
      const { data: batikFavorites, error: batikError } = await supabase
        .from("favorite_batik")
        .select("*, batik_items(*)")
        .eq("user_id", user.id);

      console.log("Batik favorites result:", { data: batikFavorites, error: batikError });
      if (batikError) throw batikError;
      setFavoriteBatik(batikFavorites?.map(f => f.batik_items).filter(Boolean) as BatikItem[] || []);

    } catch (err) {
      console.error("Failed to fetch favorites:", err);
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
    }
    setLoading(false);
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      toast.success("Nama berhasil diperbarui");
      setIsEditingName(false);
    } catch (err) {
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
      // First verify current password by signing in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      });
      if (signInError) {
        toast.error("Password saat ini salah");
        return;
      }
      // Then update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
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

      setFavoriteStores(prev => prev.filter(store => store.id !== storeId));
      toast.success("Dihapus dari favorit");
    } catch (err) {
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

      setFavoriteBatik(prev => prev.filter(batik => batik.id !== batikId));
      toast.success("Batik dihapus dari favorit");
    } catch (err) {
      toast.error("Gagal menghapus batik dari favorit");
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna";
  const initials = user ? getInitials(user) : "U";

  return (
    <div className="min-h-screen relative" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="mega" />

      <div className="container mx-auto px-4 sm:px-6 py-10 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                  color: "#FAF8F5"
                }}
              >
                {initials}
              </div>
              <button
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                style={{ background: "#8B6F47", color: "white" }}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1">
              {loading ? (
                <>
                  <Skeleton className="h-9 w-48 mb-2" />
                  <Skeleton className="h-5 w-64" />
                </>
              ) : (
                <>
                  <h1
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#3D2B1F",
                      fontSize: "2rem",
                      fontWeight: 700,
                      marginBottom: "0.4rem"
                    }}
                  >
                    {displayName}
                  </h1>
                  <p style={{ color: "#7A6B5E" }}>{email}</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 gap-2 mb-8 bg-white rounded-2xl p-1 shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
            <TabsTrigger value="account" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Akun</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favorit</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Pesanan</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Bantuan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            {/* Account Info Card */}
            <Card className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, rgba(139,111,71,0.05), rgba(212,184,139,0.03))" }}>
                <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Informasi Akun</CardTitle>
                <CardDescription>Perbarui informasi profil Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" style={{ color: "#5A4A3E" }}>Nama Lengkap</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditingName}
                      className="rounded-xl"
                      style={{ borderColor: "rgba(212,184,139,0.3)" }}
                    />
                    {isEditingName ? (
                      <>
                        <Button
                          onClick={handleSaveName}
                          disabled={savingName}
                          className="rounded-xl font-semibold"
                          style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "white" }}
                        >
                          {savingName ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Simpan
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setFullName(user?.user_metadata?.full_name || "");
                            setIsEditingName(false);
                          }}
                          className="rounded-xl"
                        >
                          Batal
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditingName(true)}
                        className="rounded-xl font-semibold"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Email (read only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" style={{ color: "#5A4A3E" }}>Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="rounded-xl bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                </div>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, rgba(139,111,71,0.05), rgba(212,184,139,0.03))" }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  <Lock className="w-5 h-5" />
                  Ubah Password
                </CardTitle>
                <CardDescription>Lindungi akun Anda dengan password baru</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" style={{ color: "#5A4A3E" }}>Password Saat Ini</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="rounded-xl pr-10"
                      style={{ borderColor: "rgba(212,184,139,0.3)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" style={{ color: "#5A4A3E" }}>Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-xl pr-10"
                      style={{ borderColor: "rgba(212,184,139,0.3)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" style={{ color: "#5A4A3E" }}>Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl pr-10"
                      style={{ borderColor: "rgba(212,184,139,0.3)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full rounded-xl font-semibold"
                  style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "white" }}
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Ubah Password
                </Button>
              </CardFooter>
            </Card>

            {/* Logout Card */}
            <Card className="rounded-3xl overflow-hidden shadow-sm border-red-100" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
              <CardContent className="pt-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "#EF4444" }}>Keluar dari Akun</h3>
                  <p className="text-sm" style={{ color: "#7A6B5E" }}>Anda akan keluar dari akun ini</p>
                </div>
                <Button
                  onClick={() => setShowLogoutDialog(true)}
                  variant="destructive"
                  className="rounded-xl font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-8">
            {/* Favorite Stores */}
            <Card className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, rgba(139,111,71,0.05), rgba(212,184,139,0.03))" }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  <Store className="w-5 h-5" />
                  Toko Favorit
                </CardTitle>
                <CardDescription>Toko batik yang Anda sukai</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingFavorites ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="w-16 h-16 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : favoriteStores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(139,111,71,0.08)" }}>
                      <Store className="w-8 h-8" style={{ color: "#8B6F47" }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#3D2B1F" }}>Belum Ada Toko Favorit</h3>
                    <p className="text-sm mb-6 max-w-xs" style={{ color: "#7A6B5E" }}>
                      Jelajahi toko batik di Desa Jetis dan tambahkan ke favorit Anda
                    </p>
                    <Link to="/desa-jetis">
                      <Button className="rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "white" }}>
                        Jelajahi Toko
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favoriteStores.map((store) => (
                      <div key={store.id} className="flex gap-4 items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                        <Link to={`/desa-jetis/${store.id}`} className="flex gap-4 items-center flex-1">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {store.image && <img src={store.image} alt={store.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate" style={{ color: "#3D2B1F" }}>{store.name}</h4>
                            <p className="text-sm truncate" style={{ color: "#7A6B5E" }}>{store.specialty}</p>
                          </div>
                        </Link>
                        <button
                          onClick={() => removeFavoriteStore(store.id)}
                          className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                          title="Hapus dari favorit"
                        >
                          <Heart className="w-5 h-5 fill-red-500" fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Batik */}
            <Card className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, rgba(139,111,71,0.05), rgba(212,184,139,0.03))" }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  <Palette className="w-5 h-5" />
                  Batik Favorit
                </CardTitle>
                <CardDescription>Motif batik yang Anda sukai</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingFavorites ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="w-full aspect-square rounded-2xl" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : favoriteBatik.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(139,111,71,0.08)" }}>
                      <Palette className="w-8 h-8" style={{ color: "#8B6F47" }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#3D2B1F" }}>Belum Ada Batik Favorit</h3>
                    <p className="text-sm mb-6 max-w-xs" style={{ color: "#7A6B5E" }}>
                      Jelajahi katalog batik dan tambahkan motif favorit Anda
                    </p>
                    <Link to="/catalog">
                      <Button className="rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "white" }}>
                        Lihat Katalog
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {favoriteBatik.map((batik) => (
                      <div key={batik.id} className="group cursor-pointer relative">
                        <div className="aspect-square rounded-2xl overflow-hidden mb-2" style={{ background: batik.bg_color }}>
                          <PatternMini 
                            primary={batik.primary_color} 
                            secondary={batik.secondary_color} 
                            bg={batik.bg_color} 
                            type={batik.style_type || "parang"}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm truncate flex-1" style={{ color: "#3D2B1F" }}>{batik.name}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavoriteBatik(batik.id);
                            }}
                            className="p-1 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                            title="Hapus dari favorit"
                          >
                            <Heart className="w-4 h-4 fill-red-500" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, rgba(139,111,71,0.05), rgba(212,184,139,0.03))" }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  <Package className="w-5 h-5" />
                  Riwayat Pesanan
                </CardTitle>
                <CardDescription>Lihat semua pesanan batik Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Link to="/orders">
                  <Button className="w-full rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "white" }}>
                    Lihat Semua Pesanan
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(212,184,139,0.2)" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, rgba(139,111,71,0.05), rgba(212,184,139,0.03))" }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                  <MessageCircle className="w-5 h-5" />
                  Bantuan & Dukungan
                </CardTitle>
                <CardDescription>Hubungi kami jika ada pertanyaan</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Link to="/chat" className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
                        <MessageCircle className="w-5 h-5" style={{ color: "#8B6F47" }} />
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: "#3D2B1F" }}>Chat dengan CS</h4>
                        <p className="text-sm" style={{ color: "#7A6B5E" }}>Tanya tentang produk atau pesanan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                  <a href="mailto:info@rekabatik.id" className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,111,71,0.1)" }}>
                        <Mail className="w-5 h-5" style={{ color: "#8B6F47" }} />
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: "#3D2B1F" }}>Email Kami</h4>
                        <p className="text-sm" style={{ color: "#7A6B5E" }}>info@rekabatik.id</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Keluar dari Akun?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#7A6B5E" }}>
              Apakah Anda yakin ingin keluar dari akun {displayName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl"
              style={{ background: "#EF4444" }}
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
