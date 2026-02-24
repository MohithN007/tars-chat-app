"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function usePresence(userId?: Id<"users">) {
  const heartbeat = useMutation(api.users.heartbeat);

  useEffect(() => {
    if (!userId) return;

    // mark immediately
    heartbeat({ userId });

    const interval = setInterval(() => {
      heartbeat({ userId });
    }, 15000);

    return () => clearInterval(interval);
  }, [userId, heartbeat]);
}