"use client";

import { useEffect, useState } from "react";
import type { Organization } from "@/lib/types";

/** Active org id for realtime filters; null while loading or unauthorized. */
export function useActiveOrgId() {
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/org")
      .then((r) => r.json())
      .then((d: { org?: Organization }) => {
        if (!cancelled) setOrgId(d.org?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setOrgId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return orgId;
}
