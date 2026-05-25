"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Clock,
  Hash,
  ListOrdered,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  Trophy,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AdminImagePicker,
  flushPendingImage,
} from "@/components/admin/AdminImagePicker";
import { DarkStatCard, DarkChip } from "@/components/admin/AdminLatihanClient";

type QuizType = "latihan" | "ujian";
type AnswerKey = "A" | "B" | "C" | "D" | "E";
const OPTION_KEYS: AnswerKey[] = ["A", "B", "C", "D", "E"];

export type AdminQuiz = {
  _id: Id<"quizzes">;
  title: string;
  type: QuizType;
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

export type ModuleOption = {
  _id: Id<"modules">;
  title: string;
  categoryName: string;
};

type QuestionType = "single" | "multiple" | "truefalse_table";

type QuestionDraft = {
  question: string;
  /** URL Cloudinary committed (null = belum / sudah dihapus). */
  imageUrl: string | null;
  /** File yang user pilih tapi belum di-upload. Di-flush saat Save. */
  imageFile: File | null;

  // Tipe soal — switch antara single / multiple / truefalse_table
  type: QuestionType;

  // single & multiple
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: AnswerKey; // single
  correctAnswers: AnswerKey[]; // multiple

  // truefalse_table
  statements: { text: string; isTrue: boolean }[];

  explanation: string;
  explanationImageUrl: string | null;
  explanationImageFile: File | null;
  explanationVideoUrl: string;
};

const emptyDraft = (): QuestionDraft => ({
  question: "",
  imageUrl: null,
  imageFile: null,
  type: "single",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionE: "",
  correctAnswer: "A",
  correctAnswers: [],
  statements: [
    { text: "", isTrue: true },
    { text: "", isTrue: false },
    { text: "", isTrue: true },
  ],
  explanation: "",
  explanationImageUrl: null,
  explanationImageFile: null,
  explanationVideoUrl: "",
});

const validateDraft = (d: QuestionDraft): string | null => {
  if (!d.question.trim()) return "Teks pertanyaan wajib diisi";

  if (d.type === "truefalse_table") {
    if (d.statements.length < 3) {
      return "Tabel B/S minimal 3 pernyataan";
    }
    if (d.statements.length > 10) {
      return "Tabel B/S maksimal 10 pernyataan";
    }
    for (let i = 0; i < d.statements.length; i++) {
      if (!d.statements[i].text.trim()) {
        return `Pernyataan ${i + 1} wajib diisi`;
      }
    }
  } else {
    // single & multiple butuh A-E terisi
    for (const k of OPTION_KEYS) {
      if (!d[`option${k}` as keyof QuestionDraft]) {
        return `Opsi ${k} wajib diisi`;
      }
    }
    if (d.type === "multiple" && d.correctAnswers.length === 0) {
      return "Pilih minimal 1 jawaban benar untuk soal multiple choice";
    }
  }

  if (!d.explanation.trim()) return "Pembahasan wajib diisi";
  return null;
};

/**
 * Build payload Convex untuk createQuestionsBatch / updateQuestion.
 * Hanya kirim field yang relevan dengan tipe soal — sisa undefined supaya
 * tidak menumpuk garbage di DB.
 */
const buildCreatePayload = (
  d: QuestionDraft,
  finalImageUrl: string | null,
  finalExplanationImageUrl: string | null,
) => {
  const base = {
    question: d.question.trim(),
    imageUrl: finalImageUrl ?? undefined,
    type: d.type,
    explanation: d.explanation.trim(),
    explanationImageUrl: finalExplanationImageUrl ?? undefined,
    explanationVideoUrl: d.explanationVideoUrl.trim() || undefined,
  };

  if (d.type === "truefalse_table") {
    return {
      ...base,
      statements: d.statements
        .filter((s) => s.text.trim())
        .map((s) => ({ text: s.text.trim(), isTrue: s.isTrue })),
    };
  }

  // single & multiple — kirim opsi A-E
  const optionFields = {
    optionA: d.optionA.trim(),
    optionB: d.optionB.trim(),
    optionC: d.optionC.trim(),
    optionD: d.optionD.trim(),
    optionE: d.optionE.trim(),
  };

  if (d.type === "multiple") {
    return { ...base, ...optionFields, correctAnswers: d.correctAnswers };
  }

  // single
  return { ...base, ...optionFields, correctAnswer: d.correctAnswer };
};

/**
 * Build QuestionDraft dari ExistingQuestion (data dari Convex). Field-field
 * yang tidak relevan untuk tipe tertentu di-fill default supaya state TypeScript
 * tetap valid; logika render editor yang akan menyembunyikan field tidak relevan.
 */
const draftFromExisting = (question: ExistingQuestion): QuestionDraft => {
  const type: QuestionType = question.type ?? "single";
  const fallbackStmts =
    type === "truefalse_table"
      ? (question.statements ?? [
          { text: "", isTrue: true },
          { text: "", isTrue: false },
          { text: "", isTrue: true },
        ])
      : [
          { text: "", isTrue: true },
          { text: "", isTrue: false },
          { text: "", isTrue: true },
        ];

  return {
    question: question.question,
    imageUrl: question.imageUrl ?? null,
    imageFile: null,
    type,
    optionA: question.optionA ?? "",
    optionB: question.optionB ?? "",
    optionC: question.optionC ?? "",
    optionD: question.optionD ?? "",
    optionE: question.optionE ?? "",
    correctAnswer: question.correctAnswer ?? "A",
    correctAnswers: question.correctAnswers ?? [],
    statements: fallbackStmts,
    explanation: question.explanation,
    explanationImageUrl: question.explanationImageUrl ?? null,
    explanationImageFile: null,
    explanationVideoUrl: question.explanationVideoUrl ?? "",
  };
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type TierFilter = "all" | "free" | "pro";

export function AdminQuizClient() {
  const allQuizzes = useQuery(api.quiz.listQuizzesAdmin);
  const modules = useQuery(api.materi.listMateriAdmin);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  // Halaman ini fokus ke UJIAN saja. Latihan dikelola di /admin/latihan.
  const ujianQuizzes = useMemo(() => {
    if (!allQuizzes) return [];
    return allQuizzes.filter((q) => q.type === "ujian");
  }, [allQuizzes]);

  const moduleOptions: ModuleOption[] = useMemo(() => {
    if (!modules) return [];
    return modules.map((m) => ({
      _id: m._id,
      title: m.title,
      categoryName: m.categoryName,
    }));
  }, [modules]);

  // Daftar kategori unik dari ujian (untuk chip filter).
  const categories = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>();
    for (const q of ujianQuizzes) {
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
  }, [ujianQuizzes]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ujianQuizzes.filter((qz) => {
      if (categoryFilter !== "all" && qz.categorySlug !== categoryFilter)
        return false;
      if (tierFilter === "free" && !qz.isFree) return false;
      if (tierFilter === "pro" && qz.isFree) return false;
      if (q) {
        const hay = `${qz.title} ${qz.moduleName} ${qz.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ujianQuizzes, searchQuery, categoryFilter, tierFilter]);

  // Statistik ujian (sebelum filter).
  const stats = useMemo(() => {
    const total = ujianQuizzes.length;
    const free = ujianQuizzes.filter((q) => q.isFree).length;
    const pro = total - free;
    const totalQuestions = ujianQuizzes.reduce(
      (s, q) => s + q.questionCount,
      0,
    );
    return { total, free, pro, totalQuestions };
  }, [ujianQuizzes]);

  const isLoading = allQuizzes === undefined || modules === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Trophy className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manajemen Ujian</h1>
            <p className="text-gray-400 text-sm mt-1">
              Buat dan kelola ujian simulasi CPNS.
            </p>
          </div>
        </div>
        <CreateQuizDialog moduleOptions={moduleOptions} defaultType="ujian" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DarkStatCard label="Total Ujian" value={stats.total} accent="purple" />
        <DarkStatCard
          label="Akses Free"
          value={stats.free}
          accent="emerald"
          icon={<CheckCircle2 className="size-3.5" />}
        />
        <DarkStatCard
          label="Khusus Pro"
          value={stats.pro}
          accent="sky"
          icon={<Lock className="size-3.5" />}
        />
        <DarkStatCard
          label="Total Soal"
          value={stats.totalQuestions}
          accent="amber"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3 bg-gray-900 p-4 border border-gray-800 rounded-xl">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4" />
          <Input
            placeholder="Cari quiz, modul, atau kategori..."
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-brand-sky/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Judul Ujian</TableHead>
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
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-gray-500"
                  >
                    Tidak ada quiz yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((quiz) => (
                  <TableRow
                    key={quiz._id}
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    <TableCell className="font-medium text-gray-200">
                      <span className="truncate max-w-[180px] sm:max-w-xs block">
                        {quiz.title}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        className="border-0 text-xs font-semibold"
                        style={{
                          backgroundColor: `${quiz.categoryColor}26`,
                          color: quiz.categoryColor,
                        }}
                      >
                        {quiz.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 hidden sm:table-cell">
                      <span className="truncate max-w-[200px] block">
                        {quiz.moduleName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          quiz.isFree
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-semibold"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs font-semibold"
                        }
                      >
                        {quiz.isFree ? (
                          <>
                            <CheckCircle2 className="size-3 mr-1" /> Free
                          </>
                        ) : (
                          <>
                            <Lock className="size-3 mr-1" /> Pro
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 tabular-nums">
                      {quiz.questionCount}
                    </TableCell>
                    <TableCell className="text-gray-300 hidden md:table-cell tabular-nums">
                      {quiz.duration}m
                    </TableCell>
                    <TableCell className="text-gray-400 hidden md:table-cell tabular-nums">
                      {quiz.attemptCount}
                      {quiz.attemptCount > 0 && (
                        <span className="text-xs text-gray-500 block">
                          avg {quiz.avgScore}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {quiz.isPublished ? (
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
                    <TableCell className="text-right whitespace-nowrap">
                      <EditQuizDialog
                        quiz={quiz}
                        moduleOptions={moduleOptions}
                      />
                      <DeleteQuizButton quiz={quiz} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete quiz button
// ---------------------------------------------------------------------------

export function DeleteQuizButton({ quiz }: { quiz: AdminQuiz }) {
  const deleteQuiz = useMutation(api.quiz.deleteQuiz);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Hapus quiz "${quiz.title}"? Seluruh soal dan attempt akan ikut terhapus.`,
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteQuiz({ quizId: quiz._id });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus quiz");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={deleting}
      onClick={handleDelete}
      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-400/10 ml-1"
    >
      {deleting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Quiz meta form (shared by create + edit)
// ---------------------------------------------------------------------------

function QuizMetaForm({
  title,
  setTitle,
  type,
  setType,
  moduleId,
  setModuleId,
  duration,
  setDuration,
  maxQuestions,
  setMaxQuestions,
  isPublished,
  setIsPublished,
  moduleOptions,
}: {
  title: string;
  setTitle: (v: string) => void;
  type: QuizType;
  setType: (v: QuizType) => void;
  moduleId: Id<"modules"> | "";
  setModuleId: (v: Id<"modules">) => void;
  duration: number;
  setDuration: (v: number) => void;
  maxQuestions: number;
  setMaxQuestions: (v: number) => void;
  isPublished: boolean;
  setIsPublished: (v: boolean) => void;
  moduleOptions: ModuleOption[];
}) {
  const maxCap = type === "latihan" ? 10 : 100;

  return (
    <>
      <div className="space-y-2">
        <Label className="text-slate-300">Judul Quiz</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white focus-visible:ring-brand-sky/50"
          placeholder="Contoh: Latihan Pancasila"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Tipe Quiz</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["latihan", "ujian"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                type === t
                  ? t === "latihan"
                    ? "border-brand-sky bg-brand-sky/10 text-brand-sky"
                    : "border-brand-purple bg-brand-purple/10 text-brand-purple"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              <p className="text-sm font-medium capitalize">{t}</p>
              <p className="text-[11px] opacity-60 mt-0.5">
                {t === "latihan" ? "Maks 10 soal" : "Jumlah fleksibel"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Materi Terkait</Label>
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value as Id<"modules">)}
          className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-sm text-white outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/50"
        >
          <option value="">Pilih materi...</option>
          {moduleOptions.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title} — {m.categoryName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Durasi (menit)</Label>
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
            className="bg-slate-800 border-slate-700 text-white focus-visible:ring-brand-sky/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Maks Soal ({maxCap})</Label>
          <Input
            type="number"
            min={1}
            max={maxCap}
            value={maxQuestions}
            onChange={(e) =>
              setMaxQuestions(
                Math.max(1, Math.min(Number(e.target.value) || 1, maxCap)),
              )
            }
            className="bg-slate-800 border-slate-700 text-white focus-visible:ring-brand-sky/50"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
        <div>
          <p className="text-sm font-medium text-gray-200">Status Publikasi</p>
          <p className="text-xs text-gray-500">
            {isPublished
              ? "Quiz bisa dikerjakan user."
              : "Draft — belum tampil."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPublished(!isPublished)}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
            isPublished ? "bg-emerald-500" : "bg-gray-700"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform ${
              isPublished ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Create Quiz Dialog (meta-only, questions added in edit)
// ---------------------------------------------------------------------------

export function CreateQuizDialog({
  moduleOptions,
  defaultType = "latihan",
}: {
  moduleOptions: ModuleOption[];
  /** Default tipe — pakai "ujian" di /admin/quiz, "latihan" di /admin/latihan. */
  defaultType?: QuizType;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<QuizType>(defaultType);
  const [moduleId, setModuleId] = useState<Id<"modules"> | "">("");
  // Default durasi: latihan 15 menit, ujian 60 menit. Default max soal:
  // latihan 10, ujian 30 — match dengan seed data.
  const [duration, setDuration] = useState(defaultType === "ujian" ? 60 : 15);
  const [maxQuestions, setMaxQuestions] = useState(
    defaultType === "ujian" ? 30 : 10,
  );
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuiz = useMutation(api.quiz.createQuiz);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setTitle("");
      setType(defaultType);
      setModuleId("");
      setDuration(defaultType === "ujian" ? 60 : 15);
      setMaxQuestions(defaultType === "ujian" ? 30 : 10);
      setIsPublished(false);
      setError(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) return setError("Judul wajib diisi");
    if (!moduleId) return setError("Materi wajib dipilih");
    setSaving(true);
    try {
      await createQuiz({
        title: title.trim(),
        type,
        moduleId,
        duration,
        maxQuestions,
        isPublished,
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            disabled={moduleOptions.length === 0}
            className="bg-brand-purple hover:bg-brand-purple/90 text-white shadow-lg shadow-purple-500/20 w-full sm:w-auto"
          />
        }
      >
        <PlusCircle className="size-4" />
        Buat Quiz Baru
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white p-0 gap-0 admin-dark-scroll">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800">
          <DialogTitle>Buat Quiz Baru</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <QuizMetaForm
            title={title}
            setTitle={setTitle}
            type={type}
            setType={setType}
            moduleId={moduleId}
            setModuleId={setModuleId}
            duration={duration}
            setDuration={setDuration}
            maxQuestions={maxQuestions}
            setMaxQuestions={setMaxQuestions}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            moduleOptions={moduleOptions}
          />
          <p className="text-xs text-gray-500 border-t border-gray-800 pt-4">
            Setelah membuat quiz, klik tombol edit untuk menambahkan soal.
          </p>
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-gray-800 bg-gray-900/50 flex flex-row justify-end gap-2 sm:gap-2">
          <DialogClose
            render={
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              />
            }
          >
            Batal
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-purple hover:bg-brand-purple/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Quiz"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Quiz Dialog (meta + questions)
// ---------------------------------------------------------------------------

export function EditQuizDialog({
  quiz,
  moduleOptions,
}: {
  quiz: AdminQuiz;
  moduleOptions: ModuleOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-sky-400 hover:bg-sky-400/10"
          />
        }
      >
        <Edit className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800 text-white p-0 gap-0 max-h-[90vh] admin-dark-scroll">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800">
          <DialogTitle>Edit Quiz: {quiz.title}</DialogTitle>
        </DialogHeader>
        {open && (
          <EditQuizBody
            quiz={quiz}
            moduleOptions={moduleOptions}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditQuizBody({
  quiz,
  moduleOptions,
  onClose,
}: {
  quiz: AdminQuiz;
  moduleOptions: ModuleOption[];
  onClose: () => void;
}) {
  const detail = useQuery(api.quiz.getQuizWithQuestionsAdmin, {
    quizId: quiz._id,
  });
  const updateQuiz = useMutation(api.quiz.updateQuiz);
  const createQuestionsBatch = useMutation(api.quiz.createQuestionsBatch);
  const updateQuestion = useMutation(api.quiz.updateQuestion);
  const deleteQuestion = useMutation(api.quiz.deleteQuestion);

  const [tab, setTab] = useState<"meta" | "questions">("meta");

  // Meta state
  const [title, setTitle] = useState(quiz.title);
  const [type, setType] = useState<QuizType>(quiz.type);
  const [moduleId, setModuleId] = useState<Id<"modules"> | "">(quiz.moduleId);
  const [duration, setDuration] = useState(quiz.duration);
  const [maxQuestions, setMaxQuestions] = useState(quiz.maxQuestions);
  const [isPublished, setIsPublished] = useState(quiz.isPublished);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Drafts for new questions
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const handleSaveMeta = async () => {
    setMetaError(null);
    if (!title.trim()) return setMetaError("Judul wajib diisi");
    if (!moduleId) return setMetaError("Materi wajib dipilih");
    setSavingMeta(true);
    try {
      await updateQuiz({
        quizId: quiz._id,
        patch: {
          title: title.trim(),
          type,
          moduleId,
          duration,
          maxQuestions,
          isPublished,
        },
      });
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveBatch = async () => {
    setBatchError(null);
    if (drafts.length === 0) return;
    for (const d of drafts) {
      const err = validateDraft(d);
      if (err) return setBatchError(err);
    }
    setSavingBatch(true);
    try {
      // Flush semua pending image files ke Cloudinary terlebih dulu.
      // Dijalankan paralel per draft untuk hemat waktu (satu draft pun bisa
      // punya 2 file: gambar soal + gambar pembahasan).
      const flushedDrafts = await Promise.all(
        drafts.map(async (d) => {
          const [finalImageUrl, finalExplanationImageUrl] = await Promise.all([
            flushPendingImage(d.imageUrl, d.imageFile),
            flushPendingImage(d.explanationImageUrl, d.explanationImageFile),
          ]);
          return { ...d, finalImageUrl, finalExplanationImageUrl };
        }),
      );

      await createQuestionsBatch({
        quizId: quiz._id,
        questions: flushedDrafts.map((d) =>
          buildCreatePayload(
            d,
            d.finalImageUrl,
            d.finalExplanationImageUrl,
          ),
        ),
      });
      setDrafts([]);
    } catch (e) {
      setBatchError(e instanceof Error ? e.message : "Gagal menyimpan soal");
    } finally {
      setSavingBatch(false);
    }
  };

  const updateDraft = (i: number, patch: Partial<QuestionDraft>) => {
    setDrafts((d) =>
      d.map((draft, idx) => (idx === i ? { ...draft, ...patch } : draft)),
    );
  };

  const removeDraft = (i: number) => {
    setDrafts((d) => d.filter((_, idx) => idx !== i));
  };

  const existingCount = detail?.questions.length ?? 0;
  const canAddMore = existingCount + drafts.length < maxQuestions;

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 flex gap-4">
        {(["meta", "questions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-brand-sky text-brand-sky"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {t === "meta" ? "Info Quiz" : `Soal (${existingCount})`}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
        {tab === "meta" && (
          <>
            <QuizMetaForm
              title={title}
              setTitle={setTitle}
              type={type}
              setType={setType}
              moduleId={moduleId}
              setModuleId={setModuleId}
              duration={duration}
              setDuration={setDuration}
              maxQuestions={maxQuestions}
              setMaxQuestions={setMaxQuestions}
              isPublished={isPublished}
              setIsPublished={setIsPublished}
              moduleOptions={moduleOptions}
            />
            {metaError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-400 flex items-start gap-2">
                <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
                <span>{metaError}</span>
              </div>
            )}
          </>
        )}

        {tab === "questions" && (
          <div className="space-y-4">
            {/* Existing questions */}
            {detail === undefined ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-gray-500" />
              </div>
            ) : detail === null ? (
              <div className="text-sm text-gray-500">Quiz tidak ditemukan.</div>
            ) : detail.questions.length === 0 ? (
              <div className="text-sm text-gray-500 border border-dashed border-gray-700 rounded-lg p-6 text-center">
                Belum ada soal. Tambahkan di bawah.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <ListOrdered className="size-3.5" /> Soal Tersimpan
                </p>
                {detail.questions.map((q, idx) => (
                  <ExistingQuestionRow
                    key={q._id}
                    question={q}
                    index={idx}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                  />
                ))}
              </div>
            )}

            {/* New drafts */}
            {drafts.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-xs text-gray-400">Soal Baru (belum tersimpan)</p>
                {drafts.map((d, i) => (
                  <DraftQuestionRow
                    key={i}
                    draft={d}
                    index={existingCount + i}
                    onChange={(patch) => updateDraft(i, patch)}
                    onRemove={() => removeDraft(i)}
                  />
                ))}
              </div>
            )}

            {canAddMore ? (
              <Button
                variant="outline"
                className="w-full border-dashed border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800/50"
                onClick={() => setDrafts((d) => [...d, emptyDraft()])}
              >
                <PlusCircle className="size-4" />
                Tambah Soal Baru
              </Button>
            ) : (
              <p className="text-xs text-gray-500 text-center">
                Sudah mencapai batas maksimum ({maxQuestions}). Hapus soal
                atau naikkan batas di tab Info Quiz.
              </p>
            )}

            {batchError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-400 flex items-start gap-2">
                <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
                <span>{batchError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="p-4 border-t border-gray-800 bg-gray-900/50 flex flex-row justify-end gap-2 sm:gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Tutup
        </Button>
        {tab === "meta" ? (
          <Button
            onClick={handleSaveMeta}
            disabled={savingMeta}
            className="bg-brand-sky hover:bg-brand-sky/90 text-white"
          >
            {savingMeta ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSaveBatch}
            disabled={savingBatch || drafts.length === 0}
            className="bg-brand-purple hover:bg-brand-purple/90 text-white"
          >
            {savingBatch ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              `Simpan ${drafts.length} Soal Baru`
            )}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// Existing question row (collapsed / expanded for edit)
// ---------------------------------------------------------------------------

type ExistingQuestion = {
  _id: Id<"questions">;
  quizId: Id<"quizzes">;
  question: string;
  imageUrl?: string;
  type?: QuestionType;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  correctAnswer?: AnswerKey;
  correctAnswers?: AnswerKey[];
  statements?: { text: string; isTrue: boolean }[];
  explanation: string;
  explanationImageUrl?: string;
  explanationVideoUrl?: string;
  order: number;
};

function ExistingQuestionRow({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: ExistingQuestion;
  index: number;
  onUpdate: (args: {
    questionId: Id<"questions">;
    patch: Partial<Omit<ExistingQuestion, "_id" | "quizId" | "order">>;
  }) => Promise<unknown>;
  onDelete: (args: { questionId: Id<"questions"> }) => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    draftFromExisting(question),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded) {
      setDraft(draftFromExisting(question));
      setError(null);
    }
  }, [expanded, question]);

  const handleSave = async () => {
    setError(null);
    const err = validateDraft(draft);
    if (err) return setError(err);
    setSaving(true);
    try {
      // Flush pending images dulu — upload ke Cloudinary baru jalan di sini,
      // bukan saat user pilih file. Replace flow akan auto-hapus gambar lama.
      const [finalImageUrl, finalExplanationImageUrl] = await Promise.all([
        flushPendingImage(draft.imageUrl, draft.imageFile),
        flushPendingImage(draft.explanationImageUrl, draft.explanationImageFile),
      ]);

      await onUpdate({
        questionId: question._id,
        patch: buildCreatePayload(
          draft,
          finalImageUrl,
          finalExplanationImageUrl,
        ),
      });
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan soal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus soal nomor ${index + 1}?`)) return;
    setSaving(true);
    try {
      await onDelete({ questionId: question._id });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus soal");
    } finally {
      setSaving(false);
    }
  };

  if (!expanded) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/30 p-3 hover:bg-slate-800/60 transition-colors">
        <span className="size-6 shrink-0 flex items-center justify-center rounded-md bg-slate-700 text-xs font-bold text-slate-300">
          {index + 1}
        </span>
        <span className="flex-1 truncate text-sm text-slate-200">
          {question.question}
        </span>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] shrink-0">
          Jawaban {question.correctAnswer}
        </Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setExpanded(true)}
          className="text-slate-400 hover:text-sky-400 hover:bg-sky-400/10"
        >
          <Edit className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={saving}
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <QuestionEditor
      draft={draft}
      onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      index={index}
      headerRight={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="text-slate-400 hover:text-white"
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-sky hover:bg-brand-sky/90 text-white"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Simpan"}
          </Button>
        </>
      }
      error={error}
    />
  );
}

function DraftQuestionRow({
  draft,
  index,
  onChange,
  onRemove,
}: {
  draft: QuestionDraft;
  index: number;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <QuestionEditor
      draft={draft}
      onChange={onChange}
      index={index}
      headerRight={
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          className="text-slate-500 hover:text-red-400 hover:bg-red-400/10"
        >
          <X className="size-3.5" />
        </Button>
      }
    />
  );
}

function QuestionEditor({
  draft,
  onChange,
  index,
  headerRight,
  error,
}: {
  draft: QuestionDraft;
  onChange: (patch: Partial<QuestionDraft>) => void;
  index: number;
  headerRight: React.ReactNode;
  error?: string | null;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-200">
          Soal {index + 1}
        </h4>
        <div className="flex items-center gap-1">{headerRight}</div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-400 text-xs">Teks Pertanyaan</Label>
        <Textarea
          value={draft.question}
          onChange={(e) => onChange({ question: e.target.value })}
          className="bg-slate-900 border-slate-700 text-white focus-visible:ring-brand-sky/50 resize-none min-h-[60px]"
          placeholder="Tuliskan pertanyaan..."
        />
      </div>

      {/* Type selector — pilih tipe soal */}
      <div className="space-y-2">
        <Label className="text-slate-400 text-xs">Tipe Soal</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { value: "single", label: "Pilihan Ganda" },
              { value: "multiple", label: "Multi-jawaban" },
              { value: "truefalse_table", label: "Tabel B/S" },
            ] as const
          ).map((opt) => {
            const active = draft.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ type: opt.value })}
                className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors ${
                  active
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gambar soal — opsional, untuk soal figural / yang butuh visual. */}
      <div className="space-y-2">
        <Label className="text-slate-400 text-xs">
          Gambar Soal (opsional)
        </Label>
        <AdminImagePicker
          value={draft.imageUrl}
          pendingFile={draft.imageFile}
          onChange={(next) =>
            onChange({ imageUrl: next.url, imageFile: next.pendingFile })
          }
          label="Gambar soal"
          compact
        />
      </div>

      {/* === SINGLE / MULTIPLE: opsi A-E + jawaban benar === */}
      {draft.type !== "truefalse_table" && (
        <>
          <div className="grid gap-2">
            {OPTION_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-700 text-xs font-bold text-slate-300">
                  {key}
                </span>
                <Input
                  value={
                    draft[`option${key}` as keyof QuestionDraft] as string
                  }
                  onChange={(e) =>
                    onChange({
                      [`option${key}`]: e.target.value,
                    } as Partial<QuestionDraft>)
                  }
                  className="bg-slate-900 border-slate-700 text-white focus-visible:ring-brand-sky/50"
                  placeholder={`Opsi ${key}`}
                />
              </div>
            ))}
          </div>

          {draft.type === "single" ? (
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Jawaban Benar</Label>
              <div className="flex gap-2">
                {OPTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ correctAnswer: key })}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      draft.correctAnswer === key
                        ? "border-green-500/50 bg-green-500/10 text-green-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // multiple — pilih beberapa jawaban benar
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">
                Jawaban Benar (pilih ≥ 1)
              </Label>
              <div className="flex gap-2">
                {OPTION_KEYS.map((key) => {
                  const picked = draft.correctAnswers.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const next = picked
                          ? draft.correctAnswers.filter((k) => k !== key)
                          : [...draft.correctAnswers, key];
                        onChange({ correctAnswers: next });
                      }}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        picked
                          ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* === TRUEFALSE_TABLE: editor list pernyataan === */}
      {draft.type === "truefalse_table" && (
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs">
            Pernyataan (3-10) — Centang B atau S sebagai kunci
          </Label>
          <div className="space-y-2">
            {draft.statements.map((s, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-2"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-700 text-[10px] font-bold text-slate-300 mt-1">
                  {idx + 1}
                </span>
                <Textarea
                  value={s.text}
                  onChange={(e) => {
                    const next = [...draft.statements];
                    next[idx] = { ...next[idx], text: e.target.value };
                    onChange({ statements: next });
                  }}
                  className="bg-slate-900 border-slate-700 text-white text-sm focus-visible:ring-brand-sky/50 resize-none min-h-[40px] flex-1"
                  placeholder={`Pernyataan ${idx + 1}...`}
                />
                <div className="flex flex-col gap-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...draft.statements];
                      next[idx] = { ...next[idx], isTrue: true };
                      onChange({ statements: next });
                    }}
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors ${
                      s.isTrue
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                        : "border-slate-700 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    BENAR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...draft.statements];
                      next[idx] = { ...next[idx], isTrue: false };
                      onChange({ statements: next });
                    }}
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors ${
                      !s.isTrue
                        ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
                        : "border-slate-700 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    SALAH
                  </button>
                </div>
                {draft.statements.length > 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = draft.statements.filter(
                        (_, i) => i !== idx,
                      );
                      onChange({ statements: next });
                    }}
                    className="text-slate-500 hover:text-rose-400 mt-1"
                    aria-label={`Hapus pernyataan ${idx + 1}`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {draft.statements.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  statements: [
                    ...draft.statements,
                    { text: "", isTrue: true },
                  ],
                })
              }
              className="w-full border-dashed border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800/50"
            >
              + Tambah Pernyataan
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-slate-400 text-xs">Pembahasan</Label>
        <Textarea
          value={draft.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          className="bg-slate-900 border-slate-700 text-white focus-visible:ring-brand-sky/50 resize-none min-h-[50px]"
          placeholder="Jelaskan jawaban yang benar..."
        />
      </div>

      {/* Gambar pembahasan — opsional. */}
      <div className="space-y-2">
        <Label className="text-slate-400 text-xs">
          Gambar Pembahasan (opsional)
        </Label>
        <AdminImagePicker
          value={draft.explanationImageUrl}
          pendingFile={draft.explanationImageFile}
          onChange={(next) =>
            onChange({
              explanationImageUrl: next.url,
              explanationImageFile: next.pendingFile,
            })
          }
          label="Gambar pembahasan"
          compact
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-400 text-xs">
          Video Pembahasan (opsional)
        </Label>
        <Input
          value={draft.explanationVideoUrl}
          onChange={(e) => onChange({ explanationVideoUrl: e.target.value })}
          className="bg-slate-900 border-slate-700 text-white focus-visible:ring-brand-sky/50"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-2 text-xs text-red-400 flex items-start gap-2">
          <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
