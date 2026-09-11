import Link from "next/link";
import { DemoWidgetLoader } from "@/components/demo-widget-loader";

const PILOT_KEY =
  process.env.NEXT_PUBLIC_PILOT_WIDGET_KEY || "pk_live_pilot_dakar_01";

export default function DemoWidgetPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--jh-teal)]">
        ← JokoHub
      </Link>
      <h1 className="font-display mt-4 text-4xl font-semibold text-[var(--jh-teal)]">
        Demo storefront
      </h1>
      <p className="mt-3 text-black/60">
        Loads the widget with pilot key <code>{PILOT_KEY}</code>. Sign in to the
        inbox as <code>owner@jokohub.app</code> / <code>testpass123</code> to
        reply. Pass <code>?key=…</code> to try another org’s widget key.
      </p>
      <div className="jh-panel mt-10 rounded-3xl p-8">
        <p className="font-display text-2xl">Baobab Market</p>
        <p className="mt-2 text-black/55">
          Sample product page. Use the chat bubble in the corner.
        </p>
      </div>
      <DemoWidgetLoader />
    </main>
  );
}
