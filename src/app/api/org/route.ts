import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveOrg } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { demoDb } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    org: active.org,
    role: active.role,
    user: active.user,
  });
}

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  allowedOrigins: z.array(z.string()).optional(),
  widgetSettings: z
    .object({
      primaryColor: z.string().optional(),
      greeting: z.string().optional(),
      position: z.enum(["left", "right"]).optional(),
    })
    .optional(),
});

export async function PATCH(req: Request) {
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (active.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (isDemoMode()) {
    const org = demoDb().orgs.find((o) => o.id === active.org.id);
    if (!org) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (parsed.data.name) org.name = parsed.data.name;
    if (parsed.data.allowedOrigins) org.allowedOrigins = parsed.data.allowedOrigins;
    if (parsed.data.widgetSettings) {
      org.widgetSettings = { ...org.widgetSettings, ...parsed.data.widgetSettings };
    }
    return NextResponse.json({ org });
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.allowedOrigins) updates.allowed_origins = parsed.data.allowedOrigins;
  if (parsed.data.widgetSettings) {
    updates.widget_settings = {
      ...active.org.widgetSettings,
      ...parsed.data.widgetSettings,
    };
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", active.org.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ org: data });
}
