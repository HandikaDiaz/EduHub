import { QuizResults } from "@/components/quiz/QuizResults";
import type { Id } from "@/convex/_generated/dataModel";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <QuizResults attemptId={attemptId as Id<"attempts">} />;
}
