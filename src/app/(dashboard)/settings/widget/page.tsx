"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Organization } from "@/lib/types";

export default function WidgetSettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [message, setMessage] = useState("");
  const [origins, setOrigins] = useState("*");

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((d) => {
        if (d.org) {
          setOrg(d.org);
          setOrigins((d.org.allowedOrigins || ["*"]).join(", "));
        }
      });
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widgetSettings: {
          primaryColor: String(fd.get("primaryColor")),
          greeting: String(fd.get("greeting")),
          position: String(fd.get("position")),
        },
        allowedOrigins: origins
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Save failed");
      return;
    }
    setOrg(data.org);
    setMessage("Saved");
  }

  if (!org) {
    return <p className="p-6 text-sm text-black/55">Loading…</p>;
  }

  const snippet = `<script>
  window.JokoHubSettings = { key: "${org.widgetKey}" };
</script>
<script async src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"></script>`;

  return (
    <section className="jh-panel mx-auto max-w-3xl rounded-3xl p-6 md:p-8">
      <h1 className="font-display text-3xl font-semibold">Widget</h1>
      <p className="mt-2 text-sm text-black/55">
        Paste this snippet before <code>&lt;/body&gt;</code> on your site.
      </p>

      <pre className="mt-4 overflow-x-auto rounded-2xl bg-[var(--jh-teal)] p-4 text-xs text-white">
        {snippet}
      </pre>

      <p className="mt-3 text-sm">
        Widget key: <code className="rounded bg-white px-2 py-1">{org.widgetKey}</code>
      </p>

      <form onSubmit={save} className="mt-8 space-y-4">
        <label className="block text-sm">
          Greeting
          <input
            name="greeting"
            defaultValue={org.widgetSettings.greeting}
            className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Primary color
          <input
            name="primaryColor"
            type="color"
            defaultValue={org.widgetSettings.primaryColor}
            className="mt-1 h-10 w-24 rounded-xl border border-[var(--jh-line)] bg-white"
          />
        </label>
        <label className="block text-sm">
          Position
          <select
            name="position"
            defaultValue={org.widgetSettings.position}
            className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
          >
            <option value="right">Right</option>
            <option value="left">Left</option>
          </select>
        </label>
        <label className="block text-sm">
          Allowed origins (comma-separated, or *)
          <input
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
          />
        </label>
        {message ? <p className="text-sm text-[var(--jh-teal)]">{message}</p> : null}
        <button type="submit" className="jh-btn jh-btn-primary">
          Save widget settings
        </button>
      </form>
    </section>
  );
}
