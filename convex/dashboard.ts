import { query } from "./_generated/server";
import { effectiveTier } from "./lib/auth";

export const getDashboardData = query({
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
    const publishedModules = allModules.filter((m) => m.isPublished);

    const videoProgress = await ctx.db
      .query("videoProgress")
      .withIndex("by_user_module", (q) => q.eq("userId", user._id))
      .collect();

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Stats
    const completedVideos = videoProgress.filter((v) => v.isCompleted);
    const avgScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length,
          )
        : 0;

    // Categories with progress
    const categoriesWithProgress = categories
      .sort((a, b) => a.order - b.order)
      .map((cat) => {
        const catModules = publishedModules.filter(
          (m) => m.categoryId === cat._id,
        );
        const completedInCat = catModules.filter((m) =>
          completedVideos.some((v) => v.moduleId === m._id),
        ).length;
        return {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          totalModules: catModules.length,
          completedModules: completedInCat,
        };
      });

    // Continue learning — most recent video progress
    let continueModule = null;
    const sortedProgress = [...videoProgress].sort(
      (a, b) => b.watchedAt - a.watchedAt,
    );

    if (sortedProgress.length > 0) {
      const lastProgress = sortedProgress[0];
      const mod = allModules.find((m) => m._id === lastProgress.moduleId);
      if (mod) {
        const category = categories.find((c) => c._id === mod.categoryId);
        const quizzes = await ctx.db
          .query("quizzes")
          .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
          .collect();
        const quizIds = new Set(quizzes.map((q) => q._id));
        const moduleAttempts = attempts.filter((a) => quizIds.has(a.quizId));

        continueModule = {
          _id: mod._id,
          title: mod.title,
          slug: mod.slug,
          categoryName: category?.name ?? "",
          categorySlug: category?.slug ?? "",
          categoryColor: category?.color ?? "#0EA5E9",
          videoCompleted: lastProgress.isCompleted,
          quizzesDone: moduleAttempts.length,
          quizzesTotal: quizzes.filter((q) => q.isPublished).length,
        };
      }
    }

    // Recent activity — last 5 attempts
    const recentAttempts = [...attempts]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5);

    const recentActivity = [];
    for (const attempt of recentAttempts) {
      const quiz = await ctx.db.get(attempt.quizId);
      let moduleName = "";
      let categoryName = "";
      if (quiz) {
        const mod = await ctx.db.get(quiz.moduleId);
        if (mod) {
          moduleName = mod.title;
          const cat = categories.find((c) => c._id === mod.categoryId);
          categoryName = cat?.name ?? "";
        }
      }
      recentActivity.push({
        _id: attempt._id,
        quizId: attempt.quizId,
        type: (quiz?.type ?? "latihan") as "latihan" | "ujian",
        quizTitle: quiz?.title ?? "",
        moduleName,
        categoryName,
        score: attempt.score,
        completedAt: attempt.completedAt,
      });
    }

    return {
      user: {
        name: user.name,
        role: user.role,
        tier: effectiveTier(user),
        trialUsed: user.trialUsed,
        trialExpiredAt: user.trialExpiredAt ?? null,
        proExpiredAt: user.proExpiredAt ?? null,
      },
      stats: {
        materiCompleted: completedVideos.length,
        materiTotal: publishedModules.length,
        latihanDone: attempts.length,
        avgScore,
      },
      continueModule,
      categories: categoriesWithProgress,
      recentActivity,
    };
  },
});
