import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import type { Id } from "@/convex/_generated/dataModel";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <QuizPlayer quizId={quizId as Id<"quizzes">} />;
}
