import { z } from "zod";
import { isDemoMode } from "@/lib/config";
import { demoOrgByWidgetKey } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonWithCors,
  optionsWithCors,
  originAllowed,
} from "@/lib/widget-cors";

const querySchema = z.object({
  key: z.string().min(8),
});

export async function OPTIONS(req: Request) {
  return optionsWithCors(req.headers.get("origin"));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  const parsed = querySchema.safeParse({ key: url.searchParams.get("key") });
  if (!parsed.success) {
    return jsonWithCors(
      { error: "Missing widget key" },
      { status: 400, origin }
    );
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
    return jsonWithCors(
      {
        orgId: org.id,
        name: org.name,
        settings: org.widgetSettings,
        realtime: null,
      },
      { origin }
    );
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;

  return jsonWithCors(
    {
      orgId: org.id,
      name: org.name,
      settings: org.widget_settings,
      realtime:
        supabaseUrl && supabaseAnonKey
          ? { url: supabaseUrl, anonKey: supabaseAnonKey }
          : null,
    },
    { origin }
  );
}
