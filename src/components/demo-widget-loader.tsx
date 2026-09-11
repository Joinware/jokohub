"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    JokoHubSettings?: { key: string; apiBase?: string };
  }
}

/** Pilot seed key when demo mode is off. Override with ?key= on /demo-widget. */
const DEFAULT_WIDGET_KEY =
  process.env.NEXT_PUBLIC_PILOT_WIDGET_KEY || "pk_live_pilot_dakar_01";

export function DemoWidgetLoader({ widgetKey }: { widgetKey?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = widgetKey || params.get("key") || DEFAULT_WIDGET_KEY;
    window.JokoHubSettings = { key };
    const existing = document.querySelector("script[data-jokohub-widget]");
    if (existing) return;
    const s = document.createElement("script");
    s.src = "/widget.js";
    s.async = true;
    s.dataset.jokohubWidget = "1";
    document.body.appendChild(s);
  }, [widgetKey]);
  return null;
}
