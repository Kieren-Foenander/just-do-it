import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper function to check if a recurring task should appear on a given date
function shouldAppearOnDate(
    dueDate: string,
    recurrence: string,
    targetDate: string
): boolean {
    if (recurrence === "none") {
        return dueDate === targetDate;
    }

    const due = new Date(dueDate);
    const target = new Date(targetDate);

    if (recurrence === "daily") {
        return true; // Appears every day
    }

    if (recurrence === "weekly") {
        return due.getDay() === target.getDay();
    }

    if (recurrence === "biweekly") {
        // Check if it's the same day of week and weeks are aligned
        if (due.getDay() !== target.getDay()) {
            return false;
        }
        const weeksDiff = Math.floor(
            (target.getTime() - due.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        return weeksDiff >= 0 && weeksDiff % 2 === 0;
    }

    if (recurrence === "monthly") {
        return due.getDate() === target.getDate();
    }

    if (recurrence === "quarterly") {
        // Same day of month, every 3 months
        if (due.getDate() !== target.getDate()) {
            return false;
        }
        const monthsDiff =
            (target.getFullYear() - due.getFullYear()) * 12 +
            (target.getMonth() - due.getMonth());
        return monthsDiff >= 0 && monthsDiff % 3 === 0;
    }

    return false;
}

export const list = query({
    args: {
        date: v.optional(v.string()), // ISO date string (YYYY-MM-DD), defaults to today
        categoryId: v.optional(v.id("categories")), // Filter by category, undefined = all
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            return [];
        }

        const targetDate = args.date || new Date().toISOString().split("T")[0];

        // Get all todos for the user
        let query = ctx.db
            .query("todos")
            .withIndex("by_user", (q) => q.eq("userId", authUser._id));

        const allTodos = await query.collect();

        // Filter by date (handling recurrence) and category
        const filteredTodos = allTodos.filter((todo) => {
            // Check if task should appear on target date
            const appearsOnDate = shouldAppearOnDate(
                todo.dueDate,
                todo.recurrence,
                targetDate
            );

            if (!appearsOnDate) {
                return false;
            }

            // Filter by category if specified
            if (args.categoryId && todo.categoryId !== args.categoryId) {
                return false;
            }

            return true;
        });

        // Get completions for recurring tasks on this date
        const completionsOnDate = await ctx.db
            .query("todoCompletions")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", authUser._id).eq("completionDate", targetDate)
            )
            .collect();

        const completionsByTodoId = new Map(
            completionsOnDate.map((c) => [c.todoId, c])
        );

        // Map todos with correct completion status for the date
        const todosWithCompletionStatus = filteredTodos.map((todo) => {
            // For recurring tasks, check per-date completion
            if (todo.recurrence !== "none") {
                const completion = completionsByTodoId.get(todo._id);
                return {
                    ...todo,
                    completed: !!completion,
                    completedAt: completion?.completedAt ?? null,
                };
            }
            // For non-recurring tasks, use the todo's own completed flag
            return todo;
        });

        // Sort by dueTime (all-day tasks first, then by time)
        todosWithCompletionStatus.sort((a, b) => {
            if (!a.dueTime && !b.dueTime) return 0;
            if (!a.dueTime) return -1;
            if (!b.dueTime) return 1;
            return a.dueTime.localeCompare(b.dueTime);
        });

        return todosWithCompletionStatus;
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        emoji: v.string(),
        categoryId: v.optional(v.id("categories")), // optional category
        dueDate: v.string(), // ISO date string (YYYY-MM-DD)
        dueTime: v.union(v.string(), v.null()), // time string (HH:mm) or null
        recurrence: v.union(
            v.literal("none"),
            v.literal("daily"),
            v.literal("weekly"),
            v.literal("biweekly"),
            v.literal("monthly"),
            v.literal("quarterly")
        ),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        // Verify category belongs to user if provided
        if (args.categoryId) {
            const category = await ctx.db.get(args.categoryId);
            if (!category || category.userId !== authUser._id) {
                throw new Error("Category not found or unauthorized");
            }
        }

        const todoId = await ctx.db.insert("todos", {
            userId: authUser._id,
            title: args.title,
            emoji: args.emoji,
            categoryId: args.categoryId,
            dueDate: args.dueDate,
            dueTime: args.dueTime,
            recurrence: args.recurrence,
            completed: false,
            completedAt: null,
            createdAt: Date.now(),
        });

        return todoId;
    },
});

export const update = mutation({
    args: {
        id: v.id("todos"),
        title: v.optional(v.string()),
        emoji: v.optional(v.string()),
        categoryId: v.optional(v.union(v.id("categories"), v.null())), // can be set to null to clear
        dueDate: v.optional(v.string()),
        dueTime: v.optional(v.union(v.string(), v.null())),
        recurrence: v.optional(
            v.union(
                v.literal("none"),
                v.literal("daily"),
                v.literal("weekly"),
                v.literal("biweekly"),
                v.literal("monthly"),
                v.literal("quarterly")
            )
        ),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        const todo = await ctx.db.get(args.id);
        if (!todo || todo.userId !== authUser._id) {
            throw new Error("Todo not found or unauthorized");
        }

        // Verify category if changed and not null
        if (args.categoryId && args.categoryId !== todo.categoryId) {
            const category = await ctx.db.get(args.categoryId);
            if (!category || category.userId !== authUser._id) {
                throw new Error("Category not found or unauthorized");
            }
        }

        const updates: {
            title?: string;
            emoji?: string;
            categoryId?: Id<"categories"> | undefined;
            dueDate?: string;
            dueTime?: string | null;
            recurrence?: "none" | "daily" | "weekly" | "biweekly" | "monthly" | "quarterly";
        } = {};

        if (args.title !== undefined) updates.title = args.title;
        if (args.emoji !== undefined) updates.emoji = args.emoji;
        if (args.categoryId !== undefined) updates.categoryId = args.categoryId ?? undefined;
        if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
        if (args.dueTime !== undefined) updates.dueTime = args.dueTime;
        if (args.recurrence !== undefined) updates.recurrence = args.recurrence;

        await ctx.db.patch(args.id, updates);
    },
});

export const toggle = mutation({
    args: {
        id: v.id("todos"),
        date: v.string(), // ISO date string (YYYY-MM-DD) - the date being viewed/toggled
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        const todo = await ctx.db.get(args.id);
        if (!todo || todo.userId !== authUser._id) {
            throw new Error("Todo not found or unauthorized");
        }

        // For non-recurring tasks, use the simple completed flag
        if (todo.recurrence === "none") {
            await ctx.db.patch(args.id, {
                completed: !todo.completed,
                completedAt: !todo.completed ? Date.now() : null,
            });
            return;
        }

        // For recurring tasks, track completions per date
        const existingCompletion = await ctx.db
            .query("todoCompletions")
            .withIndex("by_todo_date", (q) =>
                q.eq("todoId", args.id).eq("completionDate", args.date)
            )
            .unique();

        if (existingCompletion) {
            // Already completed on this date, so uncomplete it
            await ctx.db.delete(existingCompletion._id);
        } else {
            // Mark as completed for this date
            await ctx.db.insert("todoCompletions", {
                todoId: args.id,
                userId: authUser._id,
                completionDate: args.date,
                completedAt: Date.now(),
            });
        }
    },
});

export const remove = mutation({
    args: {
        id: v.id("todos"),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        const todo = await ctx.db.get(args.id);
        if (!todo || todo.userId !== authUser._id) {
            throw new Error("Todo not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

// Get todos for a date range (useful for week view)
export const listByDateRange = query({
    args: {
        startDate: v.string(), // ISO date string (YYYY-MM-DD)
        endDate: v.string(), // ISO date string (YYYY-MM-DD)
        categoryId: v.optional(v.id("categories")),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            return [];
        }

        // Get all todos for the user
        let query = ctx.db
            .query("todos")
            .withIndex("by_user", (q) => q.eq("userId", authUser._id));

        const allTodos = await query.collect();

        // Generate date range
        const start = new Date(args.startDate);
        const end = new Date(args.endDate);
        const dates: string[] = [];
        const current = new Date(start);
        while (current <= end) {
            dates.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
        }

        // Get all completions for this user in the date range
        // We'll fetch all completions and filter in memory since there's no range index
        const allCompletions = await ctx.db
            .query("todoCompletions")
            .withIndex("by_todo")
            .filter((q) => q.eq(q.field("userId"), authUser._id))
            .collect();

        // Create a map of todoId -> date -> completion
        const completionsMap = new Map<string, Map<string, typeof allCompletions[0]>>();
        for (const completion of allCompletions) {
            if (!completionsMap.has(completion.todoId)) {
                completionsMap.set(completion.todoId, new Map());
            }
            completionsMap.get(completion.todoId)!.set(completion.completionDate, completion);
        }

        // Filter todos that appear in date range and add completion status
        const todosByDate: Record<string, Array<typeof allTodos[0] & { completed: boolean; completedAt: number | null }>> = {};
        for (const date of dates) {
            todosByDate[date] = allTodos
                .filter((todo) => {
                    const appearsOnDate = shouldAppearOnDate(
                        todo.dueDate,
                        todo.recurrence,
                        date
                    );

                    if (!appearsOnDate) {
                        return false;
                    }

                    if (args.categoryId && todo.categoryId !== args.categoryId) {
                        return false;
                    }

                    return true;
                })
                .map((todo) => {
                    // For recurring tasks, check per-date completion
                    if (todo.recurrence !== "none") {
                        const completion = completionsMap.get(todo._id)?.get(date);
                        return {
                            ...todo,
                            completed: !!completion,
                            completedAt: completion?.completedAt ?? null,
                        };
                    }
                    // For non-recurring tasks, use the todo's own completed flag
                    return todo;
                });
        }

        return todosByDate;
    },
});

