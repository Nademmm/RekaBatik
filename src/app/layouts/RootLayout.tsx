import { motion, AnimatePresence } from "motion/react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ShoppingBag, Menu, X, Instagram, Facebook, Twitter, ChevronRight, User, LogOut, Package, Settings, MessageCircle, BookOpen, LayoutDashboard, ShieldCheck } from "lucide-react";
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

  const [notifications, setNotifications] = useState({ unpaidCount: 0, negotiatingCount: 0, awaitingVerificationCount: 0 });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      if (userRole === "artisan") {
        const { data: storeData } = await supabase.from("stores").select("name").eq("owner_id", user.id).single();
        if (storeData?.name) {
          const { data: orders } = await supabase.from("orders").select("status, payment_status").eq("artisan", storeData.name);
          if (orders) {
            const awaiting = orders.filter(o => o.payment_status === "awaiting_verification").length;
            const nego = orders.filter(o => o.status === "negotiating").length;
            setNotifications({ unpaidCount: 0, negotiatingCount: nego, awaitingVerificationCount: awaiting });
          }
        }
      } else {
        const { data: orders } = await supabase.from("orders").select("status, payment_status, total, date").eq("user_id", user.id);
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
        fetchNotifications();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const totalNotif = notifications.unpaidCount + notifications.negotiatingCount + notifications.awaitingVerificationCount;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      {/* Header */}
      {!isFullMode && (
        <header
          className="sticky top-0 z-50"
          style={{
            background: "#ffffffff",
          }}
        >
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex items-center justify-between md:justify-around h-20">

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
            <nav className="hidden md:flex items-center gap-2">
              {desktopNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative px-4 py-2 rounded-md transition-all duration-200"
                    style={{
                      color: isActive ? "#3D2B1F" : "#7A6B5E",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "1.03rem",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cart Icon */}
              <Link
                to="/cart"
                className="flex items-center justify-center w-10 h-10 rounded-md transition-all hover:bg-gray-100 relative"
                style={{ color: "#3D2B1F" }}
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: "#D97706" }}
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
                  className="hidden md:block w-24 h-9 rounded-md animate-pulse"
                  style={{ background: "rgba(139,111,71,0.1)" }}
                />
              ) : user ? (
                /* Logged in → user avatar + dropdown */
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <motion.button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                    style={{
                      border: "1.5px solid rgba(139,111,71,0.2)",
                      background: userMenuOpen ? "rgba(139,111,71,0.06)" : "transparent",
                    }}
                    whileHover={{ background: "rgba(139,111,71,0.06)" }}
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
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden"
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
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                              style={{ color: "#1D4ED8" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(29,78,216,0.07)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <ShieldCheck className="w-4 h-4" style={{ color: "#1D4ED8" }} />
                              Portal Super Admin
                            </Link>
                          )}
                          {/* Admin Dashboard — artisan only */}
                          {userRole === "artisan" && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                              style={{ color: "#8B6F47" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,111,71,0.07)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#5A4A3E" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,111,71,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <User className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            Profil Saya
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#5A4A3E" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,111,71,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#5A4A3E" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,111,71,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <BookOpen className="w-4 h-4" style={{ color: "#8B6F47" }} />
                            Desain Saya
                          </Link>
                          <Link
                            to="/chat"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#5A4A3E" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,111,71,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#5A4A3E" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,111,71,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#ef4444" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                  className="hidden md:flex items-center gap-2 px-5 py-2 rounded-md transition-all"
                  style={{
                    background: "#3D2B1F",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}

              {/* Mobile hamburger */}
              <motion.button
                className="md:hidden w-10 h-10 rounded-md flex items-center justify-center"
                style={{
                  color: "#3D2B1F",
                }}
                onClick={() => setMobileOpen(!mobileOpen)}
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
              <div className="px-8 py-4 space-y-2">
                {/* Super Admin Dashboard link */}
                {userRole === "super_admin" && (
                  <Link
                    to="/super-admin"
                    className="flex items-center justify-between px-4 py-3 rounded-md transition-all"
                    style={{
                      color: location.pathname === "/super-admin" ? "#1E3A8A" : "#1D4ED8",
                      fontWeight: 600,
                      background: "rgba(29,78,216,0.06)",
                    }}
                  >
                    <span className="text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />Portal Super Admin
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                )}
                {/* Admin Dashboard link — artisan only */}
                {userRole === "artisan" && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-between px-4 py-3 rounded-md transition-all"
                    style={{
                      color: location.pathname === "/admin" ? "#3D2B1F" : "#8B6F47",
                      fontWeight: 600,
                      background: "rgba(139,111,71,0.06)",
                    }}
                  >
                    <span className="text-sm flex items-center gap-2 flex-1">
                      <LayoutDashboard className="w-4 h-4" />Dashboard Admin
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
                      className="flex items-center justify-between px-4 py-3 rounded-md transition-all"
                      style={{
                        color: isActive ? "#3D2B1F" : "#7A6B5E",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <span className="text-sm flex-1">{item.label}</span>
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
                    <div className="px-4 py-3 rounded-md animate-pulse" style={{ background: "rgba(139,111,71,0.1)" }} />
                  ) : user ? (
                    /* Logged in */
                    <div className="space-y-2">
                      {/* User info */}
                      <div className="flex items-center gap-3 px-4 py-3 rounded-md" style={{ background: "rgba(139,111,71,0.06)" }}>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #3D2B1F, #8B6F47)",
                            color: "#FAF8F5",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#3D2B1F" }}>{displayName}</p>
                          <p className="text-xs truncate" style={{ color: "#9E8E82" }}>{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            setIsLogoutDialogOpen(true);
                          }}
                          className="w-10 h-10 rounded-md flex items-center justify-center"
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
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-md"
                      style={{
                        background: "#3D2B1F",
                        color: "#FFFFFF",
                        fontWeight: 500,
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
      {!isFullMode && (
        <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #3D2B1F 0%, #2A1D15 100%)" }}>
        <BatikBackground opacity={0.06} patternType="mega" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,184,139,0.5), transparent)" }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
        <div className="absolute -bottom-36 -left-36 w-[28rem] h-[28rem] rounded-full opacity-4" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)" }} />

        <div className="container mx-auto px-6 py-16 relative z-10 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-10 mb-12">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
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

              {/* Social Media */}
              <div className="flex gap-2">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(212,184,139,0.25)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                    style={{ 
                      background: "rgba(255,255,255,0.03)", 
                      color: "#D4B88B",
                      border: "1px solid rgba(212,184,139,0.15)"
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <h4 className="mb-5 font-semibold" style={{ color: "#FAF8F5", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif" }}>
                Navigasi
              </h4>
              <ul className="space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="block transition-colors"
                      style={{ color: "rgba(250,248,245,0.65)", fontSize: "0.95rem" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#D4B88B"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(250,248,245,0.65)"}
                    >
                      {item.label}
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
              className="lg:col-span-2"
            >
              <h4 className="mb-5 font-semibold" style={{ color: "#FAF8F5", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif" }}>
                Layanan Kami
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Kustomisasi Batik",
                  "Katalog Motif Premium",
                  "Pesanan Bulk",
                  "Kolaborasi Desain",
                  "Workshop Batik"
                ].map((item, i) => (
                  <li key={i}>
                    <button
                      className="block transition-colors text-left"
                      style={{ color: "rgba(250,248,245,0.65)", fontSize: "0.95rem" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#D4B88B"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(250,248,245,0.65)"}
                    >
                      {item}
                    </button>
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
              className="lg:col-span-3"
            >
              <h4 className="mb-5 font-semibold" style={{ color: "#FAF8F5", fontSize: "1.05rem", fontFamily: "'Playfair Display', serif" }}>
                Hubungi Kami
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,184,139,0.12)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B88B" strokeWidth="1.8">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <p style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    Desa Jetis, Sidoarjo<br/>Jawa Timur, Indonesia
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,184,139,0.12)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B88B" strokeWidth="1.8">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                  </div>
                  <p style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem" }}>
                    info@rekabatik.id
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,184,139,0.12)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B88B" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <p style={{ color: "rgba(250,248,245,0.68)", fontSize: "0.95rem" }}>
                    +62 812-3456-7890
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: "rgba(212,184,139,0.18)" }} />

          {/* Bottom Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <p style={{ color: "rgba(250,248,245,0.45)", fontSize: "0.9rem" }}>
              © 2026 RekaBatik. Warisan Budaya, Karya Makna.
            </p>
            
            <div className="flex items-center gap-6">
              {["Kebijakan Privasi", "Syarat & Ketentuan", "FAQ"].map((item, i) => (
                <button
                  key={i}
                  style={{ color: "rgba(250,248,245,0.45)", fontSize: "0.9rem", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#D4B88B"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(250,248,245,0.45)"}
                >
                  {item}
                </button>
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
