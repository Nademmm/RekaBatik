import { motion, AnimatePresence } from "motion/react";
import { Outlet, Link, useLocation } from "react-router";
import { Palette, Home, ShoppingBag, Grid3x3, MapPin, Menu, X, Instagram, Facebook, Twitter, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { BatikBackground } from "../components/BatikBackground";
import logoImg from "../../imports/rekabatik-logo.png";

export function RootLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/", label: "Beranda", icon: Home },
    { path: "/catalog", label: "Katalog", icon: Grid3x3 },
    { path: "/custom", label: "Kustom Batik", icon: Palette },
    { path: "/desa-jetis", label: "Desa Jetis", icon: MapPin },
    { path: "/orders", label: "Pesanan", icon: ShoppingBag },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #FBF5E6 0%, #F5E6C0 30%, #FBF0D8 60%, #FBF5E6 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50"
        initial={false}
        animate={{
          boxShadow: scrolled
            ? "0 8px 32px rgba(61, 28, 2, 0.35), 0 0 0 1px rgba(201, 150, 12, 0.25)"
            : "0 1px 0 rgba(201, 150, 12, 0.3)",
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: scrolled
            ? "rgba(30, 12, 2, 0.97)"
            : "rgba(61, 28, 2, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Batik pattern overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <BatikBackground opacity={0.06} patternType="parang" />
        </div>

        {/* Gold shimmer top border */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #C9960C 20%, #D4AF37 50%, #C9960C 80%, transparent)" }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <motion.img
                  src={logoImg}
                  alt="RekaBatik Logo"
                  style={{ height: "52px", width: "auto", maxWidth: "52px", objectFit: "contain" }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)", filter: "blur(8px)" }}
                />
              </div>
              <div className="leading-none">
                <span
                  className="block"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "1.25rem",
                    color: "#D4AF37",
                    letterSpacing: "0.08em",
                    lineHeight: "1.1",
                  }}
                >
                  RekaBatik
                </span>
                <span
                  className="block mt-0.5"
                  style={{
                    fontSize: "0.55rem",
                    letterSpacing: "0.22em",
                    color: "rgba(212,175,55,0.55)",
                    textTransform: "uppercase",
                  }}
                >
                  Platform Kustomisasi
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors duration-200 group"
                    style={{
                      color: isActive ? "#D4AF37" : "rgba(251, 245, 230, 0.7)",
                    }}
                  >
                    {/* Active background pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "linear-gradient(135deg, rgba(201,150,12,0.2), rgba(212,175,55,0.12))",
                          border: "1px solid rgba(201,150,12,0.3)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {/* Hover background */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: "rgba(201,150,12,0.08)" }}
                    />
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="text-sm relative z-10">{item.label}</span>
                    {/* Active dot */}
                    {isActive && (
                      <motion.div
                        className="w-1 h-1 rounded-full relative z-10"
                        style={{ background: "#D4AF37" }}
                        layoutId="nav-dot"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* CTA Button */}
              <motion.button
                className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #C9960C, #D4AF37)",
                  color: "#3D1C02",
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Mulai Desain
                </span>
                {/* Shimmer */}
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)" }}
                />
              </motion.button>

              {/* Mobile hamburger */}
              <motion.button
                className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: mobileOpen ? "rgba(201,150,12,0.2)" : "rgba(201,150,12,0.1)",
                  border: "1px solid rgba(201,150,12,0.25)",
                  color: "#D4AF37",
                }}
                onClick={() => setMobileOpen(!mobileOpen)}
                whileTap={{ scale: 0.93 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
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
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden md:hidden"
              style={{ background: "rgba(25, 10, 2, 0.98)", borderTop: "1px solid rgba(201,150,12,0.2)" }}
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.22 }}
                    >
                      <Link
                        to={item.path}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                        style={{
                          color: isActive ? "#D4AF37" : "rgba(251, 245, 230, 0.75)",
                          background: isActive ? "rgba(201,150,12,0.15)" : "transparent",
                          border: isActive ? "1px solid rgba(201,150,12,0.3)" : "1px solid transparent",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: isActive ? "rgba(201,150,12,0.2)" : "rgba(255,255,255,0.05)" }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile CTA */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navItems.length * 0.05, duration: 0.22 }}
                  className="pt-2 pb-1"
                >
                  <button
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, #C9960C, #D4AF37)",
                      color: "#3D1C02",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Mulai Desain Sekarang</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main>{<Outlet />}</main>

      {/* Footer */}
      <footer className="relative overflow-hidden mt-20" style={{ background: "#3D1C02" }}>
        <BatikBackground opacity={0.1} patternType="kawung" />
        {/* Gold top border */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #C9960C, #D4AF37, #C9960C)" }} />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoImg}
                  alt="RekaBatik Logo"
                  style={{ height: "48px", width: "auto", maxWidth: "48px", objectFit: "contain" }}
                />
                <span style={{ fontFamily: "'Cinzel', serif", color: "#D4AF37", fontSize: "1.3rem" }}>
                  RekaBatik
                </span>
              </div>
              <p className="mb-4" style={{ color: "rgba(251, 245, 230, 0.65)", fontSize: "0.875rem", lineHeight: "1.7" }}>
                Platform kustomisasi batik digital yang menghubungkan Anda dengan kekayaan budaya batik Indonesia.
                Rancang, kustomisasi, dan dapatkan batik impian Anda dari pengrajin terbaik.
              </p>
              <div className="flex gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(201, 150, 12, 0.2)", color: "#D4AF37" }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4" style={{ color: "#D4AF37", fontFamily: "'Playfair Display', serif" }}>
                Navigasi
              </h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="transition-colors"
                      style={{ color: "rgba(251, 245, 230, 0.65)", fontSize: "0.875rem" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4" style={{ color: "#D4AF37", fontFamily: "'Playfair Display', serif" }}>
                Kontak
              </h4>
              <div className="space-y-2" style={{ color: "rgba(251, 245, 230, 0.65)", fontSize: "0.875rem" }}>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Desa Jetis, Sidoarjo, Jawa Timur
                </p>
                <p>📧 info@rekabatik.id</p>
                <p>📞 +62 812-3456-7890</p>
              </div>
            </div>
          </div>

          <div
            className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid rgba(201, 150, 12, 0.2)", color: "rgba(251, 245, 230, 0.45)", fontSize: "0.8rem" }}
          >
            <p>© 2026 RekaBatik. Wujudkan Ide Batik Menjadi Karya Indah Penuh Makna.</p>
            <div className="flex gap-4">
              <span>Kebijakan Privasi</span>
              <span>Syarat & Ketentuan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}