"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useSyncUser() {
  const { isSignedIn, isLoaded, user } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const clerkId = user.id;

    const name =
      user.fullName ??
      ([user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "Anonymous");

    const imageUrl = user.imageUrl ?? "";

    upsertUser({ clerkId, name, imageUrl }).catch((err) => {
      console.error("[useConvexUserSync] Failed to upsert user:", err);
    });
  }, [isLoaded, isSignedIn, user?.id, user?.fullName, user?.imageUrl]);
}