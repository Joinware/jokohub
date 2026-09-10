import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-16 pt-8">
      <header className="jh-rise flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--jh-teal)] text-lg font-semibold text-white"
          >
            J
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-[var(--jh-teal)]">
              JokoHub
            </p>
            <p className="text-sm text-black/55">by Joinware</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="jh-btn jh-btn-ghost text-sm">
            Sign in
          </Link>
          <Link href="/signup" className="jh-btn jh-btn-primary text-sm">
            Start free
          </Link>
        </nav>
      </header>

      <section className="jh-rise jh-rise-delay relative mt-16 grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="font-display max-w-xl text-5xl font-semibold leading-[1.05] text-[var(--jh-ink)] md:text-6xl">
            Live chat that fits a Dakar or Banjul desk.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-black/65">
            Embed a website widget, answer in a shared inbox, and seat your team —
            built for Senegal & Gambia SMBs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="jh-btn jh-btn-primary">
              Open your inbox
            </Link>
            <Link href="/demo-widget" className="jh-btn jh-btn-ghost">
              Try the widget
            </Link>
          </div>
        </div>

        <div className="jh-panel relative overflow-hidden rounded-[2rem] p-6 shadow-[0_30px_80px_rgba(16,42,40,0.12)]">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-[var(--jh-teal)] to-[var(--jh-mint)] opacity-90" />
          <div className="relative mt-16 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">
              Shared inbox
            </p>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-[var(--jh-line)] p-3">
                <p className="text-sm font-semibold">Clinic visitor</p>
                <p className="text-sm text-black/60">Naka nga def? Need hours…</p>
              </div>
              <div className="rounded-xl border border-[var(--jh-line)] bg-[var(--jh-sand)] p-3">
                <p className="text-sm font-semibold text-[var(--jh-teal)]">You</p>
                <p className="text-sm text-black/60">
                  We’re open until 18:00 — how can we help?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--jh-line)] pt-6 text-sm text-black/50">
        <p>© {new Date().getFullYear()} Joinware · JokoHub paid beta</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-[var(--jh-teal)]">
          {SUPPORT_EMAIL}
        </a>
      </footer>
    </main>
  );
}
