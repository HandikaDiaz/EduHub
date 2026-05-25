"use client";

import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Gift,
  Lock,
  Shield,
  Sparkles,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { captureConvexError } from "@/lib/sentry";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface UpgradeDialogContextValue {
  openUpgradeDialog: () => void;
}

export const UpgradeDialogContext = createContext<UpgradeDialogContextValue>({
  openUpgradeDialog: () => {},
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const proFeatures = [
  "Akses SEMUA materi TWK, TIU, TKP",
  "Latihan soal tidak terbatas",
  "Ujian simulasi CPNS lengkap",
  "Video pembahasan semua soal",
  "Progress tracking lengkap",
  "Materi terbaru & update rutin",
  "Prioritas dukungan belajar",
];

const paymentMethods = [
  { emoji: "🏦", label: "Transfer Bank" },
  { emoji: "📱", label: "QRIS" },
  { emoji: "💚", label: "GoPay" },
  { emoji: "💜", label: "OVO" },
  { emoji: "💙", label: "DANA" },
  { emoji: "💳", label: "Kartu Kredit" },
];

// Returns "X hari Y jam" or "X jam Y menit" based on magnitude.
const formatRemaining = (expiresAt: number): string => {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "habis";
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) {
    const remainHours = hours - days * 24;
    return `${days} hari${remainHours > 0 ? ` ${remainHours} jam` : ""}`;
  }
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours} jam${minutes > 0 ? ` ${minutes} mnt` : ""}`;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UpgradeDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const openUpgradeDialog = useCallback(() => {
    setPaid(false);
    setOpen(true);
  }, []);

  const handleBeforeSnap = useCallback(() => {
    setOpen(false);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setPaid(true);
    setOpen(true);
  }, []);

  const handleSnapClose = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <UpgradeDialogContext.Provider value={{ openUpgradeDialog }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        {/*
          Scroll fix: DialogContent uses flex-col + max-h-[90dvh]. Header is
          shrink-0; body grows + scrolls (overflow-y-auto on inner section).
          The previous nested overflow-y-auto + overflow-hidden on the same
          element clipped scrolling on desktop and mobile.
        */}
        <DialogContent className="max-w-md p-0 rounded-3xl border-0 shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col gap-0 overflow-hidden">
          {paid ? (
            <PaymentSuccessView onClose={() => setOpen(false)} />
          ) : (
            <UpgradeView
              onBeforeSnap={handleBeforeSnap}
              onPaymentSuccess={handlePaymentSuccess}
              onSnapClose={handleSnapClose}
              onTrialActivated={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Dialog content — upgrade offer (3 variants based on trial state)
// ---------------------------------------------------------------------------

function UpgradeView({
  onBeforeSnap,
  onPaymentSuccess,
  onSnapClose,
  onTrialActivated,
}: {
  onBeforeSnap: () => void;
  onPaymentSuccess: () => void;
  onSnapClose: () => void;
  onTrialActivated: () => void;
}) {
  const profile = useQuery(api.users.getMyProfile);

  // Loading state: tampilkan skeleton sampai profile siap. Mencegah flicker
  // dialog "fresh" → "expired" saat user dengan trialUsed=true membuka.
  if (profile === undefined) {
    return <UpgradeViewSkeleton />;
  }

  const user = profile?.user;
  const isOnTrial = user?.tier === "trial";
  const trialUsed = user?.trialUsed ?? false;
  const trialExpiredAt = user?.trialExpiredAt ?? null;

  // Variant selection:
  //   "fresh"   — belum pernah trial → tampilkan tombol Aktifkan Trial GRATIS
  //   "active"  — sedang trial       → countdown + CheckoutButton (bayar Pro)
  //   "expired" — trial sudah habis  → banner peringatan + CheckoutButton
  const variant: "fresh" | "active" | "expired" = isOnTrial
    ? "active"
    : trialUsed
      ? "expired"
      : "fresh";

  return (
    <>
      <div className="shrink-0">
        <Header variant={variant} trialExpiredAt={trialExpiredAt} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {variant === "expired" && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Masa trial kamu sudah berakhir. Upgrade ke Pro untuk melanjutkan
              akses semua fitur.
            </p>
          </div>
        )}

        <ul className="space-y-2.5 mb-5">
          {proFeatures.map((feat) => (
            <li key={feat} className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </span>
              <span className="text-sm text-slate-700 font-medium">{feat}</span>
            </li>
          ))}
        </ul>

        {/* Payment methods (sembunyikan pada fresh — belum ada pembayaran) */}
        {variant !== "fresh" && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {paymentMethods.map((pm) => (
              <span
                key={pm.label}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
              >
                {pm.emoji} {pm.label}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {variant === "fresh" ? (
          <TrialActivationButton onActivated={onTrialActivated} />
        ) : (
          <CheckoutButton
            plan="pro"
            amount={199000}
            label={
              variant === "expired"
                ? "Upgrade ke Pro Sekarang"
                : "Lanjutkan ke Pro"
            }
            onBeforeSnap={onBeforeSnap}
            onPaymentSuccess={onPaymentSuccess}
            onSnapClose={onSnapClose}
          />
        )}

        <div className="flex items-center justify-center gap-1.5 mt-3 text-slate-400 text-xs">
          <Lock className="w-3 h-3 text-emerald-500" />
          {variant === "fresh"
            ? "Tanpa kartu kredit, bisa dibatalkan kapan saja"
            : "Pembayaran aman & terenkripsi"}
          <Shield className="w-3 h-3 text-emerald-500" />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Trial activation button — fresh variant only
// ---------------------------------------------------------------------------

function TrialActivationButton({ onActivated }: { onActivated: () => void }) {
  const triggerTrial = useMutation(api.transactions.triggerMyTrial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await triggerTrial();
      onActivated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengaktifkan trial";
      setError(msg);
      captureConvexError(err, { mutation: "transactions.triggerMyTrial" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="group/btn flex items-center justify-center gap-2 w-full py-4 text-sm font-bold rounded-2xl bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-300/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengaktifkan...
          </>
        ) : (
          <>
            <Gift className="w-4 h-4" />
            Aktifkan Trial 3 Hari Gratis
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <p className="text-[11px] text-slate-400 text-center pt-1">
        Akses penuh selama 3 hari · setelahnya kembali ke Free
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header — varies by trial state
// ---------------------------------------------------------------------------

function Header({
  variant,
  trialExpiredAt,
}: {
  variant: "fresh" | "active" | "expired";
  trialExpiredAt: number | null;
}) {
  const config = {
    fresh: {
      gradient: "from-purple-600 via-violet-600 to-purple-700",
      badge: (
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl">
          <Gift className="w-3.5 h-3.5" />
          COBA GRATIS 3 HARI
        </div>
      ),
      title: "Coba EduHub Pro Gratis",
      subtitle: "Aktifkan trial 3 hari — akses semua fitur tanpa bayar",
      priceNote: "Setelah trial: Rp 199.000/tahun (opsional)",
      showPrice: false,
    },
    active: {
      gradient: "from-sky-600 via-brand-sky to-blue-700",
      badge: (
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5" />
          TRIAL AKTIF
          {trialExpiredAt && (
            <span className="ml-1 opacity-90">
              • sisa {formatRemaining(trialExpiredAt)}
            </span>
          )}
        </div>
      ),
      title: "Lanjutkan ke Pro",
      subtitle: "Jangan tunggu trial habis — amankan akses penuh sekarang",
      priceNote: "Bayar sekarang, akses Pro aktif 1 tahun penuh",
      showPrice: true,
    },
    expired: {
      gradient: "from-slate-700 via-slate-800 to-slate-900",
      badge: (
        <div className="inline-flex items-center gap-1.5 bg-amber-400/90 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-xl">
          <Sparkles className="w-3.5 h-3.5" />
          EDUHUB PRO
        </div>
      ),
      title: "Upgrade ke Pro",
      subtitle: "Buka akses semua fitur dan lanjutkan persiapan CPNS-mu",
      priceNote: "Langganan 1 tahun — akses tanpa batas",
      showPrice: true,
    },
  }[variant];

  return (
    <div className={`bg-gradient-to-br ${config.gradient} px-6 pt-6 pb-7 text-white`}>
      <DialogHeader>
        <div className="flex items-center justify-between mb-3">
          {config.badge}
        </div>
        <DialogTitle className="text-2xl font-black text-white leading-tight">
          {config.title}
        </DialogTitle>
        <p className="text-white/75 text-sm mt-1">{config.subtitle}</p>
      </DialogHeader>

      {config.showPrice ? (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black">Rp 199.000</span>
            <span className="text-white/70 text-sm font-medium">/tahun</span>
          </div>
          <p className="text-white/60 text-xs mt-1">{config.priceNote}</p>
        </>
      ) : (
        <p className="text-white/70 text-xs mt-3">{config.priceNote}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialog content — payment success
// ---------------------------------------------------------------------------

function PaymentSuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 py-10 text-center flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900">Pembayaran Berhasil!</h3>
        <p className="text-slate-500 text-sm mt-1">
          Akun kamu telah diupgrade ke EduHub Pro. Selamat belajar!
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full py-3 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-300/50 hover:-translate-y-0.5 transition-all duration-200"
      >
        Mulai Belajar
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton — render saat profile masih loading (anti-flicker)
// ---------------------------------------------------------------------------

/**
 * Loading state untuk UpgradeView. Sengaja TIDAK memakai gradient header dari
 * variant manapun (fresh/active/expired) supaya user tidak salah baca status
 * akun sebelum data tiba. Sebagai gantinya, fokus pada spinner sentral + label
 * "Memuat status akun" yang netral.
 */
function UpgradeViewSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      {/* Spinner ring — gradient halus, tidak mendominasi */}
      <div className="relative">
        <div className="size-16 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 size-16 rounded-full border-4 border-transparent border-t-violet-400 border-r-violet-300 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="size-5 text-violet-400" />
        </div>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate-700">
          Memuat status akun
        </p>
        <p className="text-xs text-slate-400">
          Sebentar, kami sedang menyiapkan info trial &amp; paket Pro untukmu…
        </p>
      </div>

      {/* Hint shimmer — 3 baris pendek netral, biar punya rhythm visual */}
      <div className="w-full max-w-[220px] space-y-2 pt-2">
        <div className="h-2 rounded-full bg-slate-100 animate-pulse" />
        <div className="h-2 rounded-full bg-slate-100 animate-pulse w-4/5 mx-auto" />
        <div className="h-2 rounded-full bg-slate-100 animate-pulse w-3/5 mx-auto" />
      </div>
    </div>
  );
}
