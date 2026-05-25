"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  BookOpen,
  PenLine,
  Trophy,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useUpgradeDialog } from "@/components/upgrade/useUpgradeDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  slug: string;
  kategori: string;
}

const COLOR_BY_SLUG: Record<
  string,
  { bg: string; text: string; border: string; gradient: string }
> = {
  twk: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    border: "border-sky-200",
    gradient: "from-sky-500 to-cyan-500",
  },
  tiu: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-500 to-violet-500",
  },
  tkp: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-teal-500",
  },
};

const DEFAULT_COLOR = {
  bg: "bg-slate-100",
  text: "text-slate-700",
  border: "border-slate-200",
  gradient: "from-slate-500 to-slate-600",
};

// ---------------------------------------------------------------------------
// YouTube helpers
// ---------------------------------------------------------------------------

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  // Already an ID
  if (/^[\w-]{11}$/.test(url)) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function MateriDetailClient({ slug, kategori }: Props) {
  const data = useQuery(api.materi.getModuleDetail, { slug });
  const markComplete = useMutation(api.videoProgress.markComplete);
  const { openUpgradeDialog } = useUpgradeDialog();

  const [videoWatched, setVideoWatched] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (data && data.isCompleted) setVideoWatched(true);
  }, [data]);

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-6">
          <Skeleton className="h-6 w-64 bg-slate-200" />
          <Skeleton className="aspect-video w-full rounded-2xl bg-slate-200" />
          <Skeleton className="h-32 w-full rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Materi Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-500">
            Materi yang kamu cari mungkin telah dihapus atau tidak
            dipublikasikan.
          </p>
          <Link
            href="/materi"
            className="inline-block mt-2 text-sm font-semibold text-sky-600 hover:underline"
          >
            Kembali ke daftar materi
          </Link>
        </div>
      </div>
    );
  }

  const { module: mod, category, quizzes, canAccess, userTier, siblings } =
    data;
  const color = COLOR_BY_SLUG[category.slug] ?? DEFAULT_COLOR;
  const youtubeId = extractYouTubeId(mod.videoUrl);
  const isPaidUser = userTier === "pro" || userTier === "trial";

  const handleMarkComplete = async () => {
    if (videoWatched) return;
    setMarkLoading(true);
    try {
      await markComplete({ moduleId: mod._id });
      setVideoWatched(true);
    } catch {
      // ignore; keeps UI consistent if server fails
    } finally {
      setMarkLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Breadcrumb
          color={color}
          category={category}
          kategori={kategori}
          moduleTitle={mod.title}
        />
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Materi PRO
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Upgrade ke akun PRO untuk mengakses materi ini dan seluruh koleksi
            ujian simulasi.
          </p>
          <button
            onClick={openUpgradeDialog}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade ke PRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Breadcrumb
        color={color}
        category={category}
        kategori={kategori}
        moduleTitle={mod.title}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex gap-8 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-6">
            <VideoPlayer
              youtubeId={youtubeId}
              videoWatched={videoWatched}
              markLoading={markLoading}
              onMarkComplete={handleMarkComplete}
            />

            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${color.bg} ${color.text} border ${color.border}`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {category.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        videoWatched
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-50 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {videoWatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Video: Selesai
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Belum Ditonton
                        </>
                      )}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                    {mod.title}
                  </h1>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                {mod.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                <Chip
                  icon={BookOpen}
                  text={`${quizzes.length} quiz tersedia`}
                />
                <Chip
                  icon={Clock}
                  text={mod.isFree ? "Akses Gratis" : "Akses Pro"}
                />
              </div>
            </div>

            {/* Mobile sibling list */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-800 font-semibold hover:border-sky-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500" />
                  Modul dalam Kategori Ini
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    mobileNavOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileNavOpen && (
                <div className="mt-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <ModuleList
                    modules={siblings}
                    currentId={mod._id}
                    kategori={kategori}
                  />
                </div>
              )}
            </div>

            <QuizSection
              videoWatched={videoWatched}
              isPaidUser={isPaidUser}
              quizzes={quizzes}
            />
          </div>

          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div
                  className={`px-5 py-4 bg-gradient-to-r ${color.gradient}`}
                >
                  <h2 className="text-white font-bold text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Modul dalam Kategori Ini
                  </h2>
                  <p className="text-white/70 text-xs mt-0.5">
                    {category.name} — {siblings.length} modul
                  </p>
                </div>
                <ModuleList
                  modules={siblings}
                  currentId={mod._id}
                  kategori={kategori}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Breadcrumb({
  color,
  category,
  kategori,
  moduleTitle,
}: {
  color: { text: string };
  category: { name: string };
  kategori: string;
  moduleTitle: string;
}) {
  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100 px-4 md:px-6 py-3">
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-sm flex-wrap"
      >
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-sky-500 transition-colors font-medium"
        >
          EduHub
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <Link
          href="/materi"
          className="text-slate-400 hover:text-sky-500 transition-colors font-medium"
        >
          Materi
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <Link
          href={`/materi/${kategori}`}
          className={`font-semibold ${color.text} hover:opacity-80 transition-opacity`}
        >
          {category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-slate-700 font-medium truncate max-w-[160px] md:max-w-xs">
          {moduleTitle}
        </span>
      </nav>
    </div>
  );
}

function VideoPlayer({
  youtubeId,
  videoWatched,
  markLoading,
  onMarkComplete,
}: {
  youtubeId: string | null;
  videoWatched: boolean;
  markLoading: boolean;
  onMarkComplete: () => void;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-purple-400/20 rounded-2xl translate-y-1.5 translate-x-1.5 blur-sm transition-all duration-300 group-hover:translate-y-2 group-hover:translate-x-2" />

      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl aspect-video">
        {!youtubeId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 text-sm gap-2">
            <EyeOff className="w-8 h-8 text-white/40" />
            Video belum tersedia
          </div>
        ) : !playing ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group/thumb"
            onClick={() => setPlaying(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-900/80 to-purple-900/80" />
            {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail, replaced on click */}
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt="Thumbnail"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-2xl group-hover/thumb:scale-110 transition-transform duration-300">
                <PlayCircle className="w-10 h-10 text-white fill-white/30" />
              </div>
              <div className="text-center">
                <span className="text-white font-semibold text-lg">
                  Tonton Video Materi
                </span>
                <p className="text-white/60 text-sm mt-1">
                  Klik untuk mulai belajar
                </p>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video Materi"
          />
        )}
      </div>

      {!videoWatched && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onMarkComplete}
            disabled={markLoading}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {markLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Tandai sudah ditonton
          </button>
        </div>
      )}
    </div>
  );
}

type SiblingModule = {
  _id: Id<"modules">;
  title: string;
  slug: string;
  order: number;
};

function ModuleList({
  modules,
  currentId,
  kategori,
}: {
  modules: SiblingModule[];
  currentId: Id<"modules">;
  kategori: string;
}) {
  return (
    <ul className="divide-y divide-slate-50">
      {modules.map((m, i) => {
        const isCurrent = m._id === currentId;
        return (
          <li key={m._id}>
            <Link
              href={`/materi/${kategori}/${m.slug}`}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors group ${
                isCurrent ? "bg-sky-50" : ""
              }`}
            >
              <span
                className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-sm flex-1 min-w-0 leading-snug ${
                  isCurrent
                    ? "font-semibold text-sky-700"
                    : "text-slate-600"
                }`}
              >
                {m.title}
              </span>
              <span className="shrink-0">
                {isCurrent ? (
                  <PlayCircle className="w-4 h-4 text-sky-500 fill-sky-100" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type Quiz = {
  _id: Id<"quizzes">;
  title: string;
  type: "latihan" | "ujian";
  duration: number;
  maxQuestions: number;
  attempts: number;
  bestScore: number | null;
};

function QuizSection({
  videoWatched,
  isPaidUser,
  quizzes,
}: {
  videoWatched: boolean;
  isPaidUser: boolean;
  quizzes: Quiz[];
}) {
  if (!videoWatched) {
    return (
      <div className="relative bg-white rounded-2xl p-6 border border-dashed border-slate-200 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50" />
        <div className="relative z-10 flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <h3 className="font-bold text-slate-400 text-lg mb-1">
              Soal Latihan Terkunci
            </h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Tonton video materi terlebih dahulu untuk membuka soal latihan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center text-slate-500 text-sm">
        Belum ada quiz untuk materi ini.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-purple-600" />
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-purple-400/20 blur-2xl" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-white/80 text-sm font-medium">
            Video selesai — siap uji pemahamanmu?
          </span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
          Quiz Tersedia
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const isUjian = quiz.type === "ujian";
            const locked = isUjian && !isPaidUser;
            return (
              <QuizCardLink
                key={quiz._id}
                quiz={quiz}
                locked={locked}
                isUjian={isUjian}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizCardLink({
  quiz,
  locked,
  isUjian,
}: {
  quiz: Quiz;
  locked: boolean;
  isUjian: boolean;
}) {
  const inner = (
    <div
      className={`rounded-xl p-4 border flex flex-col gap-2 transition-all ${
        locked
          ? "bg-white/5 border-white/10 cursor-not-allowed"
          : "bg-white/10 border-white/20 hover:bg-white/15 hover:-translate-y-0.5 shadow-lg"
      }`}
    >
      <div className="flex items-center gap-2">
        {isUjian ? (
          <Trophy className="w-4 h-4 text-amber-300" />
        ) : (
          <PenLine className="w-4 h-4 text-sky-200" />
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {quiz.type}
        </span>
        {locked && (
          <span className="ml-auto bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </div>
      <p className="text-white font-semibold text-sm leading-snug truncate">
        {quiz.title}
      </p>
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>
          {quiz.maxQuestions} soal • {quiz.duration}m
        </span>
        {quiz.bestScore !== null && (
          <span className="font-semibold text-emerald-200">
            Best: {quiz.bestScore}%
          </span>
        )}
      </div>
    </div>
  );

  if (locked) return inner;

  return (
    <Link href={`/quiz/${quiz._id}`} className="block">
      {inner}
    </Link>
  );
}

function Chip({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
      <Icon className="w-3.5 h-3.5 text-slate-300" />
      {text}
    </div>
  );
}
