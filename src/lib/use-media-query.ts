"use client";

import { useSyncExternalStore } from "react";

/** Subscribes to a CSS media query (defaults to `serverDefault` during SSR). */
export function useMediaQuery(query: string, serverDefault = true): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverDefault,
  );
}
