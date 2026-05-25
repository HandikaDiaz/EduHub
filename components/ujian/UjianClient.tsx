"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useUpgradeDialog } from "@/components/upgrade/useUpgradeDialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Clock,
  HelpCircle,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  BarChart3,
  ClipboardList,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDuration = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function UjianClient() {
  const data = useQuery(api.quiz.listUjianQuizzes);
  const { openUpgradeDialog } = useUpgradeDialog();

  if (data === undefined) return <UjianSkeleton />;
  if (!data) return null;

  const { quizzes, attemptHistory, stats, userTier } = data;
  const isFree = userTier === "free";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="dashboard-section">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-purple/10">
            <Trophy className="size-5 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Ujian Simulasi CPNS
            </h1>
            <p className="text-sm text-muted-foreground">
              Simulasi ujian CPNS dengan kondisi sesungguhnya.
            </p>
          </div>
        </div>
      </div>

      {/* ── Upgrade Banner (Free users) ── */}
      {isFree && (
        <div className="dashboard-section" style={{ animationDelay: "0.08s" }}>
          <Card className="border-brand-purple/20 bg-gradient-to-br from-purple-50 via-white to-sky-50 overflow-hidden">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                  <Lock className="size-6 text-brand-purple" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Fitur Khusus Pro
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ujian simulasi CPNS hanya tersedia untuk pengguna Pro.
                    Upgrade sekarang untuk akses penuh ke semua fitur!
                  </p>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-brand-purple to-purple-700 text-white shadow-md shadow-purple-200/50 shrink-0"
                onClick={openUpgradeDialog}
              >
                <Sparkles className="size-4 mr-1" />
                Upgrade ke Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Stats Summary (Pro users with history) ── */}
      {!isFree && stats.totalAttempts > 0 && (
        <div
          className="dashboard-section grid grid-cols-3 gap-4"
          style={{ animationDelay: "0.08s" }}
        >
          <Card className="shadow-sm border-0">
            <CardContent className="pt-1 space-y-1">
              <p className="text-xs text-muted-foreground">Total Ujian</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {stats.totalAttempts}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="pt-1 space-y-1">
              <p className="text-xs text-muted-foreground">Rata-rata</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {stats.avgScore}
                <span className="text-sm font-normal text-muted-foreground">
                  %
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="pt-1 space-y-1">
              <p className="text-xs text-muted-foreground">Lulus</p>
              <p className="text-2xl font-bold text-green-600 tabular-nums">
                {stats.passRate}
                <span className="text-sm font-normal text-muted-foreground">
                  %
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Available Exams ── */}
      <section
        className="dashboard-section"
        style={{ animationDelay: isFree ? "0.14s" : "0.12s" }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ujian Tersedia
        </h2>
        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <ClipboardList className="size-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-gray-900">
                  Belum ada ujian tersedia
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ujian simulasi akan segera hadir. Nantikan update!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {quizzes.map((quiz) => {
              const done = quiz.attemptCount > 0;
              const scoreClr =
                quiz.bestScore === null
                  ? ""
                  : quiz.bestScore >= 75
                    ? "text-green-600 bg-green-50"
                    : quiz.bestScore >= 50
                      ? "text-amber-600 bg-amber-50"
                      : "text-red-600 bg-red-50";

              return (
                <Card
                  key={quiz._id}
                  className={cn(
                    "overflow-hidden shadow-sm transition-shadow",
                    isFree ? "opacity-70" : "hover:shadow-md",
                  )}
                >
                  <div className="h-1.5 bg-gradient-to-r from-brand-purple to-purple-600" />
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[10px] mb-2">
                          {quiz.categoryName}
                        </Badge>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {quiz.moduleName}
                        </p>
                      </div>
                      {quiz.bestScore !== null && (
                        <Badge
                          className={cn(
                            "shrink-0 tabular-nums text-sm font-bold border-0",
                            scoreClr,
                          )}
                        >
                          {quiz.bestScore}%
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="size-3" />
                        {quiz.maxQuestions} soal
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {quiz.duration} menit
                      </span>
                      {done && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="size-3" />
                          {quiz.attemptCount}&times; dicoba
                        </span>
                      )}
                    </div>

                    {isFree ? (
                      <Button
                        size="sm"
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        <Lock className="size-3 mr-1" />
                        Khusus Pro
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-brand-purple to-purple-600 text-white shadow-sm"
                        render={<Link href={`/quiz/${quiz._id}`} />}
                      >
                        {done ? "Ulangi Ujian" : "Mulai Ujian"}
                        <ArrowRight className="size-3 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Attempt History ── */}
      {attemptHistory.length > 0 && !isFree && (
        <section
          className="dashboard-section"
          style={{ animationDelay: "0.18s" }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Riwayat Ujian
          </h2>
          <Card className="border-0 shadow-sm divide-y divide-border overflow-hidden">
            {attemptHistory.map((a) => {
              const scoreClr =
                a.score >= 75
                  ? "bg-green-50 text-green-700"
                  : a.score >= 50
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700";

              return (
                <div
                  key={a._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      a.isPassed ? "bg-green-50" : "bg-red-50",
                    )}
                  >
                    {a.isPassed ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.quizTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{a.categoryName}</span>
                      <span className="text-gray-300">&middot;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDuration(a.timeTaken)}
                      </span>
                      <span className="text-gray-300">&middot;</span>
                      <span>{formatRelativeTime(a.completedAt)}</span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 tabular-nums text-xs font-semibold border-0",
                      scoreClr,
                    )}
                  >
                    {a.score}%
                  </Badge>
                </div>
              );
            })}
          </Card>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function UjianSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
