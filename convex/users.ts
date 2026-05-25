import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { effectiveTier, requireAdmin } from "./lib/auth";

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    // Idempotent: return existing user if already created
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      role: "user",
      tier: "free",
      trialUsed: false,
      isDeleted: false,
      createdAt: Date.now(),
    });
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return null;

    await ctx.db.patch(user._id, { email, name });
    return user._id;
  },
});

// ---------------------------------------------------------------------------
// Profile — authenticated user's profile + stats
// ---------------------------------------------------------------------------

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || user.isDeleted) return null;

    const allModules = await ctx.db.query("modules").collect();
    const publishedModules = allModules.filter((m) => m.isPublished);

    const videoProgress = await ctx.db
      .query("videoProgress")
      .withIndex("by_user_module", (q) => q.eq("userId", user._id))
      .collect();
    const completedVideos = videoProgress.filter((vp) => vp.isCompleted).length;

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const avgScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((s, a) => s + a.score, 0) / attempts.length,
          )
        : 0;
    const totalTimeSec = attempts.reduce((s, a) => s + a.timeTaken, 0);

    // Recent transactions (last 5)
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const recentTransactions = [...transactions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((t) => ({
        _id: t._id,
        amount: t.amount,
        status: t.status,
        paymentMethod: t.paymentMethod ?? null,
        createdAt: t.createdAt,
        paidAt: t.paidAt ?? null,
        // Order ID dipakai untuk action `confirmMyTransaction` agar user bisa
        // verifikasi manual status pembayaran dari profil.
        midtransOrderId: t.midtransOrderId,
        // Only expose snapToken on pending transactions so user can resume payment.
        snapToken: t.status === "pending" ? (t.snapToken ?? null) : null,
      }));

    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        tier: effectiveTier(user),
        trialUsed: user.trialUsed,
        trialExpiredAt: user.trialExpiredAt ?? null,
        proExpiredAt: user.proExpiredAt ?? null,
        createdAt: user.createdAt,
      },
      stats: {
        materiCompleted: completedVideos,
        materiTotal: publishedModules.length,
        quizzesDone: attempts.length,
        avgScore,
        totalTimeSec,
      },
      transactions: recentTransactions,
    };
  },
});

export const softDeleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return null;

    await ctx.db.patch(user._id, { isDeleted: true });
    return user._id;
  },
});

// ---------------------------------------------------------------------------
// ADMIN — user management
// ---------------------------------------------------------------------------

export const listUsersAdmin = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filter: v.optional(
      v.object({
        tier: v.optional(
          v.union(v.literal("free"), v.literal("trial"), v.literal("pro")),
        ),
        role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
        includeDeleted: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, { paginationOpts, filter }) => {
    await requireAdmin(ctx);

    const result = await ctx.db
      .query("users")
      .order("desc")
      .paginate(paginationOpts);

    const attempts = await ctx.db.query("attempts").collect();
    const transactions = await ctx.db.query("transactions").collect();

    const filtered = result.page.filter((u) => {
      if (filter?.tier && u.tier !== filter.tier) return false;
      if (filter?.role && u.role !== filter.role) return false;
      if (!filter?.includeDeleted && u.isDeleted) return false;
      return true;
    });

    const enriched = filtered.map((u) => {
      const userAttempts = attempts.filter((a) => a.userId === u._id);
      const userTxns = transactions.filter(
        (t) => t.userId === u._id && t.status === "success",
      );
      const totalSpent = userTxns.reduce((s, t) => s + t.amount, 0);
      return {
        _id: u._id,
        clerkId: u.clerkId,
        name: u.name,
        email: u.email,
        role: u.role,
        tier: u.tier,
        trialUsed: u.trialUsed,
        trialExpiredAt: u.trialExpiredAt ?? null,
        proExpiredAt: u.proExpiredAt ?? null,
        isDeleted: u.isDeleted,
        createdAt: u.createdAt,
        attemptCount: userAttempts.length,
        totalSpent,
      };
    });

    return {
      page: enriched,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const updateUserTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("trial"), v.literal("pro")),
    proExpiredAt: v.optional(v.number()),
    trialExpiredAt: v.optional(v.number()),
  },
  handler: async (ctx, { userId, tier, proExpiredAt, trialExpiredAt }) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User tidak ditemukan");

    const patch: {
      tier: typeof tier;
      proExpiredAt?: number;
      trialExpiredAt?: number;
      trialUsed?: boolean;
    } = { tier };
    if (proExpiredAt !== undefined) patch.proExpiredAt = proExpiredAt;
    if (trialExpiredAt !== undefined) {
      patch.trialExpiredAt = trialExpiredAt;
      patch.trialUsed = true;
    }

    await ctx.db.patch(userId, patch);
    return userId;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, { userId, role }) => {
    const currentAdmin = await requireAdmin(ctx);

    if (currentAdmin._id === userId && role !== "admin") {
      throw new Error("Tidak dapat mencopot role admin sendiri");
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User tidak ditemukan");

    await ctx.db.patch(userId, { role });
    return userId;
  },
});

export const softDeleteUserAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentAdmin = await requireAdmin(ctx);

    if (currentAdmin._id === userId) {
      throw new Error("Tidak dapat menghapus akun sendiri");
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User tidak ditemukan");

    await ctx.db.patch(userId, { isDeleted: true });
    return userId;
  },
});
