"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
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
        <h1 className="font-display text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-black/55">
          Pilot: <code>owner@jokohub.app</code> / <code>testpass123</code>
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue="owner@jokohub.app"
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
              defaultValue="testpass123"
              className="mt-1 w-full rounded-xl border border-[var(--jh-line)] bg-white px-3 py-2"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button disabled={loading} className="jh-btn jh-btn-primary w-full" type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-black/55">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--jh-teal)]">
            Start free
          </Link>
        </p>
      </div>
    </main>
  );
}
