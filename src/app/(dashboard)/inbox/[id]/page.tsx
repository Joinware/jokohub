"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org-id";
import { useOrgRealtimeRefresh } from "@/hooks/use-org-realtime-refresh";
import type { Conversation, Message } from "@/lib/types";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const orgId = useActiveOrgId();

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setError("");
    setConversation(data.conversation);
    setMessages(data.messages || []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useOrgRealtimeRefresh({
    orgId,
    conversationId: id || null,
    onRefresh: () => {
      void load();
    },
    fallbackMs: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? 3000 : 30_000,
  });

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !id) return;
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Send failed");
      return;
    }
    setBody("");
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [...prev, data.message];
    });
  }

  async function setStatus(status: "open" | "resolved") {
    if (!id) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setConversation((c) => (c ? { ...c, status } : c));
  }

  return (
    <section className="jh-panel flex min-h-[70vh] flex-col overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--jh-line)] px-4 py-3">
        <div>
          <Link href="/inbox" className="text-sm text-black/50 hover:text-[var(--jh-teal)]">
            ← Inbox
          </Link>
          <h1 className="font-display text-2xl font-semibold">
            {conversation?.visitor?.displayName || "Conversation"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatus("open")}
            className="jh-btn jh-btn-ghost px-3 py-1.5 text-xs"
          >
            Reopen
          </button>
          <button
            type="button"
            onClick={() => setStatus("resolved")}
            className="jh-btn jh-btn-primary px-3 py-1.5 text-xs"
          >
            Resolve
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.senderType === "agent"
                ? "ml-auto bg-[var(--jh-teal)] text-white"
                : m.senderType === "system"
                  ? "bg-[var(--jh-sand)] text-black/60"
                  : "bg-white border border-[var(--jh-line)]"
            }`}
          >
            <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
              {m.senderType}
            </p>
            <p>{m.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-[var(--jh-line)] p-4">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Reply to visitor…"
          className="flex-1 rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
        />
        <button type="submit" className="jh-btn jh-btn-primary">
          Send
        </button>
      </form>
    </section>
  );
}
