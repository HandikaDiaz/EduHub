"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Search,
  Lock,
  Sparkles,
  Loader2,
  Clock,
  Hash,
  PenLine,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateQuizDialog,
  EditQuizDialog,
  DeleteQuizButton,
  type ModuleOption,
} from "@/components/admin/AdminQuizClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TierFilter = "all" | "free" | "pro";

type AdminQuiz = {
  _id: Id<"quizzes">;
  title: string;
  type: "latihan" | "ujian";
  duration: number;
  maxQuestions: number;
  isPublished: boolean;
  isFree: boolean;
  createdAt: number;
  moduleId: Id<"modules">;
  moduleName: string;
  categoryId: Id<"categories"> | null;
  categorySlug: string;
  categoryName: string;
  categoryColor: string;
  questionCount: number;
  attemptCount: number;
  avgScore: number;
};

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export function AdminLatihanClient() {
  const allQuizzes = useQuery(api.quiz.listQuizzesAdmin);
  const modules = useQuery(api.materi.listMateriAdmin);
  const updateQuiz = useMutation(api.quiz.updateQuiz);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [pendingTierToggle, setPendingTierToggle] = useState<Id<"quizzes"> | null>(null);

  const moduleOptions: ModuleOption[] = useMemo(() => {
    if (!modules) return [];
    return modules.map((m) => ({
      _id: m._id,
      title: m.title,
      categoryName: m.categoryName,
    }));
  }, [modules]);

  // Hanya tampilkan quiz tipe latihan — page ini terpisah dari /admin/quiz.
  const latihans: AdminQuiz[] = useMemo(() => {
    if (!allQuizzes) return [];
    return allQuizzes.filter((q) => q.type === "latihan");
  }, [allQuizzes]);

  const categories = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>();
    for (const q of latihans) {
      if (q.categorySlug && !seen.has(q.categorySlug)) {
        seen.set(q.categorySlug, {
          name: q.categoryName,
          color: q.categoryColor,
        });
      }
    }
    return Array.from(seen.entries()).map(([slug, info]) => ({
      slug,
      ...info,
    }));
  }, [latihans]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return latihans.filter((row) => {
      if (categoryFilter !== "all" && row.categorySlug !== categoryFilter)
        return false;
      if (tierFilter === "free" && !row.isFree) return false;
      if (tierFilter === "pro" && row.isFree) return false;
      if (q) {
        const hay = `${row.title} ${row.moduleName} ${row.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [latihans, search, categoryFilter, tierFilter]);

  const stats = useMemo(() => {
    const total = latihans.length;
    const free = latihans.filter((l) => l.isFree).length;
    const pro = total - free;
    const totalQuestions = latihans.reduce((s, l) => s + l.questionCount, 0);
    return { total, free, pro, totalQuestions };
  }, [latihans]);

  const handleToggleTier = async (quiz: AdminQuiz) => {
    setPendingTierToggle(quiz._id);
    try {
      await updateQuiz({
        quizId: quiz._id,
        patch: { isFree: !quiz.isFree },
      });
    } catch (err) {
      console.error("Toggle tier failed:", err);
    } finally {
      setPendingTierToggle(null);
    }
  };

  const isLoading = allQuizzes === undefined || modules === undefined;

  return (
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <PenLine className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manajemen Latihan</h1>
            <p className="text-gray-400 text-sm mt-1">
              Kelola soal latihan & atur akses tier free/pro per latihan.
            </p>
          </div>
        </div>
        <CreateQuizDialog moduleOptions={moduleOptions} defaultType="latihan" />
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DarkStatCard label="Total Latihan" value={stats.total} accent="emerald" />
        <DarkStatCard
          label="Akses Free"
          value={stats.free}
          accent="sky"
          icon={<CheckCircle2 className="size-3.5" />}
        />
        <DarkStatCard
          label="Khusus Pro"
          value={stats.pro}
          accent="purple"
          icon={<Sparkles className="size-3.5" />}
        />
        <DarkStatCard label="Total Soal" value={stats.totalQuestions} accent="amber" />
      </div>

      {/* ============ Filters ============ */}
      <div className="space-y-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Cari judul, modul, atau kategori…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-brand-sky/50"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Kategori
          </span>
          <DarkChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          >
            Semua
          </DarkChip>
          {categories.map((cat) => (
            <DarkChip
              key={cat.slug}
              active={categoryFilter === cat.slug}
              onClick={() => setCategoryFilter(cat.slug)}
              accentColor={cat.color}
            >
              {cat.name}
            </DarkChip>
          ))}
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Tier akses
          </span>
          <DarkChip
            active={tierFilter === "all"}
            onClick={() => setTierFilter("all")}
          >
            Semua
          </DarkChip>
          <DarkChip
            active={tierFilter === "free"}
            onClick={() => setTierFilter("free")}
            tone="emerald"
          >
            <CheckCircle2 className="size-3.5" /> Free
          </DarkChip>
          <DarkChip
            active={tierFilter === "pro"}
            onClick={() => setTierFilter("pro")}
            tone="purple"
          >
            <Lock className="size-3.5" /> Pro
          </DarkChip>
        </div>
      </div>

      {/* ============ Table — layout match /admin/quiz ============ */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Judul Latihan</TableHead>
                <TableHead className="text-gray-400 hidden sm:table-cell">
                  Kategori
                </TableHead>
                <TableHead className="text-gray-400 hidden sm:table-cell">
                  Materi Terkait
                </TableHead>
                <TableHead className="text-gray-400">Akses</TableHead>
                <TableHead className="text-gray-400">
                  <Hash className="inline size-3.5 mr-1" />
                  Soal
                </TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">
                  <Clock className="inline size-3.5 mr-1" />
                  Durasi
                </TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">
                  Attempts
                </TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-800">
                    <TableCell colSpan={9}>
                      <Skeleton className="h-6 w-full bg-gray-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent border-gray-800">
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-gray-500"
                  >
                    {latihans.length === 0
                      ? "Belum ada latihan. Klik 'Buat Quiz' untuk memulai."
                      : "Tidak ada latihan yang cocok dengan filter saat ini."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={row._id}
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    {/* Judul */}
                    <TableCell className="font-medium text-gray-200">
                      <span className="truncate max-w-[180px] sm:max-w-xs block">
                        {row.title}
                      </span>
                    </TableCell>

                    {/* Kategori */}
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        className="border-0 text-xs font-semibold"
                        style={{
                          backgroundColor: `${row.categoryColor}26`,
                          color: row.categoryColor,
                        }}
                      >
                        {row.categoryName}
                      </Badge>
                    </TableCell>

                    {/* Materi */}
                    <TableCell className="text-gray-400 hidden sm:table-cell">
                      <span className="truncate max-w-[200px] block">
                        {row.moduleName || "—"}
                      </span>
                    </TableCell>

                    {/* Akses (toggle inline) */}
                    <TableCell>
                      <DarkTierToggle
                        isFree={row.isFree}
                        loading={pendingTierToggle === row._id}
                        onToggle={() => handleToggleTier(row)}
                      />
                    </TableCell>

                    {/* Soal */}
                    <TableCell className="text-gray-300 tabular-nums">
                      {row.questionCount}
                    </TableCell>

                    {/* Durasi */}
                    <TableCell className="text-gray-300 hidden md:table-cell tabular-nums">
                      {row.duration}m
                    </TableCell>

                    {/* Attempts */}
                    <TableCell className="text-gray-400 hidden md:table-cell tabular-nums">
                      {row.attemptCount}
                      {row.attemptCount > 0 && (
                        <span className="text-xs text-gray-500 block">
                          avg {row.avgScore}%
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {row.isPublished ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                          <CheckCircle2 className="size-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-gray-500 border-gray-600 text-[10px] font-semibold"
                        >
                          Draft
                        </Badge>
                      )}
                    </TableCell>

                    {/* Aksi — pakai EditQuizDialog & DeleteQuizButton dari Quiz */}
                    <TableCell className="text-right whitespace-nowrap">
                      <EditQuizDialog quiz={row} moduleOptions={moduleOptions} />
                      <DeleteQuizButton quiz={row} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isLoading && (
        <p className="text-xs text-gray-500 text-center pb-2">
          Menampilkan {filtered.length} dari {latihans.length} latihan
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components — dark theme
// ---------------------------------------------------------------------------

export function DarkStatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: "emerald" | "sky" | "purple" | "amber";
  icon?: React.ReactNode;
}) {
  const accentClasses = {
    emerald: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400",
    sky: "from-sky-500/10 to-blue-500/10 border-sky-500/20 text-sky-400",
    purple: "from-purple-500/10 to-violet-500/10 border-purple-500/20 text-purple-400",
    amber: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400",
  }[accent];

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-3 bg-gray-900",
        accentClasses,
      )}
    >
      <p className="text-xs font-medium opacity-90 inline-flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-bold mt-0.5 text-white">{value}</p>
    </div>
  );
}

export function DarkChip({
  active,
  onClick,
  children,
  accentColor,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accentColor?: string;
  tone?: "emerald" | "purple" | "sky";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150";

  if (active) {
    if (tone === "emerald") {
      return (
        <button
          onClick={onClick}
          className={cn(base, "bg-emerald-500/15 border-emerald-500/40 text-emerald-300")}
        >
          {children}
        </button>
      );
    }
    if (tone === "purple") {
      return (
        <button
          onClick={onClick}
          className={cn(base, "bg-purple-500/15 border-purple-500/40 text-purple-300")}
        >
          {children}
        </button>
      );
    }
    if (tone === "sky") {
      return (
        <button
          onClick={onClick}
          className={cn(base, "bg-sky-500/15 border-sky-500/40 text-sky-300")}
        >
          {children}
        </button>
      );
    }
    if (accentColor) {
      return (
        <button
          onClick={onClick}
          className={cn(base, "border-current")}
          style={{
            color: accentColor,
            backgroundColor: `${accentColor}26`,
            borderColor: `${accentColor}66`,
          }}
        >
          {children}
        </button>
      );
    }
    return (
      <button
        onClick={onClick}
        className={cn(base, "bg-white border-white text-gray-900")}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        base,
        "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800 hover:text-gray-200",
      )}
    >
      {children}
    </button>
  );
}

function DarkTierToggle({
  isFree,
  loading,
  onToggle,
}: {
  isFree: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      aria-pressed={isFree}
      aria-label={isFree ? "Akses Free, klik untuk Pro" : "Akses Pro, klik untuk Free"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-wait",
        isFree
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
          : "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isFree ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <Lock className="size-3.5" />
      )}
      {isFree ? "Free" : "Pro"}
    </button>
  );
}
