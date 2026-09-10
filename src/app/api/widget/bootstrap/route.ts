import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/config";
import { demoOrgByWidgetKey } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  key: z.string().min(8),
});

function originAllowed(allowed: string[], origin: string | null) {
  if (!origin) return true;
  if (allowed.includes("*")) return true;
  return allowed.some((o) => o === origin || o === "*");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ key: url.searchParams.get("key") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing widget key" }, { status: 400 });
  }

  const origin = req.headers.get("origin");

  if (isDemoMode()) {
    const org = demoOrgByWidgetKey(parsed.data.key);
    if (!org) {
      return NextResponse.json({ error: "Unknown widget key" }, { status: 404 });
    }
    if (!originAllowed(org.allowedOrigins, origin)) {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    }
    return NextResponse.json({
      orgId: org.id,
      name: org.name,
      settings: org.widgetSettings,
    });
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("widget_key", parsed.data.key)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ error: "Unknown widget key" }, { status: 404 });
  }
  if (!originAllowed(org.allowed_origins || [], origin)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  return NextResponse.json({
    orgId: org.id,
    name: org.name,
    settings: org.widget_settings,
  });
}
