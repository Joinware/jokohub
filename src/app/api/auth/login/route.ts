import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { demoLogin } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  }

  if (isDemoMode()) {
    try {
      const { token, user } = demoLogin(parsed.data.email, parsed.data.password);
      const res = NextResponse.json({ user });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return res;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Login failed" },
        { status: 401 }
      );
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  });
}
