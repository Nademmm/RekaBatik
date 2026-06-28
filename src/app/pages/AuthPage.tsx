import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
  Phone,
  MapPin,
  Star,
  FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Toaster, toast } from "sonner";
import logoImg from "../../imports/rekabatik-logo.png";
import authIllustration from "../../imports/auth-illustration.png";
import { useAuth } from "../../lib/AuthContext";

type AuthMode = "login" | "register";
type UserRole = "customer" | "artisan";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, userRole } = useAuth();
  const redirectPath = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Form fields — common
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Form fields — artisan specific
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeSpecialty, setStoreSpecialty] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      if (userRole === "artisan") {
        navigate("/admin", { replace: true });
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, authLoading, userRole, navigate, redirectPath]);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (mode === "register" && !name.trim()) {
      errs.name = "Nama lengkap wajib diisi";
    }

    if (!email.trim()) {
      errs.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Format email tidak valid";
    }

    if (!password) {
      errs.password = "Password wajib diisi";
    } else if (password.length < 6) {
      errs.password = "Password minimal 6 karakter";
    }

    if (mode === "register") {
      if (!confirmPassword) {
        errs.confirmPassword = "Konfirmasi password wajib diisi";
      } else if (password !== confirmPassword) {
        errs.confirmPassword = "Password tidak cocok";
      }

      if (selectedRole === "artisan") {
        if (!storeName.trim()) errs.storeName = "Nama toko wajib diisi";
        if (!storePhone.trim()) errs.storePhone = "Nomor telepon toko wajib diisi";
        if (!storeAddress.trim()) errs.storeAddress = "Alamat toko wajib diisi";
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Mohon periksa kembali form Anda.");
      return false;
    }
    return true;
  }, [mode, name, email, password, confirmPassword, selectedRole, storeName, storePhone, storeAddress]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsLoading(true);

      try {
        if (mode === "login") {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          toast.success("Berhasil masuk! Selamat datang kembali.");
          const role = data.user?.user_metadata?.role;
          if (role === "artisan") {
            navigate("/admin", { replace: true });
          } else {
            navigate(redirectPath, { replace: true });
          }
        } else {
          // Register
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
                role: selectedRole,
              },
            },
          });
          if (error) throw error;

          // If artisan, create store record
          if (selectedRole === "artisan" && data.user) {
            const { error: storeError } = await supabase.from("stores").insert([{
              name: storeName,
              owner: name,
              specialty: storeSpecialty || "Batik Kustom",
              phone: storePhone,
              address: storeAddress,
              description: storeDescription || `Toko batik milik ${name}`,
              owner_id: data.user.id,
              rating: 5,
              review_count: 0,
              featured: false,
              tags: ["Custom Order"],
              motifs: [],
            }]);
            if (storeError) {
              console.error("Error creating store:", storeError);
              toast.warning("Akun dibuat, namun ada masalah mendaftarkan toko. Hubungi admin.");
            } else {
              toast.success("Akun dibuat. Toko Anda sedang menunggu persetujuan admin RekaBatik.");
            }
          } else {
            toast.success("Akun berhasil dibuat! Silakan cek email untuk verifikasi.");
          }
          switchMode("login");
        }
      } catch (err: any) {
        const msg = err?.message || "Terjadi kesalahan";
        if (msg.includes("Invalid login")) {
          toast.error("Email atau password salah");
        } else if (msg.includes("already registered")) {
          toast.error("Email sudah terdaftar");
        } else {
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [mode, email, password, name, selectedRole, storeName, storePhone, storeAddress, storeSpecialty, storeDescription, validate, navigate, switchMode, redirectPath]
  );

  const handleOAuth = useCallback(async (provider: "google" | "facebook") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message || "Gagal masuk dengan " + provider);
    }
  }, []);

  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: "", color: "", width: "0%" };
    if (pw.length < 6) return { label: "Lemah", color: "#ef4444", width: "25%" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial, pw.length >= 8].filter(Boolean).length;
    if (score <= 2) return { label: "Lemah", color: "#ef4444", width: "25%" };
    if (score <= 3) return { label: "Cukup", color: "#f59e0b", width: "50%" };
    if (score <= 4) return { label: "Kuat", color: "#22c55e", width: "75%" };
    return { label: "Sangat Kuat", color: "#059669", width: "100%" };
  };

  const pwStrength = mode === "register" ? getPasswordStrength(password) : null;

  const inputField = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    type: string,
    placeholder: string,
    icon: React.ReactNode,
    error?: string,
  ) => (
    <div>
      <label className="block mb-1.5 text-sm font-medium" style={{ color: "#5A4A3E" }}>
        {label}
      </label>
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-200"
        style={{
          border: `2px solid ${error ? "#ef4444" : focusedField === id ? "#8B6F47" : "rgba(139,111,71,0.15)"}`,
          background: focusedField === id ? "#FFFFFF" : "#FAFAF8",
          boxShadow: focusedField === id ? "0 0 0 4px rgba(139,111,71,0.08)" : "none",
        }}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => { onChange(e.target.value); if (error) setErrors(prev => ({ ...prev, [id]: undefined })); }}
          onFocus={() => setFocusedField(id)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3.5 text-sm bg-transparent outline-none placeholder:text-[#C4B5A5]"
          style={{ color: "#3D2B1F" }}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 mt-1.5 text-xs"
          style={{ color: "#ef4444" }}
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#FAF8F5", fontFamily: "'Inter', sans-serif" }}
    >
      <Toaster position="top-right" richColors />
      {/* ─── Left Panel ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-between"
        style={{
          backgroundImage: `url(${authIllustration})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(61,43,31,0.82) 0%, rgba(90,61,43,0.6) 40%, rgba(139,111,71,0.5) 100%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.05]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-batik" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M0,60 Q30,30 60,60 Q90,90 120,60" stroke="#D4B88B" strokeWidth="2" fill="none" />
                <path d="M0,90 Q30,60 60,90 Q90,120 120,90" stroke="#D4B88B" strokeWidth="1.5" fill="none" />
                <path d="M0,30 Q30,0 60,30 Q90,60 120,30" stroke="#D4B88B" strokeWidth="1.5" fill="none" />
                <circle cx="60" cy="60" r="4" fill="#D4B88B" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-batik)" />
          </svg>
        </div>
        <div className="relative z-10 p-10">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <img
              src={logoImg}
              alt="RekaBatik Logo"
              style={{ height: "40px", width: "auto", filter: "brightness(1.4) drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            />
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#FAF8F5",
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              Reka<span style={{ color: "#D4B88B" }}>Batik</span>
            </span>
          </Link>
        </div>

        {/* Tagline at bottom */}
        <div className="relative z-10 p-10">
          <p style={{ color: "rgba(250,248,245,0.75)", fontSize: "0.95rem", lineHeight: 1.8 }}>
            Platform kustomisasi batik digital yang menghubungkan pengrajin terbaik
            dengan pelanggan dari seluruh Indonesia.
          </p>
        </div>
      </div>

      {/* ─── Right Panel: Form ───────────────────────────────────── */}
      <div className="w-full lg:w-[50%] flex flex-col min-h-screen relative overflow-y-auto">
        {/* Mobile logo bar */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="RekaBatik Logo" style={{ height: "36px", width: "auto" }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>
              <span style={{ color: "#3D2B1F" }}>Reka</span>
              <span style={{ color: "#8B6F47" }}>Batik</span>
            </span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start justify-center px-6 sm:px-12 lg:px-14 py-10">
          <div className="w-full max-w-md">
            {/* Mode Tabs */}
            <div
              className="flex p-1.5 rounded-2xl mb-6"
              style={{ background: "rgba(139,111,71,0.06)", border: "1px solid rgba(139,111,71,0.1)" }}
            >
              {(["login", "register"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 relative py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{ color: mode === m ? "#3D2B1F" : "#9E8E82" }}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="auth-tab-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: "#FFFFFF", boxShadow: "0 2px 12px rgba(61,43,31,0.1)" }}
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">
                    {m === "login" ? "Masuk" : "Daftar"}
                  </span>
                </button>
              ))}
            </div>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#3D2B1F",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginBottom: "0.4rem",
                  }}
                >
                  {mode === "login" ? "Selamat Datang" : "Buat Akun Baru"}
                </h1>
                <p style={{ color: "#7A6B5E", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {mode === "login"
                    ? "Masuk ke akun Anda untuk melanjutkan desain batik."
                    : "Daftarkan diri Anda dan mulai merancang batik impian."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Role Selector (register only) */}
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5"
                >
                  <p className="text-sm font-medium mb-2.5" style={{ color: "#5A4A3E" }}>
                    Daftar sebagai:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { role: "customer" as UserRole, label: "Pelanggan", desc: "Beli & kustomisasi batik", icon: <User className="w-5 h-5" /> },
                      { role: "artisan" as UserRole, label: "Pengrajin Batik", desc: "Kelola toko & pesanan", icon: <Store className="w-5 h-5" /> },
                    ].map(({ role, label, desc, icon }) => (
                      <motion.button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
                        style={{
                          border: `2px solid ${selectedRole === role ? "#8B6F47" : "rgba(139,111,71,0.15)"}`,
                          background: selectedRole === role ? "rgba(139,111,71,0.08)" : "#FAFAF8",
                          boxShadow: selectedRole === role ? "0 0 0 4px rgba(139,111,71,0.08)" : "none",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: selectedRole === role ? "linear-gradient(135deg, #8B6F47, #6B4F2F)" : "rgba(139,111,71,0.1)",
                            color: selectedRole === role ? "#FFF" : "#8B6F47",
                          }}
                        >
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{label}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#A89B8F" }}>{desc}</p>
                        </div>
                        {selectedRole === role && (
                          <CheckCircle2 className="w-4 h-4 absolute top-3 right-3" style={{ color: "#8B6F47" }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={`${mode}-${selectedRole}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Name Field (register only) */}
                {mode === "register" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    {inputField(
                      "name", "Nama Lengkap", name, setName, "text", "Masukkan nama lengkap",
                      <User className="w-[18px] h-[18px]" style={{ color: focusedField === "name" ? "#8B6F47" : "#B8A898" }} />,
                      errors.name
                    )}
                  </motion.div>
                )}

                {/* Email Field */}
                {inputField(
                  "email", "Alamat Email", email, setEmail, "email", "contoh@email.com",
                  <Mail className="w-[18px] h-[18px]" style={{ color: focusedField === "email" ? "#8B6F47" : "#B8A898" }} />,
                  errors.email
                )}

                {/* Password Field */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium" style={{ color: "#5A4A3E" }}>Password</label>
                  <div
                    className="relative rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      border: `2px solid ${errors.password ? "#ef4444" : focusedField === "password" ? "#8B6F47" : "rgba(139,111,71,0.15)"}`,
                      background: focusedField === "password" ? "#FFFFFF" : "#FAFAF8",
                      boxShadow: focusedField === "password" ? "0 0 0 4px rgba(139,111,71,0.08)" : "none",
                    }}
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-[18px] h-[18px]" style={{ color: focusedField === "password" ? "#8B6F47" : "#B8A898" }} />
                    </div>
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-12 pr-12 py-3.5 text-sm bg-transparent outline-none placeholder:text-[#C4B5A5]"
                      style={{ color: "#3D2B1F" }}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-black/5 transition-colors"
                      style={{ color: "#B8A898" }}
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#ef4444" }}>
                      <AlertCircle className="w-3 h-3" />{errors.password}
                    </motion.p>
                  )}
                  {mode === "register" && password && pwStrength && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium" style={{ color: "#9E8E82" }}>Kekuatan password</span>
                        <span className="text-[11px] font-bold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,111,71,0.1)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: pwStrength.width }}
                          transition={{ duration: 0.4 }}
                          style={{ background: pwStrength.color }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password (register only) */}
                {mode === "register" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "#5A4A3E" }}>Konfirmasi Password</label>
                      <div
                        className="relative rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          border: `2px solid ${errors.confirmPassword ? "#ef4444" : focusedField === "confirmPassword" ? "#8B6F47" : "rgba(139,111,71,0.15)"}`,
                          background: focusedField === "confirmPassword" ? "#FFFFFF" : "#FAFAF8",
                          boxShadow: focusedField === "confirmPassword" ? "0 0 0 4px rgba(139,111,71,0.08)" : "none",
                        }}
                      >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Lock className="w-[18px] h-[18px]" style={{ color: focusedField === "confirmPassword" ? "#8B6F47" : "#B8A898" }} />
                        </div>
                        <input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                          onFocus={() => setFocusedField("confirmPassword")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Ulangi password"
                          className="w-full pl-12 pr-12 py-3.5 text-sm bg-transparent outline-none placeholder:text-[#C4B5A5]"
                          style={{ color: "#3D2B1F" }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-black/5 transition-colors"
                          style={{ color: "#B8A898" }}
                        >
                          {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 mt-1.5 text-xs"
                          style={{ color: password === confirmPassword ? "#22c55e" : "#ef4444" }}
                        >
                          {password === confirmPassword ? (
                            <><CheckCircle2 className="w-3 h-3" />Password cocok</>
                          ) : (
                            <><AlertCircle className="w-3 h-3" />{errors.confirmPassword || "Password tidak cocok"}</>
                          )}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Artisan Store Fields */}
                <AnimatePresence>
                  {mode === "register" && selectedRole === "artisan" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="pt-2">
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
                          style={{ background: "rgba(139,111,71,0.08)", border: "1px solid rgba(139,111,71,0.15)" }}
                        >
                          <Star className="w-4 h-4 flex-shrink-0" style={{ color: "#8B6F47" }} />
                          <p className="text-xs font-medium" style={{ color: "#5A4A3E" }}>
                            Lengkapi detail toko Anda agar langsung terdaftar di platform
                          </p>
                        </div>

                        {inputField(
                          "storeName", "Nama Toko / Studio", storeName, setStoreName, "text", "Contoh: Batik Amri Jetis",
                          <Store className="w-[18px] h-[18px]" style={{ color: focusedField === "storeName" ? "#8B6F47" : "#B8A898" }} />,
                          errors.storeName
                        )}
                      </div>

                      {inputField(
                        "storePhone", "Nomor Telepon Toko", storePhone, setStorePhone, "tel", "Contoh: +62 812-3456-7890",
                        <Phone className="w-[18px] h-[18px]" style={{ color: focusedField === "storePhone" ? "#8B6F47" : "#B8A898" }} />,
                        errors.storePhone
                      )}

                      {inputField(
                        "storeAddress", "Alamat Toko", storeAddress, setStoreAddress, "text", "Jl. Raya Jetis No. 12, Sidoarjo",
                        <MapPin className="w-[18px] h-[18px]" style={{ color: focusedField === "storeAddress" ? "#8B6F47" : "#B8A898" }} />,
                        errors.storeAddress
                      )}

                      {inputField(
                        "storeSpecialty", "Spesialisasi Batik (opsional)", storeSpecialty, setStoreSpecialty, "text", "Contoh: Batik Tulis Beras Utah",
                        <Star className="w-[18px] h-[18px]" style={{ color: focusedField === "storeSpecialty" ? "#8B6F47" : "#B8A898" }} />,
                      )}

                      <div>
                        <label className="block mb-1.5 text-sm font-medium" style={{ color: "#5A4A3E" }}>
                          Deskripsi Toko (opsional)
                        </label>
                        <div
                          className="relative rounded-xl overflow-hidden transition-all duration-200"
                          style={{
                            border: `2px solid ${focusedField === "storeDescription" ? "#8B6F47" : "rgba(139,111,71,0.15)"}`,
                            background: focusedField === "storeDescription" ? "#FFFFFF" : "#FAFAF8",
                            boxShadow: focusedField === "storeDescription" ? "0 0 0 4px rgba(139,111,71,0.08)" : "none",
                          }}
                        >
                          <div className="absolute left-4 top-3.5">
                            <FileText className="w-[18px] h-[18px]" style={{ color: focusedField === "storeDescription" ? "#8B6F47" : "#B8A898" }} />
                          </div>
                          <textarea
                            id="storeDescription"
                            value={storeDescription}
                            onChange={(e) => setStoreDescription(e.target.value)}
                            onFocus={() => setFocusedField("storeDescription")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Ceritakan keunikan toko batik Anda..."
                            rows={3}
                            className="w-full pl-12 pr-4 py-3.5 text-sm bg-transparent outline-none placeholder:text-[#C4B5A5] resize-none"
                            style={{ color: "#3D2B1F" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot Password (login only) */}
                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-medium transition-colors hover:underline"
                      style={{ color: "#8B6F47" }}
                      onClick={() => toast.info("Fitur lupa password akan segera hadir!")}
                    >
                      Lupa password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #3D2B1F 0%, #5A3D2B 50%, #8B6F47 100%)",
                    boxShadow: "0 4px 20px rgba(61,43,31,0.3), 0 1px 3px rgba(61,43,31,0.15)",
                  }}
                  whileHover={{ scale: isLoading ? 1 : 1.01, boxShadow: "0 6px 28px rgba(61,43,31,0.4)" }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Masuk" : selectedRole === "artisan" ? "Daftar sebagai Pengrajin" : "Daftar Sekarang"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "rgba(139,111,71,0.12)" }} />
              <span className="text-xs font-medium tracking-wide" style={{ color: "#B8A898" }}>ATAU</span>
              <div className="flex-1 h-px" style={{ background: "rgba(139,111,71,0.12)" }} />
            </div>

            {/* Social Login Buttons */}
            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => handleOAuth("google")}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#FFFFFF", color: "#3D2B1F", border: "1.5px solid rgba(139,111,71,0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                whileHover={{ scale: 1.01, boxShadow: "0 3px 12px rgba(0,0,0,0.08)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleOAuth("facebook")}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#1877F2", color: "#FFFFFF", border: "1.5px solid #1877F2", boxShadow: "0 2px 8px rgba(24,119,242,0.25)" }}
                whileHover={{ scale: 1.01, boxShadow: "0 4px 16px rgba(24,119,242,0.35)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </motion.button>
            </div>

            {/* Switch mode link */}
            <p className="text-center text-sm mt-7" style={{ color: "#7A6B5E" }}>
              {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="font-bold transition-colors hover:underline"
                style={{ color: "#8B6F47" }}
              >
                {mode === "login" ? "Daftar di sini" : "Masuk"}
              </button>
            </p>
          </div>
        </div>

        {/* Back to home link */}
        <div className="pb-6 flex justify-center">
          <Link to="/" className="text-xs font-medium transition-colors hover:underline" style={{ color: "#B8A898" }}>
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
