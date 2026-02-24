import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_TTL_MS = 3000; // 3 seconds feels smooth

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    const expiresAt = Date.now() + TYPING_TTL_MS;

    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
      return;
    }

    await ctx.db.insert("typing", {
      conversationId: args.conversationId,
      userId: args.userId,
      expiresAt,
    });
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // NO "now" arg here. Just return rows for this conversation.
    return await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});