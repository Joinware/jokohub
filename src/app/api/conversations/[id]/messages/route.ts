import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveOrg } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { demoAddMessage, demoDb } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  if (isDemoMode()) {
    const convo = demoDb().conversations.find(
      (c) => c.id === id && c.orgId === active.org.id
    );
    if (!convo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const message = demoAddMessage(
      id,
      active.org.id,
      "agent",
      parsed.data.body,
      active.user.id
    );
    if (!convo.assignedTo) convo.assignedTo = active.user.id;
    return NextResponse.json({ message });
  }

  const supabase = await createClient();
  const { data: convo } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .eq("org_id", active.org.id)
    .maybeSingle();
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      org_id: active.org.id,
      sender_type: "agent",
      sender_user_id: active.user.id,
      body: parsed.data.body,
    })
    .select("*")
    .single();

  if (error || !message) {
    return NextResponse.json({ error: error?.message || "Send failed" }, { status: 500 });
  }

  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      unread_for_agents: 0,
      assigned_to: active.user.id,
      status: "open",
    })
    .eq("id", id);

  return NextResponse.json({
    message: {
      id: message.id,
      conversationId: message.conversation_id,
      orgId: message.org_id,
      senderType: message.sender_type,
      senderUserId: message.sender_user_id,
      body: message.body,
      createdAt: message.created_at,
    },
  });
}
