import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

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
    // Keep stable ordering
    const members: [Id<"users">, Id<"users">] = [args.meId, args.otherUserId].sort(
      (a, b) => a.localeCompare(b)
    ) as [Id<"users">, Id<"users">];

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

/** Result item shape returned by listForUserWithUnread */
type ConversationListItem = {
  conversation: Doc<"conversations">;
  lastMessage: Doc<"messages"> | null;
  unreadCount: number;
  otherUser: Doc<"users"> | null;
  title: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: number;
};

/**
 * Sidebar list: conversations for user + lastMessage + unreadCount
 * PLUS other user's profile info for nicer UI (name/avatar/online)
 */
export const listForUserWithUnread = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<ConversationListItem[]> => {
    // 1) all direct conversations containing me
    const convos = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect();

    const mine = convos.filter((c) => c.memberIds.some((id) => id === args.userId));

    const results: ConversationListItem[] = [];

    for (const c of mine) {
      // figure out the "other" user in a 1-1
      const otherId: Id<"users"> | null =
        c.memberIds.find((id) => id !== args.userId) ?? null;

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
          ? msgs.reduce((best, cur) => (cur.createdAt > best.createdAt ? cur : best))
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
  handler: async (ctx, args): Promise<{ otherUser: Doc<"users"> | null } | null> => {
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return null;

    const otherId: Id<"users"> | null =
      convo.memberIds.find((id) => id !== args.meId) ?? null;

    const otherUser = otherId ? await ctx.db.get(otherId) : null;

    return { otherUser };
  },
});