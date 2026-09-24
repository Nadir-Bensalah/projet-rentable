"use client";

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T & { error?: string; code?: string };
}

/** Small fetch wrapper for our JSON API with a friendly network error message. */
export async function api<T = Record<string, unknown>>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    let data: T & { error?: string; code?: string };
    try {
      data = (await res.json()) as T & { error?: string; code?: string };
    } catch {
      data = { error: res.ok ? undefined : "Réponse inattendue du serveur." } as T & { error?: string };
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Connexion impossible. Vérifiez votre accès à Internet et réessayez.", code: "network" } as T & { error?: string; code?: string },
    };
  }
}
