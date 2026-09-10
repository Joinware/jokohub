import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/config";
import { demoDb } from "@/lib/demo-store";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret || secret.includes("...")) {
    return NextResponse.json(
      { error: "Stripe webhook not configured", scaffold: true },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid signature" },
      { status: 400 }
    );
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as {
      id: string;
      status: string;
      customer: string;
      metadata?: { orgId?: string };
      items: { data: { quantity?: number }[] };
    };
    const orgId = sub.metadata?.orgId;
    const seatLimit = sub.items.data[0]?.quantity || 3;
    const status =
      event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

    if (orgId && isDemoMode()) {
      const org = demoDb().orgs.find((o) => o.id === orgId);
      if (org) {
        org.stripeSubscriptionId = sub.id;
        org.stripeCustomerId = String(sub.customer);
        org.stripeSubscriptionStatus = status;
        org.seatLimit = seatLimit;
      }
    } else if (orgId) {
      const admin = createAdminClient();
      await admin
        .from("organizations")
        .update({
          stripe_subscription_id: sub.id,
          stripe_customer_id: String(sub.customer),
          stripe_subscription_status: status,
          seat_limit: seatLimit,
        })
        .eq("id", orgId);
    }
  }

  return NextResponse.json({ received: true });
}
