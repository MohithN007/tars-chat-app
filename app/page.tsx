"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString([], { month: "short", day: "numeric" });
}

function SignedInHome() {
  const { user, isLoaded } = useUser();

  const me = useQuery(
    api.users.getByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const conversations = useQuery(
    api.conversations.listForUserWithUnread,
    me ? { userId: me._id } : "skip"
  );

  const totalUnread =
    conversations?.reduce((sum: number, c: any) => sum + (c.unreadCount ?? 0), 0) ?? 0;

  const recent = (conversations ?? []).slice(0, 5);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              Home
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Jump into chats or start a new one.
            </p>
          </div>

          <div className="shrink-0">
            <UserButton />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {/* Profile card */}
          <div className="md:col-span-2 rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 shadow-sm">
            {!me || conversations === undefined ? (
              <div className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-neutral-800" />
                  <div className="flex-1">
                    <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-neutral-800" />
                    <div className="mt-2 h-4 w-56 rounded bg-zinc-200 dark:bg-neutral-800" />
                    <div className="mt-2 h-3 w-24 rounded bg-zinc-200 dark:bg-neutral-800" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
                  <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
                  <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-2">
                  <div className="h-11 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
                  <div className="h-11 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {me.imageUrl ? (
                      <img
                        src={me.imageUrl}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-neutral-800"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-zinc-200 dark:border-neutral-800 flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {initials(me.name)}
                      </div>
                    )}

                    <span
                      className={[
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2",
                        "border-white dark:border-neutral-950",
                        me.isOnline ? "bg-green-500" : "bg-zinc-300 dark:bg-neutral-700",
                      ].join(" ")}
                      title={me.isOnline ? "Online" : "Offline"}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {me.name ?? "You"}
                    </div>
                    <div className="text-sm text-zinc-500 truncate">
                      {me.email ?? "Signed in"}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {me.isOnline ? "Online now" : "Offline"}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 p-3">
                    <div className="text-xs text-zinc-500">Chats</div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {conversations.length}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 p-3">
                    <div className="text-xs text-zinc-500">Unread</div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {totalUnread}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 p-3">
                    <div className="text-xs text-zinc-500">Status</div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {me.isOnline ? "On" : "Off"}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-2">
                  <Link
                    href="/users"
                    className="rounded-2xl bg-black text-white px-4 py-3 text-sm font-medium text-center
                               hover:opacity-95 active:scale-[0.98] transition"
                  >
                    + Start new chat
                  </Link>

                  <Link
                    href="/conversations"
                    className="rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950
                               px-4 py-3 text-sm font-medium text-center
                               hover:bg-zinc-50 dark:hover:bg-neutral-900 active:scale-[0.98] transition"
                  >
                    View conversations
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Quick panel */}
          <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Quick actions
            </div>

            <div className="mt-3 grid gap-2">
              <Link
                href="/users"
                className="w-full rounded-2xl bg-black text-white px-4 py-3 text-sm font-medium text-center
                           hover:opacity-95 active:scale-[0.98] transition"
              >
                Browse users
              </Link>
              <Link
                href="/conversations"
                className="w-full rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950
                           px-4 py-3 text-sm font-medium text-center
                           hover:bg-zinc-50 dark:hover:bg-neutral-900 active:scale-[0.98] transition"
              >
                My conversations
              </Link>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Tip: open normal + incognito to demo realtime.
            </div>
          </div>
        </div>

        {/* Recent conversations */}
        <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Recent conversations
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Open a chat instantly.
              </div>
            </div>

            <Link
              href="/conversations"
              className="text-sm px-3 py-2 rounded-2xl border border-zinc-200 dark:border-neutral-800
                         hover:bg-zinc-50 dark:hover:bg-neutral-900 transition"
            >
              View all
            </Link>
          </div>

          {conversations === undefined ? (
            <div className="mt-4 space-y-2 animate-pulse">
              <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
              <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
              <div className="h-14 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="mt-5 text-sm text-zinc-500">
              No chats yet. Start one from <b>Browse users</b>.
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {recent.map((item: any) => {
                const idStr = String(item.conversation._id);
                const title = item.title ?? "Conversation";
                const unread = item.unreadCount ?? 0;

                const preview = item.lastMessage?.deleted
                  ? "This message was deleted"
                  : item.lastMessage?.body ?? "No messages yet";

                const ts = item.lastMessage?.createdAt ?? item.conversation?.createdAt;

                return (
                  <Link
                    key={idStr}
                    href={`/chat/${idStr}`}
                    className="block w-full rounded-2xl border border-zinc-200 dark:border-neutral-800
                               bg-zinc-50/50 dark:bg-neutral-900/30 p-3
                               hover:bg-zinc-50 dark:hover:bg-neutral-900/60 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate text-zinc-900 dark:text-zinc-100">
                        {title}
                      </div>

                      <span className="ml-auto text-[11px] text-zinc-400">
                        {formatTime(ts)}
                      </span>

                      {unread > 0 && (
                        <span className="text-[11px] bg-black text-white rounded-full px-2 py-0.5">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-500 truncate mt-1">
                      {preview}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <>
      <SignedOut>
        <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950">
          <div className="max-w-xl mx-auto px-4 py-14">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                Tars Chat
              </h1>
              <p className="text-sm text-zinc-500 mt-2">
                Sign in to message users and view your conversations.
              </p>

              <div className="mt-6 inline-flex">
                <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
                  <SignInButton />
                 
                </div>
              </div>
            </div>
          </div>
        </main>
      </SignedOut>

      <SignedIn>
        <SignedInHome />
      </SignedIn>
    </>
  );
}