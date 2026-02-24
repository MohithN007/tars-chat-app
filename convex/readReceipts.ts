import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    const lastReadAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadAt });
      return;
    }

    await ctx.db.insert("readReceipts", {
      conversationId: args.conversationId,
      userId: args.userId,
      lastReadAt,
    });
  },
});

export const getMyLastReadAt = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    return existing?.lastReadAt ?? 0;
  },
});