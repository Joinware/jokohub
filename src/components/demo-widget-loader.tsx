"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    JokoHubSettings?: { key: string; apiBase?: string };
  }
}

export function DemoWidgetLoader() {
  useEffect(() => {
    window.JokoHubSettings = { key: "pk_demo_jokohub" };
    const existing = document.querySelector("script[data-jokohub-widget]");
    if (existing) return;
    const s = document.createElement("script");
    s.src = "/widget.js";
    s.async = true;
    s.dataset.jokohubWidget = "1";
    document.body.appendChild(s);
  }, []);
  return null;
}
