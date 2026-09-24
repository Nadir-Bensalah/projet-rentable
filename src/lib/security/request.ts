import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { sha256 } from "./tokens";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
    public headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** CSRF defence for state-changing requests: the Origin (or Referer) must be our own. */
export function assertSameOrigin(req: Request) {
  const allowed = new URL(env().APP_URL).origin;
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const source = origin ?? (referer ? safeOrigin(referer) : null);
  if (!source) throw new HttpError(403, "Origine de la requête manquante.", "csrf");
  const sameHost = host ? source === `https://${host}` || source === `http://${host}` : false;
  if (source !== allowed && !sameHost) throw new HttpError(403, "Origine de la requête non autorisée.", "csrf");
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Client IP as seen by our reverse proxy. The left-most X-Forwarded-For entries can be
 * forged by the client, so we read the entry added by the trusted proxy hop(s).
 */
export function clientIp(req: Request): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? "1"));
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ip = parts[Math.max(0, parts.length - hops)];
    if (ip) return ip;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** IPs are only ever stored hashed (salted with the app secret). */
export function ipHash(req: Request): string {
  return sha256(`${env().AUTH_SECRET}:${clientIp(req)}`).slice(0, 32);
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T, maxBytes = 32 * 1024): Promise<z.infer<T>> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) throw new HttpError(413, "Requête trop volumineuse.", "too_large");
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    throw new HttpError(400, "Requête invalide.", "bad_request");
  }
  if (raw.length > maxBytes) throw new HttpError(413, "Requête trop volumineuse.", "too_large");
  let data: unknown;
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    throw new HttpError(400, "JSON invalide.", "bad_json");
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(422, first?.message ?? "Données invalides.", "validation");
  }
  return parsed.data;
}

export function json(data: unknown, init: number | ResponseInit = 200) {
  const initObj = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, {
    ...initObj,
    headers: { "Cache-Control": "no-store", ...(initObj.headers ?? {}) },
  });
}

/** Wraps a route handler: consistent JSON errors, no stack traces leaked to clients. */
export function handler<A extends unknown[]>(fn: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.message, code: e.code }, { status: e.status, headers: e.headers });
      }
      console.error("[api] unhandled error", e);
      return json({ error: "Une erreur inattendue est survenue. Réessayez dans un instant.", code: "internal" }, 500);
    }
  };
}
