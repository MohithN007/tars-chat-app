import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMyConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1) Find all conversations where I'm a member
    const convos = await ctx.db.query("conversations").collect();
    const mine = convos.filter((c) =>
      c.memberIds.some((id) => id === args.userId)
    );

    const results = [];

    for (const c of mine) {
      // 2) Get last message (latest by createdAt)
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", c._id)
        )
        .collect();

      const lastMessage =
        msgs.length > 0
          ? msgs.sort((a, b) => b.createdAt - a.createdAt)[0]
          : null;

      // 3) Get last read time for me
      const receipt = await ctx.db
        .query("readReceipts")
        .withIndex("by_conversation_user", (q) =>
          q.eq("conversationId", c._id).eq("userId", args.userId)
        )
        .unique();

      const lastReadAt = receipt?.lastReadAt ?? 0;

      // 4) Count unread: messages after lastReadAt from OTHER users
      const unreadCount = msgs.filter(
        (m) => m.createdAt > lastReadAt && m.senderId !== args.userId
      ).length;

      results.push({
        conversation: c,
        lastMessage,
        unreadCount,
      });
    }

    // optional: sort by last message time
    results.sort((a, b) => {
      const ta = a.lastMessage?.createdAt ?? a.conversation.createdAt;
      const tb = b.lastMessage?.createdAt ?? b.conversation.createdAt;
      return tb - ta;
    });

    return results;
  },
});