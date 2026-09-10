import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveOrg } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { demoDb, demoListMessages } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    const convo = demoDb().conversations.find(
      (c) => c.id === id && c.orgId === active.org.id
    );
    if (!convo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const visitor = demoDb().visitors.find((v) => v.id === convo.visitorId);
    return NextResponse.json({
      conversation: { ...convo, visitor },
      messages: demoListMessages(id),
    });
  }

  const supabase = await createClient();
  const { data: convo, error } = await supabase
    .from("conversations")
    .select("*, visitors(*)")
    .eq("id", id)
    .eq("org_id", active.org.id)
    .maybeSingle();

  if (error || !convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    conversation: {
      id: convo.id,
      orgId: convo.org_id,
      visitorId: convo.visitor_id,
      status: convo.status,
      assignedTo: convo.assigned_to,
      lastMessageAt: convo.last_message_at,
      unreadForAgents: convo.unread_for_agents,
      createdAt: convo.created_at,
      visitor: convo.visitors
        ? {
            id: convo.visitors.id,
            orgId: convo.visitors.org_id,
            sessionKey: convo.visitors.session_key,
            displayName: convo.visitors.display_name,
            email: convo.visitors.email,
            createdAt: convo.visitors.created_at,
          }
        : undefined,
    },
    messages: (messages || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      orgId: m.org_id,
      senderType: m.sender_type,
      senderUserId: m.sender_user_id,
      body: m.body,
      createdAt: m.created_at,
    })),
  });
}

const patchSchema = z.object({
  status: z.enum(["open", "resolved"]).optional(),
  assignedTo: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (isDemoMode()) {
    const convo = demoDb().conversations.find(
      (c) => c.id === id && c.orgId === active.org.id
    );
    if (!convo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (parsed.data.status) convo.status = parsed.data.status;
    if (parsed.data.assignedTo !== undefined) {
      convo.assignedTo = parsed.data.assignedTo;
    }
    return NextResponse.json({ conversation: convo });
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.assignedTo !== undefined) {
    updates.assigned_to = parsed.data.assignedTo;
  }

  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .eq("org_id", active.org.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ conversation: data });
}
