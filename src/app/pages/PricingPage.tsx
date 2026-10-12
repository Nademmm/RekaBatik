import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "react-router";
import {
  Check,
  X,
  ChevronDown,
  ArrowRight,
  BadgeCheck,
  HelpCircle,
  ShieldCheck,
  Timer,
  Crown,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { BatikBackground } from "../components/BatikBackground";

// ─── Design tokens ──────────────────────────────────────────────────────────
// One palette, used the same way everywhere. Warmth comes from soga (batik
// dye) brown and a single muted gold — not from stacking unrelated hues.

const C = {
  bg: "#15100C",
  bgRaised: "#1C1610",
  surface: "#1E1811",
  surfaceHover: "#241C14",
  border: "rgba(240,231,214,0.09)",
  borderStrong: "rgba(196,157,101,0.45)",
  cream: "#F2EAD9",
  creamSoft: "rgba(242,234,217,0.64)",
  creamFaint: "rgba(242,234,217,0.34)",
  gold: "#C49D65",
  goldSoft: "rgba(196,157,101,0.14)",
  goldLine: "rgba(196,157,101,0.5)",
};

const displayFont = "'Fraunces', 'Playfair Display', serif";
const bodyFont = "'Inter', sans-serif";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlanFeature {
  label: string;
  included: boolean | string;
}

interface Plan {
  id: "gratis" | "weekly" | "monthly";
  name: string;
  tagline: string;
  price: string | null;
  period: string | null;
  tag?: string;
  emphasized?: boolean;
  features: PlanFeature[];
  cta: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────

const plans: Plan[] = [
  {
    id: "gratis",
    name: "Gratis",
    tagline: "Untuk mencoba alat desain sebelum berlangganan.",
    price: "Rp 0",
    period: "selamanya",
    features: [
      { label: "2 desain aktif", included: "2 desain" },
      { label: "Edit desain tersimpan", included: false },

      { label: "Ekspor resolusi tinggi", included: false },
      { label: "Diskon pendaftaran HKI", included: false },
      { label: "Penyimpanan proyek", included: "Terbatas" },
    ],
    cta: "Mulai gratis",
  },
  {
    id: "weekly",
    name: "Mingguan",
    tagline: "Akses penuh untuk proyek jangka pendek.",
    price: "Rp 95.000",
    period: "per 7 hari",
    tag: "Paling banyak dipilih",
    emphasized: true,
    features: [
      { label: "12 desain aktif", included: "12 desain" },
      { label: "Edit desain tersimpan", included: true },

      { label: "Ekspor resolusi tinggi", included: true },
      { label: "Diskon pendaftaran HKI", included: "Diskon standar" },
      { label: "Penyimpanan proyek", included: "12 slot" },
    ],
    cta: "Pilih mingguan",
  },
  {
    id: "monthly",
    name: "Bulanan",
    tagline: "Untuk yang berkreasi dan merevisi secara rutin.",
    price: "Rp 199.000",
    period: "per 30 hari",
    tag: "Nilai terbaik",
    emphasized: true,
    features: [
      { label: "Desain tanpa batas", included: "Unlimited" },
      { label: "Edit desain tersimpan", included: true },

      { label: "Ekspor resolusi tinggi", included: true },
      { label: "Diskon pendaftaran HKI", included: "Diskon eksklusif" },
      { label: "Penyimpanan proyek", included: "Unlimited" },
    ],
    cta: "Pilih bulanan",
  },
];

const comparisonRows = [
  { label: "Jumlah desain", values: ["2 desain", "12 desain", "Unlimited"] },
  { label: "Edit desain tersimpan", values: [false, true, true] },

  { label: "Ekspor resolusi tinggi", values: [false, true, true] },
  { label: "Diskon pendaftaran HKI", values: [false, "Standar", "Eksklusif"] },
  { label: "Penyimpanan proyek", values: ["Terbatas", "12 slot", "Unlimited"] },
  { label: "Masa aktif", values: ["Selamanya", "7 hari", "30 hari"] },
];

const faqs = [
  {
    q: "Apakah saya bisa upgrade dari Plan Gratis ke Premium?",
    a: "Ya. Anda bisa upgrade kapan saja, dan seluruh desain yang sudah dibuat sebelumnya tetap tersimpan dan dapat diakses setelah upgrade.",
  },
  {
    q: "Bagaimana cara pembayaran Plan Premium?",
    a: "Saat ini pembayaran dapat dilakukan melalui transfer bank dan e-wallet populer. Konfirmasi dilakukan manual dalam 1×24 jam.",
  },
  {
    q: "Apakah Plan Premium dapat diperpanjang?",
    a: "Bisa. Perpanjangan dapat dilakukan kapan saja, termasuk sebelum masa aktif berakhir — masa aktif baru akan ditambahkan setelah masa aktif saat ini selesai.",
  },

  {
    q: "Apa itu Diskon Pendaftaran HKI?",
    a: "HKI (Hak Kekayaan Intelektual) melindungi desain batik Anda secara hukum. Pengguna Premium mendapat diskon biaya pendaftaran melalui mitra resmi kami.",
  },
];

// ─── Signature motif: a thin, hand-set parang hairline ─────────────────────
// The one deliberate flourish on the page — a simplified parang (diagonal
// dagger) motif rendered as crisp single-weight linework, no glow, no blur.

function BatikRule({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 16"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <pattern id="parang-rule" width="24" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M0 16 L12 4 L24 16"
            fill="none"
            stroke={C.goldLine}
            strokeWidth="1"
          />
          <circle cx="12" cy="6.5" r="1" fill={C.goldLine} />
        </pattern>
      </defs>
      <rect width="240" height="16" fill="url(#parang-rule)" />
    </svg>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 justify-center mb-5">
      <span className="w-6 h-px" style={{ background: C.goldLine }} />
      <span
        className="text-[11px] font-semibold tracking-[0.22em] uppercase"
        style={{ color: C.gold, fontFamily: bodyFont }}
      >
        {children}
      </span>
      <span className="w-6 h-px" style={{ background: C.goldLine }} />
    </div>
  );
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  const isFalse = feature.included === false;
  const isString = typeof feature.included === "string";

  return (
    <li
      className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
      style={{ borderColor: C.border }}
    >
      <div className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
        {isFalse ? (
          <X className="w-3.5 h-3.5" style={{ color: C.creamFaint }} />
        ) : (
          <Check className="w-3.5 h-3.5" style={{ color: C.gold }} strokeWidth={2.5} />
        )}
      </div>
      <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
        <span
          className="text-[13.5px] leading-snug"
          style={{
            color: isFalse ? C.creamFaint : "rgba(242,234,217,0.86)",
            fontFamily: bodyFont,
          }}
        >
          {feature.label}
        </span>
        {isString && (
          <span
            className="text-[11.5px] font-medium whitespace-nowrap"
            style={{ color: C.gold, fontFamily: bodyFont }}
          >
            {feature.included as string}
          </span>
        )}
      </div>
    </li>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentPlan = user?.user_metadata?.subscription_plan || "gratis";
  const isPending = user?.user_metadata?.subscription_pending === "true" || (user?.user_metadata?.subscription_pending as unknown) === true;
  const isActive = currentPlan === plan.id;

  const handleCTA = async () => {
    if (!user) {
      toast.error("Masuk terlebih dahulu untuk berlangganan.");
      navigate("/auth?redirect=/pricing");
      return;
    }
    if (isPending && plan.id !== "gratis") {
      toast.error("Pembayaran Anda sedang dalam verifikasi.");
      return;
    }
    if (isActive) {
      navigate("/custom");
      return;
    }
    // Premium plans → go to checkout flow
    if (plan.id === "weekly" || plan.id === "monthly") {
      navigate(`/checkout?plan=${plan.id}`);
      return;
    }
    // Free plan → activate directly
    try {
      const { error } = await supabase.auth.updateUser({
        data: { subscription_plan: "gratis" },
      });
      if (error) throw error;
      toast.success("Paket Gratis aktif.");
      navigate("/custom");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengaktifkan paket. Coba lagi.");
    }
  };

  return (
    <Reveal delay={index * 0.08} className="h-full">
      <div
        className="relative flex flex-col h-full rounded-2xl overflow-hidden transition-colors duration-200"
        style={{
          background: C.surface,
          border: `1px solid ${plan.emphasized ? C.borderStrong : C.border}`,
        }}
      >
        {plan.tag && (
          <div
            className="px-6 py-2.5 text-center border-b"
            style={{ background: C.goldSoft, borderColor: C.border }}
          >
            <span
              className="text-[11px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: C.gold, fontFamily: bodyFont }}
            >
              {plan.tag}
            </span>
          </div>
        )}

        <div className="p-7 pb-5">
          <h3
            className="text-[22px] font-semibold mb-1.5"
            style={{ color: C.cream, fontFamily: displayFont }}
          >
            {plan.name}
          </h3>
          <p
            className="text-[13.5px] leading-relaxed mb-6"
            style={{ color: C.creamSoft, fontFamily: bodyFont }}
          >
            {plan.tagline}
          </p>

          <div className="flex items-baseline gap-2">
            <span
              className="text-[34px] font-semibold tracking-tight leading-none"
              style={{ color: C.cream, fontFamily: displayFont }}
            >
              {plan.price}
            </span>
            <span className="text-[13px]" style={{ color: C.creamFaint, fontFamily: bodyFont }}>
              {plan.period}
            </span>
          </div>
        </div>

        <div className="h-px mx-7" style={{ background: C.border }} />

        <div className="px-7 pt-4 flex-1">
          <ul>
            {plan.features.map((f, i) => (
              <FeatureRow key={i} feature={f} />
            ))}
          </ul>
        </div>

        <div className="p-7 pt-6">
          <button
            onClick={handleCTA}
            disabled={isPending && plan.id !== "gratis"}
            className="w-full py-3 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-transform duration-150 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              isActive
                ? {
                    background: "rgba(196,157,101,0.15)",
                    border: `1px solid ${C.gold}`,
                    color: C.gold,
                    outlineColor: C.gold,
                  }
                : isPending && plan.id !== "gratis"
                ? {
                    background: "rgba(242,234,217,0.06)",
                    border: `1px solid ${C.border}`,
                    color: C.creamFaint,
                    outlineColor: C.gold,
                  }
                : plan.emphasized
                ? {
                    background: C.gold,
                    color: "#1B140D",
                    outlineColor: C.gold,
                  }
                : {
                    background: "transparent",
                    border: `1px solid rgba(242,234,217,0.2)`,
                    color: C.creamSoft,
                    outlineColor: C.gold,
                  }
            }
          >
            {isActive ? (
              "Paket Aktif Anda"
            ) : isPending && plan.id !== "gratis" ? (
              "Menunggu Verifikasi"
            ) : (
              <>
                {plan.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          {plan.id !== "gratis" && !isActive && !isPending && (
            <p
              className="text-center text-[11.5px] mt-3"
              style={{ color: C.creamFaint, fontFamily: bodyFont }}
            >
              Konfirmasi pembayaran dalam 1×24 jam
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Reveal delay={index * 0.04}>
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: C.border, background: open ? C.surfaceHover : "transparent" }}
      >
        <button
          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
          style={{ outlineColor: C.gold }}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span
            className="text-[14px] font-medium"
            style={{ color: open ? C.gold : C.cream, fontFamily: bodyFont }}
          >
            {q}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4" style={{ color: C.creamFaint }} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p
                className="px-5 pb-4 text-[13.5px] leading-relaxed"
                style={{ color: C.creamSoft, fontFamily: bodyFont }}
              >
                {a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

// ─── Subscription Status Banner ─────────────────────────────────────────────

function SubscriptionBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subData, setSubData] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    if (!user) { setLoadingSub(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false })
        .limit(1)
        .single();
      setSubData(data);
      setLoadingSub(false);
    };
    fetch();
  }, [user]);

  if (!user || loadingSub || !subData) return null;

  const isPending = subData.status === "pending";
  const isApproved = subData.status === "approved";
  const isRejected = subData.status === "rejected";
  const expiresAt = new Date(subData.expires_at);
  const now = new Date();
  const isExpired = expiresAt < now;
  const totalDays = subData.plan_id === "weekly" ? 7 : 30;
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const progressPct = Math.min(100, Math.max(0, (remainingDays / totalDays) * 100));
  const isExpiringSoon = isApproved && !isExpired && remainingDays <= 2;
  const planLabel = subData.plan_id === "weekly" ? "Premium Mingguan" : "Premium Bulanan";

  if (isRejected || (isApproved && isExpired)) return null;

  if (isPending) {
    return (
      <div className="rounded-2xl px-5 py-4 flex items-start gap-3 mb-8"
        style={{ background: "rgba(196,157,101,0.08)", border: `1px solid rgba(196,157,101,0.25)` }}>
        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.gold }} />
        <div>
          <p className="text-[13.5px] font-semibold" style={{ color: C.cream, fontFamily: bodyFont }}>
            Pembayaran sedang diverifikasi
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: C.creamSoft, fontFamily: bodyFont }}>
            Paket <strong style={{ color: C.gold }}>{planLabel}</strong> akan aktif setelah konfirmasi admin — biasanya 1×24 jam.
          </p>
        </div>
      </div>
    );
  }

  if (isApproved && !isExpired) {
    return (
      <div className="rounded-2xl p-5 mb-8 space-y-3"
        style={{ background: isExpiringSoon ? "rgba(239,68,68,0.07)" : "rgba(196,157,101,0.07)",
          border: `1px solid ${isExpiringSoon ? "rgba(239,68,68,0.3)" : "rgba(196,157,101,0.25)"}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" style={{ color: isExpiringSoon ? "#ef4444" : C.gold }} />
            <p className="text-[13.5px] font-semibold" style={{ color: C.cream, fontFamily: bodyFont }}>
              {planLabel} Aktif
            </p>
          </div>
          {isExpiringSoon && (
            <button
              onClick={() => navigate(`/checkout?plan=${subData.plan_id}`)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-opacity hover:opacity-80"
              style={{ background: C.gold, color: "#1B140D", fontFamily: bodyFont }}>
              <RefreshCw className="w-3 h-3" />
              Perpanjang
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-[11.5px] mb-1.5" style={{ fontFamily: bodyFont }}>
            <span style={{ color: C.creamFaint }}>
              {isExpiringSoon ? <span style={{ color: "#ef4444" }}>⚠ Berakhir dalam {remainingDays} hari</span> : `${remainingDays} dari ${totalDays} hari tersisa`}
            </span>
            <span style={{ color: C.creamFaint }}>Berakhir {expiresAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: isExpiringSoon ? "#ef4444" : `linear-gradient(90deg, ${C.gold}, rgba(196,157,101,0.6))` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main page ──────────────────────────────────────────────────────────────

export function PricingPage() {
  return (
    <div
      className="min-h-screen relative"
      style={{ background: C.bg, fontFamily: bodyFont }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <BatikBackground opacity={0.02} patternType="mega" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="pt-24 pb-14 text-center">
          <Reveal>
            <Eyebrow>Paket Berlangganan</Eyebrow>
            <h1
              className="text-[40px] md:text-[52px] font-semibold leading-[1.1] tracking-tight mb-5"
              style={{ color: C.cream, fontFamily: displayFont }}
            >
              Pilih ruang untuk
              <br />
              <span style={{ color: C.gold }}>karya batik Anda</span>
            </h1>
            <p
              className="text-[15.5px] leading-relaxed max-w-lg mx-auto mb-8"
              style={{ color: C.creamSoft }}
            >
              Mulai gratis, lalu berlangganan saat proyek Anda butuh lebih
              banyak ruang, revisi, dan fitur eksklusif.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex justify-center mb-2">
              <BatikRule className="w-40 h-4" />
            </div>
          </Reveal>
        </section>

        {/* ── Plan cards ───────────────────────────────────────────── */}
        <section className="pb-24">
          <SubscriptionBanner />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>
        </section>

        {/* ── Comparison table ─────────────────────────────────────── */}
        <section id="perbandingan" className="pb-24">
          <Reveal className="text-center mb-10">
            <Eyebrow>Detail Fitur</Eyebrow>
            <h2
              className="text-[26px] md:text-[30px] font-semibold"
              style={{ color: C.cream, fontFamily: displayFont }}
            >
              Perbandingan lengkap
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: C.border }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[520px]">
                  <thead>
                    <tr style={{ background: C.bgRaised }}>
                      <th
                        className="text-left px-5 py-4 text-[11px] font-semibold tracking-[0.12em] uppercase"
                        style={{ color: C.creamFaint }}
                      >
                        Fitur
                      </th>
                      {plans.map((p) => (
                        <th key={p.id} className="px-4 py-4 text-center">
                          <div
                            className="text-[13px] font-semibold"
                            style={{ color: C.cream, fontFamily: displayFont }}
                          >
                            {p.name}
                          </div>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: C.creamFaint }}
                          >
                            {p.price}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-t transition-colors"
                        style={{ borderColor: C.border }}
                      >
                        <td
                          className="px-5 py-3.5 text-[13.5px]"
                          style={{ color: C.creamSoft }}
                        >
                          {row.label}
                        </td>
                        {row.values.map((v, vi) => (
                          <td key={vi} className="px-4 py-3.5 text-center">
                            {v === false ? (
                              <X
                                className="w-4 h-4 inline-block"
                                style={{ color: C.creamFaint }}
                              />
                            ) : v === true ? (
                              <BadgeCheck
                                className="w-4 h-4 inline-block"
                                style={{ color: C.gold }}
                              />
                            ) : (
                              <span
                                className="text-[12.5px] font-medium"
                                style={{ color: C.gold }}
                              >
                                {v}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Testimonial ──────────────────────────────────────────── */}
        <section className="pb-24">
          <Reveal>
            <div
              className="rounded-2xl p-8 md:p-10 border"
              style={{ borderColor: C.border, background: C.surface }}
            >
              <div
                className="w-8 h-px mb-6"
                style={{ background: C.goldLine }}
              />
              <blockquote
                className="text-[18px] md:text-[20px] leading-relaxed mb-6 max-w-2xl"
                style={{ color: C.cream, fontFamily: displayFont, fontStyle: "italic" }}
              >
                "RekaBatik Premium mengubah cara saya berkreasi. Rekomendasi
                motifnya membuka arah yang tidak pernah saya pertimbangkan,
                dan ekspor resolusi tingginya sangat membantu presentasi ke
                klien."
              </blockquote>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold"
                  style={{ background: C.goldSoft, color: C.gold }}
                >
                  AR
                </div>
                <div>
                  <p className="text-[13.5px] font-medium" style={{ color: C.cream }}>
                    Arini Rahayu
                  </p>
                  <p className="text-[12px]" style={{ color: C.creamFaint }}>
                    Desainer Batik Kontemporer · Paket Bulanan
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="pb-24 max-w-2xl mx-auto">
          <Reveal className="text-center mb-9">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="w-3.5 h-3.5" style={{ color: C.gold }} />
              <span
                className="text-[11px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: C.creamSoft }}
              >
                Pertanyaan Umum
              </span>
            </div>
            <h2
              className="text-[26px] md:text-[30px] font-semibold"
              style={{ color: C.cream, fontFamily: displayFont }}
            >
              Yang sering ditanyakan
            </h2>
          </Reveal>

          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="pb-24">
          <Reveal>
            <div
              className="rounded-2xl p-10 md:p-14 text-center border"
              style={{ borderColor: C.borderStrong, background: C.bgRaised }}
            >
              <h2
                className="text-[28px] md:text-[34px] font-semibold mb-4"
                style={{ color: C.cream, fontFamily: displayFont }}
              >
                Mulai berkreasi hari ini
              </h2>
              <p
                className="text-[15px] leading-relaxed max-w-md mx-auto mb-8"
                style={{ color: C.creamSoft }}
              >
                Bergabunglah dengan desainer batik yang sudah mempercayai
                RekaBatik untuk mewujudkan karya mereka.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9">
                <Link to="/auth">
                  <button
                    className="px-7 py-3 rounded-xl font-semibold text-[13.5px] flex items-center gap-2 transition-transform duration-150 hover:-translate-y-px"
                    style={{ background: C.gold, color: "#1B140D" }}
                  >
                    Mulai gratis sekarang
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
                <Link to="/chat">
                  <button
                    className="px-7 py-3 rounded-xl font-semibold text-[13.5px] flex items-center gap-2 border transition-transform duration-150 hover:-translate-y-px"
                    style={{ borderColor: "rgba(242,234,217,0.2)", color: C.creamSoft }}
                  >
                    Hubungi kami
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6">
                {[
                  { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Pembayaran aman" },
                  { icon: <BadgeCheck className="w-3.5 h-3.5" />, label: "Garansi kepuasan" },
                  { icon: <Timer className="w-3.5 h-3.5" />, label: "Aktif instan" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.creamFaint }}
                  >
                    <span style={{ color: C.gold }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}