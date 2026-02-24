"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function formatListTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return d.toLocaleString([], { month: "short", day: "numeric" });
}

type ConversationRow = {
  conversation: {
    _id: Id<"conversations">;
    createdAt?: number;
  };
  lastMessage: {
    body?: string;
    deleted?: boolean;
    createdAt?: number;
  } | null;
  unreadCount: number;
  title: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: number;
};

export default function Sidebar() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();

  const [q, setQ] = useState("");

  const me = useQuery(
    api.users.getByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const conversations = useQuery(
    api.conversations.listForUserWithUnread,
    me ? { userId: me._id } : "skip"
  ) as ConversationRow[] | undefined;

  const activeId = params?.conversationId as string | undefined;

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const query = q.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((item) => {
      const title = (item.title ?? "Conversation").toLowerCase();
      const preview = (
        item.lastMessage?.deleted
          ? "this message was deleted"
          : item.lastMessage?.body ?? "no messages yet"
      ).toLowerCase();

      return title.includes(query) || preview.includes(query);
    });
  }, [conversations, q]);

  if (!me || conversations === undefined) {
    return (
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
    );
  }

  return (
    <aside className="w-80 border-r hidden md:flex flex-col bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-zinc-500">Welcome</div>
            <div className="font-semibold truncate text-zinc-900 dark:text-zinc-100">
              {me.name ?? "You"}
            </div>
          </div>

          <button
            onClick={() => router.push("/users")}
            className="text-xs px-3 py-2 rounded-2xl border border-zinc-200 dark:border-neutral-800
                       hover:bg-zinc-50 dark:hover:bg-neutral-900 transition"
            title="Start a new chat"
          >
            + New
          </button>
        </div>

        {/* Search */}
        <div className="mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations…"
            className="w-full text-sm px-3 py-2 rounded-2xl border border-zinc-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900 outline-none
                       focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
          />
        </div>

        <div className="mt-3 text-xs text-zinc-500">Messages</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-zinc-500">
            {q.trim() ? (
              "No matches. Try a different search."
            ) : (
              <>
                No conversations yet. Click <b>New</b> to start one.
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((item) => {
              const idStr = String(item.conversation._id);
              const active = activeId === idStr;

              const title = item.title ?? "Conversation";
              const avatarUrl = item.avatarUrl ?? "";
              const isOnline = item.isOnline ?? false;

              const previewText =
                item.lastMessage?.deleted
                  ? "This message was deleted"
                  : item.lastMessage?.body ?? "No messages yet";

              const previewIsDeleted = !!item.lastMessage?.deleted;

              const lastTs =
                item.lastMessage?.createdAt ?? item.conversation?.createdAt ?? 0;

              return (
                <button
                  key={idStr}
                  onClick={() => router.push(`/chat/${idStr}`)}
                  className={[
                    "group w-full rounded-2xl p-3 text-left transition relative",
                    active
                      ? "bg-zinc-100 dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10"
                      : "hover:bg-zinc-50 dark:hover:bg-neutral-900/60",
                  ].join(" ")}
                >
                  {active && (
                    <span className="absolute left-1 top-3 bottom-3 w-1 rounded-full bg-black dark:bg-white" />
                  )}

                  <div className="flex items-center gap-3">
                    {/* Avatar + online dot */}
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-neutral-800"
                          alt=""
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-neutral-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                          {initials(title)}
                        </div>
                      )}

                      <span
                        className={[
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2",
                          "border-white dark:border-neutral-950",
                          isOnline
                            ? "bg-green-500"
                            : "bg-zinc-300 dark:bg-neutral-700",
                        ].join(" ")}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate text-zinc-900 dark:text-zinc-100">
                          {title}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400">
                            {formatListTime(lastTs)}
                          </span>

                          {item.unreadCount > 0 && (
                            <span className="text-[11px] bg-black text-white rounded-full px-2 py-0.5">
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={[
                          "text-xs truncate",
                          previewIsDeleted
                            ? "text-zinc-400 italic"
                            : "text-zinc-500 dark:text-zinc-400",
                        ].join(" ")}
                      >
                        {previewText}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}