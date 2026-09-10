"use client";

import { useEffect, useState } from "react";
import type { Organization } from "@/lib/types";

export default function BillingPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((d) => {
        if (d.org) setOrg(d.org);
      });
  }, []);

  async function checkout() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setNote(
      data.hint ||
        data.error ||
        "Stripe scaffold ready — add test keys to .env.local"
    );
  }

  async function portal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setNote(data.error || "Portal unavailable until a Stripe customer exists");
  }

  if (!org) return <p className="p-6 text-sm text-black/55">Loading…</p>;

  return (
    <section className="jh-panel mx-auto max-w-3xl rounded-3xl p-6 md:p-8">
      <h1 className="font-display text-3xl font-semibold">Billing</h1>
      <p className="mt-2 text-black/55">
        Seat-based Stripe subscription (test mode). Placeholder list price:
        $29/seat/month.
      </p>
      <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--jh-line)] bg-white p-4">
          <dt className="text-black/45">Seats</dt>
          <dd className="text-xl font-semibold">{org.seatLimit}</dd>
        </div>
        <div className="rounded-2xl border border-[var(--jh-line)] bg-white p-4">
          <dt className="text-black/45">Subscription</dt>
          <dd className="text-xl font-semibold">
            {org.stripeSubscriptionStatus || "not started"}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={checkout} className="jh-btn jh-btn-primary">
          Start Stripe Checkout
        </button>
        <button type="button" onClick={portal} className="jh-btn jh-btn-ghost">
          Customer portal
        </button>
      </div>
      {note ? (
        <p className="mt-4 rounded-xl border border-[var(--jh-line)] bg-white p-3 text-sm">
          {note}
        </p>
      ) : null}
    </section>
  );
}
