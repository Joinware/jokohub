export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export const PRODUCT_NAME =
  process.env.NEXT_PUBLIC_PRODUCT_NAME || "JokoHub";

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@jokohub.app";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const DEFAULT_WIDGET_SETTINGS = {
  primaryColor: "#0A3D3A",
  greeting: "Hi — how can we help?",
  position: "right" as const,
};
