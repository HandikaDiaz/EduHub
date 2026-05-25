import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { effectiveTier, requireAdmin } from "./lib/auth";
import {
  isAnswered,
  scoreAnswer,
  type AttemptAnswer,
} from "./lib/scoring";

export const getQuizForTaking = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.isDeleted) return null;

    const quiz = await ctx.db.get(quizId);
    if (!quiz || !quiz.isPublished) return null;

    const mod = await ctx.db.get(quiz.moduleId);

    // Tier access guard — free user tidak boleh buka quiz pro.
    // isFree berlaku per quiz; fallback ke modul untuk row lama.
    const quizIsFree = quiz.isFree ?? mod?.isFree ?? false;
    const tier = effectiveTier(user);
    if (!quizIsFree && tier === "free") {
      return { locked: true as const };
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
      .collect();

    const category = mod
      ? await ctx.db.query("categories").collect().then((cats) => cats.find((c) => c._id === mod.categoryId))
      : null;

    return {
      locked: false as const,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        type: quiz.type,
        duration: quiz.duration,
        maxQuestions: quiz.maxQuestions,
      },
      questions: questions
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          _id: q._id,
          question: q.question,
          imageUrl: q.imageUrl ?? null,
          // Tipe soal — frontend pakai untuk render UI yang sesuai.
          type: q.type ?? ("single" as const),
          // Pilihan A-E (single/multiple). Optional supaya truefalse_table
          // bisa menyimpan null.
          optionA: q.optionA ?? null,
          optionB: q.optionB ?? null,
          optionC: q.optionC ?? null,
          optionD: q.optionD ?? null,
          optionE: q.optionE ?? null,
          // Pernyataan untuk truefalse_table — TANPA isTrue (rahasia jawaban).
          statements: q.statements
            ? q.statements.map((s) => ({ text: s.text }))
            : null,
          order: q.order,
        })),
      moduleName: mod?.title ?? "",
      categoryName: category?.name ?? "",
    };
  },
});

export const submitAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    // Bentuk jawaban variatif per tipe soal — schema attempts.answers
    // mendokumentasikan field-field yang valid.
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        chosen: v.string(),
        chosens: v.optional(v.array(v.string())),
        chosenStatements: v.optional(v.array(v.boolean())),
      }),
    ),
    timeTaken: v.number(),
  },
  handler: async (ctx, { quizId, answers, timeTaken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
      .collect();

    let totalCorrect = 0; // soal yang dapat skor 1.0 penuh
    let totalWrong = 0; // soal terjawab tapi skor < 1.0
    let totalUnanswered = 0;
    let totalScoreFraction = 0; // jumlah fraksi (0..1) per soal — untuk skor akhir

    for (const q of questions) {
      const answer = answers.find((a) => a.questionId === q._id) as
        | AttemptAnswer
        | undefined;

      if (!isAnswered(q, answer)) {
        totalUnanswered++;
        continue;
      }

      const fraction = scoreAnswer(q, answer);
      totalScoreFraction += fraction;

      if (fraction >= 1) {
        totalCorrect++;
      } else {
        totalWrong++;
      }
    }

    // Skor akhir 0-100 berbasis jumlah fraksi (semua tipe bobot sama = 1).
    const score =
      questions.length > 0
        ? Math.round((totalScoreFraction / questions.length) * 100)
        : 0;

    const attemptId = await ctx.db.insert("attempts", {
      userId: user._id,
      quizId,
      answers,
      score,
      totalCorrect,
      totalWrong,
      totalUnanswered,
      timeTaken,
      isPassed: score >= 70,
      completedAt: Date.now(),
    });

    return { attemptId, score, totalCorrect, totalWrong, totalUnanswered };
  },
});

// ---------------------------------------------------------------------------
// Latihan — list practice quizzes grouped by category → module
// ---------------------------------------------------------------------------

export const listLatihanQuizzes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.isDeleted) return null;

    // Fetch all lookup data in one go (small tables)
    const categories = await ctx.db.query("categories").collect();
    const allModules = await ctx.db.query("modules").collect();
    const allQuizzes = await ctx.db.query("quizzes").collect();
    const userAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const publishedModules = allModules.filter((m) => m.isPublished);
    const latihanQuizzes = allQuizzes.filter(
      (q) => q.type === "latihan" && q.isPublished,
    );

    const result = [];

    for (const cat of categories.sort((a, b) => a.order - b.order)) {
      const catModules = publishedModules
        .filter((m) => m.categoryId === cat._id)
        .sort((a, b) => a.order - b.order);

      const modulesWithQuizzes = [];

      for (const mod of catModules) {
        const modQuizzes = latihanQuizzes.filter(
          (q) => q.moduleId === mod._id,
        );
        if (modQuizzes.length === 0) continue;

        const quizzesWithAttempts = modQuizzes.map((quiz) => {
          const quizAttempts = userAttempts.filter(
            (a) => a.quizId === quiz._id,
          );
          const bestScore =
            quizAttempts.length > 0
              ? Math.max(...quizAttempts.map((a) => a.score))
              : null;

          return {
            _id: quiz._id,
            title: quiz.title,
            maxQuestions: quiz.maxQuestions,
            duration: quiz.duration,
            // Akses tier per quiz, fallback ke modul induk untuk row lama
            // pre-migration yang belum punya isFree.
            isFree: quiz.isFree ?? mod.isFree,
            bestScore,
            attemptCount: quizAttempts.length,
          };
        });

        modulesWithQuizzes.push({
          _id: mod._id,
          title: mod.title,
          slug: mod.slug,
          isFree: mod.isFree,
          quizzes: quizzesWithAttempts,
        });
      }

      if (modulesWithQuizzes.length === 0) continue;

      result.push({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        icon: cat.icon,
        modules: modulesWithQuizzes,
      });
    }

    return {
      categories: result,
      userTier: effectiveTier(user),
    };
  },
});

// ---------------------------------------------------------------------------
// Ujian — list simulation exams with attempt history & stats
// ---------------------------------------------------------------------------

export const listUjianQuizzes = query({
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

    const ujianQuizzes = allQuizzes.filter(
      (q) => q.type === "ujian" && q.isPublished,
    );

    // Build quiz cards
    const quizCards = ujianQuizzes.map((quiz) => {
      const mod = allModules.find((m) => m._id === quiz.moduleId);
      const cat = mod
        ? categories.find((c) => c._id === mod.categoryId)
        : null;
      const quizAttempts = userAttempts
        .filter((a) => a.quizId === quiz._id)
        .sort((a, b) => b.completedAt - a.completedAt);
      const bestScore =
        quizAttempts.length > 0
          ? Math.max(...quizAttempts.map((a) => a.score))
          : null;

      return {
        _id: quiz._id,
        title: quiz.title,
        maxQuestions: quiz.maxQuestions,
        duration: quiz.duration,
        categoryName: cat?.name ?? "",
        categorySlug: cat?.slug ?? "",
        categoryColor: cat?.color ?? "#0EA5E9",
        moduleName: mod?.title ?? "",
        bestScore,
        attemptCount: quizAttempts.length,
        lastAttempt: quizAttempts[0]
          ? {
              score: quizAttempts[0].score,
              isPassed: quizAttempts[0].isPassed,
              completedAt: quizAttempts[0].completedAt,
            }
          : null,
      };
    });

    // History: last 10 ujian attempts
    const ujianQuizIds = new Set(ujianQuizzes.map((q) => q._id));
    const allUjianAttempts = userAttempts.filter((a) =>
      ujianQuizIds.has(a.quizId),
    );
    const recentAttempts = [...allUjianAttempts]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 10);

    const attemptHistory = recentAttempts.map((attempt) => {
      const quiz = ujianQuizzes.find((q) => q._id === attempt.quizId);
      const mod = quiz
        ? allModules.find((m) => m._id === quiz.moduleId)
        : null;
      const cat = mod
        ? categories.find((c) => c._id === mod.categoryId)
        : null;

      return {
        _id: attempt._id,
        quizTitle: quiz?.title ?? "",
        categoryName: cat?.name ?? "",
        score: attempt.score,
        isPassed: attempt.isPassed,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt,
      };
    });

    // Aggregate stats
    const totalAttempts = allUjianAttempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            allUjianAttempts.reduce((s, a) => s + a.score, 0) / totalAttempts,
          )
        : 0;
    const passCount = allUjianAttempts.filter((a) => a.isPassed).length;
    const passRate =
      totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

    return {
      quizzes: quizCards,
      attemptHistory,
      stats: { totalAttempts, avgScore, passRate },
      userTier: effectiveTier(user),
    };
  },
});

// ---------------------------------------------------------------------------
// ADMIN — quiz & question management
// ---------------------------------------------------------------------------

export const listQuizzesAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [quizzes, modules, categories, questions, attempts] = await Promise.all([
      ctx.db.query("quizzes").collect(),
      ctx.db.query("modules").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("questions").collect(),
      ctx.db.query("attempts").collect(),
    ]);

    const modById = new Map(modules.map((m) => [m._id, m]));
    const catById = new Map(categories.map((c) => [c._id, c]));

    return quizzes
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((quiz) => {
        const mod = modById.get(quiz.moduleId);
        const cat = mod ? catById.get(mod.categoryId) : null;
        const quizQuestions = questions.filter((q) => q.quizId === quiz._id);
        const quizAttempts = attempts.filter((a) => a.quizId === quiz._id);
        const avgScore =
          quizAttempts.length > 0
            ? Math.round(
                quizAttempts.reduce((s, a) => s + a.score, 0) /
                  quizAttempts.length,
              )
            : 0;
        return {
          _id: quiz._id,
          title: quiz.title,
          type: quiz.type,
          duration: quiz.duration,
          maxQuestions: quiz.maxQuestions,
          isPublished: quiz.isPublished,
          isFree: quiz.isFree ?? mod?.isFree ?? false,
          createdAt: quiz.createdAt,
          moduleId: quiz.moduleId,
          moduleName: mod?.title ?? "",
          categoryId: cat?._id ?? null,
          categorySlug: cat?.slug ?? "",
          categoryName: cat?.name ?? "",
          categoryColor: cat?.color ?? "#0EA5E9",
          questionCount: quizQuestions.length,
          attemptCount: quizAttempts.length,
          avgScore,
        };
      });
  },
});

export const getQuizWithQuestionsAdmin = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    await requireAdmin(ctx);

    const quiz = await ctx.db.get(quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
      .collect();

    return {
      quiz,
      questions: questions.sort((a, b) => a.order - b.order),
    };
  },
});

export const createQuiz = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    type: v.union(v.literal("latihan"), v.literal("ujian")),
    duration: v.number(),
    maxQuestions: v.number(),
    isPublished: v.boolean(),
    isFree: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const mod = await ctx.db.get(args.moduleId);
    if (!mod) throw new Error("Modul tidak ditemukan");

    // Default isFree dari modul induk supaya tidak ada locked-by-default
    // dengan diam-diam.
    return await ctx.db.insert("quizzes", {
      ...args,
      isFree: args.isFree ?? mod.isFree,
      createdAt: Date.now(),
    });
  },
});

export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    patch: v.object({
      title: v.optional(v.string()),
      type: v.optional(v.union(v.literal("latihan"), v.literal("ujian"))),
      duration: v.optional(v.number()),
      maxQuestions: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      isFree: v.optional(v.boolean()),
      moduleId: v.optional(v.id("modules")),
    }),
  },
  handler: async (ctx, { quizId, patch }) => {
    await requireAdmin(ctx);

    const quiz = await ctx.db.get(quizId);
    if (!quiz) throw new Error("Quiz tidak ditemukan");

    if (patch.moduleId) {
      const mod = await ctx.db.get(patch.moduleId);
      if (!mod) throw new Error("Modul tidak ditemukan");
    }

    await ctx.db.patch(quizId, patch);
    return quizId;
  },
});

export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    await requireAdmin(ctx);

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
      .collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    await ctx.db.delete(quizId);
    return quizId;
  },
});

// Validator umum untuk huruf jawaban A-E.
const letterAnswerValidator = v.union(
  v.literal("A"),
  v.literal("B"),
  v.literal("C"),
  v.literal("D"),
  v.literal("E"),
);

// Validator object untuk satu draft soal — semua tipe.
const questionDraftValidator = v.object({
  question: v.string(),
  imageUrl: v.optional(v.string()),

  // Tipe soal — default "single" jika tidak diisi (admin lama tetap kompatibel).
  type: v.optional(
    v.union(
      v.literal("single"),
      v.literal("multiple"),
      v.literal("truefalse_table"),
    ),
  ),

  optionA: v.optional(v.string()),
  optionB: v.optional(v.string()),
  optionC: v.optional(v.string()),
  optionD: v.optional(v.string()),
  optionE: v.optional(v.string()),

  correctAnswer: v.optional(letterAnswerValidator),
  correctAnswers: v.optional(v.array(letterAnswerValidator)),

  statements: v.optional(
    v.array(v.object({ text: v.string(), isTrue: v.boolean() })),
  ),

  explanation: v.string(),
  explanationImageUrl: v.optional(v.string()),
  explanationVideoUrl: v.optional(v.string()),
});

export const createQuestionsBatch = mutation({
  args: {
    quizId: v.id("quizzes"),
    questions: v.array(questionDraftValidator),
  },
  handler: async (ctx, { quizId, questions }) => {
    await requireAdmin(ctx);

    const quiz = await ctx.db.get(quizId);
    if (!quiz) throw new Error("Quiz tidak ditemukan");

    const existing = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
      .collect();
    let nextOrder =
      existing.length > 0 ? Math.max(...existing.map((q) => q.order)) + 1 : 1;

    const ids = [];
    for (const q of questions) {
      const id = await ctx.db.insert("questions", {
        quizId,
        ...q,
        type: q.type ?? "single",
        order: nextOrder,
      });
      ids.push(id);
      nextOrder += 1;
    }
    return ids;
  },
});

export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    patch: v.object({
      question: v.optional(v.string()),
      imageUrl: v.optional(v.union(v.string(), v.null())),
      type: v.optional(
        v.union(
          v.literal("single"),
          v.literal("multiple"),
          v.literal("truefalse_table"),
        ),
      ),
      optionA: v.optional(v.string()),
      optionB: v.optional(v.string()),
      optionC: v.optional(v.string()),
      optionD: v.optional(v.string()),
      optionE: v.optional(v.string()),
      correctAnswer: v.optional(letterAnswerValidator),
      correctAnswers: v.optional(v.array(letterAnswerValidator)),
      statements: v.optional(
        v.array(v.object({ text: v.string(), isTrue: v.boolean() })),
      ),
      explanation: v.optional(v.string()),
      explanationImageUrl: v.optional(v.union(v.string(), v.null())),
      explanationVideoUrl: v.optional(v.string()),
      order: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { questionId, patch }) => {
    await requireAdmin(ctx);

    const q = await ctx.db.get(questionId);
    if (!q) throw new Error("Pertanyaan tidak ditemukan");

    // null pada imageUrl/explanationImageUrl = admin ingin menghapus gambar.
    // Convex `patch` dengan field=undefined akan menghapus field optional.
    const sanitized: Record<string, unknown> = { ...patch };
    if (sanitized.imageUrl === null) sanitized.imageUrl = undefined;
    if (sanitized.explanationImageUrl === null) {
      sanitized.explanationImageUrl = undefined;
    }

    await ctx.db.patch(questionId, sanitized);
    return questionId;
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    await requireAdmin(ctx);

    const q = await ctx.db.get(questionId);
    if (!q) return null;

    await ctx.db.delete(questionId);
    return questionId;
  },
});
