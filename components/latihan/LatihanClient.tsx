"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { resolveCategoryIcon } from "@/lib/categoryIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PenLine,
  Clock,
  HelpCircle,
  Lock,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Search,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Style map
// ---------------------------------------------------------------------------

const CAT_STYLE: Record<
  string,
  { bg: string; text: string; gradient: string; iconBg: string }
> = {
  TWK: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    gradient: "from-sky-500 to-sky-600",
    iconBg: "bg-sky-100",
  },
  TIU: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    gradient: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-100",
  },
  TKP: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    gradient: "from-teal-500 to-teal-600",
    iconBg: "bg-teal-100",
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
    }
  );
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function LatihanClient() {
  const data = useQuery(api.quiz.listLatihanQuizzes);
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");

  if (data === undefined) return <LatihanSkeleton />;
  if (!data) return null;

  const { categories, userTier } = data;
  console.log(categories);

  // Filter by category tab
  let filtered =
    activeTab === "Semua"
      ? categories
      : categories.filter((c) => c.slug.toUpperCase().includes(activeTab));

  // Filter by search query
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered
      .map((cat) => ({
        ...cat,
        modules: cat.modules
          .map((mod) => ({
            ...mod,
            quizzes: mod.quizzes.filter(
              (quiz) =>
                quiz.title.toLowerCase().includes(q) ||
                mod.title.toLowerCase().includes(q),
            ),
          }))
          .filter((mod) => mod.quizzes.length > 0),
      }))
      .filter((cat) => cat.modules.length > 0);
  }

  const totalQuizzes = categories.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.quizzes.length, 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="dashboard-section">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/10">
            <PenLine className="size-5 text-brand-sky" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Latihan Soal
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalQuizzes} latihan tersedia &mdash; asah kemampuan CPNS kamu.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        className="dashboard-section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ animationDelay: "0.08s" }}
      >
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-none">
          {["Semua", "TWK", "TIU", "TKP"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
          <Input
            placeholder="Cari latihan..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <Card
          className="border-dashed dashboard-section"
          style={{ animationDelay: "0.12s" }}
        >
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BookOpen className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-gray-900">
                Tidak ada latihan ditemukan
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "Coba kata kunci lain."
                  : "Latihan soal akan segera tersedia."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filtered.map((cat, ci) => {
            const style = getStyle(cat.name);
            return (
              <section
                key={cat._id}
                className="dashboard-section"
                style={{ animationDelay: `${0.12 + ci * 0.05}s` }}
              >
                {/* Category heading */}
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const Icon = resolveCategoryIcon(cat.icon);
                    return <Icon className={cn("size-5", style.text)} />;
                  })()}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {cat.name}
                  </h2>
                  <Badge
                    className={cn("text-[10px] border-0", style.bg, style.text)}
                  >
                    {cat.modules.reduce(
                      (s, m) => s + m.quizzes.length,
                      0,
                    )}{" "}
                    latihan
                  </Badge>
                </div>

                {/* Module cards */}
                <div className="space-y-4">
                  {cat.modules.map((mod) => (
                    <Card
                      key={mod._id}
                      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        className={cn("h-1 bg-gradient-to-r", style.gradient)}
                      />
                      <CardContent className="pt-3 space-y-3">
                        {/* Module header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen
                              className={cn("size-4 shrink-0", style.text)}
                            />
                            <h3 className="font-medium text-gray-900 text-sm truncate">
                              {mod.title}
                            </h3>
                          </div>
                          {!mod.isFree && userTier === "free" && (
                            <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[10px] gap-1 shrink-0">
                              <Lock className="size-2.5" />
                              Pro
                            </Badge>
                          )}
                        </div>

                        {/* Quiz rows */}
                        <div className="space-y-2">
                          {mod.quizzes.map((quiz) => {
                            const locked =
                              !mod.isFree && userTier === "free";
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
                              <div
                                key={quiz._id}
                                className={cn(
                                  "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center transition-colors",
                                  locked
                                    ? "opacity-60 bg-gray-50/80"
                                    : "hover:bg-gray-50/80",
                                )}
                              >
                                {/* Icon */}
                                <div
                                  className={cn(
                                    "hidden sm:flex size-9 shrink-0 items-center justify-center rounded-lg",
                                    done ? "bg-green-50" : style.iconBg,
                                  )}
                                >
                                  {done ? (
                                    <CheckCircle2 className="size-4 text-green-500" />
                                  ) : (
                                    <PenLine
                                      className={cn("size-4", style.text)}
                                    />
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {quiz.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <HelpCircle className="size-3" />
                                      {quiz.maxQuestions} soal
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="size-3" />
                                      {quiz.duration} mnt
                                    </span>
                                    {done && (
                                      <span className="flex items-center gap-1">
                                        <Zap className="size-3" />
                                        {quiz.attemptCount}&times; dikerjakan
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Score badge (desktop) */}
                                {quiz.bestScore !== null && (
                                  <Badge
                                    className={cn(
                                      "shrink-0 tabular-nums text-xs font-semibold border-0 hidden sm:inline-flex",
                                      scoreClr,
                                    )}
                                  >
                                    {quiz.bestScore}%
                                  </Badge>
                                )}

                                {/* CTA */}
                                {locked ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="shrink-0 text-xs w-full sm:w-auto"
                                  >
                                    <Lock className="size-3 mr-1" />
                                    Khusus Pro
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className={cn(
                                      "shrink-0 text-xs text-white shadow-sm w-full sm:w-auto bg-gradient-to-r",
                                      style.gradient,
                                    )}
                                    render={
                                      <Link href={`/quiz/${quiz._id}`} />
                                    }
                                  >
                                    {done ? "Ulangi" : "Mulai"}
                                    <ArrowRight className="size-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LatihanSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-16 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Card className="overflow-hidden">
            <Skeleton className="h-1 w-full" />
            <CardContent className="pt-3 space-y-3">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
