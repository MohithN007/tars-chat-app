import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
  clerkId: v.string(),
  name: v.string(),
  imageUrl: v.string(),

  // add these
  isOnline: v.boolean(),
  lastSeen: v.float64(),
}).index("by_clerkId", ["clerkId"]),


conversations: defineTable({
  isGroup: v.boolean(),
  memberIds: v.array(v.id("users")),
  name: v.optional(v.string()),
  createdAt: v.number(),
})
.index("by_memberIds", ["memberIds"]),

  messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  body: v.string(),
  createdAt: v.number(),
  deleted: v.optional(v.boolean()),
deletedAt: v.optional(v.number()),
reactions: v.optional(
  v.array(
    v.object({
      emoji: v.string(),
      userId: v.id("users"),
    })
  )
),
}).index("by_conversationId", ["conversationId"]),

typing: defineTable({
  conversationId: v.id("conversations"),
  userId: v.id("users"),
  expiresAt: v.number(), // when typing should disappear
})
  .index("by_conversation", ["conversationId"])
  .index("by_conversation_user", ["conversationId", "userId"]),
 
 
  readReceipts: defineTable({
  conversationId: v.id("conversations"),
  userId: v.id("users"),
  lastReadAt: v.number(),
})
  .index("by_conversation_user", ["conversationId", "userId"])
  .index("by_user", ["userId"]),

  
});
