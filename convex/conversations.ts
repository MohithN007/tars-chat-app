import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or get an existing 1–1 conversation
 * Always stores memberIds in sorted order to avoid duplicates.
 */
export const getOrCreateDirectConversation = mutation({
  args: {
    meId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const members = [args.meId, args.otherUserId].sort();

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_memberIds", (q) => q.eq("memberIds", members))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      isGroup: false,
      memberIds: members,
      createdAt: Date.now(),
    });
  },
});

/**
 * Sidebar list: conversations for user + lastMessage + unreadCount
 * PLUS other user's profile info for nicer UI (name/avatar/online)
 */
export const listForUserWithUnread = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1) all direct conversations containing me
    const convos = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect();

    const mine = convos.filter((c) =>
      c.memberIds.some((id) => id === args.userId)
    );

    const results: Array<{
      conversation: any;
      lastMessage: any | null;
      unreadCount: number;
      otherUser: any | null;
      title: string;
      avatarUrl: string;
      isOnline: boolean;
      lastSeen: number;
    }> = [];

    for (const c of mine) {
      // figure out the "other" user in a 1-1
      const otherId = c.memberIds.find((id: any) => id !== args.userId) ?? null;
      const otherUser = otherId ? await ctx.db.get(otherId) : null;

      const title = otherUser?.name ?? "Conversation";
      const avatarUrl = otherUser?.imageUrl ?? "";
      const isOnline = otherUser?.isOnline ?? false;
      const lastSeen = otherUser?.lastSeen ?? 0;

      // 2) last message
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", c._id))
        .collect();

      const lastMessage =
        msgs.length > 0
          ? msgs.reduce((best, cur) =>
              cur.createdAt > best.createdAt ? cur : best
            )
          : null;

      // 3) last read time
      const receipt = await ctx.db
        .query("readReceipts")
        .withIndex("by_conversation_user", (q) =>
          q.eq("conversationId", c._id).eq("userId", args.userId)
        )
        .unique();

      const lastReadAt = receipt?.lastReadAt ?? 0;

      // 4) unread count: after lastReadAt and not sent by me
      const unreadCount = msgs.filter(
        (m) => m.createdAt > lastReadAt && m.senderId !== args.userId
      ).length;

      results.push({
        conversation: c,
        lastMessage,
        unreadCount,
        otherUser,
        title,
        avatarUrl,
        isOnline,
        lastSeen,
      });
    }

    // newest first by last activity
    results.sort((a, b) => {
      const ta = a.lastMessage?.createdAt ?? a.conversation.createdAt;
      const tb = b.lastMessage?.createdAt ?? b.conversation.createdAt;
      return tb - ta;
    });

    return results;
  },

  
});
export const getConversationMeta = query({
  args: {
    conversationId: v.id("conversations"),
    meId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return null;

    const otherId =
      convo.memberIds.find((id: any) => id !== args.meId) ?? null;

    const otherUser = otherId ? await ctx.db.get(otherId) : null;

    return { otherUser };
  },
});