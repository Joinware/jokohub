import { z } from "zod";
import { isDemoMode } from "@/lib/config";
import {
  demoAddMessage,
  demoEnsureVisitor,
  demoListMessages,
  demoOpenOrCreateConversation,
  demoOrgByWidgetKey,
} from "@/lib/demo-store";
import { notifyConversationRefresh } from "@/lib/notify-conversation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonWithCors,
  optionsWithCors,
  originAllowed,
} from "@/lib/widget-cors";

const postSchema = z.object({
  key: z.string().min(8),
  sessionKey: z.string().min(8),
  body: z.string().min(1).max(4000),
  displayName: z.string().max(80).optional(),
});

const getSchema = z.object({
  key: z.string().min(8),
  sessionKey: z.string().min(8),
  conversationId: z.string().optional(),
});

export async function OPTIONS(req: Request) {
  return optionsWithCors(req.headers.get("origin"));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  const parsed = getSchema.safeParse({
    key: url.searchParams.get("key"),
    sessionKey: url.searchParams.get("sessionKey"),
    conversationId: url.searchParams.get("conversationId") || undefined,
  });
  if (!parsed.success) {
    return jsonWithCors({ error: "Invalid query" }, { status: 400, origin });
  }

  if (isDemoMode()) {
    const org = demoOrgByWidgetKey(parsed.data.key);
    if (!org) {
      return jsonWithCors(
        { error: "Unknown widget key" },
        { status: 404, origin }
      );
    }
    if (!originAllowed(org.allowedOrigins, origin)) {
      return jsonWithCors(
        { error: "Origin not allowed" },
        { status: 403, origin }
      );
    }
    const visitor = demoEnsureVisitor(org.id, parsed.data.sessionKey);
    const convo = demoOpenOrCreateConversation(org.id, visitor.id);
    return jsonWithCors(
      {
        conversationId: convo.id,
        messages: demoListMessages(convo.id),
      },
      { origin }
    );
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, allowed_origins")
    .eq("widget_key", parsed.data.key)
    .maybeSingle();
  if (!org) {
    return jsonWithCors(
      { error: "Unknown widget key" },
      { status: 404, origin }
    );
  }
  if (!originAllowed(org.allowed_origins || [], origin)) {
    return jsonWithCors(
      { error: "Origin not allowed" },
      { status: 403, origin }
    );
  }

  let { data: visitor } = await admin
    .from("visitors")
    .select("*")
    .eq("org_id", org.id)
    .eq("session_key", parsed.data.sessionKey)
    .maybeSingle();

  if (!visitor) {
    const inserted = await admin
      .from("visitors")
      .insert({
        org_id: org.id,
        session_key: parsed.data.sessionKey,
        display_name: "Visitor",
      })
      .select("*")
      .single();
    visitor = inserted.data;
  }
  if (!visitor) {
    return jsonWithCors(
      { error: "Visitor create failed" },
      { status: 500, origin }
    );
  }

  let { data: convo } = await admin
    .from("conversations")
    .select("*")
    .eq("org_id", org.id)
    .eq("visitor_id", visitor.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!convo) {
    const inserted = await admin
      .from("conversations")
      .insert({ org_id: org.id, visitor_id: visitor.id, status: "open" })
      .select("*")
      .single();
    convo = inserted.data;
  }
  if (!convo) {
    return jsonWithCors(
      { error: "Conversation create failed" },
      { status: 500, origin }
    );
  }

  const { data: messages } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", convo.id)
    .order("created_at", { ascending: true });

  return jsonWithCors(
    {
      conversationId: convo.id,
      messages: (messages || []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        orgId: m.org_id,
        senderType: m.sender_type,
        senderUserId: m.sender_user_id,
        body: m.body,
        createdAt: m.created_at,
      })),
    },
    { origin }
  );
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonWithCors({ error: "Invalid body" }, { status: 400, origin });
  }

  if (isDemoMode()) {
    const org = demoOrgByWidgetKey(parsed.data.key);
    if (!org) {
      return jsonWithCors(
        { error: "Unknown widget key" },
        { status: 404, origin }
      );
    }
    if (!originAllowed(org.allowedOrigins, origin)) {
      return jsonWithCors(
        { error: "Origin not allowed" },
        { status: 403, origin }
      );
    }
    const visitor = demoEnsureVisitor(
      org.id,
      parsed.data.sessionKey,
      parsed.data.displayName
    );
    const convo = demoOpenOrCreateConversation(org.id, visitor.id);
    if (org.widgetSettings.greeting && demoListMessages(convo.id).length === 0) {
      demoAddMessage(convo.id, org.id, "system", org.widgetSettings.greeting);
    }
    const message = demoAddMessage(convo.id, org.id, "visitor", parsed.data.body);
    return jsonWithCors({ conversationId: convo.id, message }, { origin });
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("widget_key", parsed.data.key)
    .maybeSingle();
  if (!org) {
    return jsonWithCors(
      { error: "Unknown widget key" },
      { status: 404, origin }
    );
  }
  if (!originAllowed(org.allowed_origins || [], origin)) {
    return jsonWithCors(
      { error: "Origin not allowed" },
      { status: 403, origin }
    );
  }

  let { data: visitor } = await admin
    .from("visitors")
    .select("*")
    .eq("org_id", org.id)
    .eq("session_key", parsed.data.sessionKey)
    .maybeSingle();

  if (!visitor) {
    const inserted = await admin
      .from("visitors")
      .insert({
        org_id: org.id,
        session_key: parsed.data.sessionKey,
        display_name: parsed.data.displayName || "Visitor",
      })
      .select("*")
      .single();
    visitor = inserted.data;
  }
  if (!visitor) {
    return jsonWithCors(
      { error: "Visitor create failed" },
      { status: 500, origin }
    );
  }

  let { data: convo } = await admin
    .from("conversations")
    .select("*")
    .eq("org_id", org.id)
    .eq("visitor_id", visitor.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!convo) {
    const inserted = await admin
      .from("conversations")
      .insert({ org_id: org.id, visitor_id: visitor.id, status: "open" })
      .select("*")
      .single();
    convo = inserted.data;
  }
  if (!convo) {
    return jsonWithCors(
      { error: "Conversation create failed" },
      { status: 500, origin }
    );
  }

  const { count } = await admin
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", convo.id);

  if ((count || 0) === 0 && org.widget_settings?.greeting) {
    await admin.from("messages").insert({
      conversation_id: convo.id,
      org_id: org.id,
      sender_type: "system",
      body: org.widget_settings.greeting,
    });
  }

  const { data: message, error } = await admin
    .from("messages")
    .insert({
      conversation_id: convo.id,
      org_id: org.id,
      sender_type: "visitor",
      body: parsed.data.body,
    })
    .select("*")
    .single();

  if (error || !message) {
    return jsonWithCors(
      { error: error?.message || "Send failed" },
      { status: 500, origin }
    );
  }

  await admin
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      unread_for_agents: (convo.unread_for_agents || 0) + 1,
      status: "open",
    })
    .eq("id", convo.id);

  await notifyConversationRefresh(convo.id);

  return jsonWithCors(
    {
      conversationId: convo.id,
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        orgId: message.org_id,
        senderType: message.sender_type,
        senderUserId: message.sender_user_id,
        body: message.body,
        createdAt: message.created_at,
      },
    },
    { origin }
  );
}
