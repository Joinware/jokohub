import { NextResponse } from "next/server";
import { getActiveOrg } from "@/lib/auth";
import { APP_URL } from "@/lib/config";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST() {
  const active = await getActiveOrg();
  if (!active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (active.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe not configured",
        hint: "Add STRIPE_SECRET_KEY and STRIPE_PRICE_SEAT to .env.local",
        scaffold: true,
      },
      { status: 503 }
    );
  }

  const stripe = getStripe()!;
  const price = process.env.STRIPE_PRICE_SEAT;
  if (!price || price.includes("...")) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_SEAT missing", scaffold: true },
      { status: 503 }
    );
  }

  let customerId = active.org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: active.user.email,
      name: active.org.name,
      metadata: { orgId: active.org.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: Math.max(1, active.org.seatLimit) }],
    success_url: `${APP_URL}/settings/billing?success=1`,
    cancel_url: `${APP_URL}/settings/billing?canceled=1`,
    metadata: { orgId: active.org.id },
    subscription_data: { metadata: { orgId: active.org.id } },
  });

  return NextResponse.json({ url: session.url });
}
