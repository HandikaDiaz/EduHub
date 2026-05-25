import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

const SETTINGS_KEY = v.union(
  v.literal("platform"),
  v.literal("content"),
  v.literal("payment"),
);

export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const rows = await ctx.db.query("settings").collect();

    const byKey: Record<string, { value: string; updatedAt: number }> = {};
    for (const row of rows) {
      byKey[row.key] = { value: row.value, updatedAt: row.updatedAt };
    }

    return {
      platform: byKey.platform ?? null,
      content: byKey.content ?? null,
      payment: byKey.payment ?? null,
    };
  },
});

export const saveSettings = mutation({
  args: {
    key: SETTINGS_KEY,
    value: v.string(),
  },
  handler: async (ctx, { key, value }) => {
    const admin = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: now,
        updatedBy: admin._id,
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      key,
      value,
      updatedAt: now,
      updatedBy: admin._id,
    });
  },
});
