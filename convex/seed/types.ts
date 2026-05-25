// Shared types untuk seed data — match `convex/schema.ts`.

export type CorrectAnswer = "A" | "B" | "C" | "D" | "E";

export interface QuestionSpec {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: CorrectAnswer;
  explanation: string;
}

export interface QuestionBank {
  latihan: QuestionSpec[];
  ujian: QuestionSpec[];
}
