import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mark user online
 */
export const setOnline = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

/**
 * Mark user offline
 */
export const setOffline = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      isOnline: false,
      lastSeen: Date.now(),
    });
  },
});