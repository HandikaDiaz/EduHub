import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/auth";

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const categories = await ctx.db.query("categories").collect();
    return categories.sort((a, b) => a.order - b.order);
  },
});

export const listCategoriesAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [categories, modules] = await Promise.all([
      ctx.db.query("categories").collect(),
      ctx.db.query("modules").collect(),
    ]);

    return categories
      .sort((a, b) => a.order - b.order)
      .map((cat) => ({
        ...cat,
        moduleCount: modules.filter((m) => m.categoryId === cat._id).length,
      }));
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Slug "${args.slug}" sudah dipakai`);

    return await ctx.db.insert("categories", args);
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    patch: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      color: v.optional(v.string()),
      icon: v.optional(v.string()),
      order: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { categoryId, patch }) => {
    await requireAdmin(ctx);

    const cat = await ctx.db.get(categoryId);
    if (!cat) throw new Error("Kategori tidak ditemukan");

    if (patch.slug && patch.slug !== cat.slug) {
      const clash = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug as string))
        .unique();
      if (clash) throw new Error(`Slug "${patch.slug}" sudah dipakai`);
    }

    await ctx.db.patch(categoryId, patch);
    return categoryId;
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    await requireAdmin(ctx);

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
      .collect();
    if (modules.length > 0) {
      throw new Error(
        `Kategori masih dipakai oleh ${modules.length} modul. Pindahkan atau hapus modulnya dulu.`,
      );
    }

    await ctx.db.delete(categoryId);
    return categoryId;
  },
});

export const reorderCategories = mutation({
  args: { orderedIds: v.array(v.id("categories")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);

    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i });
    }
    return null;
  },
});
