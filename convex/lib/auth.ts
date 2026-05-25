import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export const requireUser = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user || user.isDeleted) throw new Error("Unauthorized");
  return user;
};

export const requireAdmin = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> => {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("Forbidden: admin only");
  return user;
};

/**
 * Returns the user's effective tier, falling back to "free" if the trial or pro
 * subscription has expired. Use this instead of `user.tier` in any access check.
 */
export const effectiveTier = (user: Doc<"users">): "free" | "trial" | "pro" => {
  const now = Date.now();
  if (user.tier === "pro" && user.proExpiredAt && user.proExpiredAt < now) return "free";
  if (user.tier === "trial" && user.trialExpiredAt && user.trialExpiredAt < now) return "free";
  return user.tier;
};
