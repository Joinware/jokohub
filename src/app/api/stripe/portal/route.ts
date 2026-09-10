import { NextResponse } from "next/server";
import { getActiveOrg } from "@/lib/auth";
import { APP_URL } from "@/lib/config";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST() {
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!stripeConfigured() || !active.org.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer yet", scaffold: true },
      { status: 503 }
    );
  }
  const stripe = getStripe()!;
  const session = await stripe.billingPortal.sessions.create({
    customer: active.org.stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`,
  });
  return NextResponse.json({ url: session.url });
}
