import { query } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Hasil Saya — full results overview for the authenticated user
// ---------------------------------------------------------------------------

export const getMyResults = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.isDeleted) return null;

    const categories = await ctx.db.query("categories").collect();
    const allModules = await ctx.db.query("modules").collect();
    const allQuizzes = await ctx.db.query("quizzes").collect();
    const userAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // ── Overall stats ──
    const totalAttempts = userAttempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            userAttempts.reduce((s, a) => s + a.score, 0) / totalAttempts,
          )
        : 0;
    const passCount = userAttempts.filter((a) => a.isPassed).length;
    const passRate =
      totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;
    const totalTimeSec = userAttempts.reduce((s, a) => s + a.timeTaken, 0);

    // ── Category breakdown ──
    const categoryStats = categories
      .sort((a, b) => a.order - b.order)
      .map((cat) => {
        const catModuleIds = new Set(
          allModules
            .filter((m) => m.categoryId === cat._id)
            .map((m) => m._id),
        );
        const catQuizIds = new Set(
          allQuizzes
            .filter((q) => catModuleIds.has(q.moduleId))
            .map((q) => q._id),
        );
        const catAttempts = userAttempts.filter((a) =>
          catQuizIds.has(a.quizId),
        );
        const catAvg =
          catAttempts.length > 0
            ? Math.round(
                catAttempts.reduce((s, a) => s + a.score, 0) /
                  catAttempts.length,
              )
            : 0;
        const catBest =
          catAttempts.length > 0
            ? Math.max(...catAttempts.map((a) => a.score))
            : 0;
        const catPassCount = catAttempts.filter((a) => a.isPassed).length;

        return {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          attempts: catAttempts.length,
          avgScore: catAvg,
          bestScore: catBest,
          passCount: catPassCount,
          passRate:
            catAttempts.length > 0
              ? Math.round((catPassCount / catAttempts.length) * 100)
              : 0,
        };
      });

    // ── Score trend (last 20, oldest→newest for chart) ──
    const sortedByDate = [...userAttempts].sort(
      (a, b) => a.completedAt - b.completedAt,
    );
    const scoreTrend = sortedByDate.slice(-20).map((a) => {
      const quiz = allQuizzes.find((q) => q._id === a.quizId);
      const mod = quiz
        ? allModules.find((m) => m._id === quiz.moduleId)
        : null;
      const cat = mod
        ? categories.find((c) => c._id === mod.categoryId)
        : null;
      return {
        score: a.score,
        isPassed: a.isPassed,
        completedAt: a.completedAt,
        categoryName: cat?.name ?? "",
      };
    });

    // ── Full history (newest first; no artificial cap, client paginates) ──
    const history = [...userAttempts]
      .sort((a, b) => b.completedAt - a.completedAt)
      .map((a) => {
        const quiz = allQuizzes.find((q) => q._id === a.quizId);
        const mod = quiz
          ? allModules.find((m) => m._id === quiz.moduleId)
          : null;
        const cat = mod
          ? categories.find((c) => c._id === mod.categoryId)
          : null;
        return {
          _id: a._id,
          quizId: a.quizId,
          quizTitle: quiz?.title ?? "",
          quizType: (quiz?.type ?? "latihan") as "latihan" | "ujian",
          moduleName: mod?.title ?? "",
          categoryName: cat?.name ?? "",
          score: a.score,
          totalCorrect: a.totalCorrect,
          totalWrong: a.totalWrong,
          totalUnanswered: a.totalUnanswered,
          timeTaken: a.timeTaken,
          isPassed: a.isPassed,
          completedAt: a.completedAt,
        };
      });

    return {
      stats: { totalAttempts, avgScore, passRate, totalTimeSec },
      categoryStats,
      scoreTrend,
      history,
    };
  },
});

export const getAttemptResult = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, { attemptId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const attempt = await ctx.db.get(attemptId);
    if (!attempt || attempt.userId !== user._id) return null;

    const quiz = await ctx.db.get(attempt.quizId);
    if (!quiz) return null;

    const mod = await ctx.db.get(quiz.moduleId);
    const categories = await ctx.db.query("categories").collect();
    const category = mod
      ? categories.find((c) => c._id === mod.categoryId)
      : null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
      .collect();

    // Build reviewed questions with correct answers + user answers
    const reviewQuestions = questions
      .sort((a, b) => a.order - b.order)
      .map((q) => {
        const userAnswer = attempt.answers.find((a) => a.questionId === q._id);
        const type = q.type ?? ("single" as const);

        // Hitung correctness per tipe — pembahasan butuh tahu apakah jawaban
        // user dianggap benar penuh (1.0) atau parsial.
        let isCorrect = false;
        let isUnanswered = false;

        if (type === "single") {
          const chosen = userAnswer?.chosen ?? "";
          isCorrect = chosen === q.correctAnswer;
          isUnanswered = !chosen;
        } else if (type === "multiple") {
          const chosens = userAnswer?.chosens ?? [];
          isUnanswered = chosens.length === 0;
          if (!isUnanswered) {
            const correct = new Set(q.correctAnswers ?? []);
            const picked = new Set(chosens);
            isCorrect =
              picked.size === correct.size &&
              [...picked].every((p) => correct.has(p as never));
          }
        } else if (type === "truefalse_table") {
          const choices = userAnswer?.chosenStatements ?? [];
          isUnanswered = !choices.some((v) => typeof v === "boolean");
          if (!isUnanswered) {
            const stmts = q.statements ?? [];
            isCorrect = stmts.every(
              (s, i) => choices[i] === s.isTrue,
            );
          }
        }

        return {
          _id: q._id,
          question: q.question,
          imageUrl: q.imageUrl,
          type,
          // single & multiple
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          correctAnswer: q.correctAnswer ?? null,
          correctAnswers: q.correctAnswers ?? null,
          // truefalse_table
          statements: q.statements ?? null,
          // user answers per tipe
          chosen: userAnswer?.chosen ?? "",
          chosens: userAnswer?.chosens ?? null,
          chosenStatements: userAnswer?.chosenStatements ?? null,

          isCorrect,
          isUnanswered,
          explanation: q.explanation,
          explanationImageUrl: q.explanationImageUrl,
          explanationVideoUrl: q.explanationVideoUrl,
        };
      });

    // Progress in category
    const categoryModules = mod
      ? await ctx.db
          .query("modules")
          .withIndex("by_category", (q) => q.eq("categoryId", mod.categoryId))
          .collect()
      : [];
    const publishedModules = categoryModules.filter((m) => m.isPublished);
    const videoProgress = await ctx.db
      .query("videoProgress")
      .withIndex("by_user_module", (q) => q.eq("userId", user._id))
      .collect();
    const completedModules = publishedModules.filter((m) =>
      videoProgress.some((v) => v.moduleId === m._id && v.isCompleted),
    ).length;

    // Find next module
    let nextModule = null;
    if (mod) {
      const nextMod = publishedModules
        .sort((a, b) => a.order - b.order)
        .find((m) => m.order > mod.order);
      if (nextMod) {
        nextModule = {
          _id: nextMod._id,
          title: nextMod.title,
          slug: nextMod.slug,
          categorySlug: category?.slug ?? "",
        };
      }
    }

    return {
      attempt: {
        score: attempt.score,
        totalCorrect: attempt.totalCorrect,
        totalWrong: attempt.totalWrong,
        totalUnanswered: attempt.totalUnanswered,
        timeTaken: attempt.timeTaken,
        isPassed: attempt.isPassed,
        completedAt: attempt.completedAt,
      },
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        type: quiz.type,
        duration: quiz.duration,
      },
      moduleName: mod?.title ?? "",
      categoryName: category?.name ?? "",
      categorySlug: category?.slug ?? "",
      questions: reviewQuestions,
      progress: {
        completed: completedModules,
        total: publishedModules.length,
      },
      nextModule,
    };
  },
});
