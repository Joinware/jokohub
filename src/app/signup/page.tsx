"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        orgName: fd.get("orgName"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/inbox");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="font-display mb-8 text-2xl font-semibold text-[var(--jh-teal)]">
        JokoHub
      </Link>
      <div className="jh-panel rounded-3xl p-8">
        <h1 className="font-display text-3xl font-semibold">Create your desk</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            Organization
            <input
              name="orgName"
              required
              placeholder="Clinique Baobab"
              className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Work email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button disabled={loading} className="jh-btn jh-btn-primary w-full" type="submit">
            {loading ? "Creating…" : "Create inbox"}
          </button>
        </form>
      </div>
    </main>
  );
}
