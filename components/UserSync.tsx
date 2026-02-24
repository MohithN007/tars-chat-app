"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { useSyncUser } from "@/hooks/useSyncUser";
import { usePresence } from "@/hooks/usePresence";

export default function UserSync() {
  const { user, isLoaded } = useUser();

  const me = useQuery(
    api.users.getMe,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  useSyncUser();
  usePresence(me?._id);   // ✅ NO argument

  return null;
}