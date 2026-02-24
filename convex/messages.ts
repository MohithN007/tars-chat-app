import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      body: args.body,
      createdAt: Date.now(),

      deleted: false,
      reactions: [],
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return;

    if (msg.senderId !== args.userId) {
      throw new Error("Not allowed to delete this message");
    }

    await ctx.db.patch(args.messageId, {
      deleted: true,
      deletedAt: Date.now(),
    });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    if (!ALLOWED_REACTIONS.includes(args.emoji as any)) {
      throw new Error("Invalid emoji");
    }

    const msg = await ctx.db.get(args.messageId);
    if (!msg) return;

    if (msg.deleted) return;

    const current =
      (msg.reactions ?? []) as Array<{ emoji: string; userId: any }>;

    const exists = current.some(
      (r) => r.emoji === args.emoji && r.userId === args.userId
    );

    const next = exists
      ? current.filter(
          (r) => !(r.emoji === args.emoji && r.userId === args.userId)
        )
      : [...current, { emoji: args.emoji, userId: args.userId }];

    await ctx.db.patch(args.messageId, { reactions: next });
  },
});