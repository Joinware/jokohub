"use client";

import { useEffect, useState } from "react";
import type { Organization } from "@/lib/types";

export default function TeamSettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState("owner");

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((d) => {
        if (d.org) setOrg(d.org);
        if (d.role) setRole(d.role);
      });
  }, []);

  if (!org) return <p className="p-6 text-sm text-black/55">Loading…</p>;

  return (
    <section className="jh-panel mx-auto max-w-3xl rounded-3xl p-6 md:p-8">
      <h1 className="font-display text-3xl font-semibold">Team & seats</h1>
      <p className="mt-2 text-black/55">
        Seat limit: <strong>{org.seatLimit}</strong>. Your role: <strong>{role}</strong>.
      </p>
      <div className="mt-6 rounded-2xl border border-[var(--jh-line)] bg-white p-4">
        <p className="text-sm text-black/60">
          Paid beta ships with seat billing via Stripe. Invite emails land when
          Resend (or similar) is wired; until then, create additional accounts and
          attach them in Supabase <code>org_members</code>, or stay on demo mode with
          one owner seat.
        </p>
      </div>
    </section>
  );
}
