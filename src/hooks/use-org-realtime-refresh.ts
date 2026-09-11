"use client";

import { useEffect, useEffectEvent } from "react";
import { createClient } from "@/lib/supabase/client";

function isBrowserDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/**
 * Refetch when conversations/messages change for an org (or one thread).
 * Demo mode skips Supabase and relies on the caller's fallback poll.
 */
export function useOrgRealtimeRefresh(options: {
  orgId: string | null;
  conversationId?: string | null;
  onRefresh: () => void;
  /** Slow safety net when realtime drops (ms). Default 30s; 0 disables. */
  fallbackMs?: number;
}) {
  const { orgId, conversationId = null, fallbackMs = 30_000 } = options;
  const onRefresh = useEffectEvent(options.onRefresh);

  useEffect(() => {
    if (!orgId || isBrowserDemoMode()) {
      if (!orgId || fallbackMs <= 0) return;
      const t = setInterval(() => onRefresh(), fallbackMs);
      return () => clearInterval(t);
    }

    const supabase = createClient();
    const topic = conversationId
      ? `jh-thread-${conversationId}`
      : `jh-inbox-${orgId}`;

    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `org_id=eq.${orgId}`,
        },
        () => onRefresh()
      )
      .on(
        "postgres_changes",
        conversationId
          ? {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            }
          : {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `org_id=eq.${orgId}`,
            },
        () => onRefresh()
      )
      .subscribe();

    const fallback =
      fallbackMs > 0 ? setInterval(() => onRefresh(), fallbackMs) : null;

    return () => {
      if (fallback) clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [orgId, conversationId, fallbackMs]);
}
