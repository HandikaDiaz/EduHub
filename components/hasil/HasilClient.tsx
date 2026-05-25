"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { resolveCategoryIcon } from "@/lib/categoryIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  PenLine,
  TrendingUp,
  Target,
  Timer,
  ChevronRight,
  BookOpen,
  Search,
  X,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CAT_STYLE: Record<
  string,
  { bg: string; text: string; gradient: string; iconBg: string; ring: string }
> = {
  TWK: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    gradient: "from-sky-500 to-sky-600",
    iconBg: "bg-sky-100",
    ring: "ring-sky-200",
  },
  TIU: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    gradient: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-100",
    ring: "ring-purple-200",
  },
  TKP: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    gradient: "from-teal-500 to-teal-600",
    iconBg: "bg-teal-100",
    ring: "ring-teal-200",
  },
};

const getStyle = (name: string) => {
  const key = Object.keys(CAT_STYLE).find((k) =>
    name.toUpperCase().includes(k),
  );
  return (
    CAT_STYLE[key ?? ""] ?? {
      bg: "bg-gray-50",
      text: "text-gray-700",
      gradient: "from-gray-400 to-gray-500",
      iconBg: "bg-gray-100",
      ring: "ring-gray-200",
    }
  );
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
};

const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} mnt lalu`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function HasilClient() {
  const data = useQuery(api.results.getMyResults);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "latihan" | "ujian">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const history = data?.history;

  // Filtered + searched history (memoized — runs on every render without deps bloat)
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    const q = search.trim().toLowerCase();
    return history.filter((a) => {
      if (filter !== "all" && a.quizType !== filter) return false;
      if (!q) return true;
      return (
        a.quizTitle.toLowerCase().includes(q) ||
        a.moduleName.toLowerCase().includes(q) ||
        a.categoryName.toLowerCase().includes(q)
      );
    });
  }, [history, search, filter]);

  if (data === undefined) return <HasilSkeleton />;
  if (!data) return null;

  const { stats, categoryStats, scoreTrend } = data;
  const hasData = stats.totalAttempts > 0;
  const displayedHistory = filteredHistory.slice(0, visibleCount);
  const hasMore = visibleCount < filteredHistory.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="dashboard-section">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/10">
            <BarChart3 className="size-5 text-brand-sky" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Hasil Saya
            </h1>
            <p className="text-sm text-muted-foreground">
              Pantau perkembangan belajar CPNS kamu.
            </p>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasData && (
        <Card
          className="border-dashed dashboard-section"
          style={{ animationDelay: "0.08s" }}
        >
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BarChart3 className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-gray-900">Belum ada hasil</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mulai kerjakan latihan atau ujian untuk melihat statistikmu di
                sini.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* ── Overall Stats ── */}
          <div
            className="dashboard-section grid grid-cols-2 gap-3 sm:grid-cols-4"
            style={{ animationDelay: "0.08s" }}
          >
            <StatMiniCard
              icon={PenLine}
              label="Total Dikerjakan"
              value={String(stats.totalAttempts)}
              color="bg-brand-sky"
            />
            <StatMiniCard
              icon={TrendingUp}
              label="Rata-rata Nilai"
              value={`${stats.avgScore}%`}
              color="bg-brand-purple"
            />
            <StatMiniCard
              icon={Target}
              label="Tingkat Lulus"
              value={`${stats.passRate}%`}
              color="bg-green-500"
            />
            <StatMiniCard
              icon={Timer}
              label="Total Waktu"
              value={formatDuration(stats.totalTimeSec)}
              color="bg-teal-500"
            />
          </div>

          {/* ── Score Trend (mini sparkline via bar chart) ── */}
          {scoreTrend.length >= 3 && (
            <section
              className="dashboard-section"
              style={{ animationDelay: "0.12s" }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tren Nilai
              </h2>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="pt-3">
                  <div className="flex items-end gap-[3px] h-28">
                    {scoreTrend.map((point, i) => {
                      const height = `${Math.max(point.score, 5)}%`;
                      const style = getStyle(point.categoryName);
                      return (
                        <div
                          key={i}
                          className="group relative flex-1 flex flex-col justify-end"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center z-10">
                            <span className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                              {point.score}%
                            </span>
                          </div>
                          <div
                            className={cn(
                              "w-full rounded-t transition-all duration-300 bg-gradient-to-t",
                              point.isPassed
                                ? style.gradient
                                : "from-red-300 to-red-400",
                              "opacity-80 hover:opacity-100",
                            )}
                            style={{ height }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Passing line */}
                  <div className="relative -mt-[70%] mb-[70%] pointer-events-none">
                    <div className="absolute w-full border-t border-dashed border-green-400/60" />
                    <span className="absolute -top-3 right-0 text-[9px] text-green-500 font-medium">
                      70%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    {scoreTrend.length} percobaan terakhir
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Category Breakdown ── */}
          <section
            className="dashboard-section"
            style={{ animationDelay: "0.16s" }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Performa per Kategori
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {categoryStats.map((cat) => {
                const style = getStyle(cat.name);
                const hasAttempts = cat.attempts > 0;

                return (
                  <Card
                    key={cat._id}
                    className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className={cn("h-1.5 bg-gradient-to-r", style.gradient)}
                    />
                    <CardContent className="pt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = resolveCategoryIcon(cat.icon);
                          return (
                            <Icon className={cn("size-5", style.text)} />
                          );
                        })()}
                        <h3 className="font-semibold text-gray-900">
                          {cat.name}
                        </h3>
                      </div>

                      {!hasAttempts ? (
                        <p className="text-xs text-muted-foreground">
                          Belum ada percobaan
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-gray-900 tabular-nums">
                                {cat.avgScore}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Rata-rata
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900 tabular-nums">
                                {cat.bestScore}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Terbaik
                              </p>
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-lg font-bold tabular-nums",
                                  cat.passRate >= 70
                                    ? "text-green-600"
                                    : "text-amber-600",
                                )}
                              >
                                {cat.passRate}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Lulus
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-muted-foreground">
                                Rata-rata
                              </span>
                              <span className="font-medium tabular-nums">
                                {cat.avgScore}%
                              </span>
                            </div>
                            <Progress value={cat.avgScore} className="gap-0">
                              <ProgressTrack className="h-1.5">
                                <ProgressIndicator
                                  className={cn(
                                    "rounded-full bg-gradient-to-r",
                                    style.gradient,
                                  )}
                                />
                              </ProgressTrack>
                            </Progress>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {cat.attempts} percobaan &middot; {cat.passCount}{" "}
                            lulus
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {categoryStats.length === 0 && (
                <Card className="col-span-full border-dashed">
                  <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <BookOpen className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Kategori belum tersedia.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* ── Full History ── */}
          <section
            className="dashboard-section"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Riwayat Lengkap
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredHistory.length})
                </span>
              </h2>

              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Cari judul, modul, kategori..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Hapus pencarian"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Type filter chips */}
            <div className="flex gap-2 mb-4">
              {(
                [
                  { key: "all", label: "Semua" },
                  { key: "latihan", label: "Latihan" },
                  { key: "ujian", label: "Ujian" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => {
                    setFilter(chip.key);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === chip.key
                      ? "bg-brand-sky text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <Card className="border-0 shadow-sm divide-y divide-border overflow-hidden">
              {displayedHistory.map((a) => {
                const style = getStyle(a.categoryName);
                const scoreClr =
                  a.score >= 75
                    ? "bg-green-50 text-green-700"
                    : a.score >= 50
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700";

                return (
                  <Link
                    key={a._id}
                    href={`/quiz/${a.quizId}/result/${a._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Icon */}
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

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-sky transition-colors">
                          {a.quizTitle}
                        </p>
                        <Badge
                          className={cn(
                            "text-[9px] border-0 shrink-0",
                            a.quizType === "ujian"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-sky-50 text-sky-600",
                          )}
                        >
                          {a.quizType === "ujian" ? "Ujian" : "Latihan"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                        <Badge
                          className={cn(
                            "text-[9px] border-0 px-1.5",
                            style.bg,
                            style.text,
                          )}
                        >
                          {a.categoryName}
                        </Badge>
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 className="size-2.5 text-green-500" />
                          {a.totalCorrect}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <XCircle className="size-2.5 text-red-400" />
                          {a.totalWrong}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="size-2.5" />
                          {formatDuration(a.timeTaken)}
                        </span>
                        <span className="text-gray-300">&middot;</span>
                        <span>{formatRelativeTime(a.completedAt)}</span>
                      </div>
                    </div>

                    {/* Score + chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        className={cn(
                          "tabular-nums text-xs font-semibold border-0",
                          scoreClr,
                        )}
                      >
                        {a.score}%
                      </Badge>
                      <ChevronRight className="size-4 text-gray-300 group-hover:text-brand-sky transition-colors" />
                    </div>
                  </Link>
                );
              })}

              {filteredHistory.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    {search || filter !== "all"
                      ? "Tidak ada hasil yang cocok dengan pencarian."
                      : "Belum ada riwayat."}
                  </p>
                  {(search || filter !== "all") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setFilter("all");
                        setVisibleCount(PAGE_SIZE);
                      }}
                      className="mt-2 text-xs font-medium text-brand-sky hover:text-brand-sky/80"
                    >
                      Reset filter
                    </button>
                  )}
                </div>
              )}
            </Card>

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() =>
                  setVisibleCount((v) =>
                    Math.min(v + PAGE_SIZE, filteredHistory.length),
                  )
                }
                className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-brand-sky hover:bg-sky-50 hover:border-brand-sky/30 transition-colors shadow-sm"
              >
                <Plus className="size-4" />
                Muat {Math.min(PAGE_SIZE, filteredHistory.length - visibleCount)}{" "}
                lagi
                <span className="text-xs text-muted-foreground ml-1">
                  ({visibleCount} dari {filteredHistory.length})
                </span>
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatMiniCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BarChart3;
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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function HasilSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
