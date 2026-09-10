import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getActiveOrg } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const active = await getActiveOrg();
  if (!active) redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 md:px-6">
      <header className="jh-panel mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/inbox" className="font-display text-xl font-semibold text-[var(--jh-teal)]">
            JokoHub
          </Link>
          <nav className="flex gap-3 text-sm font-medium">
            <Link href="/inbox" className="hover:text-[var(--jh-teal)]">
              Inbox
            </Link>
            <Link href="/settings/widget" className="hover:text-[var(--jh-teal)]">
              Widget
            </Link>
            <Link href="/settings/team" className="hover:text-[var(--jh-teal)]">
              Team
            </Link>
            <Link href="/settings/billing" className="hover:text-[var(--jh-teal)]">
              Billing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-black/55">{active.org.name}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
