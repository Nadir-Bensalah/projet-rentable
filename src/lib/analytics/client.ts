"use client";

import type { ClientEvent } from "./events";

/**
 * First-party, cookie-less analytics. A random visitor id lives in sessionStorage only
 * (reset when the tab is closed); first-touch UTM parameters are kept for the session
 * so a later sign-up can be attributed to its acquisition channel.
 */

const ANON_KEY = "rv_aid";
const UTM_KEY = "rv_utm";

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function anonId(): string {
  const s = storage();
  let id = s?.getItem(ANON_KEY) ?? null;
  if (!id) {
    id = crypto.randomUUID();
    s?.setItem(ANON_KEY, id);
  }
  return id;
}

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  landing?: string;
}

export function captureUtm(): Utm {
  const s = storage();
  const existing = s?.getItem(UTM_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as Utm;
    } catch {
      /* ignore */
    }
  }
  const p = new URLSearchParams(window.location.search);
  const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : undefined;
  const utm: Utm = {
    source: p.get("utm_source") ?? p.get("ref") ?? (ref ? new URL(ref).hostname : undefined) ?? undefined,
    medium: p.get("utm_medium") ?? undefined,
    campaign: p.get("utm_campaign") ?? undefined,
    referrer: ref,
    landing: window.location.pathname,
  };
  s?.setItem(UTM_KEY, JSON.stringify(utm));
  return utm;
}

export function track(name: ClientEvent, props: Record<string, string | number | boolean | null> = {}) {
  if (typeof window === "undefined") return;
  if (navigator.doNotTrack === "1" || (window as unknown as { __rvOptOut?: boolean }).__rvOptOut) return;
  try {
    if (localStorage.getItem("rv_optout") === "1") return;
  } catch {
    /* storage unavailable */
  }
  const utm = captureUtm();
  const body = JSON.stringify({
    name,
    anonId: anonId(),
    path: window.location.pathname,
    referrer: utm.referrer ?? null,
    utm: { source: utm.source ?? null, medium: utm.medium ?? null, campaign: utm.campaign ?? null },
    props,
  });
  try {
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/events", blob)) return;
  } catch {
    /* fall through */
  }
  fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}
