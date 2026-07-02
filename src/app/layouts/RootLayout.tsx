import { motion, AnimatePresence } from "motion/react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ShoppingBag, Menu, X, Instagram, ChevronRight, User, LogOut, Package, Settings, MessageCircle, BookOpen, LayoutDashboard, ShieldCheck, Home, Grid, Palette, Info } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { BatikBackground } from "../components/BatikBackground";
import logoImg from "../../imports/rekabatik-logo.png";
import { Toaster, toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import { useFullscreen } from "../../lib/FullscreenContext";
import { supabase } from "../../lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

/** Derive initials from full_name or email */
function getInitials(user: { user_metadata?: { full_name?: string }; email?: string }) {
  const name = user.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (user.email ?? "U").slice(0, 2).toUpperCase();
}

/** Get Icon for each navigation label */
const getNavItemIcon = (label: string, isActive: boolean) => {
  const iconClass = `w-4.5 h-4.5 transition-transform duration-300 ${isActive ? "text-[#8B6F47] scale-110" : "text-[#7A6B5E] opacity-80"}`;
  switch (label) {
    case "Beranda":
      return <Home className={iconClass} />;
    case "Katalog":
      return <Grid className={iconClass} />;
    case "Kustom":
      return <Palette className={iconClass} />;
    case "Desainku":
      return <BookOpen className={iconClass} />;
    case "Pesanan":
      return <Package className={iconClass} />;
    case "Tentang Kami":
      return <Info className={iconClass} />;
    case "Chat":
      return <MessageCircle className={iconClass} />;
    case "Profil":
      return <User className={iconClass} />;
    default:
      return null;
  }
};

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, userRole } = useAuth();
  const { cartCount } = useCart();
  const { isFullMode } = useFullscreen();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationTimerRef = useRef<number | null>(null);
  const artisanStoreNameRef = useRef<string | null>(null);

  const [notifications, setNotifications] = useState({ unpaidCount: 0, negotiatingCount: 0, awaitingVerificationCount: 0 });

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications({ unpaidCount: 0, negotiatingCount: 0, awaitingVerificationCount: 0 });
      return;
    }

    try {
      if (userRole === "artisan") {
        let storeName = artisanStoreNameRef.current;
        if (!storeName) {
          const { data: storeData } = await supabase
            .from("stores")
            .select("name")
            .eq("owner_id", user.id)
            .single();
          storeName = storeData?.name ?? null;
          artisanStoreNameRef.current = storeName;
        }

        if (storeName) {
          const { data: orders } = await supabase
            .from("orders")
            .select("status, payment_status")
            .eq("artisan", storeName);
          if (orders) {
            const awaiting = orders.filter(o => o.payment_status === "awaiting_verification").length;
            const nego = orders.filter(o => o.status === "negotiating").length;
            setNotifications({ unpaidCount: 0, negotiatingCount: nego, awaitingVerificationCount: awaiting });
          }
        }
      } else {
        const { data: orders } = await supabase
          .from("orders")
          .select("status, payment_status, total, date")
          .eq("user_id", user.id);
        if (orders) {
          const unpaid = orders.filter(o => o.payment_status === "pending" && o.total > 0 && o.status !== "negotiating" && (new Date(o.date).getTime() + 86400000 > Date.now())).length;
          const nego = orders.filter(o => o.status === "negotiating").length;
          setNotifications({ unpaidCount: unpaid, negotiatingCount: nego, awaitingVerificationCount: 0 });
        }
      }
    } catch (err) {
      console.error("Error fetching navbar notifications:", err);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase
      .channel("navbar-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        if (notificationTimerRef.current) {
          window.clearTimeout(notificationTimerRef.current);
        }

        notificationTimerRef.current = window.setTimeout(() => {
          fetchNotifications();
        }, 250);
      })
      .subscribe();
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const totalNotif = notifications.unpaidCount + notifications.negotiatingCount + notifications.awaitingVerificationCount;

  useEffect(() => {
    const collapseEnterY = 72;
    const collapseExitY = 28;
    let rafId: number | null = null;

    const updateScrolled = () => {
      const currentY = window.scrollY;
      setScrolled((prev) => (prev ? currentY > collapseExitY : currentY > collapseEnterY));
      rafId = null;
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateScrolled);
    };

    updateScrolled();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle OAuth / authentication errors from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    
    if (error) {
      let displayMessage = errorDescription || "Terjadi kesalahan saat masuk.";
      
      // Translate common authentication error messages
      if (displayMessage.includes("Unable to exchange external code")) {
        displayMessage = "Gagal memproses autentikasi Google. Pastikan Google Client Secret & Redirect URI di Supabase sudah dikonfigurasi dengan benar.";
      } else if (displayMessage.includes("Signups are not allowed") || error === "signup_disabled") {
        displayMessage = "Akun Google Anda belum terdaftar. Silakan lakukan pendaftaran akun terlebih dahulu.";
      }
      
      toast.error(displayMessage, { duration: 6000 });
      
      // Clean up the URL query parameters to keep the URL clean
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setIsLogoutDialogOpen(false);
    toast.success("Berhasil keluar. Sampai jumpa!");
    navigate("/");
  };

  const navItems = [
    { path: "/", label: "Beranda" },
    { path: "/catalog", label: "Katalog" },
    { path: "/custom", label: "Kustom" },
    { path: "/desain-histori", label: "Desainku" },
    { path: "/orders", label: "Pesanan" },
    { path: "/desa-jetis", label: "Tentang Kami" },
    { path: "/chat", label: "Chat" },
    { path: "/profile", label: "Profil" },
  ];

  const serviceItems = [
    { path: "/custom", label: "Kustomisasi Batik" },
    { path: "/catalog", label: "Katalog Motif Premium" },
    { path: "/chat", label: "Pesanan Bulk" },
    { path: "/chat", label: "Kolaborasi Desain" },
    { path: "/belajar-batik", label: "Workshop Batik" },
  ];

  const desktopNavItems = navItems.filter(item => 
    !["Desainku", "Pesanan", "Chat", "Profil"].includes(item.label)
  );

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna";
  const initials = user ? getInitials(user) : "U";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#FAF8F5",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Toaster position="top-right" richColors closeButton />
      <Analytics />
      {/* Header */}
      {!isFullMode && (
        <header
          className="sticky top-0 z-50 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(255, 255, 255, 0.85)" : "#FAF8F5",
            backdropFilter: scrolled ? "blur(12px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(139, 111, 71, 0.08)" : "1px solid transparent",
            boxShadow: scrolled ? "0 4px 20px rgba(61, 43, 31, 0.04)" : "none",
          }}
        >
        <div className="container mx-auto px-6 relative z-10 max-w-7xl">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative">
                <img
                  src={logoImg}
                  alt="RekaBatik Logo"
                  style={{ height: "45px", width: "auto", maxWidth: "45px", objectFit: "contain" }}
                />
              </div>
              <div className="leading-none">
                <span
                  className="block"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    lineHeight: "1.1",
                  }}
                >
                  <span style={{ color: "#3D2B1F" }}>Reka</span><span style={{ color: "#8B6F47" }}>Batik</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {desktopNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative px-4 py-2 rounded-xl transition-all duration-300 text-[0.95rem] font-medium tracking-wide flex items-center justify-center overflow-hidden group hover:bg-[#8B6F47]/[0.03]"
                    style={{
                      color: isActive ? "#3D2B1F" : "#7A6B5E",
                    }}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {/* Sliding underline */}
                    <span 
                      className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full transition-all duration-300 ${
                        isActive ? "bg-[#8B6F47] scale-x-100" : "bg-[#D4B88B]/60 scale-x-0 group-hover:scale-x-100"
                      } origin-center`} 
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cart Icon */}
              <Link
                to="/cart"
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 relative group"
                style={{ 
                  color: "#3D2B1F",
                  background: "rgba(139,111,71,0.04)",
                  border: "1px solid rgba(139,111,71,0.1)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(139,111,71,0.08)";
                  e.currentTarget.style.borderColor = "rgba(139,111,71,0.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(139,111,71,0.04)";
                  e.currentTarget.style.borderColor = "rgba(139,111,71,0.1)";
                }}
              >
                <ShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 h-5 px-1.5 min-w-[20px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                      style={{ background: "linear-gradient(135deg, #D4B88B, #8B6F47)" }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>

              {/* ── Auth Area ─────────────────────────────── */}
              {loading ? (
                /* skeleton while loading auth */
                <div
                  className="hidden md:block w-24 h-9 rounded-xl animate-pulse"
                  style={{ background: "rgba(139,111,71,0.1)" }}
                />
              ) : user ? (
                /* Logged in → user avatar + dropdown */
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <motion.button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl transition-all duration-300"
                    style={{
                      border: "1px solid rgba(139,111,71,0.15)",
                      background: userMenuOpen ? "rgba(139,111,71,0.08)" : "rgba(139,111,71,0.03)",
                    }}
                    whileHover={{ 
                      background: "rgba(139,111,71,0.08)",
                      borderColor: "rgba(139,111,71,0.35)",
                      boxShadow: "0 4px 12px rgba(61,43,31,0.05)"
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                      style={{
                        background: "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                        color: "#FAF8F5",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {initials}
                      {totalNotif > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium max-w-[100px] truncate"
                      style={{ color: "#3D2B1F" }}
                    >
                      {displayName}
                    </span>
                    <motion.svg
                      animate={{ rotate: userMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A6B5E"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </motion.svg>
                  </motion.button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden text-left"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(139,111,71,0.12)",
                          boxShadow: "0 8px 32px rgba(61,43,31,0.14)",
                          zIndex: 100,
                        }}
                      >
                        {/* User info header */}
                        <div
                          className="px-4 py-3.5"
                          style={{ borderBottom: "1px solid rgba(139,111,71,0.08)" }}
                        >
                          <p className="text-sm font-semibold truncate" style={{ color: "#3D2B1F" }}>
                            {displayName}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: "#9E8E82" }}>
                            {user.email}
                          </p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          {/* Super Admin Dashboard — super_admin only */}
                          {userRole === "super_admin" && (
                            <Link
                              to="/super-admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50/80"
                              style={{ color: "#1D4ED8" }}
                            >
                              <ShieldCheck className="w-4 h-4" style={{ color: "#1D4ED8" }} />
                              Portal Super Admin
                            </Link>
                          )}
                          {/* Admin Dashboard — artisan only */}
                          {userRole === "artisan" && (
                            <Link
                              to="/admin"
                              onClick={(e) => {
                                if (location.pathname === "/admin") {
                                  e.preventDefault();
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                                setUserMenuOpen(false);
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#8B6F47]/[0.06]"
                              style={{ color: "#8B6F47" }}
                            >
                              <LayoutDashboard className="w-4 h-4" style={{ color: "#8B6F47" }} />
                              <span className="flex-1">Dashboard Admin</span>
                              {(notifications.awaitingVerificationCount + notifications.negotiatingCount) > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">
                                  {notifications.awaitingVerificationCount + notifications.negotiatingCount}
                                </span>
                              )}
                            </Link>
                          )}
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#8B6F47]/[0.04]"
                            style={{ color: "#5A4A3E" }}
                          >
                            <User className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            Profil Saya
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#8B6F47]/[0.04]"
                            style={{ color: "#5A4A3E" }}
                          >
                            <Package className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            <span className="flex-1">Pesanan Saya</span>
                            {userRole === "customer" && notifications.unpaidCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">
                                {notifications.unpaidCount}
                              </span>
                            )}
                            {userRole === "artisan" && notifications.awaitingVerificationCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-amber-500">
                                {notifications.awaitingVerificationCount}
                              </span>
                            )}
                          </Link>
                          <Link
                            to="/desain-histori"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#8B6F47]/[0.04]"
                            style={{ color: "#5A4A3E" }}
                          >
                            <BookOpen className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            Desain Saya
                          </Link>
                          <Link
                            to="/chat"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#8B6F47]/[0.04]"
                            style={{ color: "#5A4A3E" }}
                          >
                            <MessageCircle className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            <span className="flex-1">Chat Toko</span>
                            {notifications.negotiatingCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-amber-500">
                                {notifications.negotiatingCount}
                              </span>
                            )}
                          </Link>
                          <Link
                            to="/custom"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#8B6F47]/[0.04]"
                            style={{ color: "#5A4A3E" }}
                          >
                            <Settings className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            Studio Kustom
                          </Link>
                        </div>

                        {/* Sign out */}
                        <div
                          className="py-1.5"
                          style={{ borderTop: "1px solid rgba(139,111,71,0.08)" }}
                        >
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsLogoutDialogOpen(true);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-red-50/80"
                            style={{ color: "#ef4444" }}
                          >
                            <LogOut className="w-4 h-4" />
                            Keluar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Not logged in → Login button */
                <Link
                  to="/auth"
                  className="hidden md:flex items-center gap-2 px-5.5 py-2 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-[#3D2B1F]/10 text-[0.9rem] font-medium"
                  style={{
                    background: "linear-gradient(135deg, #3D2B1F 0%, #5A3E2B 100%)",
                    color: "#FFFFFF",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0px)";
                  }}
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}

              {/* Mobile hamburger */}
              <motion.button
                className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  color: "#3D2B1F",
                  background: "rgba(139,111,71,0.05)",
                  border: "1px solid rgba(139,111,71,0.12)"
                }}
                onClick={() => setMobileOpen(!mobileOpen)}
                whileHover={{ background: "rgba(139,111,71,0.08)" }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden md:hidden border-t"
              style={{ background: "#FFFFFF", borderColor: "#E8E1DA" }}
            >
              <div className="px-8 py-5 space-y-2 text-left">
                {/* Super Admin Dashboard link */}
                {userRole === "super_admin" && (
                  <Link
                    to="/super-admin"
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 hover:bg-blue-50/80"
                    style={{
                      color: location.pathname === "/super-admin" ? "#1E3A8A" : "#1D4ED8",
                      fontWeight: 600,
                      background: "rgba(29,78,216,0.06)",
                    }}
                  >
                    <span className="text-sm flex items-center gap-3">
                      <ShieldCheck className="w-4.5 h-4.5" />
                      <span>Portal Super Admin</span>
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                )}
                {/* Admin Dashboard link — artisan only */}
                {userRole === "artisan" && (
                  <Link
                    to="/admin"
                    onClick={(e) => {
                      if (location.pathname === "/admin") {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                      setMobileOpen(false);
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 hover:bg-[#8B6F47]/[0.06]"
                    style={{
                      color: location.pathname === "/admin" ? "#3D2B1F" : "#8B6F47",
                      fontWeight: 600,
                      background: "rgba(139,111,71,0.06)",
                    }}
                  >
                    <span className="text-sm flex items-center gap-3 flex-1">
                      <LayoutDashboard className="w-4.5 h-4.5" />
                      <span>Dashboard Admin</span>
                    </span>
                    {(notifications.awaitingVerificationCount + notifications.negotiatingCount) > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-red-500 mr-2">
                        {notifications.awaitingVerificationCount + notifications.negotiatingCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                )}
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  let badgeCount = 0;
                  let badgeColor = "bg-red-500";
                  if (item.label === "Pesanan") {
                    if (userRole === "customer") {
                      badgeCount = notifications.unpaidCount;
                    } else if (userRole === "artisan") {
                      badgeCount = notifications.awaitingVerificationCount;
                      badgeColor = "bg-amber-500";
                    }
                  } else if (item.label === "Chat") {
                    badgeCount = notifications.negotiatingCount;
                    badgeColor = "bg-amber-500";
                  }
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 hover:bg-[#8B6F47]/[0.04]"
                      style={{
                        color: isActive ? "#8B6F47" : "#5A4A3E",
                        fontWeight: isActive ? 600 : 500,
                        background: isActive ? "rgba(139,111,71,0.06)" : "transparent",
                      }}
                    >
                      <span className="text-sm flex items-center gap-3 flex-1">
                        {getNavItemIcon(item.label, isActive)}
                        <span>{item.label}</span>
                      </span>
                      {badgeCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${badgeColor} mr-2`}>
                          {badgeCount}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  );
                })}

                {/* Mobile Actions */}
                <div className="pt-3 space-y-2">
                  {loading ? (
                    /* Skeleton while loading auth */
                    <div className="px-4 py-3 rounded-xl animate-pulse" style={{ background: "rgba(139,111,71,0.1)" }} />
                  ) : user ? (
                    /* Logged in */
                    <div className="space-y-2">
                      {/* User info */}
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(139,111,71,0.06)" }}>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                            color: "#FAF8F5",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold truncate" style={{ color: "#3D2B1F" }}>{displayName}</p>
                          <p className="text-xs truncate" style={{ color: "#9E8E82" }}>{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            setIsLogoutDialogOpen(true);
                          }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                          style={{ color: "#ef4444" }}
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Not logged in */
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[0.95rem] font-medium"
                      style={{
                        background: "linear-gradient(135deg, #3D2B1F 0%, #5A3E2B 100%)",
                        color: "#FFFFFF",
                      }}
                    >
                      <User className="w-4 h-4" />
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </header>
      )}

      <main>{<Outlet />}</main>

      {/* Footer */}
      {!isFullMode && location.pathname !== '/chat' && (
        <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #3D2B1F 0%, #2A1D15 100%)" }}>
        <BatikBackground opacity={0.06} patternType="mega" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,184,139,0.5), transparent)" }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", opacity: 0.08, pointerEvents: "none" }} />
        <div className="absolute -bottom-36 -left-36 w-[28rem] h-[28rem] rounded-full" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)", opacity: 0.04, pointerEvents: "none" }} />

        <div className="container mx-auto px-6 py-16 relative z-10 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8 lg:gap-10 mb-12 text-left">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-2 lg:col-span-5"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <img
                    src={logoImg}
                    alt="RekaBatik Logo"
                    style={{ height: "48px", width: "auto", maxWidth: "48px", objectFit: "contain" }}
                  />
                </div>
                <div>
                  <span style={{ fontFamily: "'Playfair Display', serif", color: "#FAF8F5", fontSize: "1.6rem", fontWeight: 700 }}>
                    Reka<span style={{ color: "#D4B88B" }}>Batik</span>
                  </span>
                </div>
              </div>
              
              <p className="mb-7 leading-relaxed" style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem", lineHeight: "1.8" }}>
                Platform kustomisasi batik digital yang menghubungkan Anda dengan warisan budaya batik Indonesia.
                Ciptakan motif unik dan personal dari pengrajin terbaik di Desa Jetis.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-1 lg:col-span-2"
            >
              <h4 className="mb-5 font-semibold" style={{ color: "#FAF8F5", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif" }}>
                Navigasi
              </h4>
              <ul className="space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="group flex items-center transition-all duration-300"
                      style={{ color: "rgba(250,248,245,0.65)", fontSize: "0.95rem" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#D4B88B"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(250,248,245,0.65)"}
                    >
                      <ChevronRight className="w-0 h-3.5 opacity-0 group-hover:w-3.5 group-hover:opacity-100 group-hover:mr-1.5 transition-all duration-300 text-[#D4B88B] flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Layanan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-1 lg:col-span-2"
            >
              <h4 className="mb-5 font-semibold" style={{ color: "#FAF8F5", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif" }}>
                Layanan Kami
              </h4>
              <ul className="space-y-2.5">
                {serviceItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.path}
                      className="group flex items-center transition-all duration-300"
                      style={{ color: "rgba(250,248,245,0.65)", fontSize: "0.95rem" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#D4B88B"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(250,248,245,0.65)"}
                    >
                      <ChevronRight className="w-0 h-3.5 opacity-0 group-hover:w-3.5 group-hover:opacity-100 group-hover:mr-1.5 transition-all duration-300 text-[#D4B88B] flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-2 lg:col-span-3"
            >
              <h4 className="mb-5 font-semibold" style={{ color: "#FAF8F5", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif" }}>
                Hubungi Kami
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-4">
                <a 
                  href="https://www.google.com/maps/search/Desa+Jetis,+Sidoarjo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group/item w-fit"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover/item:bg-[#D4B88B] group-hover/item:text-[#3D2B1F]" style={{ background: "rgba(212,184,139,0.12)", color: "#D4B88B" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <p className="transition-colors duration-300 group-hover/item:text-[#FAF8F5]" style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    Desa Jetis, Sidoarjo<br/>Jawa Timur, Indonesia
                  </p>
                </a>
                
                <a 
                  href="mailto:rekabatik@gmail.com" 
                  className="flex items-center gap-3 group/item w-fit"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover/item:bg-[#D4B88B] group-hover/item:text-[#3D2B1F]" style={{ background: "rgba(212,184,139,0.12)", color: "#D4B88B" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                  </div>
                  <p className="transition-colors duration-300 group-hover/item:text-[#FAF8F5]" style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem" }}>
                    rekabatik@gmail.com
                  </p>
                </a>
                
                <a 
                  href="tel:+6285143898545" 
                  className="flex items-center gap-3 group/item w-fit"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover/item:bg-[#D4B88B] group-hover/item:text-[#3D2B1F]" style={{ background: "rgba(212,184,139,0.12)", color: "#D4B88B" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <p className="transition-colors duration-300 group-hover/item:text-[#FAF8F5]" style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem" }}>
                    +62 851-4389-8545
                  </p>
                </a>

                <a 
                  href="https://www.instagram.com/rekabatik.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group/item w-fit"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover/item:bg-[#D4B88B] group-hover/item:text-[#3D2B1F]" style={{ background: "rgba(212,184,139,0.12)", color: "#D4B88B" }}>
                    <Instagram className="w-4.5 h-4.5" />
                  </div>
                  <p className="transition-colors duration-300 group-hover/item:text-[#FAF8F5]" style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem" }}>
                    @rekabatik.id
                  </p>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, rgba(212,184,139,0.05), rgba(212,184,139,0.25) 50%, rgba(212,184,139,0.05))" }} />

          {/* Bottom Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <p className="text-center md:text-left" style={{ color: "rgba(250,248,245,0.45)", fontSize: "0.9rem" }}>
              © 2026 RekaBatik. Reka Desainmu, Lestarikan Budayamu!
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2">
              {[
                { label: "Kebijakan Privasi", to: "/privacy-policy" },
                { label: "Syarat & Ketentuan", to: "/terms-of-service" },
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.to}
                  style={{ color: "rgba(250,248,245,0.45)", fontSize: "0.9rem", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#D4B88B"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(250,248,245,0.45)"}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
        </footer>
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              style={{ background: "#ef4444", color: "#FFFFFF" }}
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
