"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tilt3DCard } from "@/components/dashboard/Tilt3DCard";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Send,
  Home,
  Timer,
  BookOpen,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function QuizSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden px-4 py-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="size-9 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="flex-1 px-4 py-4">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="mb-6 h-20 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result Screen
// ---------------------------------------------------------------------------

function ResultScreen({
  score,
  totalCorrect,
  totalWrong,
  totalUnanswered,
  quizId,
  attemptId,
}: {
  score: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  quizId: Id<"quizzes">;
  attemptId: Id<"attempts"> | null;
}) {
  const passed = score >= 70;
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-6">
      <div className="quiz-fade-in w-full max-w-sm space-y-8 text-center">
        {/* Score ring */}
        <div className="relative mx-auto size-44">
          <svg className="size-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#e5e7eb"
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
              strokeDashoffset={offset}
              className="quiz-score-fill"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tracking-tight text-gray-900">
              {score}
            </span>
            <span className="text-sm text-muted-foreground">Nilai</span>
          </div>
        </div>

        <p
          className={cn(
            "text-lg font-semibold",
            passed ? "text-green-600" : "text-red-500",
          )}
        >
          {passed ? "Selamat, kamu lulus!" : "Belum lulus, coba lagi!"}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-green-50 p-3">
            <CheckCircle2 className="mx-auto mb-1 size-5 text-green-600" />
            <p className="text-xl font-bold text-green-700">{totalCorrect}</p>
            <p className="text-[11px] text-green-600">Benar</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <XCircle className="mx-auto mb-1 size-5 text-red-500" />
            <p className="text-xl font-bold text-red-600">{totalWrong}</p>
            <p className="text-[11px] text-red-500">Salah</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <MinusCircle className="mx-auto mb-1 size-5 text-gray-400" />
            <p className="text-xl font-bold text-gray-600">
              {totalUnanswered}
            </p>
            <p className="text-[11px] text-gray-500">Kosong</p>
          </div>
        </div>

        <div className="space-y-2">
          {attemptId && (
            <Button
              className="w-full bg-brand-sky text-white hover:bg-brand-sky/90 gap-1.5"
              render={
                <Link href={`/quiz/${quizId}/result/${attemptId}`} />
              }
            >
              <BookOpen className="size-4" />
              Lihat Pembahasan Lengkap
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full gap-1.5"
            render={<Link href="/dashboard" />}
          >
            <Home className="size-4" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main QuizPlayer
// ---------------------------------------------------------------------------

export function QuizPlayer({ quizId }: { quizId: Id<"quizzes"> }) {
  const router = useRouter();
  const quizData = useQuery(api.quiz.getQuizForTaking, { quizId });
  const submitMutation = useMutation(api.quiz.submitAttempt);

  // ---- Answer state shape (3 tipe soal) ----
  type AnswerState = {
    /** Single — huruf pilihan A-E (atau "") */
    chosen?: string;
    /** Multiple — array huruf */
    chosens?: string[];
    /** Truefalse table — index ke pernyataan, true=B, false=S, undefined=belum */
    chosenStatements?: boolean[];
  };

  // State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimesUpModal, setShowTimesUpModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    attemptId: Id<"attempts"> | null;
    score: number;
    totalCorrect: number;
    totalWrong: number;
    totalUnanswered: number;
  } | null>(null);

  const navRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<() => Promise<void>>(async () => {});

  // Init timer once data arrives (skip locked variant — tidak ada `quiz`).
  useEffect(() => {
    if (quizData && !quizData.locked && !timerActive) {
      setTimeLeft(quizData.quiz.duration);
      setTimerActive(true);
    }
  }, [quizData, timerActive]);

  // Countdown via recursive setTimeout
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || result) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timerActive, timeLeft, result]);

  // Auto-scroll nav pill into view
  useEffect(() => {
    const el = navRef.current?.children[currentIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentIdx]);

  // Handlers — single (radio-style)
  const selectAnswer = useCallback((questionId: string, chosen: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], chosen },
    }));
  }, []);

  // Handler — multiple (toggle membership in chosens array)
  const toggleMultiAnswer = useCallback(
    (questionId: string, letter: string) => {
      setAnswers((prev) => {
        const current = prev[questionId]?.chosens ?? [];
        const next = current.includes(letter)
          ? current.filter((c) => c !== letter)
          : [...current, letter];
        return {
          ...prev,
          [questionId]: { ...prev[questionId], chosens: next },
        };
      });
    },
    [],
  );

  // Handler — truefalse_table (set per index pernyataan)
  const setStatementAnswer = useCallback(
    (questionId: string, idx: number, value: boolean) => {
      setAnswers((prev) => {
        const current = prev[questionId]?.chosenStatements ?? [];
        const next = [...current];
        next[idx] = value;
        return {
          ...prev,
          [questionId]: { ...prev[questionId], chosenStatements: next },
        };
      });
    },
    [],
  );

  const goTo = useCallback(
    (idx: number) => {
      setSlideDir(idx > currentIdx ? 1 : -1);
      setCurrentIdx(idx);
    },
    [currentIdx],
  );

  const handleSubmit = useCallback(async () => {
    if (!quizData || quizData.locked || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const answerArray = quizData.questions.map((q) => {
        const a = answers[q._id] ?? {};
        return {
          questionId: q._id as Id<"questions">,
          chosen: a.chosen ?? "",
          chosens: a.chosens,
          chosenStatements: a.chosenStatements,
        };
      });
      const elapsed = quizData.quiz.duration - timeLeft;
      const res = await submitMutation({
        quizId,
        answers: answerArray,
        timeTaken: elapsed,
      });
      setResult({
        attemptId: res.attemptId,
        score: res.score,
        totalCorrect: res.totalCorrect,
        totalWrong: res.totalWrong,
        totalUnanswered: res.totalUnanswered,
      });
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [quizData, answers, timeLeft, isSubmitting, quizId, submitMutation]);

  submitRef.current = handleSubmit;

  // Time's up
  useEffect(() => {
    if (timerActive && timeLeft <= 0 && !result && !isSubmitting && !showTimesUpModal) {
      setShowTimesUpModal(true);
      submitRef.current?.();
    }
  }, [timerActive, timeLeft, result, isSubmitting, showTimesUpModal]);

  // --- Render gates ---
  if (quizData === undefined) return <QuizSkeleton />;

  if (quizData === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] p-6 text-center">
        <p className="text-lg font-medium text-gray-700">
          Quiz tidak ditemukan atau belum dipublikasikan.
        </p>
        <Button
          variant="outline"
          render={<Link href="/dashboard" />}
        >
          Kembali
        </Button>
      </div>
    );
  }

  if (quizData.locked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-3xl shadow-lg">
          🔒
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">Khusus Pro</p>
          <p className="text-sm text-gray-500 mt-1">
            Latihan ini terkunci. Upgrade ke Pro untuk membukanya.
          </p>
        </div>
        <Button render={<Link href="/dashboard" />}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  if (result && !showTimesUpModal) {
    return (
      <ResultScreen
        score={result.score}
        totalCorrect={result.totalCorrect}
        totalWrong={result.totalWrong}
        totalUnanswered={result.totalUnanswered}
        quizId={quizId}
        attemptId={result.attemptId}
      />
    );
  }

  const { quiz, questions, moduleName, categoryName } = quizData;
  const question = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isLast = currentIdx === questions.length - 1;
  const isTimeLow = timeLeft < 60 && timeLeft > 0;

  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* ================================================================ */}
      {/* 1. STICKY HEADER                                                 */}
      {/* ================================================================ */}
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: back + title */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => router.back()}
              className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "shrink-0 text-[10px] uppercase tracking-wider border-0",
                    quiz.type === "ujian"
                      ? "bg-brand-purple/10 text-brand-purple"
                      : "bg-brand-sky/10 text-brand-sky",
                  )}
                >
                  {quiz.type}
                </Badge>
                <p className="truncate text-sm font-medium text-gray-900">
                  {categoryName && `${categoryName} — `}
                  {moduleName}
                </p>
              </div>
            </div>
          </div>

          {/* Center: timer */}
          <div
            className={cn(
              "mx-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-colors",
              isTimeLow
                ? "bg-red-50 text-red-600 quiz-timer-pulse"
                : "bg-gray-100 text-gray-700",
            )}
          >
            <Timer className="size-3.5" />
            {formatTimer(timeLeft)}
          </div>

          {/* Right: progress */}
          <p className="shrink-0 text-xs font-medium text-muted-foreground">
            <span className="text-gray-900">{currentIdx + 1}</span>/
            {questions.length}
          </p>
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. QUESTION NAVIGATION PILLS                                     */}
      {/* ================================================================ */}
      <div className="border-b bg-white/60">
        <div
          ref={navRef}
          className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none"
        >
          {questions.map((q, i) => {
            const isCurrent = i === currentIdx;
            const ans = answers[q._id];
            const isAnswered =
              q.type === "single"
                ? !!ans?.chosen
                : q.type === "multiple"
                  ? (ans?.chosens?.length ?? 0) > 0
                  : q.type === "truefalse_table"
                    ? (ans?.chosenStatements ?? []).some(
                        (v) => typeof v === "boolean",
                      )
                    : false;
            return (
              <button
                key={q._id}
                onClick={() => goTo(i)}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150",
                  isCurrent
                    ? "scale-110 bg-brand-purple text-white ring-2 ring-brand-purple/30"
                    : isAnswered
                      ? "bg-brand-sky text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. QUESTION CARD                                                 */}
      {/* ================================================================ */}
      <main className="flex-1 px-4 py-5 pb-28">
        <div
          key={`q-${currentIdx}`}
          className="quiz-slide-in"
          style={
            {
              "--quiz-slide-from": slideDir > 0 ? "24px" : "-24px",
            } as CSSProperties
          }
        >
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Soal {currentIdx + 1} dari {questions.length}
          </p>

          <Tilt3DCard tiltDeg={2} className="mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="space-y-4">
                <p className="text-base leading-relaxed text-gray-900 sm:text-lg">
                  {question.question}
                </p>
                {question.imageUrl && (
                  <div className="relative w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- GDrive CDN tidak whitelisted di next/image */}
                    <img
                      src={question.imageUrl}
                      alt="Gambar soal"
                      loading="lazy"
                      className="w-full h-auto max-h-[480px] object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Tilt3DCard>

          {/* Answer area — render sesuai tipe soal */}
          {question.type === "truefalse_table" ? (
            <TrueFalseTable
              questionId={question._id}
              statements={question.statements ?? []}
              answers={answers[question._id]?.chosenStatements ?? []}
              onChange={(idx, value) =>
                setStatementAnswer(question._id, idx, value)
              }
            />
          ) : question.type === "multiple" ? (
            <div className="space-y-2.5">
              <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Pilih semua jawaban yang benar
              </p>
              {OPTION_KEYS.map((key) => {
                const text = question[
                  OPTION_FIELDS[key] as keyof typeof question
                ] as string | null;
                if (!text) return null;
                const isSelected =
                  answers[question._id]?.chosens?.includes(key) ?? false;
                return (
                  <button
                    key={key}
                    onClick={() => toggleMultiAnswer(question._id, key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0.5",
                      isSelected
                        ? "border-purple-400 bg-purple-50 shadow-sm shadow-purple-200/40 -translate-y-px"
                        : "border-transparent bg-white shadow-sm hover:border-gray-200",
                    )}
                  >
                    {/* Checkbox visual */}
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                        isSelected
                          ? "border-purple-500 bg-purple-500 text-white"
                          : "border-gray-300 bg-white",
                      )}
                    >
                      {isSelected && <CheckCircle2 className="size-4" />}
                    </span>
                    {/* Letter pill */}
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                        isSelected
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {key}
                    </span>
                    <span className="text-sm leading-snug text-gray-700 flex-1">
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            // single (default)
            <div className="space-y-3">
              {OPTION_KEYS.map((key) => {
                const text = question[
                  OPTION_FIELDS[key] as keyof typeof question
                ] as string | null;
                if (!text) return null;
                const isSelected = answers[question._id]?.chosen === key;

                return (
                  <button
                    key={key}
                    onClick={() => selectAnswer(question._id, key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left",
                      "transition-all duration-150 ease-out",
                      "hover:-translate-y-0.5 hover:shadow-md",
                      "active:translate-y-0.5 active:shadow-sm",
                      isSelected
                        ? "border-brand-sky bg-brand-sky-bg shadow-sm shadow-sky-200/40 -translate-y-px"
                        : "border-transparent bg-white shadow-sm hover:border-gray-200",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                        isSelected
                          ? "bg-brand-sky text-white"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {key}
                    </span>
                    <span className="text-sm leading-snug text-gray-700">
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ================================================================ */}
      {/* 4. NAVIGATION BUTTONS (fixed bottom)                             */}
      {/* ================================================================ */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => goTo(currentIdx - 1)}
            className="gap-1"
          >
            <ArrowLeft className="size-4" />
            Sebelumnya
          </Button>

          {isLast ? (
            <Button
              className="gap-1 bg-gradient-to-r from-brand-purple to-purple-700 text-white hover:opacity-90"
              onClick={() => setShowSubmitModal(true)}
            >
              <Send className="size-4" />
              Kumpulkan
            </Button>
          ) : (
            <Button
              className="gap-1 bg-brand-sky text-white hover:bg-brand-sky/90"
              onClick={() => goTo(currentIdx + 1)}
            >
              Selanjutnya
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </footer>

      {/* ================================================================ */}
      {/* 5. SUBMIT CONFIRMATION MODAL                                     */}
      {/* ================================================================ */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Yakin ingin mengumpulkan?</DialogTitle>
            <DialogDescription>
              Periksa kembali jawabanmu sebelum mengumpulkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <span className="text-sm text-green-700">Soal terjawab</span>
              <span className="font-semibold text-green-700">
                {answeredCount}/{questions.length}
              </span>
            </div>
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-700">
                  {unansweredCount} soal belum dijawab
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Kembali
            </Button>
            <Button
              className="bg-gradient-to-r from-brand-purple to-purple-700 text-white hover:opacity-90"
              onClick={() => {
                setShowSubmitModal(false);
                handleSubmit();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Mengumpulkan..." : "Kumpulkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* 6. TIME'S UP MODAL                                               */}
      {/* ================================================================ */}
      <Dialog open={showTimesUpModal}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-red-100">
              <Clock className="size-7 text-red-500" />
            </div>
            <DialogTitle className="text-center text-lg">
              Waktu Habis!
            </DialogTitle>
            <DialogDescription className="text-center">
              Jawabanmu otomatis dikumpulkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              className="w-full bg-brand-sky text-white hover:bg-brand-sky/90"
              onClick={() => setShowTimesUpModal(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Lihat Hasil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TrueFalseTable — render statement table dengan kolom Benar/Salah per row.
// ---------------------------------------------------------------------------

function TrueFalseTable({
  questionId,
  statements,
  answers,
  onChange,
}: {
  questionId: string;
  statements: { text: string }[];
  /** Array boolean per index — undefined = belum dijawab. */
  answers: boolean[];
  onChange: (idx: number, value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wide flex items-center gap-1">
        <CheckCircle2 className="size-3" />
        Centang BENAR atau SALAH untuk tiap pernyataan
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 w-10">
                #
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
                Pernyataan
              </th>
              <th className="text-center text-[11px] font-semibold text-emerald-700 uppercase tracking-wide px-2 py-2 w-16 sm:w-20">
                Benar
              </th>
              <th className="text-center text-[11px] font-semibold text-rose-700 uppercase tracking-wide px-2 py-2 w-16 sm:w-20">
                Salah
              </th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s, idx) => {
              const value = answers[idx];
              return (
                <tr
                  key={idx}
                  className="border-t border-slate-100 hover:bg-slate-50/40 transition-colors"
                >
                  <td className="px-3 py-3 text-xs font-bold text-slate-400 align-top tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-3 text-sm leading-relaxed text-gray-800">
                    {s.text}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onChange(idx, true)}
                      aria-pressed={value === true}
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-md border-2 transition-all",
                        value === true
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "bg-white border-slate-300 text-slate-300 hover:border-emerald-400 hover:text-emerald-500",
                      )}
                    >
                      {value === true && <CheckCircle2 className="size-4" />}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onChange(idx, false)}
                      aria-pressed={value === false}
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-md border-2 transition-all",
                        value === false
                          ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                          : "bg-white border-slate-300 text-slate-300 hover:border-rose-400 hover:text-rose-500",
                      )}
                    >
                      {value === false && <XCircle className="size-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Hidden anchor untuk a11y reference */}
      <span className="sr-only" id={`tf-${questionId}-instructions`}>
        Setiap pernyataan harus dijawab dengan benar atau salah.
      </span>
    </div>
  );
}
