"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureUtm, track } from "@/lib/analytics/client";

/** Page views + delegated CTA click tracking (elements with data-cta="name"). */
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    captureUtm();
    track("page_view");
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cta]");
      if (el?.dataset.cta) track("cta_click", { cta: el.dataset.cta });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
