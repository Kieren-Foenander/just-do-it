import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            return [];
        }

        const categories = await ctx.db
            .query("categories")
            .withIndex("by_user", (q) => q.eq("userId", authUser._id))
            .collect();

        return categories;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        emoji: v.string(),
        color: v.string(),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        // Check if category with same name already exists
        const existing = await ctx.db
            .query("categories")
            .withIndex("by_user_name", (q) =>
                q.eq("userId", authUser._id).eq("name", args.name)
            )
            .first();

        if (existing) {
            throw new Error("Category with this name already exists");
        }

        const categoryId = await ctx.db.insert("categories", {
            userId: authUser._id,
            name: args.name,
            emoji: args.emoji,
            color: args.color,
        });

        return categoryId;
    },
});

export const update = mutation({
    args: {
        id: v.id("categories"),
        name: v.optional(v.string()),
        emoji: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        const category = await ctx.db.get(args.id);
        if (!category || category.userId !== authUser._id) {
            throw new Error("Category not found or unauthorized");
        }

        const updates: {
            name?: string;
            emoji?: string;
            color?: string;
        } = {};

        if (args.name !== undefined) updates.name = args.name;
        if (args.emoji !== undefined) updates.emoji = args.emoji;
        if (args.color !== undefined) updates.color = args.color;

        await ctx.db.patch(args.id, updates);
    },
});

export const remove = mutation({
    args: {
        id: v.id("categories"),
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        const category = await ctx.db.get(args.id);
        if (!category || category.userId !== authUser._id) {
            throw new Error("Category not found or unauthorized");
        }

        // Check if any todos are using this category
        const todosWithCategory = await ctx.db
            .query("todos")
            .withIndex("by_user_category", (q) =>
                q.eq("userId", authUser._id).eq("categoryId", args.id)
            )
            .first();

        if (todosWithCategory) {
            throw new Error("Cannot delete category with existing todos");
        }

        await ctx.db.delete(args.id);
    },
});

export const initializeDefaults = mutation({
    args: {},
    handler: async (ctx) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) {
            throw new Error("Not authenticated");
        }

        // Check if user already has categories
        const existing = await ctx.db
            .query("categories")
            .withIndex("by_user", (q) => q.eq("userId", authUser._id))
            .first();

        if (existing) {
            return; // Already initialized
        }

        const defaultCategories = [
            { name: "Clean Home", emoji: "🏠", color: "#E8D5FF" },
            { name: "Self-Care", emoji: "💆", color: "#FFD5E8" },
            { name: "Work", emoji: "💼", color: "#D5E8FF" },
        ];

        for (const category of defaultCategories) {
            await ctx.db.insert("categories", {
                userId: authUser._id,
                ...category,
            });
        }
    },
});

