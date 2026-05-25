import type { Doc } from "../_generated/dataModel";

export type AnswerChoice = "A" | "B" | "C" | "D" | "E";

export type AttemptAnswer = {
  questionId: string;
  chosen: string;
  chosens?: string[];
  chosenStatements?: boolean[];
};

export type QuestionType = "single" | "multiple" | "truefalse_table";

/** Default `single` untuk row lama yang belum punya field `type`. */
export const getQuestionType = (q: Doc<"questions">): QuestionType =>
  q.type ?? "single";

/**
 * Hitung skor untuk satu jawaban — return value 0..1 (fraksi nilai soal).
 *
 * - single           : 1 jika `chosen === correctAnswer`, else 0
 * - multiple         : TP / (jumlahBenar + FP). Adil tanpa skor negatif.
 *                      User asal pilih semua → skor turun karena FP > 0.
 * - truefalse_table  : (jumlah pernyataan dijawab tepat) / total
 */
export const scoreAnswer = (
  question: Doc<"questions">,
  answer: AttemptAnswer | undefined,
): number => {
  const type = getQuestionType(question);

  if (type === "single") {
    if (!answer || !answer.chosen) return 0;
    return answer.chosen === question.correctAnswer ? 1 : 0;
  }

  if (type === "multiple") {
    const correct = new Set(question.correctAnswers ?? []);
    if (correct.size === 0) return 0;

    const picked = new Set(answer?.chosens ?? []);
    if (picked.size === 0) return 0;

    let truePositive = 0;
    let falsePositive = 0;
    for (const p of picked) {
      if (correct.has(p as AnswerChoice)) truePositive++;
      else falsePositive++;
    }
    // TP / (totalCorrect + FP) — proporsional, tidak negatif, anti-cheat asal.
    return truePositive / (correct.size + falsePositive);
  }

  if (type === "truefalse_table") {
    const stmts = question.statements ?? [];
    if (stmts.length === 0) return 0;

    const choices = answer?.chosenStatements ?? [];
    let correctCount = 0;
    for (let i = 0; i < stmts.length; i++) {
      const userPick = choices[i];
      // Hanya hitung benar kalau user betul-betul pilih (bukan undefined).
      if (typeof userPick === "boolean" && userPick === stmts[i].isTrue) {
        correctCount++;
      }
    }
    return correctCount / stmts.length;
  }

  return 0;
};

/** Apakah user sudah menjawab soal (apa pun tipenya)? */
export const isAnswered = (
  question: Doc<"questions">,
  answer: AttemptAnswer | undefined,
): boolean => {
  if (!answer) return false;
  const type = getQuestionType(question);

  if (type === "single") return Boolean(answer.chosen);
  if (type === "multiple") return (answer.chosens?.length ?? 0) > 0;
  if (type === "truefalse_table") {
    return (answer.chosenStatements ?? []).some(
      (v) => typeof v === "boolean",
    );
  }
  return false;
};
