"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTyping } from "@/hooks/useTyping";

function formatMessageTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  const sameYear = d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (sameYear) {
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

type Reaction = { emoji: string; userId: Id<"users"> };

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();

  const conversationId = params.conversationId as Id<"conversations">;

  const { user, isLoaded } = useUser();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [text, setText] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [openReactionsFor, setOpenReactionsFor] = useState<string | null>(null);

  // send states
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedDraft, setFailedDraft] = useState<string | null>(null);

  // for typing expiry refresh
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 800);
    return () => clearInterval(i);
  }, []);

  // Queries / mutations
  const me = useQuery(
    api.users.getByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const myId = me?._id;

  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip"
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId } : "skip"
  );

  // Conversation meta (other user)
  const meta = useQuery(
    api.conversations.getConversationMeta,
    me ? { conversationId, meId: me._id } : "skip"
  );
  const otherUser = meta?.otherUser;

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const markRead = useMutation(api.readReceipts.markRead);

  // typing notifier (hook)
  const notifyTyping = useTyping(conversationId, myId);

  const othersTyping =
    typingUsers?.filter((t) => t.userId !== myId && (t.expiresAt ?? 0) > now) ??
    [];

  const emojis = useMemo(() => ["👍", "❤️", "😂", "😮", "😢"], []);

  // mark read whenever messages update
  useEffect(() => {
    if (!myId || !messages) return;
    markRead({ conversationId, userId: myId });
  }, [messages, myId, conversationId, markRead]);

  // scroll tracking
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;

    const threshold = 60;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }

  // auto-scroll if at bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isAtBottom) el.scrollTop = el.scrollHeight;
  }, [messages, isAtBottom]);

  // LOADING UI (after hooks)
  if (!isLoaded || !me || messages === undefined) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
        <div className="border-b p-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/conversations")}
            className="md:hidden text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-900"
          >
            ←
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-neutral-800" />
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-neutral-800" />
            <div className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-neutral-800" />
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 bg-zinc-50 dark:bg-neutral-950">
          <div className="h-10 w-2/3 rounded-2xl bg-gray-200 dark:bg-neutral-800" />
          <div className="h-10 w-1/2 rounded-2xl bg-gray-200 dark:bg-neutral-800 ml-auto" />
          <div className="h-10 w-3/5 rounded-2xl bg-gray-200 dark:bg-neutral-800" />
          <div className="h-10 w-2/5 rounded-2xl bg-gray-200 dark:bg-neutral-800 ml-auto" />
        </div>

        <div className="border-t p-3">
          <div className="h-10 rounded-2xl bg-gray-200 dark:bg-neutral-800" />
        </div>
      </div>
    );
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || !me) return;

    setSending(true);
    setSendError(null);

    try {
      await sendMessage({
        conversationId,
        senderId: me._id,
        body: trimmed,
      });

      setText("");
      setFailedDraft(null);
      setOpenReactionsFor(null);
    } catch (err) {
      console.error(err);
      setSendError("Failed to send. Check your connection.");
      setFailedDraft(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
        <div className="p-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/conversations")}
            className="md:hidden text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-900"
            title="Back"
          >
            ←
          </button>

          {/* Avatar + online dot */}
          <div className="relative">
            {otherUser?.imageUrl ? (
              <img
                src={otherUser.imageUrl}
                className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-neutral-800"
                alt=""
              />
            ) : (
              <div className="w-9 h-9 rounded-full border border-zinc-200 dark:border-neutral-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {initials(otherUser?.name)}
              </div>
            )}

            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950 ${
                otherUser?.isOnline ? "bg-green-500" : "bg-zinc-300 dark:bg-neutral-700"
              }`}
              title={otherUser?.isOnline ? "Online" : "Offline"}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{otherUser?.name ?? "Chat"}</div>
            <div className="text-xs text-zinc-500">
              {othersTyping.length > 0
                ? "Typing…"
                : otherUser?.isOnline
                ? "Online"
                : otherUser?.lastSeen
                ? `Last seen ${formatMessageTime(otherUser.lastSeen)}`
                : "Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-neutral-950 px-4 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                No messages yet
              </div>
              <div className="text-xs text-zinc-500 mt-1">Say hi 👋</div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === me._id;
            const reactions = (m.reactions ?? []) as Reaction[];

            const counts = new Map<string, number>();
            for (const r of reactions) {
              counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
            }

            const reactedByMe = (emoji: string) =>
              reactions.some((r) => r.emoji === emoji && r.userId === me._id);

            return (
              <div
                key={m._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[82%] md:max-w-[60%]">
                  <div
                    className={[
                      "rounded-2xl px-3 py-2 text-sm shadow-sm border",
                      "break-words whitespace-pre-wrap",
                      isMe
                        ? "bg-black text-white border-black/10 rounded-br-md"
                        : "bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-neutral-800 rounded-bl-md",
                      m.deleted ? "opacity-70 italic" : "",
                    ].join(" ")}
                  >
                    {m.deleted ? "This message was deleted" : m.body}
                  </div>

                  {/* Reactions */}
                  {!m.deleted && (
                    <div
                      className={`mt-1 flex items-center gap-2 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {emojis
                          .filter((e) => (counts.get(e) ?? 0) > 0)
                          .map((e) => (
                            <button
                              key={`pill-${m._id}-${e}`}
                              onClick={() =>
                                toggleReaction({
                                  messageId: m._id,
                                  userId: me._id,
                                  emoji: e,
                                })
                              }
                              className={[
                                "text-xs border rounded-full px-2 py-0.5 transition",
                                "bg-white/70 dark:bg-neutral-900/60 backdrop-blur",
                                "border-zinc-200 dark:border-neutral-800",
                                reactedByMe(e)
                                  ? "ring-2 ring-black/10 dark:ring-white/10"
                                  : "hover:bg-zinc-100 dark:hover:bg-neutral-900",
                              ].join(" ")}
                            >
                              {e} {counts.get(e)}
                            </button>
                          ))}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenReactionsFor(openReactionsFor === m._id ? null : m._id)
                          }
                          className="text-xs border rounded-full px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-neutral-900 border-zinc-200 dark:border-neutral-800 transition"
                          title="Add reaction"
                        >
                          🙂
                        </button>

                        {openReactionsFor === m._id && (
                          <div className="absolute z-20 mt-2 right-0 rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg p-2 flex gap-1">
                            {emojis.map((e) => (
                              <button
                                key={`pick-${m._id}-${e}`}
                                onClick={() => {
                                  toggleReaction({
                                    messageId: m._id,
                                    userId: me._id,
                                    emoji: e,
                                  });
                                  setOpenReactionsFor(null);
                                }}
                                className="text-lg leading-none px-1.5 py-1 hover:scale-110 transition"
                                aria-label={`React ${e}`}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meta row */}
                  <div
                    className={`mt-1 flex items-center gap-2 ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="text-[11px] text-zinc-400">
                      {formatMessageTime(m.createdAt)}
                    </span>

                    {isMe && !m.deleted && (
                      <button
                        onClick={() => deleteMessage({ messageId: m._id, userId: me._id })}
                        className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Typing indicator */}
      {othersTyping.length > 0 && (
        <div className="px-4 pb-2 text-sm text-zinc-500 flex items-center gap-2">
          <span className="inline-flex">
            <span className="animate-bounce">·</span>
            <span className="animate-bounce [animation-delay:120ms]">·</span>
            <span className="animate-bounce [animation-delay:240ms]">·</span>
          </span>
          <span className="truncate">
            Someone {othersTyping.length === 1 ? "is" : "are"} typing…
          </span>
        </div>
      )}

      {/* New messages */}
      {!isAtBottom && (
        <div className="px-4 pb-3 flex justify-center">
          <button
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              el.scrollTop = el.scrollHeight;
              setIsAtBottom(true);
            }}
            className="text-xs bg-black text-white px-3 py-1.5 rounded-full shadow-lg hover:opacity-95 active:scale-[0.98] transition"
          >
            ↓ New messages
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="border-t bg-white dark:bg-neutral-950 sticky bottom-0">
        {sendError && (
          <div className="px-4 pt-2 text-sm text-red-500 flex items-center gap-2">
            <span>{sendError}</span>
            {failedDraft && (
              <button
                onClick={() => {
                  setText(failedDraft);
                  setSendError(null);
                }}
                className="text-xs underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="p-3 flex gap-2 items-end">
          <input
            className="flex-1 border rounded-2xl px-4 py-2 text-sm bg-white dark:bg-neutral-900
                       border-zinc-200 dark:border-neutral-800 outline-none
                       focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
          />

          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="px-4 py-2 rounded-2xl text-white text-sm font-medium
                       bg-black disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-[0.98] transition"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}