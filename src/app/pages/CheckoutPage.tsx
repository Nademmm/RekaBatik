import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Check,
  Copy,
  ArrowLeft,
  Crown,
  ShieldCheck,
  Clock,
  Upload,
  Loader2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Matches PricingPage palette exactly; only used for accent, never for noise.

const C = {
  bg: "#100D09",
  panel: "#171310",
  surface: "#1D1812",
  line: "rgba(255,255,255,0.07)",
  lineStrong: "rgba(196,157,101,0.3)",
  cream: "#EDE5D4",
  muted: "rgba(237,229,212,0.5)",
  faint: "rgba(237,229,212,0.28)",
  gold: "#C49D65",
  goldMuted: "rgba(196,157,101,0.12)",
};

const serif = "'Fraunces', 'Playfair Display', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";

// ─── Plan definitions ─────────────────────────────────────────────────────────

interface PlanMeta {
  id: "weekly" | "monthly";
  name: string;
  price: number;
  displayPrice: string;
  period: string;
  durationDays: number;
  description: string;
  features: string[];
}

const PLANS: Record<string, PlanMeta> = {
  weekly: {
    id: "weekly",
    name: "Premium Mingguan",
    price: 95000,
    displayPrice: "Rp 95.000",
    period: "7 hari",
    durationDays: 7,
    description: "Akses penuh selama 7 hari — ideal untuk proyek jangka pendek.",
    features: [
      "12 slot desain aktif",
      "Edit desain tersimpan bebas",
      "Export resolusi HD (2000×1500 px)",
      "Diskon pendaftaran HKI standar",
    ],
  },
  monthly: {
    id: "monthly",
    name: "Premium Bulanan",
    price: 199000,
    displayPrice: "Rp 199.000",
    period: "30 hari",
    durationDays: 30,
    description: "Unlimited segalanya selama 30 hari — untuk kreator aktif.",
    features: [
      "Desain, revisi & penyimpanan tanpa batas",
      "Edit desain tersimpan bebas",
      "Export resolusi HD (2000×1500 px)",
      "Diskon pendaftaran HKI eksklusif",
    ],
  },
};

const BANKS = [
  { name: "BCA", number: "880 000 1234 56", holder: "RekaBatik" },
  { name: "BNI", number: "012 345 6789", holder: "RekaBatik" },
  { name: "Mandiri", number: "140 000 1234 567", holder: "RekaBatik" },
  { name: "GoPay / OVO", number: "0812-3456-7890", holder: "RekaBatik" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function dateStr(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Tiny shared atoms ────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px w-full" style={{ background: C.line }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10.5px] font-semibold tracking-widest uppercase"
      style={{ color: C.faint, fontFamily: sans }}
    >
      {children}
    </span>
  );
}

function FieldInput({
  label,
  required,
  ...props
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block mb-1.5">
        <span className="text-[12px] font-medium" style={{ color: C.muted, fontFamily: sans }}>
          {label}
          {required && <span style={{ color: C.gold }}> *</span>}
        </span>
      </label>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        className="w-full px-3.5 py-2.5 text-[13.5px] outline-none transition-all"
        style={{
          background: C.panel,
          border: `1px solid ${focused ? C.gold : C.line}`,
          borderRadius: 10,
          color: C.cream,
          fontFamily: sans,
        }}
      />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: 1 | 2 }) {
  const steps = ["Instruksi Bayar", "Konfirmasi"];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: done || active ? C.gold : "transparent",
                  border: `1.5px solid ${done || active ? C.gold : C.line}`,
                  color: done || active ? "#1A1209" : C.faint,
                  fontFamily: sans,
                  transition: "all 0.2s",
                }}
              >
                {done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : idx}
              </div>
              <span
                className="text-[11.5px] font-medium"
                style={{ color: active ? C.cream : C.faint, fontFamily: sans }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mx-3"
                style={{ width: 32, height: 1, background: i + 1 < current ? C.gold : C.line }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text.replace(/[\s-]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
      style={{
        background: copied ? C.gold : "transparent",
        color: copied ? "#1A1209" : C.gold,
        border: `1px solid ${copied ? C.gold : C.lineStrong}`,
        fontFamily: sans,
      }}
    >
      {copied ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Copy className="w-3 h-3" />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({ plan }: { plan: PlanMeta }) {
  const expires = addDays(plan.durationDays);
  return (
    <div className="space-y-6">
      {/* Plan identity */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: C.goldMuted, border: `1px solid ${C.lineStrong}` }}
          >
            <Crown className="w-3.5 h-3.5" style={{ color: C.gold }} />
          </div>
          <span className="text-[12px] font-semibold tracking-wide" style={{ color: C.gold, fontFamily: sans }}>
            REKABATIK PREMIUM
          </span>
        </div>
        <h2 className="text-[20px] font-semibold mb-1" style={{ color: C.cream, fontFamily: serif }}>
          {plan.name}
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: C.muted, fontFamily: sans }}>
          {plan.description}
        </p>
      </div>

      <Divider />

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <Label>Total Pembayaran</Label>
          <div className="text-[32px] font-semibold mt-1 leading-none" style={{ color: C.cream, fontFamily: serif }}>
            {plan.displayPrice}
          </div>
          <div className="text-[12px] mt-1" style={{ color: C.faint, fontFamily: sans }}>
            Berlaku hingga {dateStr(expires)}
          </div>
        </div>
      </div>

      <Divider />

      {/* Features */}
      <div className="space-y-2.5">
        <Label>Yang Anda dapatkan</Label>
        <ul className="space-y-2 mt-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Check
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                strokeWidth={2.5}
                style={{ color: C.gold }}
              />
              <span className="text-[12.5px] leading-snug" style={{ color: C.muted, fontFamily: sans }}>
                {f}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Divider />

      {/* Trust badges */}
      <div className="space-y-2">
        {[
          { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Transaksi aman & terenkripsi" },
          { icon: <Clock className="w-3.5 h-3.5" />, text: "Aktivasi dalam 1×24 jam" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ color: C.faint }}>{item.icon}</span>
            <span className="text-[11.5px]" style={{ color: C.faint, fontFamily: sans }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Payment instructions ────────────────────────────────────────────

function PaymentStep({ plan, onNext }: { plan: PlanMeta; onNext: () => void }) {
  const [activeBank, setActiveBank] = useState(0);
  const bank = BANKS[activeBank];

  return (
    <div className="space-y-6">
      {/* Bank picker */}
      <div>
        <Label>Pilih metode pembayaran</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {BANKS.map((b, i) => (
            <button
              key={i}
              onClick={() => setActiveBank(i)}
              className="px-4 py-2 rounded-lg text-[12.5px] font-medium transition-all"
              style={{
                border: `1px solid ${i === activeBank ? C.gold : C.line}`,
                background: i === activeBank ? C.goldMuted : "transparent",
                color: i === activeBank ? C.gold : C.muted,
                fontFamily: sans,
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Account detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBank}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          <Label>Informasi rekening</Label>

          <div
            className="rounded-xl p-5 space-y-4 mt-2"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Row label="Bank / Dompet" value={<strong style={{ color: C.cream }}>{bank.name}</strong>} />
            <div className="h-px" style={{ background: C.line }} />
            <Row
              label="Nomor Rekening"
              value={
                <div className="flex items-center gap-3">
                  <span
                    className="text-[18px] font-semibold tracking-wider"
                    style={{ color: C.cream, fontFamily: serif }}
                  >
                    {bank.number}
                  </span>
                  <CopyButton text={bank.number} />
                </div>
              }
            />
            <div className="h-px" style={{ background: C.line }} />
            <Row label="Atas Nama" value={<span style={{ color: C.muted }}>{bank.holder}</span>} />
            <div className="h-px" style={{ background: C.line }} />
            <Row
              label="Jumlah Transfer"
              value={
                <div className="flex items-center gap-3">
                  <span className="text-[20px] font-semibold" style={{ color: C.gold, fontFamily: serif }}>
                    {plan.displayPrice}
                  </span>
                  <CopyButton text={String(plan.price)} />
                </div>
              }
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Warning */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(196,157,101,0.07)", border: `1px solid rgba(196,157,101,0.18)` }}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.gold }} />
        <p className="text-[12px] leading-relaxed" style={{ color: C.muted, fontFamily: sans }}>
          Transfer <strong style={{ color: C.cream }}>tepat</strong> sesuai nominal di atas. Kelebihan atau
          kekurangan nominal dapat memperlambat proses verifikasi.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2"
        style={{
          background: C.gold,
          color: "#1A1209",
          fontFamily: sans,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Sudah ditransfer — Lanjutkan
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px]" style={{ color: C.faint, fontFamily: sans }}>
        {label}
      </span>
      <div className="text-[13px] text-right" style={{ fontFamily: sans }}>
        {value}
      </div>
    </div>
  );
}

// ─── Step 2: Confirmation form ────────────────────────────────────────────────

function ConfirmStep({
  plan,
  onBack,
  onDone,
}: {
  plan: PlanMeta;
  onBack: () => void;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [bank, setBank] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Masukkan nama pengirim.");
    if (!bank.trim()) return toast.error("Masukkan asal bank / e-wallet.");
    if (!user) return;
    if (!selectedFile) return toast.error("Silakan unggah bukti transfer pembayaran terlebih dahulu.");
    setLoading(true);
    try {
      const expiresAt = addDays(plan.durationDays).toISOString();
      
      let attachmentUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const pathName = `receipts/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("store-images")
          .upload(pathName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("store-images")
          .getPublicUrl(pathName);
        attachmentUrl = publicUrlData?.publicUrl || null;
      }

      // 1. Insert subscription log to the database
      const { error: dbError } = await supabase
        .from("premium_subscriptions")
        .insert([{
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || "User RekaBatik",
          plan_id: plan.id,
          price: plan.price,
          sender_name: name,
          bank_from: bank,
          transfer_date: date,
          notes: note,
          status: "pending",
          attachment_url: attachmentUrl,
          expires_at: expiresAt
        }]);

      if (dbError) throw dbError;

      // 2. Set pending state locally in user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          subscription_plan: "gratis", // Keep gratis until approved
          subscription_expires_at: null,
          subscription_pending: true,
        },
      });
      if (authError) throw authError;

      onDone();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Mini summary */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: C.goldMuted, border: `1px solid ${C.lineStrong}` }}
      >
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5" style={{ color: C.gold }} />
          <span className="text-[13px] font-medium" style={{ color: C.cream, fontFamily: sans }}>
            {plan.name}
          </span>
        </div>
        <span className="text-[14px] font-semibold" style={{ color: C.gold, fontFamily: serif }}>
          {plan.displayPrice}
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <FieldInput
          label="Nama Pengirim (sesuai rekening)"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
        />
        <FieldInput
          label="Asal Bank / E-Wallet"
          required
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          placeholder="cth: BCA Savings, GoPay"
        />
        <div>
          <label className="block mb-1.5">
            <span className="text-[12px] font-medium" style={{ color: C.muted, fontFamily: sans }}>
              Tanggal Transfer
            </span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-[13.5px] outline-none"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              color: C.cream,
              fontFamily: sans,
              colorScheme: "dark",
            }}
          />
        </div>
        <div>
          <label className="block mb-1.5">
            <span className="text-[12px] font-medium" style={{ color: C.muted, fontFamily: sans }}>
              Catatan (opsional)
            </span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Informasi tambahan jika ada…"
            rows={2}
            className="w-full px-3.5 py-2.5 text-[13.5px] outline-none resize-none"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              color: C.cream,
              fontFamily: sans,
            }}
          />
        </div>

        {/* Upload */}
        <div>
          <label className="block mb-1.5">
            <span className="text-[12px] font-medium" style={{ color: C.muted, fontFamily: sans }}>
              Bukti Transfer (Wajib) <span style={{ color: C.gold }}>*</span>
            </span>
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size > 5 * 1024 * 1024) {
                toast.error("Maks. 5 MB");
                return;
              }
              if (f) {
                setFileName(f.name);
                setSelectedFile(f);
              }
            }}
          />
          {selectedFile ? (
            <div 
              className="relative p-3.5 rounded-xl flex items-center justify-between border"
              style={{
                background: C.surface,
                borderColor: C.goldMuted,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {selectedFile.type.startsWith("image/") ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: C.line }}>
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Pratinjau Bukti" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.panel, color: C.gold }}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: C.cream }}>{fileName}</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFileName(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                style={{ color: C.muted }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full px-3.5 py-2.5 text-[13px] flex items-center gap-2 transition-colors"
              style={{
                background: C.panel,
                border: `1px dashed ${C.line}`,
                borderRadius: 10,
                color: C.faint,
                fontFamily: sans,
                textAlign: "left",
              }}
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              {"Klik untuk mengunggah foto / PDF"}
            </button>
          )}
        </div>
      </div>

      <Divider />

      {/* Notice */}
      <p className="text-[12px] leading-relaxed" style={{ color: C.faint, fontFamily: sans }}>
        Pembayaran akan diverifikasi tim kami dalam <strong style={{ color: C.muted }}>1×24 jam</strong>.
        Anda akan mendapat notifikasi setelah akun diaktifkan.
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-[13px] font-medium transition-colors"
          style={{
            background: "transparent",
            border: `1px solid ${C.line}`,
            color: C.muted,
            fontFamily: sans,
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl font-semibold text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: C.gold,
            color: "#1A1209",
            fontFamily: sans,
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {loading ? "Memproses…" : "Kirim Konfirmasi Pembayaran"}
        </button>
      </div>
    </form>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ plan }: { plan: PlanMeta }) {
  const navigate = useNavigate();
  const expires = dateStr(addDays(plan.durationDays));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="text-center py-6 space-y-6"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ border: `1.5px solid ${C.gold}`, background: C.goldMuted }}
      >
        <CheckCircle2 className="w-7 h-7" style={{ color: C.gold }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-[22px] font-semibold" style={{ color: C.cream, fontFamily: serif }}>
          Konfirmasi Terkirim
        </h2>
        <p className="text-[13.5px] leading-relaxed mx-auto max-w-xs" style={{ color: C.muted, fontFamily: sans }}>
          Terima kasih. Pembayaran <strong style={{ color: C.cream }}>{plan.name}</strong> sedang kami
          verifikasi — biasanya selesai dalam 1×24 jam.
        </p>
      </div>

      {/* Status table */}
      <div
        className="rounded-xl text-left overflow-hidden"
        style={{ border: `1px solid ${C.line}` }}
      >
        {[
          ["Paket", plan.name],
          ["Masa aktif", plan.period],
          ["Berlaku hingga", expires],
          ["Status", "Menunggu verifikasi"],
        ].map(([label, val], i, arr) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: i % 2 === 0 ? C.surface : C.panel,
              borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none",
            }}
          >
            <span className="text-[12px]" style={{ color: C.faint, fontFamily: sans }}>{label}</span>
            <span
              className="text-[13px] font-medium"
              style={{
                color: label === "Status" ? C.gold : C.cream,
                fontFamily: sans,
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/custom")}
          className="py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2"
          style={{ background: C.gold, color: "#1A1209", fontFamily: sans }}
        >
          <Sparkles className="w-4 h-4" />
          Mulai Desain
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2"
          style={{
            background: "transparent",
            border: `1px solid ${C.line}`,
            color: C.muted,
            fontFamily: sans,
          }}
        >
          Lihat Profil
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const planId = params.get("plan") || "";
  const plan = PLANS[planId] as PlanMeta | undefined;

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth?redirect=/checkout?plan=" + planId); return; }
    if (!plan) { navigate("/pricing"); }
  }, [user, loading, plan, planId, navigate]);

  if (loading || !plan || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.gold }} />
      </div>
    );
  }

  const stepTitle: Record<number, string> = {
    1: "Instruksi Pembayaran",
    2: "Konfirmasi Transfer",
    3: "Pembayaran Dikirim",
  };

  return (
    <>
      {/* Google font preload */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Inter:wght@400;500;600&display=swap"
      />

      <div className="min-h-screen" style={{ background: C.bg }}>
        {/* Top bar */}
        <header
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: C.line, background: C.panel }}
        >
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
            style={{ color: C.muted, fontFamily: sans }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" style={{ color: C.gold }} />
            <span className="text-[13px] font-semibold" style={{ color: C.cream, fontFamily: sans }}>
              RekaBatik
            </span>
          </div>
          <div className="w-20" /> {/* spacer */}
        </header>

        {/* Body */}
        <div className="max-w-5xl mx-auto px-4 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

            {/* ── Left: order summary (always visible on desktop) */}
            <div
              className="rounded-2xl p-8 hidden lg:block sticky top-8"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <OrderSummary plan={plan} />
            </div>

            {/* ── Right: checkout flow */}
            <div>
              {/* Mobile summary pill */}
              <div
                className="lg:hidden rounded-xl px-4 py-3 flex items-center justify-between mb-6"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5" style={{ color: C.gold }} />
                  <span className="text-[13px] font-medium" style={{ color: C.cream, fontFamily: sans }}>
                    {plan.name}
                  </span>
                </div>
                <span className="text-[14px] font-semibold" style={{ color: C.gold, fontFamily: serif }}>
                  {plan.displayPrice}
                </span>
              </div>

              {/* Step header */}
              {step < 3 && (
                <div className="mb-6">
                  <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: C.faint, fontFamily: sans }}>
                    Langkah {step} dari 2
                  </p>
                  <div className="flex items-center justify-between mb-5">
                    <h1 className="text-[22px] font-semibold" style={{ color: C.cream, fontFamily: serif }}>
                      {stepTitle[step]}
                    </h1>
                    <Steps current={step as 1 | 2} />
                  </div>
                  <Divider />
                </div>
              )}

              {/* Step content */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="mt-6">
                      <PaymentStep plan={plan} onNext={() => setStep(2)} />
                    </div>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="mt-6">
                      <ConfirmStep plan={plan} onBack={() => setStep(1)} onDone={() => setStep(3)} />
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="mt-4">
                      <SuccessScreen plan={plan} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
