"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useUpgradeDialog } from "@/components/upgrade/useUpgradeDialog";
import { cn } from "@/lib/utils";
import { captureClientError } from "@/lib/sentry";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import {
  UserCircle,
  Mail,
  Shield,
  Crown,
  Clock,
  BookOpen,
  PenLine,
  TrendingUp,
  Timer,
  ArrowRight,
  Sparkles,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const TIER_CONFIG = {
  free: {
    label: "Free",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: UserCircle,
  },
  trial: {
    label: "Trial",
    color: "bg-sky-50 text-sky-600 border-sky-200",
    icon: Clock,
  },
  pro: {
    label: "Pro",
    color:
      "bg-gradient-to-r from-purple-500 to-brand-purple text-white border-0",
    icon: Crown,
  },
};

type TxStatusKey = "success" | "pending" | "failed" | "expired";

const TX_STATUS: Record<
  TxStatusKey,
  {
    label: string;
    /** Box icon (kiri row) — gradient untuk visual prominence */
    iconBg: string;
    iconColor: string;
    /** Badge status di sebelah amount */
    badgeBg: string;
    badgeText: string;
    /** Border kiri untuk row sebagai marker visual */
    rowAccent: string;
    /** Hover state row */
    rowHover: string;
    /** Tone deskripsi singkat di bawah amount */
    helperText: string;
    /** Pesan helper di bawah meta */
    helperMessage?: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    label: "Berhasil",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    iconColor: "text-white",
    badgeBg: "bg-emerald-50 ring-1 ring-emerald-200",
    badgeText: "text-emerald-700",
    rowAccent: "border-l-emerald-400",
    rowHover: "hover:bg-emerald-50/40",
    helperText: "text-emerald-600",
    helperMessage: "Pembayaran lunas, akses Pro aktif.",
    icon: CheckCircle2,
  },
  pending: {
    label: "Menunggu Pembayaran",
    iconBg: "bg-gradient-to-br from-amber-300 to-orange-400",
    iconColor: "text-white",
    badgeBg: "bg-amber-50 ring-1 ring-amber-200",
    badgeText: "text-amber-700",
    rowAccent: "border-l-amber-400",
    rowHover: "hover:bg-amber-50/50",
    helperText: "text-amber-600",
    helperMessage: "Selesaikan pembayaran sebelum expired.",
    icon: Clock,
  },
  failed: {
    label: "Gagal",
    iconBg: "bg-gradient-to-br from-rose-400 to-red-500",
    iconColor: "text-white",
    badgeBg: "bg-rose-50 ring-1 ring-rose-200",
    badgeText: "text-rose-700",
    rowAccent: "border-l-rose-400",
    rowHover: "hover:bg-rose-50/40",
    helperText: "text-rose-600",
    helperMessage: "Pembayaran gagal — silakan coba transaksi baru.",
    icon: XCircle,
  },
  expired: {
    label: "Kedaluwarsa",
    iconBg: "bg-gradient-to-br from-slate-400 to-slate-500",
    iconColor: "text-white",
    badgeBg: "bg-slate-100 ring-1 ring-slate-200",
    badgeText: "text-slate-600",
    rowAccent: "border-l-slate-300",
    rowHover: "hover:bg-slate-50/60",
    helperText: "text-slate-500",
    helperMessage: "Waktu pembayaran habis. Buat transaksi baru.",
    icon: AlertCircle,
  },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function ProfilClient() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const data = useQuery(api.users.getMyProfile);
  const { openUpgradeDialog } = useUpgradeDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ redirectUrl: "/" });
  };

  if (data === undefined) return <ProfilSkeleton />;
  if (!data) return null;

  const { user, stats, transactions } = data;
  const tierCfg = TIER_CONFIG[user.tier];
  const TierIcon = tierCfg.icon;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const materiPct =
    stats.materiTotal > 0
      ? Math.round((stats.materiCompleted / stats.materiTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="dashboard-section">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-purple/10">
            <UserCircle className="size-5 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Profil Saya
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola akun dan lihat ringkasan belajarmu.
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <Card
        className="overflow-hidden shadow-sm dashboard-section"
        style={{ animationDelay: "0.08s" }}
      >
        {/* Gradient banner */}
        <div className="h-20 bg-gradient-to-r from-brand-sky via-brand-purple to-purple-600 relative">
          <div className="absolute -bottom-10 left-6">
            <Avatar className="size-20 border-4 border-white shadow-md">
              <AvatarImage
                src={clerkUser?.imageUrl}
                alt={user.name}
              />
              <AvatarFallback className="bg-brand-sky text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="pt-14 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <Badge className={cn("text-[10px] uppercase tracking-wider", tierCfg.color)}>
                  <TierIcon className="size-3 mr-0.5" />
                  {tierCfg.label}
                </Badge>
                {user.role === "admin" && (
                  <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] gap-0.5">
                    <Shield className="size-2.5" />
                    Admin
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Bergabung {formatDate(user.createdAt)}
                </span>
              </div>

              {/* Tier expiry info */}
              {user.tier === "trial" && user.trialExpiredAt && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="size-3" />
                  Trial berakhir {formatDate(user.trialExpiredAt)}
                </p>
              )}
              {user.tier === "pro" && user.proExpiredAt && (
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Crown className="size-3" />
                  Pro aktif hingga {formatDate(user.proExpiredAt)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              {user.tier === "free" && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-brand-purple to-purple-600 text-white shadow-sm"
                  onClick={openUpgradeDialog}
                >
                  <Sparkles className="size-3.5 mr-1" />
                  Upgrade Pro
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={handleSignOut}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                ) : (
                  <LogOut className="size-3.5 mr-1" />
                )}
                {isLoggingOut ? "Keluar..." : "Keluar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Learning Stats ── */}
      <section
        className="dashboard-section"
        style={{ animationDelay: "0.12s" }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ringkasan Belajar
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Materi Selesai"
            value={`${stats.materiCompleted}/${stats.materiTotal}`}
            color="bg-brand-sky"
          />
          <StatCard
            icon={PenLine}
            label="Quiz Dikerjakan"
            value={String(stats.quizzesDone)}
            color="bg-brand-purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Rata-rata Nilai"
            value={stats.quizzesDone > 0 ? `${stats.avgScore}%` : "—"}
            color="bg-green-500"
          />
          <StatCard
            icon={Timer}
            label="Total Waktu"
            value={stats.totalTimeSec > 0 ? formatDuration(stats.totalTimeSec) : "—"}
            color="bg-teal-500"
          />
        </div>

        {/* Material progress bar */}
        {stats.materiTotal > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress Materi</span>
              <span className="font-medium tabular-nums">{materiPct}%</span>
            </div>
            <Progress value={materiPct} className="gap-0">
              <ProgressTrack className="h-2">
                <ProgressIndicator className="rounded-full bg-gradient-to-r from-brand-sky to-brand-purple" />
              </ProgressTrack>
            </Progress>
          </div>
        )}
      </section>

      {/* ── Transactions ── */}
      {transactions.length > 0 && (
        <section
          className="dashboard-section"
          style={{ animationDelay: "0.16s" }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Riwayat Transaksi
          </h2>
          <Card className="border-0 shadow-sm divide-y divide-border overflow-hidden">
            {transactions.map((tx) => (
              <TransactionRow key={tx._id} tx={tx} />
            ))}
          </Card>
        </section>
      )}

      {/* ── Quick Links ── */}
      <section
        className="dashboard-section"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Akses Cepat
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickLink
            href="/hasil"
            icon={TrendingUp}
            label="Lihat Hasil Lengkap"
            desc="Statistik, tren nilai, dan riwayat"
            color="bg-brand-sky"
          />
          <QuickLink
            href="/materi"
            icon={BookOpen}
            label="Lanjutkan Belajar"
            desc="Materi, video, dan latihan soal"
            color="bg-brand-purple"
          />
        </div>
      </section>

      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-red-500 mb-3" />
          <p className="text-sm font-semibold text-slate-700 animate-pulse">Sedang keluar...</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 py-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-white",
            color,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900 tabular-nums truncate">
            {value}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
  color,
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
  desc: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="group border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
        <CardContent className="flex items-center gap-3 py-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110",
              color,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Transaction row — pending becomes clickable (resume Snap payment)
// ---------------------------------------------------------------------------

interface TxRowProps {
  tx: {
    _id: string;
    amount: number;
    status: "pending" | "success" | "failed" | "expired";
    paymentMethod: string | null;
    createdAt: number;
    paidAt: number | null;
    midtransOrderId: string;
    snapToken: string | null;
  };
}

function TransactionRow({ tx }: TxRowProps) {
  const statusCfg = TX_STATUS[tx.status] ?? TX_STATUS.pending;
  const StatusIcon = statusCfg.icon;
  const confirmTransaction = useAction(api.transactions.confirmMyTransaction);

  const [resuming, setResuming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const isPending = tx.status === "pending" && !!tx.snapToken;
  const canVerify = tx.status === "pending"; // walau snapToken null, tetap bisa verify

  // Resume Snap untuk pending tx
  const handleResume = () => {
    if (!isPending || !tx.snapToken) return;
    if (typeof window === "undefined" || !window.snap) {
      alert("Snap belum siap. Mohon refresh halaman lalu coba lagi.");
      return;
    }
    setResuming(true);
    setVerifyMessage(null);
    try {
      window.snap.pay(tx.snapToken, {
        onSuccess: async () => {
          setResuming(false);
          // Setelah Snap berhasil, langsung verify supaya tier auto-update.
          try {
            await confirmTransaction({ orderId: tx.midtransOrderId });
          } catch (err) {
            captureClientError(err, {
              component: "TransactionRow",
              phase: "auto-verify-after-snap",
              txId: tx._id,
            });
          }
        },
        onPending: () => setResuming(false),
        onError: (result) => {
          setResuming(false);
          captureClientError(new Error("Snap pay onError"), {
            component: "TransactionRow",
            txId: tx._id,
            result,
          });
        },
        onClose: () => setResuming(false),
      });
    } catch (err) {
      setResuming(false);
      captureClientError(err, {
        component: "TransactionRow",
        txId: tx._id,
      });
    }
  };

  // Verifikasi manual ke Midtrans Status API — handle skenario settlement async
  const handleVerify = async () => {
    if (!canVerify || verifying) return;
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const result = await confirmTransaction({ orderId: tx.midtransOrderId });
      if (result.confirmed) {
        setVerifyMessage("Pembayaran terkonfirmasi. Tier kamu sudah aktif.");
      } else {
        setVerifyMessage(`Status di Midtrans: ${result.status}`);
      }
    } catch (err) {
      captureClientError(err, {
        component: "TransactionRow",
        phase: "manual-verify",
        txId: tx._id,
      });
      setVerifyMessage("Gagal cek status. Coba lagi sebentar.");
    } finally {
      setVerifying(false);
    }
  };

  const dateLabel =
    tx.status === "success" && tx.paidAt
      ? `Lunas ${formatDate(tx.paidAt)}`
      : formatDate(tx.createdAt);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-l-2 px-4 py-3 transition-colors sm:flex-row sm:items-center",
        statusCfg.rowAccent,
        statusCfg.rowHover,
      )}
    >
      {/* ---- Icon + Amount + Meta ---- */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
            statusCfg.iconBg,
          )}
        >
          <StatusIcon className={cn("size-5", statusCfg.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 tabular-nums">
              {formatCurrency(tx.amount)}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                statusCfg.badgeBg,
                statusCfg.badgeText,
              )}
            >
              <StatusIcon className="size-3" />
              {statusCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
            {tx.paymentMethod && (
              <>
                <span className="inline-flex items-center gap-1">
                  <Wallet className="size-3" />
                  {tx.paymentMethod}
                </span>
                <span className="text-gray-300">&middot;</span>
              </>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {dateLabel}
            </span>
          </div>

          {statusCfg.helperMessage && (
            <p className={cn("text-[11px] mt-1", statusCfg.helperText)}>
              {statusCfg.helperMessage}
            </p>
          )}

          {verifyMessage && (
            <p className="text-[11px] mt-1 text-slate-600 italic">
              {verifyMessage}
            </p>
          )}
        </div>
      </div>

      {/* ---- Actions ---- */}
      {tx.status === "pending" && (
        <div className="flex items-center gap-2 sm:shrink-0 sm:ml-2">
          {canVerify && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleVerify}
              disabled={verifying}
              className="h-8 gap-1 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              {verifying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              <span className="hidden sm:inline">Cek Status</span>
            </Button>
          )}
          {isPending && (
            <Button
              size="sm"
              onClick={handleResume}
              disabled={resuming}
              className="h-8 gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {resuming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowRight className="size-3.5" />
              )}
              Bayar Sekarang
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProfilSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Card className="overflow-hidden">
        <Skeleton className="h-20 w-full" />
        <CardContent className="pt-14 space-y-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
