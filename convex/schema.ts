import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    tier: v.union(v.literal("free"), v.literal("trial"), v.literal("pro")),
    trialUsed: v.boolean(),
    trialExpiredAt: v.optional(v.number()),
    proExpiredAt: v.optional(v.number()),
    isDeleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
    order: v.number(),
  }).index("by_slug", ["slug"]),

  modules: defineTable({
    categoryId: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    videoUrl: v.string(),
    isFree: v.boolean(),
    isPublished: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"]),

  quizzes: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    type: v.union(v.literal("latihan"), v.literal("ujian")),
    duration: v.number(),
    maxQuestions: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
  }).index("by_module", ["moduleId"]),

  questions: defineTable({
    quizId: v.id("quizzes"),
    question: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    optionE: v.string(),
    correctAnswer: v.union(
      v.literal("A"),
      v.literal("B"),
      v.literal("C"),
      v.literal("D"),
      v.literal("E"),
    ),
    explanation: v.string(),
    explanationVideoUrl: v.optional(v.string()),
    order: v.number(),
  }).index("by_quiz", ["quizId"]),

  attempts: defineTable({
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    answers: v.array(
      v.object({ questionId: v.id("questions"), chosen: v.string() }),
    ),
    score: v.number(),
    totalCorrect: v.number(),
    totalWrong: v.number(),
    totalUnanswered: v.number(),
    timeTaken: v.number(),
    isPassed: v.boolean(),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_quiz", ["quizId"]),

  videoProgress: defineTable({
    userId: v.id("users"),
    moduleId: v.id("modules"),
    isCompleted: v.boolean(),
    watchedAt: v.number(),
  }).index("by_user_module", ["userId", "moduleId"]),

  transactions: defineTable({
    userId: v.id("users"),
    midtransOrderId: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    paymentMethod: v.optional(v.string()),
    snapToken: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_order_id", ["midtransOrderId"])
    .index("by_user", ["userId"]),
});
