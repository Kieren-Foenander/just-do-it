import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    emoji: v.string(),
    color: v.string(), // hex color code
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  todos: defineTable({
    userId: v.string(),
    title: v.string(),
    emoji: v.string(),
    categoryId: v.optional(v.id("categories")), // optional category
    dueDate: v.string(), // ISO date string (YYYY-MM-DD)
    dueTime: v.union(v.string(), v.null()), // time string (HH:mm) or null for all-day
    recurrence: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    completed: v.boolean(),
    completedAt: v.union(v.number(), v.null()), // timestamp or null
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "dueDate"])
    .index("by_user_category", ["userId", "categoryId"])
    .index("by_user_completed", ["userId", "completed"]),

  // Track completions for recurring tasks per date
  todoCompletions: defineTable({
    todoId: v.id("todos"),
    userId: v.string(),
    completionDate: v.string(), // ISO date string (YYYY-MM-DD) - the date this instance was completed
    completedAt: v.number(), // timestamp when it was completed
  })
    .index("by_todo", ["todoId"])
    .index("by_todo_date", ["todoId", "completionDate"])
    .index("by_user_date", ["userId", "completionDate"]),
});
