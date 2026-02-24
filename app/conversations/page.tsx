"use client";

import Sidebar from "../chat/[conversationId]/Sidebar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ConversationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const me = useQuery(
    api.users.getByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  // ✅ Use the same backend that Sidebar uses
  const conversations = useQuery(
    api.conversations.listForUserWithUnread,
    me ? { userId: me._id } : "skip"
  );

  // Loading (keep simple)
  if (!me || conversations === undefined) {
    return (
      <div className="h-screen flex">
        <div className="w-80 border-r hidden md:flex flex-col bg-white dark:bg-neutral-950">
          <div className="p-4 border-b">
            <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-neutral-800" />
            <div className="mt-2 h-5 w-36 rounded bg-zinc-200 dark:bg-neutral-800" />
            <div className="mt-4 h-9 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
          </div>
          <div className="p-3 space-y-2">
            <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
            <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
            <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
          </div>
        </div>

        <div className="flex-1 bg-zinc-50 dark:bg-neutral-950 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Loading your conversations…
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Getting everything ready.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main panel */}
      <main className="flex-1 bg-zinc-50 dark:bg-neutral-950 flex flex-col">
        {/* ✅ Top header actions */}
        <div className="sticky top-0 z-10 border-b border-zinc-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Conversations
              </div>
              <div className="text-xs text-zinc-500 truncate">
                {conversations.length === 0
                  ? "Start your first chat"
                  : "Pick a chat from the sidebar"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push("/")}
                className="text-sm px-3 py-2 rounded-2xl border border-zinc-200 dark:border-neutral-800
                           bg-white dark:bg-neutral-950 hover:bg-zinc-50 dark:hover:bg-neutral-900 transition"
                title="Go to Home"
              >
                Home
              </button>

              <button
                onClick={() => router.push("/users")}
                className="text-sm px-4 py-2 rounded-2xl bg-black text-white
                           hover:opacity-95 active:scale-[0.98] transition"
                title="Start a new chat"
              >
                + New chat
              </button>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center">
          {conversations.length === 0 ? (
            <div className="text-center px-6">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                No conversations yet
              </div>
              <div className="text-sm text-zinc-500 mt-2 max-w-sm">
                Start your first chat by opening the Users page and selecting someone.
              </div>

              <button
                onClick={() => router.push("/users")}
                className="mt-4 px-4 py-2 rounded-2xl bg-black text-white text-sm
                           hover:opacity-95 active:scale-[0.98] transition"
              >
                Start a new chat
              </button>

              <div className="mt-6 md:hidden">
                <div className="text-xs text-zinc-500">
                  Tip: open two browsers to demo realtime.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center px-6">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Select a chat
              </div>
              <div className="text-sm text-zinc-500 mt-2 max-w-sm">
                Choose a conversation from the sidebar to start messaging.
              </div>

              {/* Mobile conversation list (since Sidebar is hidden on mobile) */}
              <div className="mt-6 md:hidden w-full max-w-md text-left">
                <div className="text-xs text-zinc-500 mb-2">Your chats</div>
                <div className="space-y-2">
                  {conversations.map((item: any) => {
                    const idStr = String(item.conversation._id);
                    const title = item.title ?? "Conversation";
                    const preview =
                      item.lastMessage?.deleted
                        ? "This message was deleted"
                        : item.lastMessage?.body ?? "No messages yet";
                    const unread = item.unreadCount ?? 0;

                    return (
                      <button
                        key={idStr}
                        onClick={() => router.push(`/chat/${idStr}`)}
                        className="w-full rounded-2xl border border-zinc-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-950 p-3 text-left
                                   hover:bg-zinc-50 dark:hover:bg-neutral-900/60 transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate text-zinc-900 dark:text-zinc-100">
                            {title}
                          </div>
                          {unread > 0 && (
                            <span className="ml-auto text-[11px] bg-black text-white rounded-full px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 truncate mt-1">
                          {preview}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => router.push("/users")}
                  className="mt-4 w-full px-4 py-2 rounded-2xl bg-black text-white text-sm
                             hover:opacity-95 active:scale-[0.98] transition"
                >
                  + New chat
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}