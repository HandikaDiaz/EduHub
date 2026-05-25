import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const markComplete = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = await requireUser(ctx);

    const mod = await ctx.db.get(moduleId);
    if (!mod) throw new Error("Modul tidak ditemukan");

    const existing = await ctx.db
      .query("videoProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", moduleId),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isCompleted: true,
        watchedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("videoProgress", {
      userId: user._id,
      moduleId,
      isCompleted: true,
      watchedAt: now,
    });
  },
});
