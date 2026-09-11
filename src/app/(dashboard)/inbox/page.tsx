"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org-id";
import { useOrgRealtimeRefresh } from "@/hooks/use-org-realtime-refresh";
import type { Conversation } from "@/lib/types";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState("");
  const orgId = useActiveOrgId();

  const load = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setError("");
    setConversations(data.conversations || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useOrgRealtimeRefresh({
    orgId,
    onRefresh: () => {
      void load();
    },
    // Demo mode has no realtime — poll a bit faster there.
    fallbackMs: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? 4000 : 30_000,
  });

  return (
    <section className="jh-panel grid min-h-[70vh] overflow-hidden rounded-3xl md:grid-cols-[320px_1fr]">
      <aside className="border-b border-[var(--jh-line)] md:border-b-0 md:border-r">
        <div className="border-b border-[var(--jh-line)] px-4 py-4">
          <h1 className="font-display text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-black/50">{conversations.length} conversations</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {error ? <p className="p-4 text-sm text-red-700">{error}</p> : null}
          {!error && conversations.length === 0 ? (
            <p className="p-4 text-sm text-black/55">
              No chats yet. Open{" "}
              <Link href="/demo-widget" className="font-semibold text-[var(--jh-teal)]">
                the demo widget
              </Link>{" "}
              and send a message.
            </p>
          ) : null}
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/inbox/${c.id}`}
              className="block border-b border-[var(--jh-line)] px-4 py-3 hover:bg-white/70"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {c.visitor?.displayName || "Visitor"}
                </p>
                {c.unreadForAgents > 0 ? (
                  <span className="rounded-full bg-[var(--jh-amber)] px-2 py-0.5 text-xs font-semibold text-white">
                    {c.unreadForAgents}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-sm text-black/55">{c.preview || c.status}</p>
            </Link>
          ))}
        </div>
      </aside>
      <div className="hidden place-items-center p-8 text-center text-black/45 md:grid">
        <div>
          <p className="font-display text-2xl text-[var(--jh-teal)]">Select a conversation</p>
          <p className="mt-2 text-sm">Assign, reply, and resolve from the thread view.</p>
        </div>
      </div>
    </section>
  );
}
