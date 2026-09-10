import { NextResponse } from "next/server";
import { getActiveOrg } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { demoListConversations } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ conversations: demoListConversations(active.org.id) });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, visitors(*)")
    .eq("org_id", active.org.id)
    .order("last_message_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversations = (data || []).map((row) => ({
    id: row.id,
    orgId: row.org_id,
    visitorId: row.visitor_id,
    status: row.status,
    assignedTo: row.assigned_to,
    lastMessageAt: row.last_message_at,
    unreadForAgents: row.unread_for_agents,
    createdAt: row.created_at,
    visitor: row.visitors
      ? {
          id: row.visitors.id,
          orgId: row.visitors.org_id,
          sessionKey: row.visitors.session_key,
          displayName: row.visitors.display_name,
          email: row.visitors.email,
          createdAt: row.visitors.created_at,
        }
      : undefined,
    preview: "",
  }));

  return NextResponse.json({ conversations });
}
