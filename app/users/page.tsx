"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [q, setQ] = useState("");
  const [openingFor, setOpeningFor] = useState<string | null>(null);

  const me = useQuery(
    api.users.getByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const users = useQuery(
    api.users.getAllUsersExceptMe,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateDirectConversation
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    const query = q.trim().toLowerCase();
    if (!query) return users;

    return users.filter((u: any) => {
      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, q]);

  async function openChat(otherUserId: string) {
    if (!me) return;

    setOpeningFor(otherUserId);
    try {
      const conversationId = await getOrCreateConversation({
        meId: me._id,
        otherUserId,
      });

      router.push(`/chat/${conversationId}`);
    } finally {
      setOpeningFor(null);
    }
  }

  // Loading skeleton (same logic, nicer UI)
  if (!isLoaded || !me || !users) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-neutral-800" />
              <div className="mt-2 h-4 w-64 rounded bg-zinc-200 dark:bg-neutral-800" />
            </div>
            <div className="h-10 w-24 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
          </div>

          <div className="mt-5 h-10 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />

          <div className="mt-6 grid gap-3">
            <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
            <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
            <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
            <div className="h-16 rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Users
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Pick someone to start a chat.
            </p>
          </div>

          <button
  onClick={() => router.push("/")}
  className="text-sm px-3 py-2 rounded-2xl border border-zinc-200 dark:border-neutral-800
             bg-white dark:bg-neutral-950 hover:bg-zinc-50 dark:hover:bg-neutral-900 transition"
  title="Back to home"
>
  ← Home
</button>
        </div>

        {/* Search */}
        <div className="mt-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name (or email if available)…"
            className="w-full text-sm px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900 outline-none
                       focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
          />
        </div>

        {/* List */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 text-center">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No users found
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Try a different search.
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((u: any) => {
                const idStr = String(u._id);
                const name = u.name ?? "User";
                const email = u.email ?? "";
                const isOnline = !!u.isOnline;

                return (
                  <button
                    key={idStr}
                    onClick={() => openChat(u._id)}
                    disabled={openingFor === idStr}
                    className="w-full text-left rounded-2xl border border-zinc-200 dark:border-neutral-800
                               bg-white dark:bg-neutral-950 p-3 flex items-center gap-3
                               hover:bg-zinc-50 dark:hover:bg-neutral-900/60 transition
                               disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {u.imageUrl ? (
                        <img
                          src={u.imageUrl}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-neutral-800"
                          alt=""
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full border border-zinc-200 dark:border-neutral-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                          {initials(name)}
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
                          {name}
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>

                      {email ? (
                        <div className="text-xs text-zinc-500 truncate">
                          {email}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 truncate">
                          Tap to message
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="shrink-0">
                      <span className="text-xs px-3 py-2 rounded-2xl bg-black text-white inline-block">
                        {openingFor === idStr ? "Opening…" : "Message"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

       
      </div>
    </div>
  );
}