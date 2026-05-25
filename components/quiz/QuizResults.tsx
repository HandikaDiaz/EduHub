"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tilt3DCard } from "@/components/dashboard/Tilt3DCard";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  PlayCircle,
} from "lucide-react";

const YouTube = dynamic(() => import("react-youtube").then((m) => m.default), {
  ssr: false,
});

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;
type OptionKey = (typeof OPTION_KEYS)[number];

const OPTION_FIELDS: Record<OptionKey, string> = {
  A: "optionA",
  B: "optionB",
  C: "optionC",
  D: "optionD",
  E: "optionE",
};

const CIRCUMFERENCE = 2 * Math.PI * 70;

type FilterTab = "all" | "wrong" | "correct";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Question Card
// ---------------------------------------------------------------------------

type ReviewQuestion = {
  _id: string;
  question: string;
  imageUrl?: string;
  type?: "single" | "multiple" | "truefalse_table";

  // single & multiple
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  optionE?: string | null;
  correctAnswer?: string | null;
  correctAnswers?: string[] | null;

  // truefalse_table
  statements?: { text: string; isTrue: boolean }[] | null;

  // user answers
  chosen: string;
  chosens?: string[] | null;
  chosenStatements?: boolean[] | null;

  isCorrect: boolean;
  isUnanswered: boolean;
  explanation: string;
  explanationImageUrl?: string;
  explanationVideoUrl?: string;
};

function ReviewQuestionCard({
  q,
  index,
}: {
  q: ReviewQuestion;
  index: number;
}) {
  const type = q.type ?? "single";
  const [showVideo, setShowVideo] = useState(false);
  const videoId = q.explanationVideoUrl
    ? extractYouTubeId(q.explanationVideoUrl)
    : null;

  return (
    <Card className="border-0 shadow-sm overflow-hidden result-question-card">
      {/* Status strip */}
      <div
        className={cn(
          "h-1 w-full",
          q.isCorrect
            ? "bg-green-500"
            : q.isUnanswered
              ? "bg-gray-300"
              : "bg-red-500",
        )}
      />

      <CardContent className="space-y-4 pt-2">
        {/* Header: number + badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Soal {index + 1}
          </span>
          <Badge
            className={cn(
              "text-[10px] uppercase tracking-wider border-0",
              q.isCorrect
                ? "bg-green-50 text-green-700"
                : q.isUnanswered
                  ? "bg-gray-100 text-gray-500"
                  : "bg-red-50 text-red-700",
            )}
          >
            {q.isCorrect ? "Benar" : q.isUnanswered ? "Kosong" : "Salah"}
          </Badge>
        </div>

        {/* Question text */}
        <p className="text-sm leading-relaxed text-gray-900">{q.question}</p>

        {/* Question image */}
        {q.imageUrl && (
          <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={q.imageUrl}
              alt="Gambar soal"
              loading="lazy"
              className="w-full h-auto max-h-72 object-contain"
            />
          </div>
        )}

        {/* Options — render sesuai tipe soal */}
        {type === "truefalse_table" ? (
          <ReviewTrueFalseTable
            statements={q.statements ?? []}
            chosen={q.chosenStatements ?? []}
          />
        ) : type === "multiple" ? (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-purple-600 font-semibold">
              Pilihan ganda kompleks (multi-jawaban)
            </p>
            {OPTION_KEYS.map((key) => {
              const text = q[
                OPTION_FIELDS[key] as keyof typeof q
              ] as string | null;
              if (!text) return null;
              const correctSet = new Set(q.correctAnswers ?? []);
              const chosenSet = new Set(q.chosens ?? []);
              const isCorrectAnswer = correctSet.has(key);
              const isPicked = chosenSet.has(key);
              const isWrongPick = isPicked && !isCorrectAnswer;
              const isMissed = isCorrectAnswer && !isPicked;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
                    isCorrectAnswer
                      ? "border-green-200 bg-green-50"
                      : isWrongPick
                        ? "border-red-200 bg-red-50"
                        : "border-transparent bg-gray-50",
                  )}
                >
                  {isCorrectAnswer ? (
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                  ) : isWrongPick ? (
                    <XCircle className="size-4 shrink-0 text-red-500" />
                  ) : (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-gray-400">
                      {key}
                    </span>
                  )}
                  <span
                    className={cn(
                      "leading-snug flex-1",
                      isCorrectAnswer
                        ? "font-medium text-green-800"
                        : isWrongPick
                          ? "text-red-700"
                          : "text-gray-600",
                    )}
                  >
                    {text}
                  </span>
                  {isPicked && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      Pilihan kamu
                    </span>
                  )}
                  {isMissed && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600">
                      Terlewat
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // single
          <div className="space-y-2">
            {OPTION_KEYS.map((key) => {
              const text = q[
                OPTION_FIELDS[key] as keyof typeof q
              ] as string | null;
              if (!text) return null;
              const isCorrectAnswer = q.correctAnswer === key;
              const isUserWrong = q.chosen === key && !q.isCorrect;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
                    isCorrectAnswer
                      ? "border-green-200 bg-green-50"
                      : isUserWrong
                        ? "border-red-200 bg-red-50"
                        : "border-transparent bg-gray-50",
                  )}
                >
                  {isCorrectAnswer ? (
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                  ) : isUserWrong ? (
                    <XCircle className="size-4 shrink-0 text-red-500" />
                  ) : (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-gray-400">
                      {key}
                    </span>
                  )}
                  <span
                    className={cn(
                      "leading-snug",
                      isCorrectAnswer
                        ? "font-medium text-green-800"
                        : isUserWrong
                          ? "text-red-700"
                          : "text-gray-600",
                    )}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Expandable explanation */}
        <Accordion>
          <AccordionItem value="explanation" className="border-0">
            <AccordionTrigger className="text-sm font-medium text-brand-sky hover:no-underline py-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                Lihat Pembahasan
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-gray-700">
              <div className="space-y-3 rounded-lg bg-sky-50/50 p-3">
                <p>{q.explanation}</p>

                {q.explanationImageUrl && (
                  <div className="overflow-hidden rounded-lg border border-sky-100 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.explanationImageUrl}
                      alt="Gambar pembahasan"
                      loading="lazy"
                      className="w-full h-auto max-h-72 object-contain"
                    />
                  </div>
                )}

                {videoId && !showVideo && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 text-brand-purple hover:text-brand-purple/80 hover:bg-purple-50 h-auto px-2 py-1.5"
                    onClick={() => setShowVideo(true)}
                  >
                    <PlayCircle className="size-4" />
                    <span className="text-xs font-medium">
                      Tonton Video Pembahasan
                    </span>
                  </Button>
                )}

                {videoId && showVideo && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <YouTube
                      videoId={videoId}
                      className="absolute inset-0"
                      opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: { rel: 0, modestbranding: 1 },
                      }}
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function QuizResults({ attemptId }: { attemptId: Id<"attempts"> }) {
  const data = useQuery(api.results.getAttemptResult, { attemptId });
  const [filterTab, setFilterTab] = useState<FilterTab>("wrong");
  const reviewRef = useRef<HTMLDivElement>(null);

  if (data === undefined) return <ResultsSkeleton />;

  if (data === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] p-6 text-center">
        <p className="text-lg font-medium text-gray-700">
          Hasil tidak ditemukan.
        </p>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Kembali
        </Button>
      </div>
    );
  }

  const { attempt, quiz, moduleName, categoryName, questions, progress, nextModule } = data;
  const passed = attempt.isPassed;
  const scoreOffset = CIRCUMFERENCE * (1 - attempt.score / 100);

  const filteredQuestions =
    filterTab === "all"
      ? questions
      : filterTab === "wrong"
        ? questions.filter((q) => !q.isCorrect)
        : questions.filter((q) => q.isCorrect);

  const scrollToReview = () => {
    reviewRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ================================================================ */}
      {/* 1. RESULT HERO — compact, horizontal on sm+                      */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-sky via-sky-500 to-brand-purple px-4 pb-10 pt-8">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 size-56 rounded-full bg-purple-400/10 blur-3xl" />

        {/* Back button — top-left */}
        <div className="relative mx-auto max-w-2xl mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-white hover:bg-white/15 hover:text-white -ml-2"
            render={<Link href="/dashboard" />}
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Button>
        </div>

        <div className="relative mx-auto max-w-2xl result-hero-fade">
          {/* Quiz meta */}
          <div className="text-center space-y-1 mb-6">
            <Badge className="bg-white/20 text-white text-[10px] uppercase tracking-wider border-0">
              {quiz.type}
            </Badge>
            <p className="text-sm text-white/80">
              {categoryName} &mdash; {moduleName}
            </p>
          </div>

          {/* Score + stats row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Score ring */}
            <div className="relative size-36 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={passed ? "#22C55E" : "#EF4444"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={scoreOffset}
                  className="quiz-score-fill"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tracking-tight text-white">
                  {attempt.score}
                </span>
                <span className="text-xs text-white/60">/100</span>
              </div>
            </div>

            {/* Stats block */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <Badge
                className={cn(
                  "text-sm px-4 py-1 border-0",
                  passed
                    ? "bg-green-500/90 text-white"
                    : "bg-red-500/90 text-white",
                )}
              >
                {passed ? "LULUS" : "BELUM LULUS"}
              </Badge>

              <div className="grid grid-cols-3 gap-3 text-white">
                <div className="sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <CheckCircle2 className="size-4 text-green-300" />
                    <span className="text-lg font-bold">
                      {attempt.totalCorrect}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60">Benar</span>
                </div>
                <div className="sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <XCircle className="size-4 text-red-300" />
                    <span className="text-lg font-bold">
                      {attempt.totalWrong}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60">Salah</span>
                </div>
                <div className="sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <MinusCircle className="size-4 text-white/50" />
                    <span className="text-lg font-bold">
                      {attempt.totalUnanswered}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60">Kosong</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-white/70">
                <Clock className="size-3.5" />
                Waktu: {formatTime(attempt.timeTaken)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. ACTION BAR — sticky on scroll                                 */}
      {/* ================================================================ */}
      <section className="mx-auto -mt-5 max-w-2xl px-4 relative z-10">
        <Tilt3DCard tiltDeg={2}>
          <Card className="border-0 shadow-lg">
            <CardContent className="py-1">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-brand-sky text-white hover:bg-brand-sky/90 gap-1.5"
                  onClick={scrollToReview}
                >
                  <BookOpen className="size-4" />
                  <span className="hidden sm:inline">Lihat </span>Pembahasan
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 border-brand-purple/30 text-brand-purple hover:bg-purple-50"
                  render={<Link href={`/quiz/${quiz._id}`} />}
                >
                  <RotateCcw className="size-3.5" />
                  Coba Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        </Tilt3DCard>
      </section>

      {/* ================================================================ */}
      {/* 4. REVIEW SECTION                                                */}
      {/* ================================================================ */}
      <section ref={reviewRef} className="mx-auto max-w-2xl px-4 pt-10 pb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Pembahasan Soal
        </h2>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {(
            [
              { key: "wrong" as FilterTab, label: "Salah", count: attempt.totalWrong + attempt.totalUnanswered },
              { key: "correct" as FilterTab, label: "Benar", count: attempt.totalCorrect },
              { key: "all" as FilterTab, label: "Semua", count: questions.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filterTab === tab.key
                  ? tab.key === "wrong"
                    ? "bg-red-100 text-red-700"
                    : tab.key === "correct"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200",
              )}
            >
              {tab.label}
              <span className="tabular-nums text-xs opacity-70">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Question cards */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <CheckCircle2 className="size-8 text-green-400" />
                <p className="text-sm text-muted-foreground">
                  {filterTab === "wrong"
                    ? "Tidak ada jawaban salah — sempurna!"
                    : "Tidak ada soal dalam kategori ini."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((q) => {
              const originalIdx = questions.findIndex(
                (oq) => oq._id === q._id,
              );
              return (
                <ReviewQuestionCard
                  key={q._id}
                  q={q}
                  index={originalIdx}
                />
              );
            })
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5. BOTTOM CTA                                                    */}
      {/* ================================================================ */}
      <section className="border-t bg-white px-4 py-6">
        <div className="mx-auto max-w-sm space-y-3 text-center">
          {nextModule && (
            <Button
              className="w-full gap-1.5 bg-brand-sky text-white hover:bg-brand-sky/90"
              render={
                <Link
                  href={`/materi/${nextModule.categorySlug}/${nextModule.slug}`}
                />
              }
            >
              Lanjut ke Materi Berikutnya
              <ArrowRight className="size-4" />
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Kamu sudah menyelesaikan{" "}
            <span className="font-semibold text-gray-700">
              {progress.completed}/{progress.total}
            </span>{" "}
            modul {categoryName}!
          </p>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewTrueFalseTable — render statement table di pembahasan, highlight
// jawaban user vs jawaban benar.
// ---------------------------------------------------------------------------

function ReviewTrueFalseTable({
  statements,
  chosen,
}: {
  statements: { text: string; isTrue: boolean }[];
  chosen: boolean[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-purple-600 font-semibold">
        Tabel Benar/Salah
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-[10px] font-semibold text-slate-500 uppercase px-2 py-1.5 w-8">
                #
              </th>
              <th className="text-left text-[10px] font-semibold text-slate-500 uppercase px-2 py-1.5">
                Pernyataan
              </th>
              <th className="text-center text-[10px] font-semibold text-slate-500 uppercase px-2 py-1.5 w-20">
                Jawabanmu
              </th>
              <th className="text-center text-[10px] font-semibold text-slate-500 uppercase px-2 py-1.5 w-20">
                Kunci
              </th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s, idx) => {
              const userPick = chosen[idx];
              const userAnswered = typeof userPick === "boolean";
              const isUserCorrect = userAnswered && userPick === s.isTrue;

              return (
                <tr
                  key={idx}
                  className={cn(
                    "border-t border-slate-100",
                    isUserCorrect
                      ? "bg-green-50/40"
                      : userAnswered
                        ? "bg-red-50/40"
                        : "bg-gray-50/40",
                  )}
                >
                  <td className="px-2 py-2 text-slate-400 font-bold align-top tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-2 py-2 text-gray-800 leading-snug">
                    {s.text}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {!userAnswered ? (
                      <span className="text-[10px] text-gray-400 italic">
                        kosong
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          isUserCorrect
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {userPick ? "Benar" : "Salah"}
                        {isUserCorrect ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <XCircle className="size-3" />
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className={cn(
                        "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                        s.isTrue
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {s.isTrue ? "Benar" : "Salah"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
