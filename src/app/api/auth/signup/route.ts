import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { SESSION_COOKIE } from "@/lib/auth";
import { DEFAULT_WIDGET_SETTINGS, isDemoMode } from "@/lib/config";
import { demoSignup } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup payload" }, { status: 400 });
  }

  if (isDemoMode()) {
    try {
      const { token, user } = demoSignup(
        parsed.data.email,
        parsed.data.password,
        parsed.data.orgName
      );
      const res = NextResponse.json({ user });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return res;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Signup failed" },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || "Signup failed" }, { status: 400 });
  }

  const admin = createAdminClient();
  const slugBase = parsed.data.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: parsed.data.orgName,
      slug: `${slugBase}-${nanoid(4)}`,
      widget_key: `pk_${nanoid(16)}`,
      allowed_origins: ["*"],
      seat_limit: 3,
      widget_settings: DEFAULT_WIDGET_SETTINGS,
    })
    .select("*")
    .single();

  if (orgError || !org) {
    return NextResponse.json(
      { error: orgError?.message || "Could not create organization" },
      { status: 500 }
    );
  }

  await admin.from("org_members").insert({
    org_id: org.id,
    user_id: data.user.id,
    role: "owner",
  });

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  });
}
