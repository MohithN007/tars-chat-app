"use client";

import { useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useTyping(
  conversationId?: Id<"conversations">,
  userId?: Id<"users">
) {
  const setTyping = useMutation(api.typing.setTyping);
  const lastSentRef = useRef(0);

  return function notifyTyping() {
    if (!conversationId || !userId) return;

    const now = Date.now();
    if (now - lastSentRef.current < 700) return;

    lastSentRef.current = now;
    setTyping({ conversationId, userId });
  };
}