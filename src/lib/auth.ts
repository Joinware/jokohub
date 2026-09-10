import { cookies } from "next/headers";
import { isDemoMode } from "./config";
import { demoOrgForUser, demoUserFromToken } from "./demo-store";
import { createClient } from "./supabase/server";
import type { Organization, SessionUser } from "./types";

const COOKIE = "jh_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemoMode()) {
    const jar = await cookies();
    return demoUserFromToken(jar.get(COOKIE)?.value);
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  return { id: data.user.id, email: data.user.email };
}

export async function getActiveOrg(): Promise<{
  user: SessionUser;
  org: Organization;
  role: "owner" | "agent";
} | null> {
  const user = await getSessionUser();
  if (!user) return null;

  if (isDemoMode()) {
    const pair = demoOrgForUser(user.id);
    if (!pair) return null;
    return { user, org: pair.org, role: pair.membership.role };
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, org_id, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organizations) return null;
  const orgRaw = membership.organizations;
  const row = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as Record<
    string,
    unknown
  > | null;
  if (!row) return null;
  const org: Organization = {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    widgetKey: String(row.widget_key),
    allowedOrigins: (row.allowed_origins as string[]) || [],
    seatLimit: Number(row.seat_limit ?? 3),
    stripeCustomerId: (row.stripe_customer_id as string) || null,
    stripeSubscriptionId: (row.stripe_subscription_id as string) || null,
    stripeSubscriptionStatus:
      (row.stripe_subscription_status as string) || null,
    widgetSettings: (row.widget_settings as Organization["widgetSettings"]) || {
      primaryColor: "#0A3D3A",
      greeting: "Hi — how can we help?",
      position: "right",
    },
    createdAt: String(row.created_at),
  };
  return {
    user,
    org,
    role: membership.role as "owner" | "agent",
  };
}

export { COOKIE as SESSION_COOKIE };
