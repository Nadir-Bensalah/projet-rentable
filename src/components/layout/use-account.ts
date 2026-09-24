"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccountView } from "@/lib/account-view";

export type MeState = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; account: AccountView };

let cache: { at: number; value: MeState } | null = null;
const listeners = new Set<(s: MeState) => void>();

export async function fetchMe(force = false): Promise<MeState> {
  if (!force && cache && Date.now() - cache.at < 15_000) return cache.value;
  try {
    const res = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
    const data = (await res.json()) as { authenticated: boolean; account?: AccountView };
    const value: MeState = data.authenticated && data.account ? { status: "authenticated", account: data.account } : { status: "anonymous" };
    cache = { at: Date.now(), value };
    listeners.forEach((l) => l(value));
    return value;
  } catch {
    return cache?.value ?? { status: "anonymous" };
  }
}

export function setAccount(account: AccountView | null) {
  const value: MeState = account ? { status: "authenticated", account } : { status: "anonymous" };
  cache = { at: Date.now(), value };
  listeners.forEach((l) => l(value));
}

/** Shared, cached view of the signed-in account for client components. */
export function useAccount() {
  const [state, setState] = useState<MeState>(cache?.value ?? { status: "loading" });
  useEffect(() => {
    listeners.add(setState);
    fetchMe().then(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  const refresh = useCallback(() => fetchMe(true), []);
  return { state, refresh };
}
