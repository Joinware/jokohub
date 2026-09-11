import { NextResponse } from "next/server";

/** Whether the browser Origin is permitted for this widget key's org. */
export function originAllowed(allowed: string[], origin: string | null) {
  if (!origin) return true;
  // Empty allowlist = open (pilot-friendly); tighten in org settings when ready.
  if (!allowed.length || allowed.includes("*")) return true;
  return allowed.some((o) => o === origin || o === "*");
}

/** CORS headers so cross-origin shop embeds can call widget APIs. */
export function widgetCorsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return headers;
}

export function jsonWithCors(
  body: unknown,
  init: { status?: number; origin: string | null }
) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: widgetCorsHeaders(init.origin),
  });
}

export function optionsWithCors(origin: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: widgetCorsHeaders(origin),
  });
}
