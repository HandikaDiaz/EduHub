"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { Tilt3DCard } from "./Tilt3DCard";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { useUpgradeDialog } from "@/components/upgrade/useUpgradeDialog";
import {
  BookOpen,
  PenLine,
  TrendingUp,
  Play,
  Lock,
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { resolveCategoryIcon } from "@/lib/categoryIcon";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_STYLE: Record<
  string,
  { bg: string; text: string; iconBg: string; gradient: string; ring: string }
> = {
  TWK: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    iconBg: "bg-sky-100",
    gradient: "from-sky-400 to-sky-600",
    ring: "ring-sky-200",
  },
  TIU: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    iconBg: "bg-purple-100",
    gradient: "from-purple-400 to-purple-600",
    ring: "ring-purple-200",
  },
  TKP: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    iconBg: "bg-teal-100",
    gradient: "from-teal-400 to-teal-600",
    ring: "ring-teal-200",
  },
};

const getCategoryStyle = (name: string) => {
  const key = Object.keys(CATEGORY_STYLE).find((k) =>
    name.toUpperCase().includes(k),
  );
  return (
    CATEGORY_STYLE[key ?? ""] ?? {
      bg: "bg-gray-50",
      text: "text-gray-700",
      iconBg: "bg-gray-100",
      gradient: "from-gray-400 to-gray-600",
      ring: "ring-gray-200",
    }
  );
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
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  total,
  color,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  total?: number;
  color: string;
  delay: string;
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : 0;

  const hasProgress = total !== undefined && total > 0;

  return (
    <Tilt3DCard className="min-w-[180px] snap-center h-full">
      <Card
        className={cn(
          "relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow dashboard-section h-full",
        )}
        style={{ animationDelay: delay }}
      >
        <CardContent className="flex h-full flex-col gap-3 pt-1">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                color,
              )}
            >
              <Icon className="size-5 text-white" />
            </div>
            {/* Right slot — % atau placeholder agar tinggi header card konsisten. */}
            {total !== undefined ? (
              <span className="text-xs font-medium text-muted-foreground">
                {pct}%
              </span>
            ) : (
              <span className="text-xs font-medium text-transparent select-none">
                0%
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {value}
              {total !== undefined && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{total}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          {/* Progress bar — render placeholder transparan saat tidak ada `total`
              supaya semua StatCard punya tinggi identik di grid. */}
          {hasProgress ? (
            <Progress value={pct} className="gap-0">
              <ProgressTrack className="h-1.5">
                <ProgressIndicator
                  className={cn("rounded-full transition-all duration-1000", color)}
                />
              </ProgressTrack>
            </Progress>
          ) : (
            <div className="h-1.5" aria-hidden="true" />
          )}
        </CardContent>
      </Card>
    </Tilt3DCard>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DashboardContent() {
  const { user: clerkUser } = useUser();
  const data = useQuery(api.dashboard.getDashboardData);
  const { openUpgradeDialog } = useUpgradeDialog();

  if (data === undefined) return <DashboardSkeleton />;

  // User signed in but no Convex record yet — show welcome anyway
  const userName =
    data?.user?.name ??
    clerkUser?.firstName ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "there";
  const tier = data?.user?.tier ?? "free";
  const isAdmin = data?.user?.role === "admin";
  const trialUsed = data?.user?.trialUsed ?? false;
  // Trial sudah habis = sekarang tier "free" tapi sudah pernah pakai trial.
  const trialExpired = tier === "free" && trialUsed;

  return (
    <div className="-mx-6 -mt-6 space-y-8">
      {/* ================================================================= */}
      {/* 1. HEADER                                                         */}
      {/* ================================================================= */}
      <section className="dashboard-section relative overflow-hidden px-6 pt-8 pb-8 dashboard-mesh-bg">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-sky/[0.06] blur-2xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 size-48 rounded-full bg-brand-purple/[0.05] blur-2xl" />

        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Selamat Datang, {userName} <span className="inline-block animate-wave origin-[70%_70%]">&#128075;</span>
              </h1>
              <Badge
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  tier === "pro"
                    ? "bg-gradient-to-r from-purple-500 to-brand-purple text-white border-0"
                    : "bg-gray-100 text-gray-500 border-gray-200",
                )}
              >
                {tier}
              </Badge>
            </div>

            {/* Admin shortcut — hanya muncul kalau role admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-gradient-to-br from-slate-900 to-slate-800 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:from-slate-800 hover:to-slate-900 transition-all"
              >
                <Shield className="size-3.5" />
                Admin Panel
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Semangat belajar hari ini!
          </p>

          {/* Upgrade banner — variant berbeda untuk trial-habis vs belum pernah trial */}
          {tier === "free" &&
            (trialExpired ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Masa trial kamu sudah berakhir
                    </p>
                    <p className="text-xs text-amber-700/80 mt-0.5">
                      Upgrade ke Pro untuk lanjutkan akses semua fitur — Rp 199.000/tahun
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200/50 shrink-0"
                  onClick={openUpgradeDialog}
                >
                  Upgrade ke Pro
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-sky/20 bg-gradient-to-r from-sky-50 via-white to-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between upgrade-shimmer">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-brand-sky shrink-0" />
                  <p className="text-sm font-medium text-gray-700">
                    Coba Pro gratis 3 hari &mdash; akses semua materi &amp; ujian simulasi
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-brand-sky hover:bg-brand-sky/90 text-white shadow-sm shadow-sky-200/50 shrink-0"
                  onClick={openUpgradeDialog}
                >
                  Aktifkan Trial
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. PROGRESS OVERVIEW                                              */}
      {/* ================================================================= */}
      <section className="px-6">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:items-stretch sm:overflow-visible">
          <StatCard
            icon={BookOpen}
            label="Materi Selesai"
            value={data?.stats?.materiCompleted ?? 0}
            total={data?.stats?.materiTotal ?? 0}
            color="bg-brand-sky"
            delay="0.1s"
          />
          <StatCard
            icon={PenLine}
            label="Latihan Dikerjakan"
            value={data?.stats?.latihanDone ?? 0}
            color="bg-brand-purple"
            delay="0.15s"
          />
          <StatCard
            icon={TrendingUp}
            label="Rata-rata Nilai"
            value={data?.stats?.avgScore ?? 0}
            total={100}
            color="bg-teal-500"
            delay="0.2s"
          />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. CONTINUE LEARNING                                              */}
      {/* ================================================================= */}
      {data?.continueModule && (
        <section className="dashboard-section px-6" style={{ animationDelay: "0.25s" }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Lanjut Belajar
          </h2>
          <Tilt3DCard>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <Badge
                    className={cn(
                      "text-[10px] border-0",
                      getCategoryStyle(data.continueModule.categoryName).bg,
                      getCategoryStyle(data.continueModule.categoryName).text,
                    )}
                  >
                    {data.continueModule.categoryName}
                  </Badge>
                  <p className="text-base font-semibold text-gray-900">
                    {data.continueModule.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {data.continueModule.videoCompleted ? (
                        <CheckCircle2 className="size-3.5 text-green-500" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                      Video {data.continueModule.videoCompleted ? "selesai" : "belum"}
                    </span>
                    <span className="flex items-center gap-1">
                      <PenLine className="size-3.5" />
                      Quiz {data.continueModule.quizzesDone}/{data.continueModule.quizzesTotal}
                    </span>
                  </div>
                  <Progress
                    value={
                      data.continueModule.quizzesTotal > 0
                        ? Math.round(
                          ((data.continueModule.quizzesDone +
                            (data.continueModule.videoCompleted ? 1 : 0)) /
                            (data.continueModule.quizzesTotal + 1)) *
                          100,
                        )
                        : data.continueModule.videoCompleted
                          ? 100
                          : 0
                    }
                    className="gap-0"
                  >
                    <ProgressTrack className="h-1.5">
                      <ProgressIndicator className="bg-brand-sky rounded-full" />
                    </ProgressTrack>
                  </Progress>
                </div>
                <Button
                  className="bg-brand-sky hover:bg-brand-sky/90 text-white shadow-sm shadow-sky-200/50 shrink-0"
                  render={<Link href={`/materi/${data.continueModule.categorySlug}/${data.continueModule.slug}`} />}
                >
                  Lanjutkan
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </CardContent>
            </Card>
          </Tilt3DCard>
        </section>
      )}

      {/* ================================================================= */}
      {/* 4. CATEGORIES                                                     */}
      {/* ================================================================= */}
      <section className="dashboard-section px-6" style={{ animationDelay: "0.3s" }}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Kategori Materi CPNS
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(data?.categories ?? []).map((cat) => {
            const style = getCategoryStyle(cat.name);
            const pct =
              cat.totalModules > 0
                ? Math.round((cat.completedModules / cat.totalModules) * 100)
                : 0;

            return (
              <Tilt3DCard key={cat._id}>
                <Link href={`/materi#${cat.slug}`} className="block">
                  <Card
                    className={cn(
                      "group border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden relative",
                    )}
                  >
                    {/* Gradient top strip */}
                    <div
                      className={cn(
                        "h-1.5 w-full bg-gradient-to-r",
                        style.gradient,
                      )}
                    />
                    <CardContent className="flex flex-col gap-3 pt-2">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = resolveCategoryIcon(cat.icon);
                          return (
                            <div
                              className={cn(
                                "flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                                style.iconBg,
                              )}
                            >
                              <Icon className={cn("size-5", style.text)} />
                            </div>
                          );
                        })()}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {cat.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cat.completedModules}/{cat.totalModules} materi
                            selesai
                          </p>
                        </div>
                        <ArrowRight
                          className={cn(
                            "size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                            style.text,
                          )}
                        />
                      </div>
                      <Progress value={pct} className="gap-0">
                        <ProgressTrack className="h-1.5">
                          <ProgressIndicator
                            className={cn(
                              "rounded-full bg-gradient-to-r",
                              style.gradient,
                            )}
                          />
                        </ProgressTrack>
                      </Progress>
                    </CardContent>
                  </Card>
                </Link>
              </Tilt3DCard>
            );
          })}

          {/* Empty state if no categories seeded yet */}
          {(data?.categories ?? []).length === 0 && (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <BookOpen className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Materi belum tersedia. Nantikan update terbaru!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. RECENT ACTIVITY                                                */}
      {/* ================================================================= */}
      {(data?.recentActivity ?? []).length > 0 && (
        <section className="dashboard-section px-6" style={{ animationDelay: "0.35s" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Aktivitas Terakhir
            </h2>
            <Link
              href="/hasil"
              className="flex items-center gap-1 text-xs font-medium text-brand-sky hover:text-brand-sky/80 transition-colors"
            >
              Lihat Semua
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <Card className="border-0 shadow-sm divide-y divide-border overflow-hidden">
            {data!.recentActivity.map((act) => {
              const style = getCategoryStyle(act.categoryName);
              const scoreColor =
                act.score >= 75
                  ? "bg-green-50 text-green-700"
                  : act.score >= 50
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700";

              return (
                <Link
                  key={act._id}
                  href={`/quiz/${act.quizId}/result/${act._id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 group"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      style.iconBg,
                    )}
                  >
                    {act.type === "ujian" ? (
                      <Trophy className={cn("size-4", style.text)} />
                    ) : (
                      <PenLine className={cn("size-4", style.text)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-sky transition-colors">
                      {act.type === "ujian"
                        ? "Menyelesaikan Ujian"
                        : "Menyelesaikan Latihan"}{" "}
                      &mdash; {act.moduleName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{formatRelativeTime(act.completedAt)}</span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 tabular-nums text-xs font-semibold border-0",
                      scoreColor,
                    )}
                  >
                    {act.score}
                  </Badge>
                  <ArrowRight className="size-3.5 shrink-0 text-gray-300 group-hover:text-brand-sky transition-colors" />
                </Link>
              );
            })}
          </Card>
        </section>
      )}

      {/* ================================================================= */}
      {/* 6. QUICK ACCESS                                                   */}
      {/* ================================================================= */}
      <section className="dashboard-section px-6 pb-6" style={{ animationDelay: "0.4s" }}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Akses Cepat
        </h2>
        <div className="grid grid-cols-2 items-stretch gap-4">
          <Tilt3DCard className="h-full">
            <Button
              className="h-full w-full flex-col gap-2 rounded-xl bg-gradient-to-br from-brand-sky to-sky-600 py-5 text-white shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/40 transition-shadow"
              render={<Link href="/latihan" />}
            >
              <Zap className="size-6" />
              <span className="text-sm font-semibold">
                Latihan Soal Hari Ini
              </span>
              {/* Spacer transparan agar tinggi sejajar dengan tombol Ujian
                  Simulasi yang punya 3 baris (icon + label + badge). */}
              <span className="text-[10px] font-normal text-transparent select-none">
                &nbsp;
              </span>
            </Button>
          </Tilt3DCard>
          <Tilt3DCard className="h-full">
            {tier === "free" ? (
              <Button
                className="h-full w-full flex-col gap-2 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 py-5 text-white shadow-md shadow-gray-200/50 hover:from-brand-purple hover:to-purple-700 transition-all"
                onClick={openUpgradeDialog}
              >
                <div className="relative">
                  <Trophy className="size-6" />
                  <Lock className="absolute -right-1.5 -bottom-1 size-3.5 text-white/80" />
                </div>
                <span className="text-sm font-semibold">Ujian Simulasi</span>
                <span className="text-[10px] font-normal opacity-80">
                  Khusus Pro
                </span>
              </Button>
            ) : (
              <Button
                className="h-full w-full flex-col gap-2 rounded-xl bg-gradient-to-br from-brand-purple to-purple-700 py-5 text-white shadow-md shadow-purple-200/50 hover:shadow-lg hover:shadow-purple-300/40 transition-shadow"
                render={<Link href="/ujian" />}
              >
                <Trophy className="size-6" />
                <span className="text-sm font-semibold">Ujian Simulasi</span>
                <span className="text-[10px] font-normal text-transparent select-none">
                  &nbsp;
                </span>
              </Button>
            )}
          </Tilt3DCard>
        </div>
      </section>
    </div>
  );
}
