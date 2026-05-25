import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { effectiveTier, requireAdmin, requireUser } from "./lib/auth";

// ---------------------------------------------------------------------------
// PUBLIC — /materi listing
// ---------------------------------------------------------------------------

export const listCategoriesWithModules = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const [categories, allModules, allQuizzes, userProgress] = await Promise.all([
      ctx.db.query("categories").collect(),
      ctx.db.query("modules").collect(),
      ctx.db.query("quizzes").collect(),
      ctx.db
        .query("videoProgress")
        .withIndex("by_user_module", (q) => q.eq("userId", user._id))
        .collect(),
    ]);

    const publishedModules = allModules.filter((m) => m.isPublished);
    const completedModuleIds = new Set(
      userProgress.filter((p) => p.isCompleted).map((p) => p.moduleId),
    );

    const result = [...categories]
      .sort((a, b) => a.order - b.order)
      .map((cat) => {
        const mods = publishedModules
          .filter((m) => m.categoryId === cat._id)
          .sort((a, b) => a.order - b.order)
          .map((mod) => {
            const quizCount = allQuizzes.filter(
              (q) => q.moduleId === mod._id && q.isPublished,
            ).length;
            return {
              _id: mod._id,
              title: mod.title,
              slug: mod.slug,
              description: mod.description,
              isFree: mod.isFree,
              order: mod.order,
              quizCount,
              isCompleted: completedModuleIds.has(mod._id),
            };
          });
        return {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          order: cat.order,
          modules: mods,
        };
      });

    return {
      categories: result,
      userTier: effectiveTier(user),
    };
  },
});

// ---------------------------------------------------------------------------
// PUBLIC — /materi/[kategori]/[slug] detail
// ---------------------------------------------------------------------------

export const getModuleDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const user = await requireUser(ctx);

    const mod = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!mod || !mod.isPublished) return null;

    const category = await ctx.db.get(mod.categoryId);
    if (!category) return null;

    const canAccess = mod.isFree || effectiveTier(user) !== "free";

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
      .collect();
    const publishedQuizzes = quizzes.filter((q) => q.isPublished);

    const userAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const quizzesWithStats = publishedQuizzes.map((quiz) => {
      const quizAttempts = userAttempts.filter((a) => a.quizId === quiz._id);
      const bestScore =
        quizAttempts.length > 0
          ? Math.max(...quizAttempts.map((a) => a.score))
          : null;
      return {
        _id: quiz._id,
        title: quiz.title,
        type: quiz.type,
        duration: quiz.duration,
        maxQuestions: quiz.maxQuestions,
        attempts: quizAttempts.length,
        bestScore,
      };
    });

    const progress = await ctx.db
      .query("videoProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", mod._id),
      )
      .unique();

    // Sibling modules in the same category (for next/prev nav on detail page)
    const siblings = await ctx.db
      .query("modules")
      .withIndex("by_category", (q) => q.eq("categoryId", mod.categoryId))
      .collect();
    const siblingOrdered = siblings
      .filter((m) => m.isPublished)
      .sort((a, b) => a.order - b.order)
      .map((m) => ({
        _id: m._id,
        title: m.title,
        slug: m.slug,
        order: m.order,
      }));

    return {
      module: {
        _id: mod._id,
        title: mod.title,
        slug: mod.slug,
        description: mod.description,
        videoUrl: mod.videoUrl,
        isFree: mod.isFree,
        order: mod.order,
      },
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        icon: category.icon,
      },
      quizzes: quizzesWithStats,
      isCompleted: progress?.isCompleted ?? false,
      canAccess,
      userTier: effectiveTier(user),
      siblings: siblingOrdered,
    };
  },
});

// ---------------------------------------------------------------------------
// ADMIN — materi management
// ---------------------------------------------------------------------------

export const listMateriAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [modules, categories, quizzes, progress] = await Promise.all([
      ctx.db.query("modules").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("quizzes").collect(),
      ctx.db.query("videoProgress").collect(),
    ]);

    const catById = new Map(categories.map((c) => [c._id, c]));

    return modules
      .sort((a, b) => a.order - b.order)
      .map((mod) => {
        const cat = catById.get(mod.categoryId);
        const quizCount = quizzes.filter((q) => q.moduleId === mod._id).length;
        const viewCount = progress.filter((p) => p.moduleId === mod._id).length;
        const completedCount = progress.filter(
          (p) => p.moduleId === mod._id && p.isCompleted,
        ).length;
        return {
          _id: mod._id,
          title: mod.title,
          slug: mod.slug,
          description: mod.description,
          videoUrl: mod.videoUrl,
          isFree: mod.isFree,
          isPublished: mod.isPublished,
          order: mod.order,
          createdAt: mod.createdAt,
          categoryId: mod.categoryId,
          categoryName: cat?.name ?? "",
          categoryColor: cat?.color ?? "#0EA5E9",
          quizCount,
          viewCount,
          completedCount,
        };
      });
  },
});

export const createModule = mutation({
  args: {
    categoryId: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    videoUrl: v.string(),
    isFree: v.boolean(),
    isPublished: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Slug "${args.slug}" sudah dipakai`);

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Kategori tidak ditemukan");

    return await ctx.db.insert("modules", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateModule = mutation({
  args: {
    moduleId: v.id("modules"),
    patch: v.object({
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      isFree: v.optional(v.boolean()),
      isPublished: v.optional(v.boolean()),
      order: v.optional(v.number()),
      categoryId: v.optional(v.id("categories")),
    }),
  },
  handler: async (ctx, { moduleId, patch }) => {
    await requireAdmin(ctx);

    const mod = await ctx.db.get(moduleId);
    if (!mod) throw new Error("Modul tidak ditemukan");

    if (patch.slug && patch.slug !== mod.slug) {
      const clash = await ctx.db
        .query("modules")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug as string))
        .unique();
      if (clash) throw new Error(`Slug "${patch.slug}" sudah dipakai`);
    }

    if (patch.categoryId) {
      const category = await ctx.db.get(patch.categoryId);
      if (!category) throw new Error("Kategori tidak ditemukan");
    }

    await ctx.db.patch(moduleId, patch);
    return moduleId;
  },
});

export const deleteModule = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    await requireAdmin(ctx);

    const mod = await ctx.db.get(moduleId);
    if (!mod) return null;

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();

    for (const quiz of quizzes) {
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
        .collect();
      for (const question of questions) {
        await ctx.db.delete(question._id);
      }

      const attempts = await ctx.db
        .query("attempts")
        .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
        .collect();
      for (const attempt of attempts) {
        await ctx.db.delete(attempt._id);
      }

      await ctx.db.delete(quiz._id);
    }

    // videoProgress is indexed by (userId, moduleId). Scan the small table
    // and delete rows matching this module — progress rows per module are bounded by user count.
    const allProgress = await ctx.db.query("videoProgress").collect();
    for (const row of allProgress.filter((p) => p.moduleId === moduleId)) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.delete(moduleId);
    return moduleId;
  },
});
